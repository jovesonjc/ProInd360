from django.urls import path
from .views import ProducaoDashboardView, QualidadeDashboardView, VendasDashboardView

app_name = 'dashboards'

urlpatterns = [
    path('producao/', ProducaoDashboardView.as_view(), name='producao-dashboard'),
    path('qualidade/', QualidadeDashboardView.as_view(), name='qualidade-dashboard'),
    path('vendas/', VendasDashboardView.as_view(), name='vendas-dashboard'),
]