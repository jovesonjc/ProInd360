from rest_framework import viewsets, serializers
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import OrdemProducao, EtapaProducao, HistoricoEtapas
from .serializers import OrdemProducaoSerializer, EtapaProducaoSerializer, HistoricoEtapasSerializer, PedidoPCPSerializer
from rest_framework.response import Response
from django.db.models import F, ExpressionWrapper, fields, Sum
from datetime import timedelta
from rest_framework.decorators import action
from apps.comercial.models import PedidoVenda
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class OrdemProducaoViewSet(viewsets.ModelViewSet):
    queryset = OrdemProducao.objects.all()
    serializer_class = OrdemProducaoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        queryset = OrdemProducao.objects.all().order_by('id')
        status = self.request.query_params.get('status', None)
        etapas = self.request.query_params.get('etapas', None)
        priority = self.request.query_params.get('priority', None)
        search = self.request.query_params.get('search', None)

        if status:
            queryset = queryset.filter(status__iexact=status)
        
        if etapas:
            # This assumes 'etapas' is a ManyToMany relationship and the related model has a 'name' field.
            queryset = queryset.filter(etapas__name__iexact=etapas).distinct()

        if priority:
            queryset = queryset.filter(priority__iexact=priority)

        if search:
            q_objects = Q(client__icontains=search)
            if search.isdigit():
                q_objects |= Q(id=int(search))
            
            queryset = queryset.filter(q_objects)
        
        return queryset

class EtapaProducaoViewSet(viewsets.ModelViewSet):
    queryset = EtapaProducao.objects.all()
    serializer_class = EtapaProducaoSerializer
    permission_classes = [IsAuthenticated]

class HistoricoEtapasViewSet(viewsets.ModelViewSet):
    queryset = HistoricoEtapas.objects.all()
    serializer_class = HistoricoEtapasSerializer
    permission_classes = [IsAuthenticated]

class RelatorioOrdemProducaoSerializer(serializers.ModelSerializer):
    total_estimated_time = serializers.DurationField()
    total_actual_time = serializers.DurationField()
    time_difference = serializers.DurationField()

    class Meta:
        model = OrdemProducao
        fields = ['id', 'client', 'start_date', 'estimated_end_date', 'status', 'priority', 'total_estimated_time', 'total_actual_time', 'time_difference']

class RelatorioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OrdemProducao.objects.all()
    serializer_class = RelatorioOrdemProducaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = OrdemProducao.objects.annotate(
            total_estimated_time=Sum('etapas__estimated_time'),
            total_actual_time=Sum('etapas__actual_time'),
            time_difference=ExpressionWrapper(
                F('total_estimated_time') - F('total_actual_time'),
                output_field=fields.DurationField()
            )
        )
        return queryset
