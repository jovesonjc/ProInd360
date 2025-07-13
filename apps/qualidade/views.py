from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import ChecklistInspecao, Falha, Retrabalho
from .serializers import ChecklistInspecaoSerializer, FalhaSerializer, RetrabalhoSerializer

class ChecklistInspecaoViewSet(viewsets.ModelViewSet):
    queryset = ChecklistInspecao.objects.all()
    serializer_class = ChecklistInspecaoSerializer
    permission_classes = [IsAuthenticated]

class FalhaViewSet(viewsets.ModelViewSet):
    queryset = Falha.objects.all()
    serializer_class = FalhaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ordem', 'etapa', 'tipo_falha', 'resolvido']

    @action(detail=True, methods=['patch'])
    def resolve(self, request, pk=None):
        falha = self.get_object()
        falha.resolvido = True
        falha.save()
        serializer = self.get_serializer(falha)
        return Response(serializer.data)

class RetrabalhoViewSet(viewsets.ModelViewSet):
    queryset = Retrabalho.objects.all()
    serializer_class = RetrabalhoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['operador_responsavel', 'falha']
