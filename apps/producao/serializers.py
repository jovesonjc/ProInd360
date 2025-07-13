from rest_framework import serializers
from .models import Produto, OrdemProducao, EtapaProducao, OrdemProducaoObservacao
from apps.comercial.models import PedidoVenda
from apps.clientes.models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['nome']

class PedidoVendaSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True)

    class Meta:
        model = PedidoVenda
        fields = ['id', 'cliente', 'prioridade', 'valor_total']

class EtapaProducaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapaProducao
        fields = ['nome_etapa', 'data_inicio_prevista', 'data_fim_prevista', 'concluida']

class OrdemProducaoSerializer(serializers.ModelSerializer):
    pedido_venda = PedidoVendaSerializer(read_only=True)
    etapas = EtapaProducaoSerializer(many=True, read_only=True)
    cliente = serializers.CharField(source='pedido_venda.cliente.nome', read_only=True)
    prioridade = serializers.CharField(source='pedido_venda.prioridade', read_only=True)
    valor_total = serializers.DecimalField(source='pedido_venda.valor_total', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = OrdemProducao
        fields = [
            'id',
            'produto',
            'quantidade_produzir',
            'status',
            'data_inicio_prevista',
            'data_fim_prevista',
            'pedido_venda',
            'etapas',
            'cliente',
            'prioridade',
            'valor_total',
        ]

class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = '__all__'

class OrdemProducaoObservacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemProducaoObservacao
        fields = '__all__'