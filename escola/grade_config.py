"""
Configuração central do novo sistema de notas baseado em simulados.

- DISCIPLINAS: sigla -> nome de cada disciplina.
- AREAS: código da área -> {nome, disciplinas (siglas), avs em que aparece}.
- AV_TIPOS: tipos de avaliação (AV1, AV2, AV3 qualitativa).
- EPOCAS: bimestres.

Estas constantes são reusadas no backend (models/grading/views) e expostas ao
frontend via endpoint para popular os seletores de criação de simulado.
"""

# sigla -> nome
DISCIPLINAS = [
    ('PRT', 'Português'),
    ('LPR', 'Letramento Português'),
    ('MTM', 'Matemática'),
    ('LMT', 'Letramento Matemática'),
    ('ING', 'Inglês'),
    ('ESP', 'Espanhol'),
    ('EDF', 'Educação Física'),
    ('ART', 'Artes'),
    ('GGF', 'Geografia'),
    ('HST', 'História'),
    ('SOC', 'Sociologia'),
    ('FIL', 'Filosofia'),
    ('QMC', 'Química'),
    ('FSC', 'Física'),
    ('BIO', 'Biologia'),
]

# código -> (nome, [siglas das disciplinas], [AVs em que a área é usada])
AREAS = [
    ('PRT',  'Português',            ['PRT', 'LPR'],                          ['AV1']),
    ('MTM',  'Matemática',           ['MTM', 'LMT'],                          ['AV1', 'AV2']),
    ('LING', 'Linguagens e Códigos', ['PRT', 'LPR', 'ART', 'EDF', 'ING', 'ESP'], ['AV1', 'AV2']),
    ('HUM',  'Ciências Humanas',     ['GGF', 'HST', 'SOC', 'FIL'],            ['AV1', 'AV2']),
    ('NAT',  'Ciências da Natureza', ['QMC', 'FSC', 'BIO', 'MTM', 'LMT'],     ['AV1', 'AV2']),
]

AV_TIPOS = [
    ('AV1', 'AV1'),
    ('AV2', 'AV2'),
    ('AV3', 'AV3 (Qualitativa)'),
]

EPOCAS = [
    ('1B', '1° Bimestre'),
    ('2B', '2° Bimestre'),
    ('3B', '3° Bimestre'),
    ('4B', '4° Bimestre'),
]

# Choices simplificados (só código/nome) para os campos dos models
AREA_CHOICES = [(cod, nome) for (cod, nome, _disc, _avs) in AREAS]


def areas_para_av(av_tipo):
    """Retorna a lista de áreas (cod, nome) válidas para um tipo de AV."""
    return [(cod, nome) for (cod, nome, _disc, avs) in AREAS if av_tipo in avs]


def config_dict():
    """Estrutura serializável para o frontend."""
    return {
        'disciplinas': [{'sigla': s, 'nome': n} for s, n in DISCIPLINAS],
        'areas': [
            {'codigo': cod, 'nome': nome, 'disciplinas': disc, 'avs': avs}
            for (cod, nome, disc, avs) in AREAS
        ],
        'av_tipos': [{'codigo': c, 'nome': n} for c, n in AV_TIPOS],
        'epocas': [{'codigo': c, 'nome': n} for c, n in EPOCAS],
    }
