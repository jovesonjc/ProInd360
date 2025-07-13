import React, { useState, useCallback } from 'react';
import api from '../services/axios';
import {
  FiArchive,
  FiScissors,
  FiFeather,
  FiGitCommit,
  FiCheckSquare,
  FiPackage,
  FiPrinter,
} from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';

const EnviarParaSetor = ({ pedido, onStatusChange, onClose, setorStatus }) => {
  const [updatingSetor, setUpdatingSetor] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  const setores = [
    { name: 'Estoque', value: 'ESTOQUE', icon: <FiArchive /> },
    { name: 'Corte', value: 'CORTE', icon: <FiScissors /> },
    { name: 'Estamparia', value: 'ESTAMPARIA', icon: <FiPrinter /> },
    { name: 'Bordado', value: 'BORDADO', icon: <FiFeather /> },
    { name: 'Costura', value: 'COSTURA', icon: <FiGitCommit /> },
    { name: 'Acabamento', value: 'ACABAMENTO', icon: <FiCheckSquare /> },
    { name: 'Embalagem', value: 'EMBALAGEM', icon: <FiPackage /> },
  ];

  const handleUpdateStatus = useCallback(async (setorValue, setorName) => {
    setUpdatingSetor(setorValue);
    setUpdateError(null);

    const promise = api.patch(`comercial/pedidos/${pedido.id}/`, { status: setorValue });

    toast.promise(
      promise,
      {
        loading: `Enviando para ${setorName}...`,
        success: () => {
          onStatusChange(pedido.id, setorValue);
          setTimeout(() => {
            onClose();
          }, 1000); // Delay to allow user to see the success message
          return `Pedido enviado para ${setorName} com sucesso!`;
        },
        error: (err) => {
          console.error('Falha ao atualizar o status do pedido:', err);
          setUpdateError(`Falha ao enviar para ${setorName}. Tente novamente.`);
          return `Falha ao enviar para ${setorName}.`;
        },
      },
      {
        style: {
          minWidth: '250px',
        },
        success: {
          duration: 5000,
          icon: '🚀',
        },
      }
    );

    promise.finally(() => {
      setUpdatingSetor(null);
    });
  }, [pedido.id, onStatusChange, onClose]);

  return (
    <div className="mt-4 w-full">
      <Toaster position="top-center" reverseOrder={false} />
      <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Enviar para o Setor</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(() => {
          const statusLevels = {
            'PRODUCAO': 0,
            'ESTOQUE': 1,
            'MATERIAIS_CONFIRMADOS': 1,
            'MATERIAIS_INCOMPLETOS': 1,
            'CORTE': 2,
            'ESTAMPARIA': 3,
            'BORDADO': 4,
            'COSTURA': 5,
            'ACABAMENTO': 6,
            'EMBALAGEM': 7,
          };

          return setores.map((setor) => {
            const currentLevel = statusLevels[setorStatus] || 0;
            const sectorLevel = statusLevels[setor.value] || 99;
            
            // Allow returning to 'Estoque' if materials are incomplete
            const isCompleted = setorStatus === 'MATERIAIS_INCOMPLETOS' && setor.value === 'ESTOQUE'
              ? false
              : sectorLevel <= currentLevel;

            const buttonClass = isCompleted
              ? 'bg-green-500'
              : 'bg-gray-500 hover:bg-gray-600';

            return (
              <button
                key={setor.value}
                onClick={() => handleUpdateStatus(setor.value, setor.name)}
                disabled={updatingSetor !== null || isCompleted}
                className={`flex flex-col items-center justify-center p-4 rounded-lg text-white font-semibold shadow-md transform transition-transform duration-200 ease-in-out ${buttonClass} ${updatingSetor === null && !isCompleted ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
              >
                <span className="text-2xl mb-2">{setor.icon}</span>
                <span>{setor.name}</span>
                {updatingSetor === setor.value && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </button>
            );
          });
        })()}
      </div>
      {updateError && <p className="text-red-500 text-sm mt-4 text-center">{updateError}</p>}
    </div>
  );
};

export default EnviarParaSetor;