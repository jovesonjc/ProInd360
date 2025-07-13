from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, PedidoClienteViewSet, ClienteAuthViewSet, PedidoTrackingViewSet

app_name = 'clientes'

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'pedidos', PedidoClienteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('clientes/login/', ClienteAuthViewSet.as_view({'post': 'login'}), name='cliente-login'),
    path('pedidos/track/<str:numero_pedido>/', PedidoTrackingViewSet.as_view({'get': 'retrieve'}), name='pedido-track'),
]