import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/pcp', label: 'PCP' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/comercial', label: 'Comercial' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/logistica', label: 'Logística' },
  { to: '/financeiro', label: 'Financeiro' },
  { to: '/qualidade', label: 'Qualidade' },
  { to: '/producao', label: 'Produção' },
  { to: '/produtos', label: 'Produtos' },
];

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">ProIndústria 360</h2>
      <nav className="flex-grow">
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `block p-2 rounded ${isActive ? 'bg-gray-700' : ''}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <button
        onClick={handleLogout}
        className="w-full px-4 py-2 mt-4 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Logout
      </button>
    </div>
  );
};

export default Sidebar;