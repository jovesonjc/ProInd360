from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, F, ExpressionWrapper, fields
from datetime import timedelta

from apps.pcp.models import OrdemProducao, EtapaProducao
from apps.qualidade.models import Falha, Retrabalho
from apps.comercial.models import PedidoVenda, Orcamento

class ProducaoDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        # Orders: ready vs in production vs pending
        order_status_counts = OrdemProducao.objects.values('status').annotate(count=Count('id'))
        
        # Production lead time: real vs estimated (for completed orders)
        completed_orders = OrdemProducao.objects.filter(status='CONCLUIDA').annotate(
            estimated_lead_time=ExpressionWrapper(
                F('estimated_end_date') - F('start_date'),
                output_field=fields.DurationField()
            ),
            # Assuming actual completion date is available, e.g., last etapa_producao end_time
            # For simplicity, let's assume estimated_end_date is the target.
            # A more complex query would involve HistoricoEtapas for actual end time.
        )
        
        # Average estimated lead time for completed orders
        avg_estimated_lead_time = completed_orders.aggregate(avg_time=Avg('estimated_lead_time'))['avg_time']
        
        # Average actual production time per order (sum of actual_time for all stages in an order)
        # This requires EtapaProducao.actual_time to be populated.
        avg_actual_production_time_per_order = EtapaProducao.objects.filter(
            order__status='CONCLUIDA', actual_time__isnull=False
        ).values('order').annotate(
            total_actual_time=Sum('actual_time')
        ).aggregate(avg_total=Avg('total_actual_time'))['avg_total']

        data = {
            "order_status_counts": {item['status']: item['count'] for item in order_status_counts},
            "average_estimated_lead_time_completed_orders": str(avg_estimated_lead_time) if avg_estimated_lead_time else None,
            "average_actual_production_time_per_order": str(avg_actual_production_time_per_order) if avg_actual_production_time_per_order else None,
            # "productivity_by_operator": "Requires operator tracking in EtapaProducao or a dedicated model."
        }
        return Response(data)

class QualidadeDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        total_falhas = Falha.objects.count()
        total_retrabalhos = Retrabalho.objects.count()
        
        retrabalho_rate = (total_retrabalhos / total_falhas) * 100 if total_falhas > 0 else 0

        data = {
            "total_falhas": total_falhas,
            "total_retrabalhos": total_retrabalhos,
            "retrabalho_rate_percentage": round(retrabalho_rate, 2),
        }
        return Response(data)

class VendasDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        # Sales pipeline from PedidoVenda status
        pedido_venda_status_counts = PedidoVenda.objects.values('status').annotate(count=Count('id'))
        
        # Sales pipeline from Orcamento status
        orcamento_status_counts = Orcamento.objects.values('status').annotate(count=Count('id'))

        data = {
            "pedido_venda_pipeline": {item['status']: item['count'] for item in pedido_venda_status_counts},
            "orcamento_pipeline": {item['status']: item['count'] for item in orcamento_status_counts},
        }
        return Response(data)
