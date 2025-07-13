from django.db import models
from apps.pcp.models import OrdemProducao

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class MateriaPrima(BaseModel):
    UNIDADE_MEDIDA_CHOICES = [
        ('METRO', 'Metro'),
        ('UNIDADE', 'Unidade'),
        ('GRAMA', 'Grama'),
        ('ROLO', 'Rolo'),
        ('CAIXA', 'Caixa'),
        ('LITRO', 'Litro'),
        ('TUBO', 'Tubo'),
    ]

    name = models.CharField(max_length=255, unique=True)
    tipo_produto = models.CharField(max_length=50, default='TECIDO')
    categoria_subtipo = models.CharField(max_length=255, blank=True, default='')
    cor = models.CharField(max_length=100, blank=True, default='')
    unidade_medida = models.CharField(max_length=20, choices=UNIDADE_MEDIDA_CHOICES, default='UNIDADE')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Quantidade")
    
    LOCAL_CHOICES = [
        ('ALMOXARIFADO', 'Almoxarifado'),
        ('MEZANINO', 'Mezanino'),
        ('PRODUCAO', 'Produção'),
    ]
    local = models.CharField(max_length=255, choices=LOCAL_CHOICES, default='ALMOXARIFADO')
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Campos específicos para Rolo
    quantidade_rolos = models.IntegerField(
        blank=True, null=True,
        help_text="Quantidade de rolos (preenchido apenas para unidade 'Rolo')"
    )
    metragem_por_rolo = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True,
        help_text="Metragem por rolo (preenchido apenas para unidade 'Rolo')"
    )

    # Campos específicos para Caixa
    quantidade_caixas = models.IntegerField(
        blank=True, null=True,
        help_text="Quantidade de caixas (preenchido apenas para unidade 'Caixa')"
    )
    quantidade_por_caixa = models.IntegerField(
        blank=True, null=True,
        help_text="Quantidade de unidades por caixa (preenchido apenas para unidade 'Caixa')"
    )

    # Campos específicos para Tubo (Linha)
    quantidade_tubos = models.IntegerField(
        blank=True, null=True,
        help_text="Quantidade de tubos (preenchido apenas para unidade 'Tubo')"
    )
    metros_por_tubo = models.DecimalField(
        max_digits=10, decimal_places=2,
        blank=True, null=True,
        help_text="Metragem por tubo (preenchido apenas para unidade 'Tubo')"
    )
 
    class Meta:
        verbose_name = "Matéria Prima"
        verbose_name_plural = "Matérias Primas"
        ordering = ['name']

    def save(self, *args, **kwargs):
        if self.unidade_medida == 'ROLO' and self.quantidade_rolos is not None and self.metragem_por_rolo is not None:
            self.quantity = self.quantidade_rolos * self.metragem_por_rolo
        elif self.unidade_medida == 'CAIXA' and self.quantidade_caixas is not None and self.quantidade_por_caixa is not None:
            self.quantity = self.quantidade_caixas * self.quantidade_por_caixa
        elif self.unidade_medida == 'TUBO' and self.quantidade_tubos is not None and self.metros_por_tubo is not None:
            self.quantity = self.quantidade_tubos * self.metros_por_tubo
        super().save(*args, **kwargs)

    def __str__(self):
        if self.unidade_medida == 'ROLO':
            return f"{self.name} ({self.quantity} M em {self.quantidade_rolos or 0} rolos)"
        if self.unidade_medida == 'CAIXA':
            return f"{self.name} ({self.quantity} Unidades em {self.quantidade_caixas or 0} caixas)"
        if self.unidade_medida == 'TUBO':
            return f"{self.name} ({self.quantity} M em {self.quantidade_tubos or 0} tubos)"
        return f"{self.name} ({self.quantity} {self.get_unidade_medida_display()})"

class ProdutoProcesso(BaseModel):
    STATUS_CHOICES = [
        ('EM_PRODUCAO', 'Em Produção'),
        ('AGUARDANDO_QUALIDADE', 'Aguardando Qualidade'),
        ('REJEITADO', 'Rejeitado'),
        ('CONCLUIDO', 'Concluído'),
    ]

    name = models.CharField(max_length=255)
    order = models.ForeignKey(OrdemProducao, on_delete=models.CASCADE, related_name='produtos_em_processo')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='EM_PRODUCAO')

    class Meta:
        verbose_name = "Produto em Processo"
        verbose_name_plural = "Produtos em Processo"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} (Ordem: {self.order.id}) - Status: {self.status}"

class ProdutoAcabado(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    quantity = models.IntegerField(default=0)
    production_date = models.DateField()

    class Meta:
        verbose_name = "Produto Acabado"
        verbose_name_plural = "Produtos Acabados"
        ordering = ['-production_date', 'name']

    def __str__(self):
        return f"{self.name} ({self.quantity} unidades) - Produzido em: {self.production_date}"

class HistoricoUsoMaterial(BaseModel):
    material = models.ForeignKey(MateriaPrima, on_delete=models.CASCADE, related_name='historico_uso')
    pedido_venda = models.ForeignKey('comercial.PedidoVenda', on_delete=models.SET_NULL, null=True, blank=True, related_name='historico_materiais_usados')
    quantidade_utilizada = models.DecimalField(max_digits=10, decimal_places=2)
    data_utilizacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Histórico de Uso de Material"
        verbose_name_plural = "Históricos de Uso de Materiais"
        ordering = ['-data_utilizacao']

    def __str__(self):
        return f"{self.material.name} - {self.quantidade_utilizada} {self.material.get_unidade_medida_display()} em {self.data_utilizacao.strftime('%d/%m/%Y %H:%M')}"
