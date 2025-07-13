import React, { useState, useEffect } from 'react';
import api from '../services/axios';

const OrdemProducaoObservacaoModal = ({ isOpen, onClose, ordem, onSaveSuccess }) => {
  const [tipo, setTipo] = useState('OBSERVACAO');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setTipo('OBSERVACAO');
      setDescricao('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/producao/observacoes-producao/', {
        ordem_producao: ordem.id,
        tipo,
        descricao,
      });
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao registrar ocorrência:", err);
      setError('Falha ao registrar ocorrência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Ocorrência para OP #{ordem.id}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="tipo" className="block text-gray-700 text-sm font-bold mb-2">Tipo:</label>
            <select
              id="tipo"
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="OBSERVACAO">Observação</option>
              <option value="RETRABALHO">Retrabalho</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="descricao" className="block text-gray-700 text-sm font-bold mb-2">Descrição:</label>
            <textarea
              id="descricao"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              placeholder="Descreva a observação ou o retrabalho..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            ></textarea>
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrdemProducaoObservacaoModal;