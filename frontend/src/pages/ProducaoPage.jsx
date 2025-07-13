import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/axios';
import { FiChevronRight, FiCheck, FiRefreshCw, FiEdit3 } from 'react-icons/fi';
import OrdemProducaoObservacaoModal from '../components/OrdemProducaoObservacaoModal';

const statusMap = {
  'PENDENTE': { text: 'Pendente', color: 'bg-yellow-500' },
  'EM_ANDAMENTO': { text: 'Em Produção', color: 'bg-blue-500' },
  'CONCLUIDA': { text: 'Concluída', color: 'bg-green-500' },
  'CANCELADA': { text: 'Cancelada', color: 'bg-red-500' },
};

const getStatusStyle = (status) => statusMap[status] || { text: status, color: 'bg-gray-500' };

const prioridadeMap = {
  'ALTA': { text: 'Alta', color: 'text-red-600' },
  'NORMAL': { text: 'Normal', color: 'text-yellow-600' },
  'BAIXA': { text: 'Baixa', color: 'text-green-600' },
};

const getPrioridadeStyle = (prioridade) => prioridadeMap[prioridade] || { text: prioridade, color: 'text-gray-600' };

const OrdemProducaoCard = ({ ordem, onUpdate }) => {
  const handleAvancarEtapa = async () => {
    try {
      await api.post(`/producao/ordens/${ordem.id}/avancar_etapa/`);
      onUpdate(); // Callback to refresh the list
    } catch (error) {
      console.error("Falha ao avançar etapa:", error);
      alert("Não foi possível avançar a etapa. Tente novamente.");
    }
  };

  const handleConcluirOrdem = async () => {
    if (window.confirm(`Tem certeza que deseja concluir a Ordem de Produção ${ordem.id}?`)) {
      try {
        await api.post(`/producao/ordens/${ordem.id}/concluir_ordem/`);
        onUpdate(); // Callback to refresh the list
      } catch (error) {
        console.error("Falha ao concluir ordem:", error);
        alert("Não foi possível concluir a ordem. Tente novamente.");
      }
    }
  };

  const statusStyle = getStatusStyle(ordem.status);
  const prioridadeStyle = getPrioridadeStyle(ordem.prioridade);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border-l-4" style={{ borderColor: statusStyle.color }}>
      {/* Header do Card */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">OP: #{ordem.id}</h2>
          <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{ordem.cliente}</span></p>
          <p className="text-sm text-gray-600">Data de Início: <span className="font-semibold">{new Date(ordem.data_inicio_prevista).toLocaleDateString()}</span></p>
          <p className="text-sm text-gray-600">Valor: <span className="font-semibold">{ordem.valor_total ? `R$ ${parseFloat(ordem.valor_total).toFixed(2)}` : 'N/A'}</span></p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${statusStyle.color}`}>{statusStyle.text}</span>
          <p className={`text-sm font-bold mt-1 ${prioridadeStyle.color}`}>Prioridade: {prioridadeStyle.text}</p>
        </div>
      </div>

      {/* Timeline de Etapas */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Progresso da Produção:</h3>
        <div className="flex items-center space-x-2">
          {(ordem.etapas && ordem.etapas.length > 0) ? (
            ordem.etapas.map((etapa, index) => (
              <React.Fragment key={etapa.nome_etapa}>
                <div className={`flex flex-col items-center ${etapa.concluida ? 'text-green-600' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapa.concluida ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {etapa.concluida && <FiCheck className="text-white" />}
                  </div>
                  <p className="text-xs mt-1 text-center">{etapa.nome_etapa}</p>
                </div>
                {index < ordem.etapas.length - 1 && (
                  <div className="flex-1 h-1 bg-gray-300"></div>
                )}
              </React.Fragment>
            ))
          ) : (
            <p className="text-sm text-gray-500">Nenhuma etapa definida para esta ordem.</p>
          )}
        </div>
      </div>

      {/* Ações */}
      {ordem.status !== 'CONCLUIDA' && ordem.status !== 'CANCELADA' && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleAvancarEtapa}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            Avançar Etapa <FiChevronRight className="ml-2" />
          </button>
          <button
            onClick={handleConcluirOrdem}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
          >
            Concluir Pedido <FiCheck className="ml-2" />
          </button>
          <button
            onClick={() => onOpenObservationModal(ordem)}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
          >
            <FiEdit3 className="mr-2" /> Registrar Ocorrência
          </button>
        </div>
      )}
    </div>
  );
};

const ProducaoPage = () => {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
   const fetchControllerRef = useRef(null);
   const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
   const [selectedOrdem, setSelectedOrdem] = useState(null);

  const handleRefresh = () => setRefreshTrigger(c => c + 1);

  const handleOpenObservationModal = (ordem) => {
    setSelectedOrdem(ordem);
    setIsObservationModalOpen(true);
  };

  const handleCloseObservationModal = () => {
    setIsObservationModalOpen(false);
    setSelectedOrdem(null);
  };

  const fetchClientes = async (signal) => {
    try {
      const response = await api.get('clientes/clientes/', { signal });
      const data = response.data.results || response.data;
      if (Array.isArray(data)) {
        setClientes(data);
        return data;
      }
      return [];
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error('Falha ao buscar clientes', err);
        setError('Falha ao buscar clientes.');
      }
      return [];
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const fetchedClients = await fetchClientes(signal);

      try {
        const response = await api.get('/comercial/pedidos/', { signal });
        if (!signal.aborted) {
          const approvedOrders = response.data.results
            .filter(p => p.status === 'APROVADO')
            .map(order => {
              const cliente = fetchedClients.find(c => c.id === order.cliente);
              return {
                ...order,
                cliente: cliente ? cliente.nome : `ID ${order.cliente}`,
                valor_total: order.valor_total,
                data_inicio_prevista: order.data_pedido,
              };
            });
          setOrdens(approvedOrders);
          console.log("Dados de ordens aprovadas recebidos:", approvedOrders);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError('Falha ao carregar as ordens de produção.');
          console.error("Detalhes do erro de fetch:", err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      abortController.abort();
    };
  }, [refreshTrigger]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTrigger(c => c + 1);
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Controle de Produção</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {loading && ordens.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      ) : (
        ordens.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {ordens.map(ordem => (
              <OrdemProducaoCard
                key={ordem.id}
                ordem={ordem}
                onUpdate={handleRefresh}
                onOpenObservationModal={handleOpenObservationModal}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">Nenhuma Ordem de Produção encontrada.</p>
            <p className="text-gray-400 text-sm mt-2">Verifique se existem pedidos aprovados no módulo Comercial ou aguarde novas ordens.</p>
          </div>
        )
      )}

      {selectedOrdem && (
        <OrdemProducaoObservacaoModal
          isOpen={isObservationModalOpen}
          onClose={handleCloseObservationModal}
          ordem={selectedOrdem}
          onSaveSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default ProducaoPage;