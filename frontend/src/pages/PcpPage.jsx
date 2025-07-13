import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/axios';
import { FiSearch, FiChevronDown, FiInfo } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';
import EnviarParaSetor from '../components/EnviarParaSetor';

const PcpPage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    etapas: '',
    prioridade: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('pendentes'); // New state for active tab
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [selectedPedido, setSelectedPedido] = useState(null); // State for selected pedido details
  const [isSendingToProduction, setIsSendingToProduction] = useState(false); // New state for loading during API call
  const [isSendingToEspera, setIsSendingToEspera] = useState(false);
  const [sendToProductionError, setSendToProductionError] = useState(null); // New state for API error
  const [setorStatus, setSetorStatus] = useState('');
  const [materiais, setMateriais] = useState([]);
  const [loadingMateriais, setLoadingMateriais] = useState(false);
  const [errorMateriais, setErrorMateriais] = useState(null);


  const fetchClientes = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Você não está autenticado. Por favor, faça login.");
      return [];
    }
    try {
      const response = await api.get('clientes/clientes/');
      const data = response.data.results || response.data;
      if (Array.isArray(data)) {
        setClientes(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch clients', err);
      setError('Failed to fetch clients.');
      return [];
    }
  }, []);

  const fetchPedidos = useCallback(async (currentClients) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Você não está autenticado. Por favor, faça login.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch all pedidos, then filter on the frontend based on the active tab
      const response = await api.get('comercial/pedidos/');
      const data = response.data.results || response.data;
      if (Array.isArray(data)) {
        const formattedData = data.map(item => {
          const client = currentClients.find(c => c.id === item.cliente);
          return {
            ...item,
            cliente: client,
            data_inicio: item.data_pedido,
          };
        });
        setPedidos(formattedData);
      } else {
        setPedidos([]);
        setError('Formato de dados inesperado recebido do servidor.');
      }
    } catch (err) {
      setPedidos([]);
      setError('Falha ao carregar os pedidos.');
      console.error('Failed to fetch pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMateriais = useCallback(async (pedidoId) => {
    setLoadingMateriais(true);
    setErrorMateriais(null);
    try {
      const response = await api.get(`comercial/pedidos/${pedidoId}/materiais/`);
      setMateriais(response.data);
    } catch (err) {
      console.error('Failed to fetch materials', err);
      setErrorMateriais('Falha ao carregar os materiais.');
    } finally {
      setLoadingMateriais(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const fetchedClients = await fetchClientes();
      await fetchPedidos(fetchedClients);
    };
    loadData();
  }, [fetchClientes, fetchPedidos]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const getDisplayStatus = (apiStatus) => {
    switch (apiStatus) {
      case 'PENDENTE': return 'Pendente';
      case 'APROVADO': return 'Aprovado';
      case 'CONCLUIDO': return 'Concluído';
      case 'CANCELADO': return 'Cancelado';
      case 'REJEITADO': return 'Rejeitado';
      case 'PRODUCAO': return 'Em Produção';
      default: return apiStatus;
    }
  };


  const getPriorityClass = (prioridade) => {
    switch (prioridade) {
      case 'ALTA': return 'bg-red-100 text-red-800';
      case 'NORMAL': return 'bg-yellow-100 text-yellow-800';
      case 'BAIXA': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEtapaClass = (etapa) => {
    switch (etapa) {
      case 'Bordado': return 'bg-yellow-100 text-yellow-800';
      case 'Corte': return 'bg-blue-100 text-blue-800';
      case 'Costura': return 'bg-purple-100 text-purple-800';
      case 'Acabamento': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      console.error("Failed to format date:", dateString, e);
      return 'N/A';
    }
  };

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(pedido => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearchTerm = searchTerm === '' ||
        (pedido.cliente?.nome || '').toLowerCase().includes(searchTermLower) ||
        (pedido.id?.toString() || '').includes(searchTermLower);

      const matchesStatus = filters.status === '' ||
        getDisplayStatus(pedido.status) === filters.status;

      const matchesEtapas = filters.etapas === '' ||
        (pedido.etapas || []).includes(filters.etapas);

      const matchesPrioridade = filters.prioridade === '' ||
        pedido.prioridade === filters.prioridade;

      return matchesSearchTerm && matchesStatus && matchesEtapas && matchesPrioridade;
    });
  }, [pedidos, searchTerm, filters]);


  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const uniqueEtapas = useMemo(() => {
    const allEtapas = new Set();
    pedidos.forEach(pedido => {
      (pedido.etapas || []).forEach(etapa => allEtapas.add(etapa));
    });
    return Array.from(allEtapas);
  }, [pedidos]);

  const handleRowClick = (pedido) => {
    setSelectedPedido(pedido);
    setIsModalOpen(true);
    fetchMateriais(pedido.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPedido(null);
    setSendToProductionError(null); // Clear error when closing modal
    setMateriais([]);
    setErrorMateriais(null);
  };

  const handleSendToProduction = useCallback(async (pedidoId) => {
    setIsSendingToProduction(true);
    setSendToProductionError(null);
    try {
      const payload = { status: 'PRODUCAO' };
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (pedido && pedido.em_espera) {
        payload.em_espera = false;
      }

      await api.patch(`comercial/pedidos/${pedidoId}/`, payload);
      
      // Update local state to reflect the change and move the order
      setPedidos(prevPedidos =>
        prevPedidos.map(p =>
          p.id === pedidoId ? { ...p, status: 'PRODUCAO', em_espera: false } : p
        )
      );
      closeModal(); // Close modal on success
    } catch (err) {
      console.error('Failed to send to production:', err);
      setSendToProductionError('Falha ao enviar para produção. Tente novamente.');
    } finally {
      setIsSendingToProduction(false);
    }
  }, [pedidos, setPedidos, closeModal]);

  const handleSendToEspera = useCallback(async (pedidoId, emEspera) => {
    setIsSendingToEspera(true);
    setSendToProductionError(null);
    try {
      await api.patch(`comercial/pedidos/${pedidoId}/`, { em_espera: emEspera });
      
      setPedidos(prevPedidos =>
        prevPedidos.map(p =>
          p.id === pedidoId ? { ...p, em_espera: emEspera } : p
        )
      );
      closeModal();
    } catch (err) {
      console.error('Failed to send to espera:', err);
      setSendToProductionError('Falha ao enviar para espera. Tente novamente.');
    } finally {
      setIsSendingToEspera(false);
    }
  }, [setPedidos, closeModal]);

  const handleStatusChange = useCallback((pedidoId, newStatus) => {
    setPedidos(prevPedidos =>
      prevPedidos.map(p =>
        p.id === pedidoId ? { ...p, status: newStatus } : p
      )
    );
  }, []);

  const filteredPedidosByTab = useMemo(() => {
    let filtered = pedidos;
    if (activeTab === 'pendentes') {
      filtered = pedidos.filter(p => p.status === 'PENDENTE');
    } else if (activeTab === 'producao') {
      const producaoStatus = [
        'PRODUCAO', 'ESTOQUE', 'CORTE', 'ESTAMPARIA', 'BORDADO', 'COSTURA',
        'ACABAMENTO', 'EMBALAGEM', 'MATERIAIS_CONFIRMADOS', 'MATERIAIS_INCOMPLETOS'
      ];
      filtered = pedidos.filter(p => producaoStatus.includes(p.status) && !p.em_espera);
    } else if (activeTab === 'em_espera') {
      filtered = pedidos.filter(p => p.em_espera);
    } else if (activeTab === 'concluidos') {
      filtered = pedidos.filter(p => p.status === 'CONCLUIDO');
    }

    return filtered.filter(pedido => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearchTerm = searchTerm === '' ||
        (pedido.cliente?.nome || '').toLowerCase().includes(searchTermLower) ||
        (pedido.id?.toString() || '').includes(searchTermLower);

      const matchesStatus = filters.status === '' ||
        getDisplayStatus(pedido.status) === filters.status;

      const matchesEtapas = filters.etapas === '' ||
        (pedido.etapas || []).includes(filters.etapas);

      const matchesPrioridade = filters.prioridade === '' ||
        pedido.prioridade === filters.prioridade;

      return matchesSearchTerm && matchesStatus && matchesEtapas && matchesPrioridade;
    });
  }, [pedidos, searchTerm, filters, activeTab]);

  const totalPages = Math.ceil(filteredPedidosByTab.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPedidosByTab.slice(startIndex, endIndex);
  }, [filteredPedidosByTab, currentPage, itemsPerPage]);



  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">PCP - Planejamento e Controle da Produção</h1>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('pendentes')}
            className={`${activeTab === 'pendentes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pedidos Pendentes
          </button>
          <button
            onClick={() => setActiveTab('producao')}
            className={`${activeTab === 'producao' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Produção
          </button>
          <button
            onClick={() => setActiveTab('em_espera')}
            className={`${activeTab === 'em_espera' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Em Espera
          </button>
          <button
            onClick={() => setActiveTab('concluidos')}
            className={`${activeTab === 'concluidos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Concluídos
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-1 relative">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por OP ou cliente..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Removed status filter as tabs handle it */}
        <div className="relative">
          <select name="etapas" value={filters.etapas} onChange={handleFilterChange} className="w-full p-2 pr-8 border border-gray-300 rounded-md appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todas as Etapas</option>
            {uniqueEtapas.map(etapa => (
              <option key={etapa} value={etapa}>{etapa}</option>
            ))}
          </select>
          <FiChevronDown className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select name="prioridade" value={filters.prioridade} onChange={handleFilterChange} className="w-full p-2 pr-8 border border-gray-300 rounded-md appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todas as Prioridades</option>
            <option value="ALTA">Alta</option>
            <option value="NORMAL">Normal</option>
            <option value="BAIXA">Baixa</option>
          </select>
          <FiChevronDown className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
      ) : (
        <>
          {activeTab === 'pendentes' && (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(pedido)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pedido.cliente?.nome || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pedido.quantidade_pecas}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(pedido.prazo)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <StatusBadge status={pedido.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={(e) => { e.stopPropagation(); handleRowClick(pedido); }} className="text-blue-600 hover:text-blue-900">
                          <FiInfo className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-200">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">Página {currentPage} de {Math.max(totalPages, 1)}</span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}

          {activeTab === 'producao' && (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              {currentItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(pedido)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pedido.cliente?.nome || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pedido.quantidade_pecas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(pedido.prazo)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <StatusBadge status={pedido.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={(e) => { e.stopPropagation(); handleRowClick(pedido); }} className="text-blue-600 hover:text-blue-900">
                            <FiInfo className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-gray-600 p-4">Nenhum pedido em produção no momento.</div>
              )}
              {/* Pagination */}
              <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-200">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">Página {currentPage} de {Math.max(totalPages, 1)}</span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}

          {activeTab === 'em_espera' && (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              {currentItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(pedido)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pedido.cliente?.nome || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pedido.quantidade_pecas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(pedido.prazo)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <StatusBadge status={pedido.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={(e) => { e.stopPropagation(); handleRowClick(pedido); }} className="text-blue-600 hover:text-blue-900">
                            <FiInfo className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-gray-600 p-4">Nenhum pedido em espera no momento.</div>
              )}
              {/* Pagination */}
              <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-200">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">Página {currentPage} de {Math.max(totalPages, 1)}</span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}

          {activeTab === 'concluidos' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Pedidos Concluídos</h2>
              <p className="text-gray-600">O conteúdo desta aba será implementado em uma próxima etapa.</p>
            </div>
          )}
        </>
      )}

      {/* Pedido Detail Modal */}
      {isModalOpen && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Detalhes do Pedido #{selectedPedido.id}</h2>
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div className="p-4 border rounded-md bg-gray-50">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cliente:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPedido.cliente?.nome || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Documento (CPF/CNPJ):</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPedido.cliente?.cpf_cnpj || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefone:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPedido.cliente?.telefone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Pedido */}
              <div className="p-4 border rounded-md bg-gray-50">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Informações do Pedido</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data do Pedido:</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(selectedPedido.data_pedido)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prazo de Entrega:</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(selectedPedido.prazo)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Quantidade Total de Peças:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPedido.quantidade_pecas}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor Total:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPedido.valor_total !== null && selectedPedido.valor_total !== undefined && !isNaN(parseFloat(selectedPedido.valor_total))
                        ? `R$ ${parseFloat(selectedPedido.valor_total).toFixed(2)}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prioridade:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(selectedPedido.prioridade)}`}>
                        {selectedPedido.prioridade}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      <StatusBadge status={selectedPedido.status} />
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              {selectedPedido.itens && selectedPedido.itens.length > 0 && (
                  <div className="p-4 border rounded-md bg-gray-50">
                      <h3 className="text-xl font-bold mb-4 text-gray-800">Itens do Pedido</h3>
                      {selectedPedido.itens.map((item, index) => (
                          <div key={index} className="p-4 border rounded-md mb-4 bg-white shadow-sm">
                              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                                  {item.tipo === 'CAMISA' ? '👕' : '👖'} Item #{index + 1}: {item.modelo}
                              </h4>
                              <div className="space-y-4">
                                  {item.tipo === 'CAMISA' && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div><p className="text-sm font-medium text-gray-500">Gola:</p><p className="text-base text-gray-900">{item.gola || 'N/A'}</p></div>
                                          <div><p className="text-sm font-medium text-gray-500">Manga:</p><p className="text-base text-gray-900">{item.manga || 'N/A'}</p></div>
                                          <div><p className="text-sm font-medium text-gray-500">Corpo Frente:</p><p className="text-base text-gray-900">{item.corpo_frente || 'N/A'}</p></div>
                                          <div><p className="text-sm font-medium text-gray-500">Corpo Costa:</p><p className="text-base text-gray-900">{item.corpo_costa || 'N/A'}</p></div>
                                      </div>
                                  )}

                                  {item.bordado && (
                                      <div>
                                          <p className="text-sm font-medium text-gray-500">Informações do Bordado:</p>
                                          <p className="text-base text-gray-900 whitespace-pre-wrap">{item.bordado}</p>
                                      </div>
                                  )}


                                  <div>
                                      <p className="text-sm font-medium text-gray-500">Tamanhos:</p>
                                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-base text-gray-900 mt-1">
                                          {Object.entries(item.tamanhos || {}).map(([size, quantity]) => (
                                              quantity > 0 && <span key={size} className="px-2 py-1 bg-gray-200 rounded-md text-sm">{size}: {quantity}</span>
                                          ))}
                                      </div>
                                  </div>

                                  {item.descricao && (
                                      <div>
                                          <p className="text-sm font-medium text-gray-500">Observações Adicionais:</p>
                                          <p className="text-base text-gray-900 whitespace-pre-wrap">{item.descricao}</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* Materiais Necessários */}
              <div className="p-4 border rounded-md bg-gray-50">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Materiais Necessários (Total)</h3>
                {loadingMateriais ? (
                  <p>Carregando materiais...</p>
                ) : errorMateriais ? (
                  <p className="text-red-500">{errorMateriais}</p>
                ) : materiais.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Necessário</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponível</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {materiais.map((mat, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{mat.nome}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {mat.unidade === 'Unidade' || mat.unidade === 'Grama' ? mat.quantidade_necessaria.toFixed(0) : mat.quantidade_necessaria.toFixed(2)}{' '}
                              {mat.nome.includes('Tecido') || mat.nome.includes('Tubo') ? 'Metro' : mat.unidade}
                            </td>
                            <td className={`px-4 py-2 whitespace-nowrap text-sm ${mat.suficiente ? 'text-green-600' : 'text-red-600'}`}>
                              {mat.unidade === 'Unidade' || mat.unidade === 'Grama' ? mat.quantidade_disponivel.toFixed(0) : mat.quantidade_disponivel.toFixed(2)}{' '}
                              {mat.unidade_medida === 'ROLO' ? 'Metros (Rolos)' : mat.unidade_medida === 'TUBO' ? 'Metros (Tubos)' : mat.unidade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>Nenhum material calculado para este pedido.</p>
                )}
              </div>
            </div>

            <div className="mt-8 border-t-2 border-gray-100 pt-6 space-y-6">
              {/* Componente de envio para setor na aba de produção */}
              {activeTab === 'producao' && (
                <EnviarParaSetor
                  pedido={selectedPedido}
                  onStatusChange={handleStatusChange}
                  onClose={closeModal}
                  setorStatus={selectedPedido.status}
                />
              )}

              {/* Mensagem de erro */}
              {sendToProductionError && (
                <div className="text-red-500 text-center">{sendToProductionError}</div>
              )}

              {/* Container de botões */}
              <div className="flex justify-end space-x-4">
                {/* Botão de Enviar para Espera (não mostra na aba em_espera) */}
                {activeTab !== 'em_espera' && (
                  <button
                    type="button"
                    onClick={() => handleSendToEspera(selectedPedido.id, true)}
                    className={`px-6 py-2 rounded-md text-black font-semibold transition duration-200 ease-in-out
                      ${isSendingToEspera ? 'bg-yellow-300 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'}
                    `}
                    disabled={isSendingToEspera}
                  >
                    {isSendingToEspera ? 'Enviando...' : 'Enviar para Espera'}
                  </button>
                )}

                {/* Botão de Enviar para Produção (apenas na aba de pendentes ou na aba de em_espera) */}
                {((activeTab === 'pendentes' && selectedPedido.status === 'PENDENTE') || activeTab === 'em_espera') && (
                  <button
                    type="button"
                    onClick={() => handleSendToProduction(selectedPedido.id)}
                    className={`px-6 py-2 rounded-md text-white font-semibold transition duration-200 ease-in-out
                      ${isSendingToProduction ? 'bg-blue-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
                    `}
                    disabled={isSendingToProduction}
                  >
                    {isSendingToProduction ? 'Enviando...' : 'Enviar para Produção!'}
                  </button>
                )}

                {/* Botão de Fechar */}
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PcpPage;