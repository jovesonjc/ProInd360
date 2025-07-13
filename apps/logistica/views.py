from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Entrega, RotaEntrega
from .serializers import EntregaSerializer, RotaEntregaSerializer
import random
from datetime import timedelta, date, datetime

class EntregaViewSet(viewsets.ModelViewSet):
    queryset = Entrega.objects.all()
    serializer_class = EntregaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'pedido']

class RotaEntregaViewSet(viewsets.ModelViewSet):
    queryset = RotaEntrega.objects.all()
    serializer_class = RotaEntregaSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def batch_create_deliveries(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class IntegracaoLogisticaViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny] # Publicly accessible for simulation

    @action(detail=False, methods=['post'])
    def simulate_shipping_cost(self, request):
        # This is a simplified simulation. In a real scenario, you'd integrate with
        # Correios/Jadlog APIs, which would involve more complex logic, API keys, etc.
        
        # Example input:
        # {
        #   "origin_zip_code": "01000-000",
        #   "destination_zip_code": "02000-000",
        #   "weight_kg": 1.5,
        #   "dimensions_cm": {"length": 20, "width": 15, "height": 10}
        # }

        origin_zip_code = request.data.get('origin_zip_code')
        destination_zip_code = request.data.get('destination_zip_code')
        weight_kg = request.data.get('weight_kg')
        dimensions_cm = request.data.get('dimensions_cm')

        if not all([origin_zip_code, destination_zip_code, weight_kg, dimensions_cm]):
            return Response({"detail": "Missing required parameters."}, status=status.HTTP_400_BAD_REQUEST)

        # Simulate cost and delivery time
        simulated_cost = round(random.uniform(10.0, 100.0), 2)
        simulated_delivery_days = random.randint(1, 10)
        estimated_delivery_date = date.today() + timedelta(days=simulated_delivery_days)

        return Response({
            "carrier": "Simulated Carrier (Correios/Jadlog)",
            "cost": simulated_cost,
            "estimated_delivery_days": simulated_delivery_days,
            "estimated_delivery_date": estimated_delivery_date.isoformat(),
            "currency": "BRL"
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def simulate_tracking_update(self, request):
        # Simulate a tracking update for a given tracking number
        # In a real scenario, this would be triggered by webhooks or polling from carrier APIs
        tracking_number = request.data.get('tracking_number')
        current_status = request.data.get('current_status')
        location = request.data.get('location')

        if not all([tracking_number, current_status, location]):
            return Response({"detail": "Missing required parameters."}, status=status.HTTP_400_BAD_REQUEST)

        # Here you would update your Entrega model based on the tracking information
        # For simulation, just return a success message
        return Response({
            "tracking_number": tracking_number,
            "new_status": current_status,
            "location": location,
            "timestamp": datetime.now().isoformat(),
            "message": "Tracking updated successfully (simulated)."
        }, status=status.HTTP_200_OK)
