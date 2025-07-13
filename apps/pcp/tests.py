from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from datetime import date, timedelta
from apps.pcp.models import OrdemProducao, EtapaProducao, HistoricoEtapas

class OrdemProducaoTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # Assuming authentication is required, create a dummy user or mock authentication
        # For simplicity, we'll proceed without explicit user creation if IsAuthenticated is not strictly enforced for tests
        # If it is, you'd need to create a user and authenticate:
        # from django.contrib.auth.models import User
        # self.user = User.objects.create_user(username='testuser', password='testpassword')
        # self.client.force_authenticate(user=self.user)

    def test_create_ordem_producao(self):
        """
        Ensure we can create a new OrdemProducao object.
        """
        url = reverse('ordemproducao-list')
        data = {
            'client': 'Cliente Teste',
            'start_date': date.today().isoformat(),
            'estimated_end_date': (date.today() + timedelta(days=7)).isoformat(),
            'status': 'PENDENTE',
            'priority': 'MEDIA'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(OrdemProducao.objects.count(), 1)
        self.assertEqual(OrdemProducao.objects.get().client, 'Cliente Teste')

    def test_link_steps_to_order(self):
        """
        Ensure we can link EtapaProducao steps to an OrdemProducao.
        """
        ordem = OrdemProducao.objects.create(
            client='Cliente com Etapas',
            start_date=date.today(),
            estimated_end_date=(date.today() + timedelta(days=10)),
            status='EM_ANDAMENTO',
            priority='ALTA'
        )
        url = reverse('etapaproducao-list')
        data = {
            'order': ordem.id,
            'name': 'Corte',
            'estimated_time': str(timedelta(hours=5)),
            'is_completed': False
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EtapaProducao.objects.count(), 1)
        self.assertEqual(EtapaProducao.objects.get().order, ordem)

        data = {
            'order': ordem.id,
            'name': 'Montagem',
            'estimated_time': str(timedelta(hours=10)),
            'is_completed': False
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EtapaProducao.objects.count(), 2)
        self.assertEqual(ordem.etapas.count(), 2)

class RelatorioTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # Assuming authentication is required, create a dummy user or mock authentication
        # from django.contrib.auth.models import User
        # self.user = User.objects.create_user(username='testuser', password='testpassword')
        # self.client.force_authenticate(user=self.user)

        self.ordem = OrdemProducao.objects.create(
            client='Cliente Relatorio',
            start_date=date.today(),
            estimated_end_date=(date.today() + timedelta(days=10)),
            status='CONCLUIDA',
            priority='MEDIA'
        )
        self.etapa1 = EtapaProducao.objects.create(
            order=self.ordem,
            name='Etapa A',
            estimated_time=timedelta(hours=8),
            actual_time=timedelta(hours=7),
            is_completed=True
        )
        self.etapa2 = EtapaProducao.objects.create(
            order=self.ordem,
            name='Etapa B',
            estimated_time=timedelta(hours=5),
            actual_time=timedelta(hours=6),
            is_completed=True
        )
        self.etapa3 = EtapaProducao.objects.create(
            order=self.ordem,
            name='Etapa C',
            estimated_time=timedelta(hours=10),
            actual_time=None, # Not completed yet
            is_completed=False
        )

    def test_report_estimated_vs_actual_time(self):
        """
        Ensure the report endpoint correctly compares estimated vs actual time.
        """
        url = reverse('relatorios-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        # Find data for etapa1
        etapa1_data = next(item for item in response.data if item['id'] == self.etapa1.id)
        self.assertIsNotNone(etapa1_data)
        self.assertEqual(etapa1_data['name'], 'Etapa A')
        self.assertEqual(etapa1_data['estimated_time'], '8:00:00')
        self.assertEqual(etapa1_data['actual_time'], '7:00:00')
        self.assertEqual(etapa1_data['time_difference'], '1:00:00') # estimated - actual = 8 - 7 = 1 hour

        # Find data for etapa2
        etapa2_data = next(item for item in response.data if item['id'] == self.etapa2.id)
        self.assertIsNotNone(etapa2_data)
        self.assertEqual(etapa2_data['name'], 'Etapa B')
        self.assertEqual(etapa2_data['estimated_time'], '5:00:00')
        self.assertEqual(etapa2_data['actual_time'], '6:00:00')
        self.assertEqual(etapa2_data['time_difference'], '-1:00:00') # estimated - actual = 5 - 6 = -1 hour

        # Find data for etapa3 (actual_time is None)
        etapa3_data = next(item for item in response.data if item['id'] == self.etapa3.id)
        self.assertIsNotNone(etapa3_data)
        self.assertEqual(etapa3_data['name'], 'Etapa C')
        self.assertEqual(etapa3_data['estimated_time'], '10:00:00')
        self.assertIsNone(etapa3_data['actual_time'])
        self.assertIsNone(etapa3_data['time_difference'])
