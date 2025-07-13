import React from 'react';

const StatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let displayText = status;

  switch (status) {
    case 'PENDENTE':
      bgColor = 'bg-yellow-100'; // #FFF3CD is close to yellow-100
      textColor = 'text-yellow-800'; // #856404 is close to yellow-800
      displayText = 'PENDENTE';
      break;
    case 'PRODUCAO':
      bgColor = 'bg-blue-100'; // #D1ECF1 is close to blue-100
      textColor = 'text-blue-800'; // #0C5460 is close to blue-800
      displayText = 'EM PRODUÇÃO';
      break;
    case 'APROVADO':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      displayText = 'APROVADO';
      break;
    case 'CONCLUIDO':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      displayText = 'CONCLUÍDO';
      break;
    case 'CANCELADO':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      displayText = 'CANCELADO';
      break;
    case 'REJEITADO':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      displayText = 'REJEITADO';
      break;
    case 'ESTOQUE':
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      displayText = 'ESTOQUE';
      break;
    case 'CORTE':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      displayText = 'CORTE';
      break;
    case 'ESTAMPARIA':
        bgColor = 'bg-pink-100';
        textColor = 'text-pink-800';
        displayText = 'ESTAMPARIA';
        break;
    case 'BORDADO':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        displayText = 'BORDADO';
        break;
    case 'COSTURA':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        displayText = 'COSTURA';
        break;
    case 'ACABAMENTO':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        displayText = 'ACABAMENTO';
        break;
    case 'EMBALAGEM':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        displayText = 'EMBALAGEM';
        break;
    case 'MATERIAIS_CONFIRMADOS':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        displayText = 'Materiais Confirmados';
        break;
    case 'MATERIAIS_INCOMPLETOS':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        displayText = 'Materiais Incompletos';
        break;
    default:
      break;
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;