from rest_framework.routers import DefaultRouter
from .views import ChecklistInspecaoViewSet, FalhaViewSet, RetrabalhoViewSet

app_name = 'qualidade'

router = DefaultRouter()
router.register(r'checklists', ChecklistInspecaoViewSet)
router.register(r'falhas', FalhaViewSet)
router.register(r'retrabalhos', RetrabalhoViewSet)

urlpatterns = router.urls