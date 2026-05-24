from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponseRedirect
from urllib.parse import urlsplit


def _frontend_redirect(path=''):
    """
    Redireciona para FRONTEND_URL + path.
    Proteções:
      - Se FRONTEND_URL não estiver configurado → /admin/login/ (sem loop)
      - Se FRONTEND_URL apontar para o próprio host (erro de config) → /admin/login/
    Com nginx local o Django nunca recebe / ou /login/, então esta view
    só é chamada no Render ou no acesso direto ao Django.
    """
    def view(request):
        base = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
        if base and urlsplit(base).netloc != request.get_host():
            return HttpResponseRedirect(base + path)
        return HttpResponseRedirect('/admin/login/')
    return view


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('escola.api_urls')),

    path('login/', _frontend_redirect('/login')),
    path('', _frontend_redirect('/')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
