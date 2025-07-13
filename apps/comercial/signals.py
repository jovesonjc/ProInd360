from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from decimal import Decimal
from .models import PedidoVenda, ItemPedido
from apps.estoque.models import MateriaPrima, HistoricoUsoMaterial

# @receiver(post_save, sender=PedidoVenda)
def baixar_estoque_materiais(sender, instance, **kwargs):
    """
    Signal para baixar o estoque de matéria-prima quando o status do pedido
    de venda for alterado para 'Materiais Confirmados'.
    A baixa só ocorre uma vez, controlada pelo campo 'materiais_baixados'.
    """
    if instance.status == 'MATERIAIS_CONFIRMADOS' and not instance.materiais_baixados:
        try:
            with transaction.atomic():
                materiais_a_processar = {}

                # 1. Agrupa e soma todas as quantidades necessárias por material
                for item in instance.itens.all():
                    for material_info in item.materiais:
                        material_id = material_info.get('material_id')
                        quantidade_necessaria = Decimal(material_info.get('quantidade', 0))

                        if not material_id or quantidade_necessaria <= 0:
                            continue
                        
                        materiais_a_processar[material_id] = materiais_a_processar.get(material_id, 0) + quantidade_necessaria

                # 2. Processa a baixa para cada material
                for material_id, total_necessario in materiais_a_processar.items():
                    try:
                        # Bloqueia a linha para evitar condições de corrida
                        material = MateriaPrima.objects.select_for_update().get(id=material_id)
                        
                        if material.quantity < total_necessario:
                            raise Exception(f"Estoque insuficiente para {material.name}. Necessário: {total_necessario}, Disponível: {material.quantity}")

                        # Atualiza a quantidade diretamente no banco de dados para contornar o save()
                        nova_quantidade = material.quantity - total_necessario
                        MateriaPrima.objects.filter(id=material_id).update(quantity=nova_quantidade)

                        # Cria o registro no histórico
                        HistoricoUsoMaterial.objects.create(
                            material=material,
                            pedido_venda=instance,
                            quantidade_utilizada=total_necessario
                        )

                    except MateriaPrima.DoesNotExist:
                        raise Exception(f"Matéria-prima com ID {material_id} não encontrada.")

                # 3. Marca o pedido como processado para evitar nova baixa
                instance.materiais_baixados = True
                instance.save(update_fields=['materiais_baixados', 'updated_at'])

        except Exception as e:
            print(f"ERRO na transação ao baixar estoque para o pedido {instance.id}: {e}")

@receiver(post_save, sender=ItemPedido)
@receiver(post_delete, sender=ItemPedido)
def atualizar_materiais_pedido_venda(sender, instance, **kwargs):
    """
    Signal para atualizar o campo 'materiais_necessarios' no PedidoVenda
    sempre que um ItemPedido associado for salvo ou deletado.
    """
    pedido_venda = instance.pedido

    # Agrega todos os materiais de todos os itens do pedido
    materiais_agregados = {}
    for item in pedido_venda.itens.all():
        for material_info in item.materiais:
            material_id = material_info.get('material_id')
            quantidade = material_info.get('quantidade', 0)
            nome = material_info.get('nome', 'Desconhecido')
            unidade = material_info.get('unidade', '')

            if material_id:
                if material_id not in materiais_agregados:
                    materiais_agregados[material_id] = {
                        'material_id': material_id,
                        'nome': nome,
                        'quantidade': 0,
                    }
                materiais_agregados[material_id]['quantidade'] += quantidade
    
    # Converte o dicionário de volta para uma lista de dicionários
    pedido_venda.materiais_necessarios = list(materiais_agregados.values())
    pedido_venda.save(update_fields=['materiais_necessarios', 'updated_at'])