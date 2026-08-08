from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status

from escola.models import Aviso

from .base import BaseAPITestCase


def _fake_image(name='capa.png'):
    # PNG 1x1 mínimo válido, o suficiente para o ImageField aceitar.
    content = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0'
        b'\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return SimpleUploadedFile(name, content, content_type='image/png')


class AvisosPublicosTests(BaseAPITestCase):
    def test_lista_publica_so_traz_ativos_e_publicados(self):
        Aviso.objects.create(
            titulo='Publicado', descricao_curta='x', imagem_capa=_fake_image(),
            ativo=True, publicar_em=timezone.now() - timedelta(days=1),
        )
        Aviso.objects.create(
            titulo='Inativo', descricao_curta='x', imagem_capa=_fake_image('b.png'),
            ativo=False, publicar_em=timezone.now() - timedelta(days=1),
        )
        Aviso.objects.create(
            titulo='Futuro', descricao_curta='x', imagem_capa=_fake_image('c.png'),
            ativo=True, publicar_em=timezone.now() + timedelta(days=1),
        )

        resp = self.client.get('/api/avisos/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titulos = [a['titulo'] for a in resp.data]
        self.assertEqual(titulos, ['Publicado'])

    def test_detalhe_publico_por_slug(self):
        aviso = Aviso.objects.create(
            titulo='Evento legal', descricao_curta='x', imagem_capa=_fake_image(),
            ativo=True, publicar_em=timezone.now() - timedelta(days=1),
        )
        resp = self.client.get(f'/api/avisos/{aviso.slug}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['titulo'], 'Evento legal')

    def test_detalhe_publico_de_aviso_inativo_404(self):
        aviso = Aviso.objects.create(
            titulo='Rascunho', descricao_curta='x', imagem_capa=_fake_image(), ativo=False,
        )
        resp = self.client.get(f'/api/avisos/{aviso.slug}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class AdminAvisosCrudTests(BaseAPITestCase):
    def test_professor_nao_acessa_admin_de_avisos(self):
        self.auth_professor()
        resp = self.client.get('/api/admin/avisos/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_lista_todos_os_avisos(self):
        Aviso.objects.create(titulo='A', descricao_curta='x', imagem_capa=_fake_image('a.png'), ativo=False)
        self.auth_admin()
        resp = self.client.get('/api/admin/avisos/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_admin_cria_aviso(self):
        self.auth_admin()
        resp = self.client.post('/api/admin/avisos/', {
            'categoria': 'evento',
            'titulo': 'Feira de Ciências',
            'descricao_curta': 'Venha conferir',
            'imagem_capa': _fake_image(),
        }, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        aviso = Aviso.objects.get()
        self.assertEqual(aviso.slug, 'feira-de-ciencias')
        self.assertEqual(aviso.autor, self.admin_user)

    def test_admin_cria_aviso_sem_campo_obrigatorio_falha(self):
        self.auth_admin()
        resp = self.client.post('/api/admin/avisos/', {
            'categoria': 'evento', 'titulo': 'Sem descrição',
        }, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_slug_duplicado_gera_sufixo(self):
        Aviso.objects.create(titulo='Mesmo Título', descricao_curta='x', imagem_capa=_fake_image('a.png'))
        aviso2 = Aviso.objects.create(titulo='Mesmo Título', descricao_curta='y', imagem_capa=_fake_image('b.png'))
        self.assertEqual(aviso2.slug, 'mesmo-titulo-2')

    def test_admin_atualiza_aviso_patch(self):
        aviso = Aviso.objects.create(titulo='Original', descricao_curta='x', imagem_capa=_fake_image())
        self.auth_admin()
        resp = self.client.patch(f'/api/admin/avisos/{aviso.id}/', {'titulo': 'Editado', 'ativo': 'true'}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        aviso.refresh_from_db()
        self.assertEqual(aviso.titulo, 'Editado')
        self.assertTrue(aviso.ativo)

    def test_admin_exclui_aviso(self):
        aviso = Aviso.objects.create(titulo='Para excluir', descricao_curta='x', imagem_capa=_fake_image())
        self.auth_admin()
        resp = self.client.delete(f'/api/admin/avisos/{aviso.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Aviso.objects.filter(id=aviso.id).exists())

    def test_upload_imagem_conteudo(self):
        self.auth_admin()
        resp = self.client.post('/api/admin/avisos/upload-imagem/', {'imagem': _fake_image()}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertIn('url', resp.data)

    def test_upload_imagem_sem_arquivo_falha(self):
        self.auth_admin()
        resp = self.client.post('/api/admin/avisos/upload-imagem/', {}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
