from django.db import models
from apps.comercial.models import PedidoVenda

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Entrega(BaseModel):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('EM_ROTA', 'Em Rota'),
        ('ENTREGUE', 'Entregue'),
        ('CANCELADA', 'Cancelada'),
    ]

    pedido = models.ForeignKey(PedidoVenda, on_delete=models.CASCADE, related_name='entregas')
    endereco_destino = models.CharField(max_length=255)
    data_envio = models.DateField(null=True, blank=True)
    data_prevista_entrega = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    transportadora = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Entrega"
        verbose_name_plural = "Entregas"
        ordering = ['data_prevista_entrega', 'status']
        indexes = [
            models.Index(fields=['pedido']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Entrega do Pedido {self.pedido.id} para {self.endereco_destino} - Status: {self.status}"

class RotaEntrega(BaseModel):
    STATUS_CHOICES = [
        ('PLANEJADA', 'Planejada'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]

    entregador = models.CharField(max_length=255) # Could be a ForeignKey to a User or Entregador model
    entregas = models.ManyToManyField(Entrega, related_name='rotas')
    data_rota = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANEJADA')

    class Meta:
        verbose_name = "Rota de Entrega"
        verbose_name_plural = "Rotas de Entrega"
        ordering = ['data_rota', 'status']
        indexes = [
            models.Index(fields=['entregador', 'data_rota']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Rota de {self.entregador} em {self.data_rota} - Status: {self.status}"
