from rest_framework import serializers
from .models import ChecklistInspecao, Falha, Retrabalho

class ChecklistInspecaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistInspecao
        fields = '__all__'

class FalhaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Falha
        fields = '__all__'

class RetrabalhoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Retrabalho
        fields = '__all__'