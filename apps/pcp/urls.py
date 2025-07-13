from rest_framework.routers import DefaultRouter
from .views import (
    OrdemProducaoViewSet, 
    EtapaProducaoViewSet, 
    HistoricoEtapasViewSet, 
    RelatorioViewSet
)

app_name = 'pcp'

router = DefaultRouter()
router.register(r'ordens', OrdemProducaoViewSet)
router.register(r'etapas', EtapaProducaoViewSet)
router.register(r'historico-etapas', HistoricoEtapasViewSet)
router.register(r'relatorios', RelatorioViewSet, basename='relatorios')

urlpatterns = router.urls