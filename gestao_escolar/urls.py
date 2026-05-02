from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponseRedirect
from urllib.parse import urlsplit


def _frontend_url(request):
    """Retorna a URL base do frontend se for diferente do host atual, ou None."""
    frontend = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    if not frontend:
        return None
    if urlsplit(frontend).netloc == request.get_host():
        return None  # mesma origem — evita loop
    return frontend


def root_redirect(request):
    """/ → landing page do frontend, ou resposta JSON informativa como fallback."""
    frontend = _frontend_url(request)
    if frontend:
        return HttpResponseRedirect(frontend + '/')
    return JsonResponse({
        'detail': 'API do Sistema CARA. Use /api/ para os endpoints REST ou /admin/ para o painel administrativo.'
    })


def frontend_login_redirect(request):
    """/login/ → página de login do frontend, ou /admin/login/ como fallback."""
    frontend = _frontend_url(request)
    if frontend:
        return HttpResponseRedirect(frontend + '/login')
    return HttpResponseRedirect('/admin/login/')


urlpatterns = [
    path('admin/', admin.site.urls),

    # API REST
    path('api/', include('escola.api_urls')),

    # Redirecionamentos para o frontend Next.js
    path('login/', frontend_login_redirect),
    path('', root_redirect),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

