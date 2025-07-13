from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, F, Avg, ExpressionWrapper, fields
from datetime import timedelta, date

from .models import Produto, OrdemProducao, EtapaProducao, OrdemProducaoObservacao
from .serializers import ProdutoSerializer, OrdemProducaoSerializer, EtapaProducaoSerializer, OrdemProducaoObservacaoSerializer

class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer

class OrdemProducaoViewSet(viewsets.ModelViewSet):
    serializer_class = OrdemProducaoSerializer

    def get_queryset(self):
        return OrdemProducao.objects.select_related(
            'pedido_venda__cliente',
            'produto'
        ).prefetch_related('etapas').order_by('data_inicio_prevista')

    @action(detail=True, methods=['post'])
    def avancar_etapa(self, request, pk=None):
        ordem = self.get_object()
        etapa_atual = ordem.etapas.filter(concluida=False).order_by('sequencia').first()

        if not etapa_atual:
            return Response({'status': 'Todas as etapas já foram concluídas.'}, status=status.HTTP_400_BAD_REQUEST)

        etapa_atual.concluida = True
        etapa_atual.data_fim_real = date.today()
        etapa_atual.save()
        
        # Se for a primeira etapa, inicia a OP
        if ordem.status == 'PENDENTE':
            ordem.status = 'EM_ANDAMENTO'
            ordem.data_inicio_real = date.today()
            ordem.save()

        proxima_etapa = ordem.etapas.filter(concluida=False).order_by('sequencia').first()
        if proxima_etapa:
            proxima_etapa.data_inicio_real = date.today()
            proxima_etapa.save()
        else:
            # Se não houver próxima etapa, conclui a ordem
            ordem.status = 'CONCLUIDA'
            ordem.data_fim_real = date.today()
            ordem.save()

        return Response(self.get_serializer(ordem).data)

    @action(detail=True, methods=['post'])
    def concluir_ordem(self, request, pk=None):
        ordem = self.get_object()
        ordem.status = 'CONCLUIDA'
        ordem.data_fim_real = date.today()
        
        # Garante que todas as etapas sejam marcadas como concluídas
        for etapa in ordem.etapas.all():
            if not etapa.concluida:
                etapa.concluida = True
                if not etapa.data_fim_real:
                    etapa.data_fim_real = date.today()
                etapa.save()
        
        ordem.save()
        return Response(self.get_serializer(ordem).data)

class EtapaProducaoViewSet(viewsets.ModelViewSet):
    queryset = EtapaProducao.objects.all()
    serializer_class = EtapaProducaoSerializer

class OrdemProducaoObservacaoViewSet(viewsets.ModelViewSet):
    queryset = OrdemProducaoObservacao.objects.all()
    serializer_class = OrdemProducaoObservacaoSerializer

class ProducaoIndicadoresView(APIView):
    def get(self, request, *args, **kwargs):
        ordens_em_producao = OrdemProducao.objects.filter(status='EM_ANDAMENTO').count()
        ordens_pendentes = OrdemProducao.objects.filter(status='PENDENTE').count()

        tempo_medio_op_query = OrdemProducao.objects.filter(
            status='CONCLUIDA',
            data_inicio_real__isnull=False,
            data_fim_real__isnull=False
        ).annotate(
            duracao=ExpressionWrapper(F('data_fim_real') - F('data_inicio_real'), output_field=fields.DurationField())
        ).aggregate(tempo_medio=Avg('duracao'))

        tempo_medio_op = tempo_medio_op_query['tempo_medio']
        
        tempo_medio_horas = 0
        if tempo_medio_op:
            tempo_medio_horas = tempo_medio_op.total_seconds() / 3600

        data = {
            'ordens_em_producao': ordens_em_producao,
            'ordens_pendentes': ordens_pendentes,
            'tempo_medio_op_horas': round(tempo_medio_horas, 2),
        }
        return Response(data)

class ProducaoCronogramaView(APIView):
    def get(self, request, *args, **kwargs):
        ordens = OrdemProducao.objects.filter(status__in=['EM_ANDAMENTO', 'PENDENTE']).prefetch_related('etapas')
        serializer = OrdemProducaoSerializer(ordens, many=True)
        return Response(serializer.data)

class ProducaoSetoresView(APIView):
    def get(self, request, *args, **kwargs):
        setores = EtapaProducao.objects.values('nome_etapa').annotate(
            total_ops=Count('ordem_producao', distinct=True),
            concluidas=Count('ordem_producao', filter=F('concluida'), distinct=True)
        ).order_by('nome_etapa')
        
        return Response(setores)
