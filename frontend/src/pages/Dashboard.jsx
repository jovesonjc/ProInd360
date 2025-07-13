import React from 'react';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  return (
    <div>
      <Navbar />
      <div className="container p-4 mx-auto">
        <h1 className="text-2xl font-bold">Welcome, logged in!</h1>
      </div>
    </div>
  );
};

export default Dashboard;