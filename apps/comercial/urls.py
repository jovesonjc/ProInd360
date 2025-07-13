from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    PedidoVendaViewSet,
    OrcamentoViewSet,
    VendedorViewSet,
    ComissaoViewSet,
    ModeloProdutoViewSet
)

app_name = 'comercial'

router = DefaultRouter()
router.register(r'pedidos', PedidoVendaViewSet)
router.register(r'orcamentos', OrcamentoViewSet)
router.register(r'vendedores', VendedorViewSet)
router.register(r'comissoes', ComissaoViewSet)
router.register(r'modelos-produto', ModeloProdutoViewSet)

urlpatterns = router.urls