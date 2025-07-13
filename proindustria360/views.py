from rest_framework.response import Response
from rest_framework.views import APIView
from django.urls import reverse

class APIRoot(APIView):
    def get(self, request, format=None):
        return Response({
            'admin': reverse('admin:index', request=request, format=format),
            'token_obtain_pair': reverse('token_obtain_pair', request=request, format=format),
            'token_refresh': reverse('token_refresh', request=request, format=format),
            'token_verify': reverse('token_verify', request=request, format=format),
            'pcp': request.build_absolute_uri(reverse('pcp:ordemproducao-list', request=request, format=format)),
            'estoque': request.build_absolute_uri(reverse('estoque:estoque-list', request=request, format=format)),
            'comercial': request.build_absolute_uri(reverse('comercial:comercial-list', request=request, format=format)),
            'logistica': request.build_absolute_uri(reverse('logistica:logistica-list', request=request, format=format)),
            'producao': request.build_absolute_uri(reverse('producao:producao-list', request=request, format=format)),
            'qualidade': request.build_absolute_uri(reverse('qualidade:qualidade-list', request=request, format=format)),
            'clientes': request.build_absolute_uri(reverse('clientes:clientes-list', request=request, format=format)),
            'dashboards': request.build_absolute_uri(reverse('dashboards:dashboards-list', request=request, format=format)),
        })