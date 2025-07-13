import React, { useState, useEffect } from 'react';
import axios from '../services/axios';

const NovaPecaForm = ({ onAddPeca, modelos = [] }) => {
  const [selectedModelo, setSelectedModelo] = useState('');
  const [formData, setFormData] = useState({
    modelo_base_id: '',
    modelo_especifico: '',
    gola: '',
    manga: '',
    corpo_frente: '',
    corpo_costa: '',
    bordado: '',
    modelo_calca: '',
    informacoes_adicionais: '',
    tamanhos: { P: 0, M: 0, G: 0, GG: 0, XG: 0 },
    preco_unitario: '',
  });
  const [fichaTecnica, setFichaTecnica] = useState(null);
  const [verificacaoEstoque, setVerificacaoEstoque] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleModeloChange = (e) => {
    const modeloId = e.target.value;
    setSelectedModelo(modeloId);
    setFormData({ ...formData, modelo_base_id: modeloId });

    if (modeloId) {
      // Resetar verificações anteriores
      setFichaTecnica(null);
      setVerificacaoEstoque(null);
      
      // Buscar ficha técnica do modelo selecionado
      axios.get(`/comercial/modelos-produto/${modeloId}/ficha_tecnica/`)
        .then(response => {
          setFichaTecnica(response.data);
        })
        .catch(error => console.error("Erro ao buscar ficha técnica:", error));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTamanhosChange = (e) => {
    const { name, value } = e.target;
    const newTamanhos = { ...formData.tamanhos, [name]: parseInt(value, 10) || 0 };
    setFormData({ ...formData, tamanhos: newTamanhos });
    verificarEstoque(newTamanhos);
  };
  
  const verificarEstoque = (tamanhos) => {
    const quantidadeTotal = Object.values(tamanhos).reduce((acc, curr) => acc + curr, 0);

    if (selectedModelo && quantidadeTotal > 0) {
      setLoading(true);
      axios.post(`/comercial/modelos-produto/${selectedModelo}/verificar_estoque/`, { tamanhos: tamanhos })
        .then(response => {
          setVerificacaoEstoque(response.data);
        })
        .catch(error => console.error("Erro ao verificar estoque:", error))
        .finally(() => setLoading(false));
    }
  };

  const handleAddToOrder = () => {
    if (!selectedModelo) {
      alert("Por favor, selecione um tipo de peça.");
      return;
    }
    onAddPeca(formData);
    // Reset form after adding
    setSelectedModelo('');
    setFormData({
      modelo_base_id: '',
      modelo_especifico: '',
      gola: '',
      manga: '',
      corpo_frente: '',
      corpo_costa: '',
      bordado: '',
      modelo_calca: '',
      informacoes_adicionais: '',
      tamanhos: { P: 0, M: 0, G: 0, GG: 0, XG: 0 },
      preco_unitario: '',
    });
    setFichaTecnica(null);
    setVerificacaoEstoque(null);
  };

  const getModeloTipo = () => {
    if (!selectedModelo) return null;
    const modelo = modelos.find(m => m.id === parseInt(selectedModelo));
    return modelo ? modelo.tipo : null;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold">Adicionar Nova Peça</h2>
      
      {/* Seletor de Tipo de Peça (Modelo) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo da Peça</label>
        <select
          value={selectedModelo}
          onChange={handleModeloChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Selecione o tipo</option>
          {modelos.map(modelo => (
            <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>
          ))}
        </select>
      </div>

      {/* Modelo Específico */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Modelo</label>
        <input
          type="text"
          name="modelo_especifico"
          value={formData.modelo_especifico}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          placeholder="Ex: Gola Polo Piquet"
        />
      </div>

      {/* Campos específicos para Camisa ou Calça */}
      {getModeloTipo() === 'CAMISA' && (
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="gola" value={formData.gola} onChange={handleChange} placeholder="Gola" className="p-2 border rounded" />
          <input type="text" name="manga" value={formData.manga} onChange={handleChange} placeholder="Manga" className="p-2 border rounded" />
          <input type="text" name="corpo_frente" value={formData.corpo_frente} onChange={handleChange} placeholder="Corpo Frente" className="p-2 border rounded" />
          <input type="text" name="corpo_costa" value={formData.corpo_costa} onChange={handleChange} placeholder="Corpo Costa" className="p-2 border rounded" />
          <textarea name="bordado" value={formData.bordado} onChange={handleChange} placeholder="Informações do Bordado" className="col-span-2 p-2 border rounded" />
        </div>
      )}
      {getModeloTipo() === 'CALCA' && (
        <div className="space-y-2">
            <input type="text" name="modelo_calca" value={formData.modelo_calca} onChange={handleChange} placeholder="Modelo da Calça" className="w-full p-2 border rounded" />
            <textarea name="informacoes_adicionais" value={formData.informacoes_adicionais} onChange={handleChange} placeholder="Informações Adicionais" className="w-full p-2 border rounded" />
        </div>
      )}


      {/* Tamanhos */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Tamanhos</label>
        <div className="grid grid-cols-5 gap-2">
          {Object.keys(formData.tamanhos).map(size => (
            <div key={size}>
              <label className="block text-xs font-medium text-gray-600 text-center">{size}</label>
              <input
                type="number"
                name={size}
                value={formData.tamanhos[size]}
                onChange={handleTamanhosChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder={size}
                min="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preço */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Preço por Unidade (R$)</label>
        <input
          type="number"
          name="preco_unitario"
          value={formData.preco_unitario}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          placeholder="0.00"
        />
      </div>

      {/* Verificação de Estoque */}
      {loading && <p>Verificando estoque...</p>}
      {verificacaoEstoque && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Verificação de Estoque:</h3>
          <ul className="space-y-1">
            {verificacaoEstoque.map(item => (
              <li key={item.material_id} className={`flex justify-between ${item.suficiente ? 'text-green-700' : 'text-red-700'}`}>
                <span>{item.nome} ({item.tipo_produto})</span>
                <span>
                  Necessário: {item.quantidade_necessaria.toFixed(2)} {item.unidade_medida} |
                  Disponível: {item.quantidade_disponivel.toFixed(0)} |
                  {!item.suficiente && ` Faltam: ${(item.quantidade_necessaria - item.quantidade_disponivel).toFixed(2)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToOrder}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        Adicionar Peça ao Pedido
      </button>
    </div>
  );
};

export default NovaPecaForm;