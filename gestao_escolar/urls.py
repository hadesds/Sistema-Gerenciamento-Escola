from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponseRedirect


def api_root(request):
    return JsonResponse({'detail': 'API do Sistema CARA. Use /api/ para os endpoints REST ou /admin/ para o painel administrativo.'})


def frontend_login_redirect(request):
    """Redireciona /login/ para a página de login do frontend (Next.js/Vercel)."""
    frontend = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    if frontend:
        return HttpResponseRedirect(f'{frontend}/login')
    return HttpResponseRedirect('/admin/login/')


urlpatterns = [
    path('admin/', admin.site.urls),

    # API REST
    path('api/', include('escola.api_urls')),

    # Redireciona /login/ para o frontend — usado pelo logout do admin Django
    path('login/', frontend_login_redirect),

    # Raiz — resposta informativa
    path('', api_root),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
