from rest_framework import serializers
from .models import OrdemProducao, EtapaProducao, HistoricoEtapas
from apps.comercial.models import PedidoVenda
from apps.comercial.serializers import ItemPedidoSerializer

class OrdemProducaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemProducao
        fields = '__all__'

class EtapaProducaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapaProducao
        fields = '__all__'

class HistoricoEtapasSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoEtapas
        fields = '__all__'

class PedidoPCPSerializer(serializers.ModelSerializer):
    itens = ItemPedidoSerializer(many=True, read_only=True)

    class Meta:
        model = PedidoVenda
        fields = [
            'id', 'cliente', 'data_pedido', 'prazo', 'prioridade',
            'quantidade_pecas', 'valor_total', 'status', 'etapas',
            'itens', 'created_at', 'updated_at'
        ]