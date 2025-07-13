from rest_framework import serializers
from .models import Entrega, RotaEntrega

class EntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entrega
        fields = '__all__'

class RotaEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RotaEntrega
        fields = '__all__'