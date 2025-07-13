from django.db import models

class Produto(models.Model):
    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    codigo = models.CharField(max_length=100, unique=True)
    unidade_medida = models.CharField(max_length=50)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"

class OrdemProducao(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]

    pedido_venda = models.ForeignKey('comercial.PedidoVenda', on_delete=models.SET_NULL, null=True, blank=True, related_name='ordens_producao')
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    quantidade_produzir = models.DecimalField(max_digits=10, decimal_places=2)
    data_inicio_prevista = models.DateField()
    data_fim_prevista = models.DateField()
    data_inicio_real = models.DateField(blank=True, null=True)
    data_fim_real = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"OP {self.id} - {self.produto.nome}"

    class Meta:
        verbose_name = "Ordem de Produção"
        verbose_name_plural = "Ordens de Produção"

class EtapaProducao(models.Model):
    ordem_producao = models.ForeignKey(OrdemProducao, on_delete=models.CASCADE, related_name='etapas')
    nome_etapa = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    sequencia = models.IntegerField()
    data_inicio_prevista = models.DateField()
    data_fim_prevista = models.DateField()
    data_inicio_real = models.DateField(blank=True, null=True)
    data_fim_real = models.DateField(blank=True, null=True)
    concluida = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.ordem_producao.produto.nome} - Etapa {self.sequencia}: {self.nome_etapa}"

    class Meta:
        verbose_name = "Etapa de Produção"
        verbose_name_plural = "Etapas de Produção"
        ordering = ['sequencia']

class OrdemProducaoObservacao(models.Model):
    ordem_producao = models.ForeignKey(OrdemProducao, on_delete=models.CASCADE, related_name='producao_observacoes')
    tipo = models.CharField(max_length=50, choices=[('OBSERVACAO', 'Observação'), ('RETRABALHO', 'Retrabalho')])
    descricao = models.TextField()
    data_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OP {self.ordem_producao.id} - {self.tipo} em {self.data_registro.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        verbose_name = "Observação/Retrabalho da Ordem de Produção"
        verbose_name_plural = "Observações/Retrabalhos das Ordens de Produção"
        ordering = ['-data_registro']
