from django.contrib import admin

from .models import Produto, OrdemProducao, EtapaProducao

admin.site.register(Produto)
admin.site.register(OrdemProducao)
admin.site.register(EtapaProducao)
