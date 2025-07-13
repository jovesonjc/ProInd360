from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'producao'

router = DefaultRouter()
router.register(r'produtos', views.ProdutoViewSet)
router.register(r'ordens', views.OrdemProducaoViewSet, basename='ordemproducao')
router.register(r'etapas-producao', views.EtapaProducaoViewSet)
router.register(r'observacoes-producao', views.OrdemProducaoObservacaoViewSet, basename='observacao-producao')

urlpatterns = [
    path('', include(router.urls)),
    path('indicadores/', views.ProducaoIndicadoresView.as_view(), name='producao-indicadores'),
    path('cronograma/', views.ProducaoCronogramaView.as_view(), name='producao-cronograma'),
    path('setores/', views.ProducaoSetoresView.as_view(), name='producao-setores'),
]