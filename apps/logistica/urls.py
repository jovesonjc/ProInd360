from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntregaViewSet, RotaEntregaViewSet, IntegracaoLogisticaViewSet

app_name = 'logistica'

router = DefaultRouter()
router.register(r'entregas', EntregaViewSet)
router.register(r'rotas', RotaEntregaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('integracao/', IntegracaoLogisticaViewSet.as_view({
        'post': 'simulate_shipping_cost',
        'patch': 'simulate_tracking_update'
    }), name='logistica-integracao'),
]