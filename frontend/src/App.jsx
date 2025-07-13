import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import PcpPage from './pages/PcpPage';
import EstoquePage from './pages/EstoquePage';
import ComercialPage from './pages/ComercialPage';
import ClientesPage from './pages/ClientesPage';
import LogisticaPage from './pages/LogisticaPage';
import FinanceiroPage from './pages/FinanceiroPage';
import QualidadePage from './pages/QualidadePage';
import ProducaoPage from './pages/ProducaoPage';
import ProdutosPage from './pages/ProdutosPage';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pcp" element={<PcpPage />} />
          <Route path="estoque" element={<EstoquePage />} />
          <Route path="comercial" element={<ComercialPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="logistica" element={<LogisticaPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="qualidade" element={<QualidadePage />} />
          <Route path="producao" element={<ProducaoPage />} />
          <Route path="produtos" element={<ProdutosPage />} />
          <Route index element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;