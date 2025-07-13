from django.db import models
from apps.pcp.models import OrdemProducao

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Cliente(BaseModel):
    TIPO_CHOICES = [
        ('PF', 'Pessoa Física'),
        ('PJ', 'Pessoa Jurídica'),
    ]

    nome = models.CharField(max_length=255)
    cpf_cnpj = models.CharField(max_length=18, unique=True)
    email = models.EmailField(blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    tipo = models.CharField(max_length=2, choices=TIPO_CHOICES, default='PF')

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['nome']

    def __str__(self):
        return self.nome

class PedidoCliente(BaseModel):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('EM_PROCESSAMENTO', 'Em Processamento'),
        ('ENVIADO', 'Enviado'),
        ('ENTREGUE', 'Entregue'),
        ('CANCELADO', 'Cancelado'),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pedidos')
    numero_pedido = models.CharField(max_length=50, unique=True)
    data_pedido = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    etapa_atual = models.CharField(max_length=100, blank=True, null=True)
    data_entrega_prevista = models.DateField(blank=True, null=True)
    
    # Link to OrdemProducao if a client order directly triggers a production order
    ordem_producao = models.ForeignKey(OrdemProducao, on_delete=models.SET_NULL, null=True, blank=True, related_name='pedidos_cliente')

    class Meta:
        verbose_name = "Pedido do Cliente"
        verbose_name_plural = "Pedidos dos Clientes"
        ordering = ['-data_pedido']

    def __str__(self):
        return f"Pedido {self.numero_pedido} - Cliente: {self.cliente.nome}"
