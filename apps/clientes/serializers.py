from rest_framework import serializers
from .models import Cliente, PedidoCliente

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class PedidoClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoCliente
        fields = '__all__'

class PedidoStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoCliente
        fields = ['status', 'etapa_atual']
        extra_kwargs = {
            'status': {'required': False},
            'etapa_atual': {'required': False},
        }