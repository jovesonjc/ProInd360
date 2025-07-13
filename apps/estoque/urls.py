from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import MateriaPrimaViewSet, ProdutoProcessoViewSet, ProdutoAcabadoViewSet, CoresDisponiveisView, GolaSubtiposView, HistoricoUsoMaterialViewSet

app_name = 'estoque'

router = DefaultRouter()
router.register(r'materias-primas', MateriaPrimaViewSet)
router.register(r'produtos-processo', ProdutoProcessoViewSet)
router.register(r'produtos-acabados', ProdutoAcabadoViewSet)
router.register(r'historico-uso-materiais', HistoricoUsoMaterialViewSet)

urlpatterns = router.urls + [
    path('cores-disponiveis/', CoresDisponiveisView.as_view(), name='cores-disponiveis'),
path('gola-subtipos/', GolaSubtiposView.as_view(), name='gola-subtipos'),
]