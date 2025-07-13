from django.db import models


class OrdemProducao(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]

    PRIORITY_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('MEDIA', 'Média'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]

    client = models.CharField(max_length=255)
    start_date = models.DateField()
    estimated_end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIA')

    class Meta:
        verbose_name = "Ordem de Produção"
        verbose_name_plural = "Ordens de Produção"
        ordering = ['start_date']

    def __str__(self):
        return f"Ordem de Produção {self.id} - Cliente: {self.client}"

class EtapaProducao(models.Model):
    order = models.ForeignKey(OrdemProducao, on_delete=models.CASCADE, related_name='etapas')
    name = models.CharField(max_length=100)
    estimated_time = models.DurationField()
    actual_time = models.DurationField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Etapa de Produção"
        verbose_name_plural = "Etapas de Produção"
        ordering = ['order', 'name']

    def __str__(self):
        return f"Etapa: {self.name} ({self.order.client})"

class HistoricoEtapas(models.Model):
    step = models.ForeignKey(EtapaProducao, on_delete=models.CASCADE, related_name='historico')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Histórico da Etapa {self.step.name} - Início: {self.start_time}"

    class Meta:
        verbose_name = "Histórico de Etapa"
        verbose_name_plural = "Históricos de Etapas"
        ordering = ['start_time']
