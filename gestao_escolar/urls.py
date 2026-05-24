from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API REST
    path('api/', include('escola.api_urls')),

    # / e /login/ → frontend (nginx roteia para Next.js na mesma porta)
    path('login/', RedirectView.as_view(url='/login', permanent=False)),
    path('', RedirectView.as_view(url='/', permanent=False)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
