import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/statistics');
        setStats(response.data);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Could not fetch statistics.');
      }
    };
    fetchStats();
  }, []);

  if (message) {
    return <p className='text-red-500 text-center mt-4'>{message}</p>;
  }

  if (!stats) {
    return <p className='text-center mt-4'>Loading statistics...</p>;
  }

  return (
    <div className='p-6 bg-gray-800 rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-4'>System Statistics</h2>
      <ul className='space-y-2'>
        {Object.entries(stats).map(([key, value]) => (
          <li key={key} className='flex justify-between'>
            <span className='font-semibold'>{key}</span>
            <span>{String(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Statistics; 