import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/axios';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import NovaPecaForm from '../components/NovaPecaForm';

const ComercialPage = () => {
  // Main page state
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Form state
  const initialOrderData = {
    cliente: '',
    prazo: '',
    prioridade: 'NORMAL',
    status: 'PENDENTE',
  };
  const [orderData, setOrderData] = useState(initialOrderData);
  const [stagedItems, setStagedItems] = useState([]);
  const [openSections, setOpenSections] = useState({});

  // --- Data Fetching ---
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [pedidosRes, clientesRes, materiaisRes, modelosRes] = await Promise.all([
        api.get('comercial/pedidos/'),
        api.get('clientes/clientes/'),
        api.get('estoque/materias-primas/'),
        api.get('comercial/modelos-produto/')
      ]);

      const clientesData = clientesRes.data.results || clientesRes.data;
      setClientes(Array.isArray(clientesData) ? clientesData : []);

      const pedidosData = pedidosRes.data.results || pedidosRes.data;
      if (Array.isArray(pedidosData) && Array.isArray(clientesData)) {
        const formattedData = pedidosData.map(item => ({
          ...item,
          cliente: clientesData.find(c => c.id === item.cliente) || item.cliente,
        }));
        setPedidos(formattedData);
      }
      
      const materiaisData = materiaisRes.data.results || materiaisRes.data;
      setMateriais(Array.isArray(materiaisData) ? materiaisData : []);
      
      const modelosData = modelosRes.data.results || modelosRes.data;
      setModelos(Array.isArray(modelosData) ? modelosData : []);

      setError(null);
    } catch (err) {
      setError('Falha ao carregar dados. Tente novamente.');
      console.error('Failed to fetch initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- Form Handlers ---
  const handleOrderDataChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionarPeca = (novaPeca) => {
    const modeloSelecionado = modelos.find(m => m.id === parseInt(novaPeca.modelo_base_id));
    if (!modeloSelecionado) {
      alert("Erro: Modelo base não encontrado. Tente novamente.");
      return;
    }

    const pecaParaAdicionar = {
      tipo: modeloSelecionado.tipo,
      modelo_base: novaPeca.modelo_base_id,
      modelo: novaPeca.modelo_especifico,
      gola: novaPeca.gola,
      manga: novaPeca.manga,
      corpo_frente: novaPeca.corpo_frente,
      corpo_costa: novaPeca.corpo_costa,
      bordado: novaPeca.bordado,
      // Para calça, os campos seriam outros, mas a estrutura é a mesma
      descricao: modeloSelecionado.tipo === 'CALCA' ? novaPeca.informacoes_adicionais : '',
      tamanhos: novaPeca.tamanhos,
      preco_unitario: novaPeca.preco_unitario,
      materiais: [], // O backend irá popular isso com base no modelo_base
    };
    
    const totalQuantity = Object.values(pecaParaAdicionar.tamanhos).reduce((sum, q) => sum + (parseInt(q, 10) || 0), 0);
    pecaParaAdicionar.subtotal = (parseFloat(pecaParaAdicionar.preco_unitario) || 0) * totalQuantity;

    setStagedItems(prev => [...prev, pecaParaAdicionar]);
  };

  const unstageItem = (index) => {
    setStagedItems(prev => prev.filter((_, i) => i !== index));
  };

  // --- Modal Management ---
  const openModal = (item = null) => {
    setCurrentItem(item);
    if (item) {
      setOrderData({
        cliente: item.cliente?.id || '',
        prazo: item.prazo ? item.prazo.split('T')[0] : '',
        prioridade: item.prioridade || 'NORMAL',
        status: item.status || 'PENDENTE',
      });
      const itemsWithSubtotal = item.itens.map(it => {
        const totalQuantity = Object.values(it.tamanhos || {}).reduce((sum, q) => sum + (parseInt(q, 10) || 0), 0);
        return {
          ...it,
          materiais: it.materiais || [],
          tamanhos: it.tamanhos || { PP: 0, P: 0, M: 0, G: 0, GG: 0, EXG: 0 },
          preco_unitario: it.preco_unitario || 0,
          subtotal: (parseFloat(it.preco_unitario) || 0) * totalQuantity,
        };
      });
      setStagedItems(itemsWithSubtotal);
    } else {
      setOrderData(initialOrderData);
      setStagedItems([]);
    }
    setOpenSections({});
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);
  const openDeleteModal = (item) => { setCurrentItem(item); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  // --- API Actions ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stagedItems.length === 0) {
      alert("Adicione pelo menos um item ao pedido antes de salvar.");
      return;
    }

    const method = currentItem ? 'put' : 'post';
    const url = currentItem ? `comercial/pedidos/${currentItem.id}/` : 'comercial/pedidos/';

    const totalOrderValue = stagedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalQuantity = stagedItems.reduce((total, item) => {
      return total + Object.values(item.tamanhos).reduce((sum, q) => sum + (parseInt(q, 10) || 0), 0);
    }, 0);

    const dataToSend = {
      ...orderData,
      cliente: Number(orderData.cliente),
      valor_total: totalOrderValue,
      quantidade_pecas: totalQuantity,
      itens: stagedItems.map(({ subtotal, ...item }) => ({ // remove subtotal before sending
        ...item,
        preco_unitario: parseFloat(item.preco_unitario) || 0,
        materiais: item.materiais.map(m => ({
          material_id: Number(m.material_id),
          quantidade: Number(m.quantidade),
        })),
      })),
    };

    try {
      await api[method](url, dataToSend);
      fetchInitialData();
      closeModal();
    } catch (err) {
      console.error('Failed to save item', err.response?.data || err.message);
      setError(currentItem ? 'Falha ao atualizar o pedido.' : 'Falha ao criar o pedido.');
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    try {
      await api.delete(`comercial/pedidos/${currentItem.id}/`);
      fetchInitialData();
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete item', err);
      setError('Falha ao excluir o item.');
    }
  };

  // --- Memos and Helpers ---
  const filteredItems = useMemo(() =>
    Array.isArray(pedidos) ? pedidos.filter(item => {
      const clientName = item.cliente?.nome || '';
      const searchTermLower = searchTerm.toLowerCase();
      return clientName.toLowerCase().includes(searchTermLower) ||
             (item.prioridade || '').toLowerCase().includes(searchTermLower) ||
             (item.status || '').toLowerCase().includes(searchTermLower);
    }) : [], [pedidos, searchTerm]);

  const totalOrderValue = useMemo(() => 
    stagedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0), 
    [stagedItems]
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatCurrency = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;

  const getStatusClass = (status) => ({
    'Concluído': 'bg-green-100 text-green-800',
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Em Produção': 'bg-blue-100 text-blue-800',
    'Cancelado': 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-800');

  const getPriorityClass = (prioridade) => ({
    'URGENTE': 'bg-red-100 text-red-800',
    'NORMAL': 'bg-yellow-100 text-yellow-800',
  }[prioridade] || 'bg-gray-100 text-gray-800');

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  // --- Render Functions ---

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <style>{`.input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; }`}</style>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão Comercial</h1>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Novo Pedido</button>
      </div>

      <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mb-4" />

      {loading ? <p>Carregando...</p> : error ? <p className="text-red-500">{error}</p> : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {['ID', 'Cliente', 'Data', 'Prazo', 'Qtd. Peças', 'Prioridade', 'Status', 'Ações'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{item.id}</td>
                  <td className="px-6 py-4">{item.cliente?.nome || 'N/A'}</td>
                  <td className="px-6 py-4">{formatDate(item.data_pedido)}</td>
                  <td className="px-6 py-4">{formatDate(item.prazo)}</td>
                  <td className="px-6 py-4">{item.quantidade_pecas}</td>
                  <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(item.prioridade)}`}>{item.prioridade}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(item.status)}`}>{item.status}</span></td>
                  <td className="px-6 py-4">
                    <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                    <button onClick={() => openDeleteModal(item)} className="text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{currentItem ? 'Editar Pedido' : 'Novo Pedido'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-4">🧾 Dados do Pedido</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select name="cliente" value={orderData.cliente} onChange={handleOrderDataChange} className="input" required><option value="">Selecione um cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
                  <input type="date" name="prazo" value={orderData.prazo} onChange={handleOrderDataChange} className="input" required />
                  <select name="prioridade" value={orderData.prioridade} onChange={handleOrderDataChange} className="input" required><option value="NORMAL">Normal</option><option value="URGENTE">Urgente</option></select>
                </div>
              </div>

              {stagedItems.length > 0 && (
                <div className="p-4 border rounded-md bg-blue-50">
                    <h3 className="text-lg font-semibold mb-4">📦 Resumo do Pedido</h3>
                    <ul className="space-y-2 mb-4">
                        {stagedItems.map((item, index) => (
                            <li key={index} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                                <div>
                                    <span className="font-bold">{item.tipo === 'CAMISA' ? '👕' : '👖'} {item.modelo}</span>
                                    <span className="text-sm text-gray-600 ml-2">({Object.values(item.tamanhos).reduce((s, q) => s + q, 0)} peças)</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold mr-4">{formatCurrency(item.subtotal)}</span>
                                    <button type="button" onClick={() => unstageItem(index)} className="text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="text-right font-bold text-xl">
                        Valor Total do Pedido: {formatCurrency(totalOrderValue)}
                    </div>
                </div>
              )}

              <NovaPecaForm onAddPeca={handleAdicionarPeca} modelos={modelos.filter(m => m.tipo !== 'CALCA')} />

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">{currentItem ? 'Salvar Alterações' : 'Criar Pedido'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir o pedido "{currentItem?.id}"?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={closeDeleteModal} className="bg-gray-200 px-4 py-2 rounded-md">Cancelar</button>
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-md">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComercialPage;