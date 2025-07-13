from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import ProtectedError
from decimal import Decimal
from .models import MateriaPrima, ProdutoProcesso, ProdutoAcabado, HistoricoUsoMaterial
from apps.comercial.models import PedidoVenda
from .serializers import MateriaPrimaSerializer, ProdutoProcessoSerializer, ProdutoAcabadoSerializer, GolaSubtipoSerializer, HistoricoUsoMaterialSerializer

class CoresDisponiveisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tipo_tecido = request.query_params.get('tipo_tecido')
        
        query = MateriaPrima.objects.filter(tipo_produto='TECIDO')
        
        if tipo_tecido:
            # Mapeia o valor do frontend para o valor do banco de dados, se necessário
            # Exemplo: 'MALHA_PV' no frontend pode ser 'Malha PV' no banco
            mapeamento_tecido = {
                'MALHA_PV': 'Malha PV',
                'ALGODAO': 'Algodão',
                'DRY_FIT': 'Dry Fit',
                'VISCOLYCRA': 'Viscolycra',
            }
            categoria_subtipo = mapeamento_tecido.get(tipo_tecido, tipo_tecido)
            query = query.filter(categoria_subtipo=categoria_subtipo)

        cores = query.values_list('cor', flat=True).distinct().exclude(cor='').order_by('cor')
        return Response(list(cores))

class MateriaPrimaViewSet(viewsets.ModelViewSet):
    queryset = MateriaPrima.objects.all()
    serializer_class = MateriaPrimaSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='utilizar-material')
    def utilizar_material(self, request, pk=None):
        material = self.get_object()
        try:
            quantidade_utilizada = Decimal(request.data.get('quantidade_utilizada'))
            pedido_id = request.data.get('pedido_id')
        except (TypeError, ValueError):
            return Response({'error': 'Dados inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantidade_utilizada <= 0:
            return Response({'error': 'Quantidade utilizada deve ser maior que zero.'}, status=status.HTTP_400_BAD_REQUEST)

        if material.quantity < quantidade_utilizada:
            return Response({'error': 'Estoque insuficiente.'}, status=status.HTTP_400_BAD_REQUEST)

        material.quantity -= quantidade_utilizada
        material.save()

        pedido_venda = None
        if pedido_id:
            try:
                pedido_venda = PedidoVenda.objects.get(id=pedido_id)
            except PedidoVenda.DoesNotExist:
                pass

        HistoricoUsoMaterial.objects.create(
            material=material,
            quantidade_utilizada=quantidade_utilizada,
            pedido_venda=pedido_venda
        )

        serializer = self.get_serializer(material)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProdutoProcessoViewSet(viewsets.ModelViewSet):
    queryset = ProdutoProcesso.objects.all()
    serializer_class = ProdutoProcessoSerializer
    permission_classes = [IsAuthenticated]

class ProdutoAcabadoViewSet(viewsets.ModelViewSet):
    queryset = ProdutoAcabado.objects.all()
    serializer_class = ProdutoAcabadoSerializer
    permission_classes = [IsAuthenticated]

class GolaSubtiposView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        subtipos = MateriaPrima.objects.filter(
            tipo_produto='GOLAS'
        ).values_list('categoria_subtipo', flat=True).distinct().exclude(categoria_subtipo='').order_by('categoria_subtipo')
        return Response(list(subtipos))

class HistoricoUsoMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualização do histórico de uso de materiais.
    Permite apenas operações de leitura (list e retrieve).
    """
    queryset = HistoricoUsoMaterial.objects.select_related('material', 'pedido_venda').all()
    serializer_class = HistoricoUsoMaterialSerializer
    permission_classes = [IsAuthenticated]
