from django.db import models
from apps.pcp.models import OrdemProducao, EtapaProducao
# Assuming 'producao' app has a 'Peca' or similar model if needed for 'tipo_peca' FK
# from apps.producao.models import Peca # Uncomment if Peca model exists and is relevant

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class ChecklistInspecao(BaseModel):
    SETOR_CHOICES = [
        ('RECEBIMENTO', 'Recebimento'),
        ('PRODUCAO', 'Produção'),
        ('FINALIZACAO', 'Finalização'),
        ('EXPEDICAO', 'Expedição'),
    ]

    tipo_peca = models.CharField(max_length=100) # Could be ForeignKey to a Peca model
    itens = models.TextField(help_text="Lista de itens do checklist, separados por linha ou JSON.")
    setor = models.CharField(max_length=20, choices=SETOR_CHOICES)

    class Meta:
        verbose_name = "Checklist de Inspeção"
        verbose_name_plural = "Checklists de Inspeção"
        ordering = ['setor', 'tipo_peca']

    def __str__(self):
        return f"Checklist para {self.tipo_peca} no setor de {self.setor}"

class Falha(BaseModel):
    TIPO_FALHA_CHOICES = [
        ('DEFEITO', 'Defeito'),
        ('NAO_CONFORMIDADE', 'Não Conformidade'),
        ('ERRO_OPERACIONAL', 'Erro Operacional'),
        ('OUTRO', 'Outro'),
    ]

    ordem = models.ForeignKey(OrdemProducao, on_delete=models.CASCADE, related_name='falhas')
    etapa = models.ForeignKey(EtapaProducao, on_delete=models.CASCADE, related_name='falhas', null=True, blank=True)
    descricao = models.TextField()
    tipo_falha = models.CharField(max_length=30, choices=TIPO_FALHA_CHOICES, default='DEFEITO')
    resolvido = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Falha"
        verbose_name_plural = "Falhas"
        ordering = ['-created_at', 'resolvido']
        indexes = [
            models.Index(fields=['ordem', 'etapa']),
            models.Index(fields=['tipo_falha', 'resolvido']),
        ]

    def __str__(self):
        return f"Falha na Ordem {self.ordem.id} - Tipo: {self.tipo_falha} - Resolvido: {self.resolvido}"

class Retrabalho(BaseModel):
    falha = models.OneToOneField(Falha, on_delete=models.CASCADE, related_name='retrabalho')
    operador_responsavel = models.CharField(max_length=255) # Could be ForeignKey to a User or Operador model
    tempo_gasto = models.DurationField()
    data_retrabalho = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Retrabalho"
        verbose_name_plural = "Retrabalhos"
        ordering = ['-data_retrabalho']
        indexes = [
            models.Index(fields=['operador_responsavel', 'data_retrabalho']),
        ]

    def __str__(self):
        return f"Retrabalho para Falha {self.falha.id} - Operador: {self.operador_responsavel}"
