from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({'detail': 'API do Sistema CARA. Use /api/ para os endpoints REST ou /admin/ para o painel administrativo.'})


urlpatterns = [
    path('admin/', admin.site.urls),

    # API REST
    path('api/', include('escola.api_urls')),

    # Raiz — resposta informativa
    path('', api_root),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
