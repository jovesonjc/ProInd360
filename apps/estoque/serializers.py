from rest_framework import serializers
from .models import MateriaPrima, ProdutoProcesso, ProdutoAcabado, HistoricoUsoMaterial

class MateriaPrimaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MateriaPrima
        fields = [
            'id',
            'name',
            'tipo_produto',
            'categoria_subtipo',
            'cor',
            'unidade_medida',
            'quantity',
        ]

class HistoricoUsoMaterialSerializer(serializers.ModelSerializer):
    material_nome = serializers.CharField(source='material.name', read_only=True)
    unidade_medida = serializers.SerializerMethodField()
    pedido_id = serializers.IntegerField(source='pedido_venda.id', read_only=True, allow_null=True)

    class Meta:
        model = HistoricoUsoMaterial
        fields = ('id', 'material_nome', 'pedido_id', 'quantidade_utilizada', 'unidade_medida', 'data_utilizacao')

    def get_unidade_medida(self, obj):
        """
        Transforma a unidade de medida para uma exibição mais clara no histórico.
        'Rolo' e 'Tubo' viram 'Metros'.
        'Caixa' vira 'Unidades'.
        """
        unidade_original = obj.material.unidade_medida
        if unidade_original in ['ROLO', 'TUBO']:
            return 'Metros'
        if unidade_original == 'CAIXA':
            return 'Unidades'
        return obj.material.get_unidade_medida_display()

class ProdutoProcessoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProdutoProcesso
        fields = '__all__'

class ProdutoAcabadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProdutoAcabado
        fields = '__all__'

class GolaSubtipoSerializer(serializers.Serializer):
    categoria_subtipo = serializers.CharField(max_length=255)