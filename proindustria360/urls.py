"""
URL configuration for proindustria360 project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import RedirectView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from .auth_views import CustomTokenObtainPairView
from proindustria360.views import APIRoot # Import the new API Root view

urlpatterns = [
    path('', RedirectView.as_view(url='api/', permanent=False)), # Redirect root to /api/
    path('admin/', admin.site.urls),
    path('api/', APIRoot.as_view(), name='api-root'), # API Root view
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/pcp/', include('apps.pcp.urls')),
    path('api-auth/', include('rest_framework.urls')), # Add this line for DRF login/logout
    path('api/estoque/', include('apps.estoque.urls')),
    path('api/comercial/', include('apps.comercial.urls')),
    path('api/logistica/', include('apps.logistica.urls')),
    path('api/producao/', include('apps.producao.urls')),
    path('api/qualidade/', include('apps.qualidade.urls')),
    path('api/clientes/', include('apps.clientes.urls')),
    path('api/dashboards/', include('apps.dashboards.urls')),
]
