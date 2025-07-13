import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/axios';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiChevronDown } from 'react-icons/fi';

const ProdutosPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const initialFormData = {
    nome: '',
    tipo: 'CAMISA',
    tamanhos: { P: 0, M: 0, G: 0, GG: 0, XG: 0 },
    materiais: [], // { material_id, quantidade, tamanho }
  };
  const [formData, setFormData] = useState(initialFormData);

  const tipoProdutoOptions = [
    { value: 'CAMISA', label: 'Camisa' },
    { value: 'CALCA', label: 'Calça' },
  ];

  const tamanhoOptions = ['P', 'M', 'G', 'GG', 'XG'];

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [produtosRes, materiasPrimasRes] = await Promise.all([
        api.get('comercial/modelos-produto/'),
        api.get('estoque/materias-primas/'),
      ]);
      setProdutos(produtosRes.data.results || produtosRes.data);
      setMateriasPrimas(materiasPrimasRes.data.results || materiasPrimasRes.data);
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTamanhoChange = (size, value) => {
    setFormData(prev => ({
      ...prev,
      tamanhos: {
        ...prev.tamanhos,
        [size]: parseInt(value, 10) || 0,
      },
    }));
  };

  const handleMaterialChange = (index, field, value) => {
    const newMaterials = [...formData.materiais];
    newMaterials[index][field] = value;
    setFormData(prev => ({ ...prev, materiais: newMaterials }));
  };

  const addMaterialField = () => {
    setFormData(prev => ({
      ...prev,
      materiais: [...prev.materiais, { material_id: '', quantidade: '', tamanho: '' }],
    }));
  };

  const removeMaterialField = (index) => {
    setFormData(prev => ({
      ...prev,
      materiais: prev.materiais.filter((_, i) => i !== index),
    }));
  };

  const openModal = (item = null) => {
    setCurrentItem(item);
    if (item) {
      const formattedMateriais = item.consumo_materiais.map(cm => ({
        id: cm.id, // Include the ID for existing materials
        material_id: cm.material.id,
        quantidade: cm.quantidade,
        tamanho: cm.tamanho,
      }));
      setFormData({
        nome: item.nome,
        tipo: item.tipo,
        tamanhos: {}, // Tamanhos são definidos por ConsumoMaterial, não diretamente no ModeloProduto
        materiais: formattedMateriais,
      });
    } else {
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setError(null);
  };

  const openDeleteModal = (item) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.nome || !formData.tipo) {
      setError('Nome do produto e tipo são obrigatórios.');
      return;
    }

    // Validate materials
    for (const material of formData.materiais) {
      if (!material.material_id || !material.quantidade || !material.tamanho) {
        setError('Todos os campos de material (tipo, quantidade, tamanho) são obrigatórios.');
        return;
      }
      if (isNaN(parseFloat(material.quantidade)) || parseFloat(material.quantidade) <= 0) {
        setError('Quantidade do material deve ser um número positivo.');
        return;
      }
    }

    const dataToSend = {
      nome: formData.nome,
      tipo: formData.tipo,
      consumo_materiais: formData.materiais.map(m => ({
        ...(m.id && { id: m.id }), // Conditionally include ID for existing materials
        material_id: m.material_id,
        quantidade: parseFloat(m.quantidade),
        tamanho: m.tamanho,
      })),
    };

    try {
      if (currentItem) {
        await api.put(`comercial/modelos-produto/${currentItem.id}/`, dataToSend);
      } else {
        await api.post('comercial/modelos-produto/', dataToSend);
      }
      fetchInitialData();
      closeModal();
    } catch (err) {
      console.error('Failed to save product', err.response?.data || err.message);
      setError(currentItem ? 'Falha ao atualizar o produto.' : 'Falha ao criar o produto.');
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    try {
      await api.delete(`comercial/modelos-produto/${currentItem.id}/`);
      fetchInitialData();
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete product', err);
      setError('Falha ao excluir o produto. Verifique se não há pedidos associados.');
    }
  };

  const filteredProdutos = useMemo(() =>
    Array.isArray(produtos) ? produtos.filter(produto => {
      const searchTermLower = searchTerm.toLowerCase();
      return (produto.nome || '').toLowerCase().includes(searchTermLower) ||
             (produto.tipo || '').toLowerCase().includes(searchTermLower);
    }) : [], [produtos, searchTerm]);

  const getMateriaPrimaLabel = (id) => {
    const mp = materiasPrimas.find(m => m.id === id);
    return mp ? `${mp.name} (${mp.categoria_subtipo || 'N/A'})` : 'Material Desconhecido';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Produtos</h1>
        <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 shadow">
          <FiPlus className="mr-2" />
          Novo Produto
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar produto por nome ou tipo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md mb-4"
      />

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materiais Cadastrados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProdutos.map((produto) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{produto.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{produto.tipo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {produto.consumo_materiais && produto.consumo_materiais.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {produto.consumo_materiais.map((cm, idx) => (
                          <li key={idx}>
                            {getMateriaPrimaLabel(cm.material.id)} - {parseFloat(cm.quantidade).toFixed(2)} ({cm.tamanho})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>Nenhum material cadastrado.</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => openModal(produto)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <FiEdit />
                    </button>
                    <button onClick={() => openDeleteModal(produto)} className="text-red-600 hover:text-red-900">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(isModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{currentItem ? 'Editar Produto' : 'Novo Produto'}</h2>
            {error && <div className="text-sm text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Details */}
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-4">Detalhes do Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                    <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                  </div>
                  <div>
                    <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo de Produto</label>
                    <select name="tipo" id="tipo" value={formData.tipo} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                      {tipoProdutoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Materiais Necessários */}
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-4">Materiais Necessários</h3>
                {formData.materiais.map((material, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-3 border border-gray-200 rounded-md relative">
                    <div className="md:col-span-2">
                      <label htmlFor={`material_id-${index}`} className="block text-sm font-medium text-gray-700">Material</label>
                      <select
                        name={`material_id-${index}`}
                        id={`material_id-${index}`}
                        value={material.material_id}
                        onChange={(e) => handleMaterialChange(index, 'material_id', parseInt(e.target.value, 10))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Selecione o Material</option>
                        {materiasPrimas.map(mp => (
                          <option key={mp.id} value={mp.id}>{`${mp.name} (${mp.tipo_produto} - ${mp.categoria_subtipo || 'N/A'})`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`quantidade-${index}`} className="block text-sm font-medium text-gray-700">Quantidade</label>
                      <input
                        type="number"
                        step="0.01"
                        name={`quantidade-${index}`}
                        id={`quantidade-${index}`}
                        value={material.quantidade}
                        onChange={(e) => handleMaterialChange(index, 'quantidade', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`tamanho-${index}`} className="block text-sm font-medium text-gray-700">Tamanho</label>
                      <select
                        name={`tamanho-${index}`}
                        id={`tamanho-${index}`}
                        value={material.tamanho}
                        onChange={(e) => handleMaterialChange(index, 'tamanho', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Selecione o Tamanho</option>
                        {tamanhoOptions.map(size => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={() => removeMaterialField(index)} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600">Remover</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addMaterialField} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Adicionar Material</button>
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{currentItem ? 'Salvar Alterações' : 'Cadastrar Produto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir o produto "{currentItem?.nome}"?</p>
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

export default ProdutosPage;