from rest_framework import serializers
from .models import PedidoVenda, Orcamento, Vendedor, Comissao, ItemPedido, ModeloProduto, ConsumoMaterial
from apps.estoque.models import MateriaPrima
from apps.estoque.serializers import MateriaPrimaSerializer

class MaterialPedidoSerializer(serializers.Serializer):
    material_id = serializers.IntegerField()
    quantidade = serializers.FloatField()
    material = MateriaPrimaSerializer(read_only=True)

    def to_representation(self, instance):
        # instance is a dict like {'material_id': 1, 'quantidade': 2.5}
        try:
            material_obj = MateriaPrima.objects.get(id=instance['material_id'])
            material_data = MateriaPrimaSerializer(material_obj).data
        except MateriaPrima.DoesNotExist:
            material_data = None # Or a default representation indicating missing material
        
        return {
            'material_id': instance['material_id'],
            'quantidade': instance['quantidade'],
            'material': material_data
        }

class ConsumoMaterialSerializer(serializers.ModelSerializer):
    material_id = serializers.PrimaryKeyRelatedField(
        queryset=MateriaPrima.objects.all(), source='material', write_only=True
    )
    material = MateriaPrimaSerializer(read_only=True)

    class Meta:
        model = ConsumoMaterial
        fields = ['id', 'tamanho', 'material_id', 'material', 'quantidade']
        read_only_fields = ['id', 'material'] # 'material' is read-only for output

class ModeloProdutoSerializer(serializers.ModelSerializer):
    consumo_materiais = ConsumoMaterialSerializer(many=True, required=False)

    class Meta:
        model = ModeloProduto
        fields = ['id', 'nome', 'tipo', 'consumo_materiais']

    def create(self, validated_data):
        consumo_materiais_data = validated_data.pop('consumo_materiais', [])
        modelo_produto = ModeloProduto.objects.create(**validated_data)
        for consumo_data in consumo_materiais_data:
            ConsumoMaterial.objects.create(modelo=modelo_produto, **consumo_data)
        return modelo_produto

    def update(self, instance, validated_data):
        consumo_materiais_data = validated_data.pop('consumo_materiais', None)

        instance.nome = validated_data.get('nome', instance.nome)
        instance.tipo = validated_data.get('tipo', instance.tipo)
        instance.save()

        if consumo_materiais_data is not None:
            # Get existing consumo_materiais for the instance
            existing_consumo_materiais = list(instance.consumo_materiais.all())
            existing_ids = {cm.id for cm in existing_consumo_materiais}
            
            # Separate incoming data into updates and creations
            consumo_materiais_to_update = []
            consumo_materiais_to_create = []
            incoming_ids = set()

            for item_data in consumo_materiais_data:
                item_id = item_data.get('id')
                if item_id and item_id in existing_ids:
                    consumo_materiais_to_update.append(item_data)
                    incoming_ids.add(item_id)
                else:
                    consumo_materiais_to_create.append(item_data)
            
            # Delete items not in the incoming data
            for cm_instance in existing_consumo_materiais:
                if cm_instance.id not in incoming_ids:
                    cm_instance.delete()
            
            # Update existing items
            for item_data in consumo_materiais_to_update:
                cm_instance = ConsumoMaterial.objects.get(id=item_data['id'], modelo=instance)
                for attr, value in item_data.items():
                    if attr != 'id':
                        setattr(cm_instance, attr, value)
                cm_instance.save()
            
            # Create new items
            for item_data in consumo_materiais_to_create:
                ConsumoMaterial.objects.create(modelo=instance, **item_data)

        return instance

class ItemPedidoSerializer(serializers.ModelSerializer):
    modelo_base = serializers.PrimaryKeyRelatedField(
        queryset=ModeloProduto.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    modelo_base_data = ModeloProdutoSerializer(source='modelo_base', read_only=True)
    materiais = MaterialPedidoSerializer(many=True, read_only=True) # Mark as read-only

    class Meta:
        model = ItemPedido
        fields = [
            'id', 'tipo', 'modelo_base', 'modelo_base_data', 'modelo', 'gola', 'manga', 'corpo_frente',
            'corpo_costa', 'bordado', 'materiais', 'tamanhos',
            'descricao', 'preco_unitario'
        ]
        
class PedidoVendaSerializer(serializers.ModelSerializer):
    itens = ItemPedidoSerializer(many=True)

    class Meta:
        model = PedidoVenda
        fields = [
            'id', 'cliente', 'data_pedido', 'prazo', 'prioridade',
            'quantidade_pecas', 'valor_total', 'status', 'etapas',
            'itens', 'created_at', 'updated_at', 'materiais_necessarios'
        ]

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        pedido = PedidoVenda.objects.create(**validated_data)
        for item_data in itens_data:
            # Remove 'materiais' from item_data as it's a calculated field
            item_data.pop('materiais', None)
            item = ItemPedido.objects.create(pedido=pedido, **item_data)
            # The .save() method of ItemPedido will automatically call calcular_materiais()
            item.save()
        return pedido

    def update(self, instance, validated_data):
        itens_data = validated_data.pop('itens', None)
        
        # Update PedidoVenda fields
        instance.cliente = validated_data.get('cliente', instance.cliente)
        instance.prazo = validated_data.get('prazo', instance.prazo)
        instance.prioridade = validated_data.get('prioridade', instance.prioridade)
        instance.quantidade_pecas = validated_data.get('quantidade_pecas', instance.quantidade_pecas)
        instance.valor_total = validated_data.get('valor_total', instance.valor_total)
        instance.status = validated_data.get('status', instance.status)
        instance.save()

        if itens_data is not None:
            # Efficient update: map existing items by ID
            existing_items = {item.id: item for item in instance.itens.all()}
            
            for item_data in itens_data:
                item_id = item_data.get('id')
                if item_id and item_id in existing_items:
                    # Update existing item
                    item_instance = existing_items.pop(item_id)
                    # Update fields...
                    # Remove 'materiais' from item_data as it's a calculated field
                    item_data.pop('materiais', None)
                    # Update other fields
                    for attr, value in item_data.items():
                        setattr(item_instance, attr, value)
                    item_instance.save()
                else:
                    # Create new item
                    # Remove 'materiais' from item_data as it's a calculated field
                    item_data.pop('materiais', None)
                    new_item = ItemPedido.objects.create(pedido=instance, **item_data)
                    new_item.save()

            # Remove old items that were not in the update
            for item_instance in existing_items.values():
                item_instance.delete()

        return instance

class OrcamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Orcamento
        fields = '__all__'

class VendedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendedor
        fields = '__all__'

class ComissaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comissao
        fields = '__all__'