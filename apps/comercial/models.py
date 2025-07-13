from django.db import models
from apps.clientes.models import Cliente
from apps.estoque.models import MateriaPrima

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class PedidoVenda(BaseModel):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('APROVADO', 'Aprovado'),
        ('REJEITADO', 'Rejeitado'),
        ('CONCLUIDO', 'Concluído'),
        ('CANCELADO', 'Cancelado'),
        ('PRODUCAO', 'Em Produção'),
        ('ESTOQUE', 'Estoque'),
        ('CORTE', 'Corte'),
        ('ESTAMPARIA', 'Estamparia'),
        ('BORDADO', 'Bordado'),
        ('COSTURA', 'Costura'),
        ('ACABAMENTO', 'Acabamento'),
        ('EMBALAGEM', 'Embalagem'),
        ('MATERIAIS_CONFIRMADOS', 'Materiais Confirmados'),
        ('MATERIAIS_INCOMPLETOS', 'Materiais Incompletos'),
    ]

    PRIORIDADE_CHOICES = [
        ('NORMAL', 'Normal'),
        ('URGENTE', 'Urgente'),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pedidos_venda')
    data_pedido = models.DateTimeField(auto_now_add=True)
    prazo = models.DateField(null=True, blank=True)
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES, default='NORMAL')
    quantidade_pecas = models.PositiveIntegerField(default=1)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDENTE')
    etapas = models.JSONField(default=list, blank=True)
    em_espera = models.BooleanField(default=False)
    materiais_baixados = models.BooleanField(default=False)
    materiais_necessarios = models.JSONField(default=list, blank=True, help_text="Lista consolidada de materiais necessários para o pedido")

    class Meta:
        verbose_name = "Pedido de Venda"
        verbose_name_plural = "Pedidos de Venda"
        ordering = ['-data_pedido']
        indexes = [
            models.Index(fields=['cliente', 'data_pedido']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Pedido de Venda {self.id} - Cliente: {self.cliente.nome} - Valor: {self.valor_total}"

class ModeloProduto(BaseModel):
    TIPO_PRODUTO_CHOICES = [
        ('CAMISA', 'Camisa'),
        ('CALCA', 'Calça'),
    ]
    nome = models.CharField(max_length=100, unique=True, help_text="Ex: Camisa Polo, Camisa Social, Calça Jeans")
    tipo = models.CharField(max_length=10, choices=TIPO_PRODUTO_CHOICES, default='CAMISA')
    
    class Meta:
        verbose_name = "Modelo de Produto"
        verbose_name_plural = "Modelos de Produtos"
        ordering = ['nome']

    def __str__(self):
        return self.nome

class ConsumoMaterial(BaseModel):
    TAMANHO_CHOICES = [
        ('P', 'P'),
        ('M', 'M'),
        ('G', 'G'),
        ('GG', 'GG'),
        ('XG', 'XG'),
    ]
    modelo = models.ForeignKey(ModeloProduto, on_delete=models.CASCADE, related_name='consumo_materiais')
    tamanho = models.CharField(max_length=3, choices=TAMANHO_CHOICES)
    material = models.ForeignKey(MateriaPrima, on_delete=models.CASCADE, related_name='consumo_modelos')
    quantidade = models.DecimalField(max_digits=10, decimal_places=3, help_text="Consumo do material para este tamanho")

    class Meta:
        verbose_name = "Consumo de Material por Tamanho"
        verbose_name_plural = "Consumos de Materiais por Tamanho"
        unique_together = ('modelo', 'tamanho', 'material')
        ordering = ['modelo', 'tamanho']

    def __str__(self):
        return f"{self.modelo.nome} ({self.tamanho}): {self.material.name} - {self.quantidade}"


class ItemPedido(BaseModel):
    TIPO_PRODUTO_CHOICES = [
        ('CAMISA', 'Camisa'),
        ('CALCA', 'Calça'),
    ]

    pedido = models.ForeignKey(PedidoVenda, related_name='itens', on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO_PRODUTO_CHOICES, default='CAMISA')
    modelo_base = models.ForeignKey('ModeloProduto', on_delete=models.SET_NULL, null=True, blank=True, help_text="Modelo base para ficha técnica de materiais")
    
    # Campo de modelo genérico
    modelo = models.CharField(max_length=255, blank=True, help_text="Ex: 'Gola Polo Tradicional' ou 'Calça Jogger Masculina'")

    # Campos específicos para Camisa
    gola = models.CharField(max_length=255, blank=True, null=True)
    manga = models.CharField(max_length=255, blank=True, null=True)
    corpo_frente = models.CharField(max_length=255, blank=True, null=True)
    corpo_costa = models.CharField(max_length=255, blank=True, null=True)
    bordado = models.TextField(blank=True, null=True, help_text="Detalhes do bordado")

    # Campos compartilhados
    materiais = models.JSONField(default=list, help_text="Lista de materiais e suas quantidades. Ex: [{'material_id': 1, 'quantidade': 2.5}]")
    tamanhos = models.JSONField(default=dict, help_text="Grade de tamanhos e quantidades. Ex: {'P': 10, 'M': 20}")
    descricao = models.TextField(blank=True, null=True, help_text="Descrição adicional opcional")
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def calcular_materiais(self):
        """
        Calcula a necessidade total de materiais com base na grade de tamanhos e no consumo por modelo.
        """
        if not self.modelo_base or not self.tamanhos:
            self.materiais = []
            return

        necessidades = {}
        for tamanho, quantidade_pecas in self.tamanhos.items():
            if quantidade_pecas <= 0:
                continue
            
            consumo_por_tamanho = ConsumoMaterial.objects.filter(modelo=self.modelo_base, tamanho=tamanho)
            for consumo in consumo_por_tamanho:
                material_id = consumo.material.id
                quantidade_necessaria = consumo.quantidade * quantidade_pecas
                
                if material_id not in necessidades:
                    necessidades[material_id] = {'material_id': material_id, 'nome': consumo.material.name, 'quantidade': 0, 'unidade': consumo.material.get_unidade_medida_display()}
                
                necessidades[material_id]['quantidade'] += float(quantidade_necessaria)

        self.materiais = list(necessidades.values())

    def save(self, *args, **kwargs):
        self.calcular_materiais()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Item de Pedido"
        verbose_name_plural = "Itens de Pedido"

    def __str__(self):
        return f"Item de Pedido {self.id} - {self.get_tipo_display()} ({self.modelo})"

class Orcamento(BaseModel):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('APROVADO', 'Aprovado'),
        ('REJEITADO', 'Rejeitado'),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='orcamentos')
    descricao = models.TextField()
    valor_estimado = models.DecimalField(max_digits=10, decimal_places=2)
    data = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')

    class Meta:
        verbose_name = "Orçamento"
        verbose_name_plural = "Orçamentos"
        ordering = ['-data']
        indexes = [
            models.Index(fields=['cliente', 'data']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Orçamento {self.id} - Cliente: {self.cliente.nome} - Valor Estimado: {self.valor_estimado}"

class Vendedor(BaseModel):
    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    meta_mensal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        verbose_name = "Vendedor"
        verbose_name_plural = "Vendedores"
        ordering = ['nome']
        indexes = [
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return self.nome

class Comissao(BaseModel):
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE, related_name='comissoes')
    pedido = models.ForeignKey(PedidoVenda, on_delete=models.CASCADE, related_name='comissoes')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_pagamento = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Comissão"
        verbose_name_plural = "Comissões"
        ordering = ['-data_pagamento', 'vendedor']
        indexes = [
            models.Index(fields=['vendedor', 'data_pagamento']),
            models.Index(fields=['pedido']),
        ]

    def __str__(self):
        return f"Comissão de {self.valor} para {self.vendedor.nome} (Pedido: {self.pedido.id})"
