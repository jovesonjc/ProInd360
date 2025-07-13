import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/axios';
import { FiPackage, FiSearch, FiPlus, FiChevronDown, FiEdit, FiTrash2, FiInfo } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';

const EstoquePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('produtos');
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [historicoItems, setHistoricoItems] = useState([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoError, setHistoricoError] = useState(null);
  const [activePedidoTab, setActivePedidoTab] = useState('estoque');
  const [materiais, setMateriais] = useState([]);
  const [loadingMateriais, setLoadingMateriais] = useState(false);
  const [errorMateriais, setErrorMateriais] = useState(null);
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    categoria: '',
    prioridade: '',
  });

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [isPedidoModalOpen, setIsPedidoModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showConsultaEstoque, setShowConsultaEstoque] = useState(false);
  const [isUtilizarMaterialModalOpen, setIsUtilizarMaterialModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantidadeUtilizada, setQuantidadeUtilizada] = useState('');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    tipo_produto: 'TECIDO',
    categoria_subtipo: '',
    cor: '',
    unidade_medida: 'METRO',
    quantity: '',
    quantidade_rolos: '',
    metragem_por_rolo: '',
    quantidade_caixas: '',
    quantidade_por_caixa: '',
    quantidade_tubos: '',
    metros_por_tubo: '',
  });

  const tipoProdutoOptions = [
    { value: 'TECIDO', label: 'Tecido' },
    { value: 'LINHA', label: 'Linha' },
    { value: 'ETIQUETA', label: 'Etiqueta' },
    { value: 'BOTAO', label: 'Botão' },
    { value: 'FIO_DE_BORDADO', label: 'Fio de Bordado' },
    { value: 'TERMOCOLANTE', label: 'Termocolante' },
    { value: 'GOLAS', label: 'Golas' },
    { value: 'EMBALAGEM', label: 'Embalagem' },
  ];

  const unidadeMedidaOptions = [
    { value: 'METRO', label: 'Metro' },
    { value: 'UNIDADE', label: 'Unidade' },
    { value: 'GRAMA', label: 'Grama' },
    { value: 'ROLO', label: 'Rolo' },
    { value: 'CAIXA', label: 'Caixa' },
    { value: 'LITRO', label: 'Litro' },
    { value: 'TUBO', label: 'Tubo' },
  ];


  const subtiposPorTipo = {
    "LINHA": [
      "100% Poliéster",
      "Algodão",
      "Linha Bordado",
      "Ponto Cadeia",
      "Linha Overlock"
    ],
    "BOTAO": [
      "Perolado",
      "Madrepérola",
      "Plástico 4 furos",
      "Preto Fosco",
      "Transparente"
    ],
    "ETIQUETA": [
      "Bordada",
      "Sublimada",
      "Estampada",
      "Costurada"
    ],
    "TECIDO": [
      "Malha PV",
      "Algodão",
      "Poliéster",
      "Dry Fit"
    ],
    "GOLAS": [
      "Gola Polo",
      "Gola V",
      "Gola Canoa",
      "Gola Careca",
      "Gola Padre",
      "Gola Alta",
      "Gola Canelada"
    ]
  };

  const [dynamicSubtipoOptions, setDynamicSubtipoOptions] = useState([]);

  const fetchItems = async (signal) => {
    setLoading(true);
    try {
      console.log("Attempting to fetch items...");
      const response = await api.get('estoque/materias-primas/', { signal });
      const data = response.data.results || response.data;
      console.log("Fetched data:", data);
      if (Array.isArray(data)) {
        setItems(data);
        setError(null);
      } else {
        setItems([]);
        setError('Formato de dados inesperado recebido do servidor.');
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setItems([]);
        setError('Falha ao carregar os itens de estoque. Tente novamente mais tarde.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = useCallback(async (signal) => {
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
        console.error('Failed to fetch clients', err);
        setError('Failed to fetch clients.');
      }
      return [];
    }
  }, []);

  const fetchPedidos = useCallback(async (currentClients, signal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('comercial/pedidos/', { signal });
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
      if (err.name !== 'CanceledError') {
        setPedidos([]);
        setError('Falha ao carregar os pedidos.');
        console.error('Failed to fetch pedidos:', err);
      }
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

  const fetchHistorico = useCallback(async (signal) => {
    setHistoricoLoading(true);
    setHistoricoError(null);
    try {
      const response = await api.get('estoque/historico-uso-materiais/', { signal });
      const data = response.data.results || response.data;
      if (Array.isArray(data)) {
        setHistoricoItems(data);
      } else {
        setHistoricoItems([]);
        setHistoricoError('Formato de dados de histórico inesperado.');
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setHistoricoError('Falha ao carregar o histórico de materiais.');
        console.error('Failed to fetch historico:', err);
      }
    } finally {
      setHistoricoLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const loadData = async () => {
      if (activeTab === 'produtos') {
        await fetchItems(abortController.signal);
      } else if (activeTab === 'pedidos') {
        const fetchedClients = await fetchClientes(abortController.signal);
        await fetchPedidos(fetchedClients, abortController.signal);
      } else if (activeTab === 'historico') {
        await fetchHistorico(abortController.signal);
      }
    };
    loadData();
    return () => {
      abortController.abort();
    };
  }, [activeTab, fetchClientes, fetchPedidos, fetchHistorico]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchMatch = (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (item.categoria_subtipo?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const localMatch = filters.local ? (item.local || '') === filters.local : true;
      const categoriaMatch = filters.categoria ? item.tipo_produto === filters.categoria : true;
      
      const getStatus = (qty) => {
        if (qty <= 0) return 'Ruptura';
        if (qty < 50) return 'Baixo'; // Example threshold
        return 'Adequado';
      };
      const statusMatch = filters.status ? getStatus(item.quantity) === filters.status : true;

      return searchMatch && localMatch && categoriaMatch && statusMatch;
    });
  }, [items, searchTerm, filters]);

  const filteredPedidosByTab = useMemo(() => {
    let filtered = pedidos;

    if (activePedidoTab === 'estoque') {
      filtered = pedidos.filter(p => p.status === 'ESTOQUE');
    } else if (activePedidoTab === 'incompletos') {
      filtered = pedidos.filter(p => p.status === 'MATERIAIS_INCOMPLETOS');
    }

    return filtered.filter(pedido => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearchTerm = searchTerm === '' ||
        (pedido.cliente?.nome || '').toLowerCase().includes(searchTermLower) ||
        (pedido.id?.toString() || '').includes(searchTermLower);

      const matchesPrioridade = filters.prioridade === '' ||
        pedido.prioridade === filters.prioridade;

      return matchesSearchTerm && matchesPrioridade;
    });
  }, [pedidos, searchTerm, filters, activePedidoTab]);

  const totalPages = Math.ceil(filteredPedidosByTab.length / itemsPerPage);
  const currentPedidos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPedidosByTab.slice(startIndex, endIndex);
  }, [filteredPedidosByTab, currentPage, itemsPerPage]);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleRowClick = (pedido) => {
    setSelectedPedido(pedido);
    setIsPedidoModalOpen(true);
    fetchMateriais(pedido.id);
  };

  const closePedidoModal = () => {
    setIsPedidoModalOpen(false);
    setSelectedPedido(null);
    setMateriais([]);
    setErrorMateriais(null);
    setShowConsultaEstoque(false); // Reset on close
  };

  const handleUpdateStatus = async (pedidoId, newStatus) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      await api.patch(`comercial/pedidos/${pedidoId}/`, { status: newStatus });
      setPedidos(prevPedidos => prevPedidos.filter(p => p.id !== pedidoId));
      // Re-fetch stock items to reflect updated quantities
      if (newStatus === 'MATERIAIS_CONFIRMADOS') {
        fetchItems();
      }
      closePedidoModal();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Falha ao atualizar o status do pedido.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusInfo = (quantidade) => {
    if (quantidade <= 0) {
      return { text: 'Ruptura', className: 'bg-red-100 text-red-800' };
    }
    if (quantidade < 50) { // Example threshold for "Baixo"
      return { text: 'Baixo', className: 'bg-orange-100 text-orange-800' };
    }
    return { text: 'Adequado', className: 'bg-green-100 text-green-800' };
  };

  const getStockBarInfo = (quantity) => {
    const maxQuantity = Math.max(...items.map(item => item.quantity), 1);
    let width = 0;
    if (maxQuantity > 0) {
      width = Math.min((quantity / maxQuantity) * 100, 100);
    }

    if (quantity <= 0) {
      return { width: '100%', className: 'bg-gray-300' };
    }
    if (quantity < 50) {
      return { width: `${width}%`, className: 'bg-orange-400' };
    }
    return { width: `${width}%`, className: 'bg-green-500' };
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        id: item.id,
        name: item.name,
        tipo_produto: item.tipo_produto,
        categoria_subtipo: item.categoria_subtipo || '',
        cor: item.cor || '',
        unidade_medida: item.unidade_medida,
        quantity: item.quantity,
        quantidade_rolos: item.quantidade_rolos || '',
        metragem_por_rolo: item.metragem_por_rolo || '',
        quantidade_caixas: item.quantidade_caixas || '',
        quantidade_por_caixa: item.quantidade_por_caixa || '',
        quantidade_tubos: item.quantidade_tubos || '',
        metros_por_tubo: item.metros_por_tubo || '',
      });
      setIsEditModalOpen(true);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        tipo_produto: '',
        categoria_subtipo: '',
        cor: '',
        unidade_medida: 'METRO',
        quantity: '',
        quantidade_rolos: '',
        metragem_por_rolo: '',
        quantidade_caixas: '',
        quantidade_por_caixa: '',
        quantidade_tubos: '',
        metros_por_tubo: '',
      });
      setIsModalOpen(true);
    }
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const getPriorityClass = (prioridade) => {
    switch (prioridade) {
      case 'ALTA': return 'bg-red-100 text-red-800';
      case 'NORMAL': return 'bg-yellow-100 text-yellow-800';
      case 'BAIXA': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === 'tipo_produto') {
      newFormData.categoria_subtipo = '';
    }

    if (name === 'unidade_medida') {
       if (value !== 'ROLO') {
           newFormData.quantidade_rolos = '';
           newFormData.metragem_por_rolo = '';
       }
       if (value !== 'CAIXA') {
           newFormData.quantidade_caixas = '';
           newFormData.quantidade_por_caixa = '';
       }
        if (value !== 'TUBO') {
            newFormData.quantidade_tubos = '';
            newFormData.metros_por_tubo = '';
        }
   }

    if (name === 'quantidade_rolos' || name === 'metragem_por_rolo' || (name === 'unidade_medida' && value === 'ROLO')) {
      const rolos = parseFloat(newFormData.quantidade_rolos) || 0;
      const metragem = parseFloat(newFormData.metragem_por_rolo) || 0;
      newFormData.quantity = (rolos * metragem).toFixed(2);
    }

    if (name === 'quantidade_caixas' || name === 'quantidade_por_caixa' || (name === 'unidade_medida' && value === 'CAIXA')) {
       const caixas = parseFloat(newFormData.quantidade_caixas) || 0;
       const porCaixa = parseFloat(newFormData.quantidade_por_caixa) || 0;
       newFormData.quantity = (caixas * porCaixa).toFixed(2);
   }

    if (name === 'quantidade_tubos' || name === 'metros_por_tubo' || (name === 'unidade_medida' && value === 'TUBO')) {
        const tubos = parseFloat(newFormData.quantidade_tubos) || 0;
        const metragem = parseFloat(newFormData.metros_por_tubo) || 0;
        newFormData.quantity = (tubos * metragem).toFixed(2);
    }
    
    setFormData(newFormData);
  };

  useEffect(() => {
    const options = subtiposPorTipo[formData.tipo_produto] || [];
    setDynamicSubtipoOptions(options.map(opt => ({ value: opt, label: opt })));
  }, [formData.tipo_produto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSend = {
      name: formData.name,
      tipo_produto: (formData.tipo_produto || 'TECIDO').toUpperCase(), // Convert to uppercase
      categoria_subtipo: formData.categoria_subtipo,
      cor: formData.cor,
      unidade_medida: formData.unidade_medida,
      // Initialize all quantity-related fields to null
      quantity: null,
      quantidade_rolos: null,
      metragem_por_rolo: null,
      quantidade_caixas: null,
      quantidade_por_caixa: null,
      quantidade_tubos: null,
      metros_por_tubo: null,
    };

    // Always include quantity, even if it's not calculated by specific units
    dataToSend.quantity = parseFloat(formData.quantity) || 0;

    if (formData.unidade_medida === 'ROLO') {
      dataToSend.quantidade_rolos = parseInt(formData.quantidade_rolos, 10) || 0;
      dataToSend.metragem_por_rolo = parseFloat(formData.metragem_por_rolo) || 0;
    } else if (formData.unidade_medida === 'CAIXA') {
       dataToSend.quantidade_caixas = parseInt(formData.quantidade_caixas, 10) || 0;
       dataToSend.quantidade_por_caixa = parseInt(formData.quantidade_por_caixa, 10) || 0;
    } else if (formData.unidade_medida === 'TUBO') {
       dataToSend.quantidade_tubos = parseInt(formData.quantidade_tubos, 10) || 0;
       dataToSend.metros_por_tubo = parseFloat(formData.metros_por_tubo) || 0;
    }

   const apiCall = editingItem
      ? api.put(`estoque/materias-primas/${editingItem.id}/`, dataToSend)
      : api.post('estoque/materias-primas/', dataToSend);

    try {
      await apiCall;
      fetchItems();
      closeModal();
    } catch (err) {
      console.error('Falha ao salvar o item.', err.response?.data || err);
      setError('Falha ao salvar o item. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await api.delete(`estoque/materias-primas/${itemId}/`);
        fetchItems();
      } catch (err) {
        console.error('Falha ao excluir o item.', err);
        setError(err.response?.data?.detail || 'Falha ao excluir o item. Tente novamente.');
      }
    }
  };

  const handleUtilizarMaterial = (material) => {
    setSelectedMaterial(material);
    setIsUtilizarMaterialModalOpen(true);
  };

  const closeUtilizarMaterialModal = () => {
    setIsUtilizarMaterialModalOpen(false);
    setSelectedMaterial(null);
    setQuantidadeUtilizada('');
  };

  const submitUtilizarMaterial = async () => {
    if (!selectedMaterial || !quantidadeUtilizada) {
      alert('Por favor, preencha a quantidade a ser utilizada.');
      return;
    }

    try {
      await api.post(`estoque/materias-primas/${selectedMaterial.id}/utilizar-material/`, {
        quantidade_utilizada: quantidadeUtilizada,
        pedido_id: selectedPedido.id,
      });
      fetchItems();
      fetchHistorico();
      closeUtilizarMaterialModal();
    } catch (err) {
      console.error('Falha ao utilizar o material.', err.response?.data || err);
      alert('Falha ao utilizar o material. Verifique o estoque e tente novamente.');
    }
  };
 
   const uniqueCategorias = useMemo(() => {
     const allTipos = items.map(item => item.tipo_produto);
    return tipoProdutoOptions.filter(opt => allTipos.includes(opt.value));
  }, [items]);
  const uniqueStatus = ['Adequado', 'Baixo', 'Ruptura'];

  const getTipoProdutoLabel = (value) => {
    const option = tipoProdutoOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getUnidadeMedidaLabel = (value) => {
    const option = unidadeMedidaOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

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
 
   const getModeloCamisaDisplay = (modelo) => {
     switch (modelo) {
       case 'CAMISETA_TRADICIONAL': return 'Camiseta Tradicional';
      case 'GOLA_POLO': return 'Gola Polo';
      case 'GOLA_CARECA': return 'Gola Careca';
      case 'SOCIAL': return 'Social';
      case 'BABY_LOOK': return 'Baby Look';
      case 'REGATA': return 'Regata';
      default: return modelo;
    }
  };

  const getTipoTecidoDisplay = (tipo) => {
    switch (tipo) {
      case 'MALHA_PV': return 'Malha PV';
      case 'ALGODAO': return 'Algodão';
      case 'DRY_FIT': return 'Dry Fit';
      case 'VISCOLYCRA': return 'Viscolycra';
      default: return tipo;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Estoque</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 shadow"
        >
          <FiPlus className="mr-2" />
          Adicionar Item
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('produtos')}
            className={`${
              activeTab === 'produtos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`${
              activeTab === 'pedidos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`${
              activeTab === 'historico'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Histórico de Materiais
          </button>
        </nav>
      </div>

      {activeTab === 'produtos' && (
        <>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-1 relative">
              <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou subtipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select name="categoria" value={filters.categoria} onChange={handleFilterChange} className="w-full p-2 pr-8 border border-gray-300 rounded-md appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todos os Tipos</option>
                {uniqueCategorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <FiChevronDown className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 pr-8 border border-gray-300 rounded-md appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todos os Status</option>
                {uniqueStatus.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <FiChevronDown className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : error && !isModalOpen ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtipo/Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const status = getStatusInfo(item.quantity);
                    const stockBar = getStockBarInfo(item.quantity);
                    console.log("Item local:", item.local); // Debugging line
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full">
                              <FiPackage className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getTipoProdutoLabel(item.tipo_produto)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.categoria_subtipo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.cor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex flex-col">
                            {item.unidade_medida === 'ROLO' ? (
                              <span>{parseInt(item.quantity)} Metros ({item.quantidade_rolos} Rolos)</span>
                            ) : item.unidade_medida === 'CAIXA' ? (
                               <span>{parseInt(item.quantity)} Unidades ({item.quantidade_caixas} Caixas)</span>
                            ) : item.unidade_medida === 'TUBO' ? (
                               <span>{parseInt(item.quantity)} Metros ({item.quantidade_tubos} Tubos)</span>
                            ) : (
                             <span>{parseInt(item.quantity)} {getUnidadeMedidaLabel(item.unidade_medida)}</span>
                            )}
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div className={`${stockBar.className} h-1.5 rounded-full`} style={{ width: stockBar.width }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                            <FiEdit />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'pedidos' && (
        <>
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActivePedidoTab('estoque')}
                className={`${activePedidoTab === 'estoque' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Aguardando Separação
              </button>
              <button
                onClick={() => setActivePedidoTab('incompletos')}
                className={`${activePedidoTab === 'incompletos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Materiais Incompletos
              </button>
            </nav>
          </div>

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
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
            ) : currentPedidos.length > 0 ? (
              <>
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
                    {currentPedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(pedido)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{pedido.id}</td>
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
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <p>Nenhum pedido nesta categoria no momento.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'historico' && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {historicoLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : historicoError ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{historicoError}</div>
          ) : historicoItems.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido OP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade Utilizada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historicoItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.material_nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.pedido_id ? `#${item.pedido_id}` : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{`${item.quantidade_utilizada} ${item.unidade_medida}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(item.data_utilizacao).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <p>Nenhum registro de uso de material encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">{editingItem ? 'Editar Item' : 'Adicionar Novo Item'}</h2>
            {error && <div className="text-sm text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="tipo_produto" className="block text-sm font-medium text-gray-700">Tipo de Produto</label>
                  <input type="text" name="tipo_produto" id="tipo_produto" value={formData.tipo_produto} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                  <label htmlFor="categoria_subtipo" className="block text-sm font-medium text-gray-700">Categoria / Subtipo</label>
                  <input
                    type="text"
                    name="categoria_subtipo"
                    id="categoria_subtipo"
                    value={formData.categoria_subtipo}
                    onChange={handleFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={formData.tipo_produto === 'GOLAS' || formData.tipo_produto === 'LINHA' || formData.tipo_produto === 'BOTAO'}
                  />
                </div>
                <div>
                  <label htmlFor="cor" className="block text-sm font-medium text-gray-700">Cor</label>
                  <input type="text" name="cor" id="cor" value={formData.cor} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="unidade_medida" className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                  <select name="unidade_medida" id="unidade_medida" value={formData.unidade_medida} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                    {unidadeMedidaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantidade</label>
                  <input type="number" step="0.01" name="quantity" id="quantity" value={formData.quantity} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required disabled={formData.unidade_medida === 'ROLO' || formData.unidade_medida === 'CAIXA' || formData.unidade_medida === 'TUBO'} />
                </div>
              </div>

              {formData.unidade_medida === 'ROLO' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="quantidade_rolos" className="block text-sm font-medium text-gray-700">Qtd. Rolos</label>
                    <input type="number" name="quantidade_rolos" id="quantidade_rolos" value={formData.quantidade_rolos} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                  </div>
                  <div>
                    <label htmlFor="metragem_por_rolo" className="block text-sm font-medium text-gray-700">Metros / Rolo</label>
                    <input type="number" step="0.01" name="metragem_por_rolo" id="metragem_por_rolo" value={formData.metragem_por_rolo} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                  </div>
                </div>
              )}

             {formData.unidade_medida === 'CAIXA' && (
               <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                   <label htmlFor="quantidade_caixas" className="block text-sm font-medium text-gray-700">Qtd. Caixas</label>
                   <input type="number" name="quantidade_caixas" id="quantidade_caixas" value={formData.quantidade_caixas} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                   </div>
                   <div>
                   <label htmlFor="quantidade_por_caixa" className="block text-sm font-medium text-gray-700">Unidades / Caixa</label>
                   <input type="number" name="quantidade_por_caixa" id="quantidade_por_caixa" value={formData.quantidade_por_caixa} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                   </div>
               </div>
             )}

             {formData.unidade_medida === 'TUBO' && formData.tipo_produto === 'LINHA' && (
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                   <label htmlFor="quantidade_tubos" className="block text-sm font-medium text-gray-700">Qtd. Tubos</label>
                   <input type="number" name="quantidade_tubos" id="quantidade_tubos" value={formData.quantidade_tubos} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                 </div>
                 <div>
                   <label htmlFor="metros_por_tubo" className="block text-sm font-medium text-gray-700">Metros / Tubo</label>
                   <input type="number" step="0.01" name="metros_por_tubo" id="metros_por_tubo" value={formData.metros_por_tubo} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                 </div>
               </div>
             )}
             <div className="flex justify-end space-x-4">
               <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{editingItem ? 'Salvar Alterações' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pedido Detail Modal */}
      {isPedidoModalOpen && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
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

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedPedido.id, 'MATERIAIS_INCOMPLETOS')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Atualizando...' : 'Materiais Incompletos'}
              </button>
              <button
                type="button"
                onClick={() => setShowConsultaEstoque(!showConsultaEstoque)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {showConsultaEstoque ? 'Ocultar Estoque' : 'Consultar Estoque'}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedPedido.id, 'MATERIAIS_CONFIRMADOS')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Atualizando...' : 'Materiais Confirmados'}
              </button>
              <button type="button" onClick={closePedidoModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isUpdatingStatus}>
                Fechar
              </button>
            </div>

            {/* Collapsible Stock View */}
            {showConsultaEstoque && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Consulta de Estoque de Materiais</h3>
                  <div className="relative w-1/3">
                    <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar material..."
                      value={stockSearchTerm}
                      onChange={(e) => setStockSearchTerm(e.target.value)}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtipo/Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items
                        .filter(item =>
                          (item.name?.toLowerCase() || '').includes(stockSearchTerm.toLowerCase()) ||
                          (item.categoria_subtipo?.toLowerCase() || '').includes(stockSearchTerm.toLowerCase())
                        )
                        .map((item) => {
                          const status = getStatusInfo(item.quantity);
                          const stockBar = getStockBarInfo(item.quantity);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full">
                                    <FiPackage className="h-6 w-6 text-gray-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getTipoProdutoLabel(item.tipo_produto)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.categoria_subtipo}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.cor}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex flex-col">
                                  {item.unidade_medida === 'ROLO' ? (
                                    <span>{parseInt(item.quantity)} Metros ({item.quantidade_rolos} Rolos)</span>
                                  ) : item.unidade_medida === 'CAIXA' ? (
                                     <span>{parseInt(item.quantity)} Unidades ({item.quantidade_caixas} Caixas)</span>
                                  ) : item.unidade_medida === 'TUBO' ? (
                                     <span>{parseInt(item.quantity)} Metros ({item.quantidade_tubos} Tubos)</span>
                                  ) : (
                                   <span>{parseInt(item.quantity)} {getUnidadeMedidaLabel(item.unidade_medida)}</span>
                                  )}
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div className={`${stockBar.className} h-1.5 rounded-full`} style={{ width: stockBar.width }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                                  {status.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => handleUtilizarMaterial(item)} className="text-green-600 hover:text-green-900">
                                  Utilizar Material
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Utilizar Material Modal */}
      {isUtilizarMaterialModalOpen && selectedMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <div className="modal-header cursor-move">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Utilizar Material</h2>
              </div>
              <p className="mb-4">
                Utilizando <strong>{selectedMaterial.name}</strong>
              </p>
              <div className="mb-4">
                <label htmlFor="quantidade_utilizada" className="block text-sm font-medium text-gray-700">
                  Quantidade a Utilizar ({getUnidadeMedidaLabel(selectedMaterial.unidade_medida)})
                </label>
                <input
                  type="number"
                  id="quantidade_utilizada"
                  value={quantidadeUtilizada}
                  onChange={(e) => setQuantidadeUtilizada(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeUtilizarMaterialModal}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitUtilizarMaterial}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Confirmar Utilização
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default EstoquePage;