from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import PedidoVenda, Orcamento, Vendedor, Comissao, ModeloProduto
from .serializers import PedidoVendaSerializer, OrcamentoSerializer, VendedorSerializer, ComissaoSerializer, ModeloProdutoSerializer, ConsumoMaterialSerializer
from apps.pcp.models import OrdemProducao
from apps.estoque.models import MateriaPrima # Import MateriaPrima
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class PedidoVendaViewSet(viewsets.ModelViewSet):
    queryset = PedidoVenda.objects.all()
    serializer_class = PedidoVendaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['cliente', 'status', 'prioridade']

    def get_queryset(self):
        """
        Sobrescreve o queryset para otimizar as consultas ao banco de dados,
        pré-buscando os itens e os detalhes do cliente para evitar o problema N+1.
        """
        return PedidoVenda.objects.prefetch_related('itens', 'cliente').all()

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'APROVADO':
            priority_map = {
                'BAIXA': 'BAIXA',
                'NORMAL': 'MEDIA',
                'ALTA': 'ALTA',
            }
            pcp_priority = priority_map.get(instance.prioridade, 'MEDIA')

            OrdemProducao.objects.create(
                client=instance.cliente.nome,
                start_date=instance.data_pedido.date(),
                estimated_end_date=instance.prazo,
                status='PENDENTE',
                priority=pcp_priority
            )

    @action(detail=True, methods=['get'])
    def materiais(self, request, pk=None):
        logger.info(f"Accessing materials for PedidoVenda ID: {pk}")
        try:
            pedido = self.get_object()
            logger.info(f"PedidoVenda found: {pedido.id}")
            logger.info(f"Number of items in pedido: {pedido.itens.count()}")

            necessidades_agregadas = defaultdict(lambda: {'quantidade': 0, 'unidade': 'N/A'})

            for item in pedido.itens.all():
                logger.info(f"Processing ItemPedido {item.id}. Modelo Base: {item.modelo_base}, Tamanhos: {item.tamanhos}")
                # Recalculate materials for each item to ensure it's up-to-date
                item.calcular_materiais()
                item.save() # Save the item to persist the calculated materials
                logger.info(f"ItemPedido {item.id} materials after calculation and save: {item.materiais}")
                
                if isinstance(item.materiais, list):
                    for material_info in item.materiais:
                        if isinstance(material_info, dict) and 'material_id' in material_info:
                            material_id = material_info['material_id']
                            quantidade = material_info.get('quantidade', 0)
                            
                            # Use the name and unit from the dict, which comes from the calculation
                            nome = material_info.get('nome', f'Material ID {material_id}')
                            unidade = material_info.get('unidade', 'N/A')

                            necessidades_agregadas[material_id]['quantidade'] += float(quantidade)
                            necessidades_agregadas[material_id]['nome'] = nome
                            necessidades_agregadas[material_id]['unidade'] = unidade
                            # Initialize quantidade_disponivel if not already present
                            if 'quantidade_disponivel' not in necessidades_agregadas[material_id]:
                                necessidades_agregadas[material_id]['quantidade_disponivel'] = 0

            logger.info(f"Aggregated necessities before fetching available quantities: {necessidades_agregadas}")

            lista_materiais = []
            for material_id, data in necessidades_agregadas.items():
                try:
                    material_obj = MateriaPrima.objects.get(id=material_id)
                    quantidade_disponivel = material_obj.quantity
                    logger.info(f"Material {material_obj.name} (ID: {material_id}) found. Available quantity: {quantidade_disponivel}")
                except MateriaPrima.DoesNotExist:
                    quantidade_disponivel = 0 # Or handle as appropriate if material not found
                    logger.warning(f"Material with ID {material_id} not found in MateriaPrima. Setting available quantity to 0.")

                lista_materiais.append({
                    'nome': data['nome'],
                    'quantidade_necessaria': data['quantidade'], # Renamed for clarity
                    'unidade': data['unidade'],
                    'quantidade_disponivel': quantidade_disponivel,
                    'suficiente': quantidade_disponivel >= data['quantidade'] # Add sufficiency check
                })
            
            logger.info(f"Final list of materials to be returned: {lista_materiais}")
            return Response(lista_materiais)

        except PedidoVenda.DoesNotExist:
            return Response({"error": "Pedido não encontrado."}, status=404)
        except Exception as e:
            logger.exception(f"Erro ao processar materiais para o pedido {pk}: {e}")
            return Response({"error": "Ocorreu um erro ao processar os materiais."}, status=500)

class OrcamentoViewSet(viewsets.ModelViewSet):
    queryset = Orcamento.objects.all()
    serializer_class = OrcamentoSerializer
    permission_classes = [IsAuthenticated]

class VendedorViewSet(viewsets.ModelViewSet):
    queryset = Vendedor.objects.all()
    serializer_class = VendedorSerializer
    permission_classes = [IsAuthenticated]

class ComissaoViewSet(viewsets.ModelViewSet):
    queryset = Comissao.objects.all()
    serializer_class = ComissaoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Example business logic for calculating commission
        # This could be more complex, e.g., based on seller's commission rate, product type, etc.
        pedido_venda = serializer.validated_data['pedido']
        valor_comissao = pedido_venda.valor_total * 0.05  # 5% commission example
        serializer.save(valor=valor_comissao)

class ModeloProdutoViewSet(viewsets.ModelViewSet):
    queryset = ModeloProduto.objects.prefetch_related('consumo_materiais__material').all()
    serializer_class = ModeloProdutoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def ficha_tecnica(self, request, pk=None):
        """
        Retorna a ficha técnica (lista de materiais) para um modelo de produto específico.
        """
        modelo = self.get_object()
        serializer = ConsumoMaterialSerializer(modelo.consumo_materiais.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verificar_estoque(self, request, pk=None):
        """
        Verifica a disponibilidade de materiais para uma dada quantidade de um modelo.
        """
        modelo = self.get_object()
        try:
            tamanhos = request.data.get('tamanhos', {})
            if not isinstance(tamanhos, dict) or not tamanhos:
                return Response({'error': 'O campo "tamanhos" deve ser um dicionário com as quantidades.'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Dados de entrada inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

        necessidades_agregadas = {}
        
        for tamanho, quantidade_pecas in tamanhos.items():
            if not isinstance(quantidade_pecas, int) or quantidade_pecas < 0:
                continue # Ignora tamanhos com quantidade inválida

            consumo_por_tamanho = modelo.consumo_materiais.filter(tamanho=tamanho).select_related('material')

            for consumo in consumo_por_tamanho:
                material = consumo.material
                quantidade_necessaria = consumo.quantidade * quantidade_pecas
                
                if material.id not in necessidades_agregadas:
                    necessidades_agregadas[material.id] = {
                        'material_id': material.id,
                        'nome': material.name,
                        'tipo_produto': material.tipo_produto,
                        'unidade_medida': 'Metro' if material.unidade_medida in ['ROLO', 'TUBO'] else material.get_unidade_medida_display(), # Show 'Metro' for ROLO and TUBO
                        'cor': material.cor, # Add material color
                        'quantidade_necessaria': 0,
                        'quantidade_disponivel': material.quantity,
                    }
                
                necessidades_agregadas[material.id]['quantidade_necessaria'] += quantidade_necessaria

        resultado_final = []
        for mat_id, dados in necessidades_agregadas.items():
            dados['suficiente'] = dados['quantidade_disponivel'] >= dados['quantidade_necessaria']
            resultado_final.append(dados)

        return Response(resultado_final)
