from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Cliente, PedidoCliente
from .serializers import ClienteSerializer, PedidoClienteSerializer, PedidoStatusUpdateSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

class PedidoClienteViewSet(viewsets.ModelViewSet):
    queryset = PedidoCliente.objects.all()
    serializer_class = PedidoClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow authenticated users to see all orders,
        # or filter by client if a client is logged in (e.g., via a custom token)
        # For simplicity, assuming IsAuthenticated is enough for now.
        return PedidoCliente.objects.all()

    def get_serializer_class(self):
        if self.action == 'partial_update':
            return PedidoStatusUpdateSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def request_change(self, request, pk=None):
        pedido = self.get_object()
        serializer = self.get_serializer(pedido, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class ClienteAuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        cpf_cnpj = request.data.get('cpf_cnpj')
        numero_pedido = request.data.get('numero_pedido')

        if not cpf_cnpj and not numero_pedido:
            return Response({"detail": "CPF/CNPJ or Numero do Pedido is required."}, status=status.HTTP_400_BAD_REQUEST)

        cliente = None
        if cpf_cnpj:
            try:
                cliente = Cliente.objects.get(cpf_cnpj=cpf_cnpj)
            except Cliente.DoesNotExist:
                pass

        if numero_pedido and not cliente:
            try:
                pedido = PedidoCliente.objects.get(numero_pedido=numero_pedido)
                cliente = pedido.cliente
            except PedidoCliente.DoesNotExist:
                pass
        
        if cliente:
            # In a real application, you would generate and return a token here
            # For simplicity, we'll just return client data
            serializer = ClienteSerializer(cliente)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid credentials or order number."}, status=status.HTTP_401_UNAUTHORIZED)

class PedidoTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PedidoCliente.objects.all()
    serializer_class = PedidoClienteSerializer
    permission_classes = [AllowAny] # Publicly accessible for tracking

    lookup_field = 'numero_pedido' # Allow lookup by numero_pedido

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except PedidoCliente.DoesNotExist:
            return Response({"detail": "Pedido not found."}, status=status.HTTP_404_NOT_FOUND)
