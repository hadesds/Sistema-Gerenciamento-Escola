from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponseRedirect


def _frontend_redirect(path=''):
    """
    Redireciona para FRONTEND_URL + path quando configurado (Render/produção).
    Fallback: /admin/login/ — para o caso de acesso direto ao Django sem nginx.
    Com nginx local, Django nunca recebe requisições para / ou /login/,
    então esta view nem é chamada nesse cenário.
    """
    def view(request):
        base = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
        if base:
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
