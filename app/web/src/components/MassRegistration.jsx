import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MassRegistration = () => {
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [operationId, setOperationId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let interval;
    if (operationId) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/mass-register/${operationId}`);
          setProgress(response.data);
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            clearInterval(interval);
            setOperationId(null);
          }
        } catch (error) {
          setMessage('Could not fetch progress.');
          clearInterval(interval);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [operationId]);

  const handleMassRegister = async () => {
    try {
      setMessage('Starting mass registration...');
      const numbers = phoneNumbers.split('\n').filter(n => n.trim() !== '');
      const response = await axios.post('/api/mass-register', { phoneNumbers: numbers });
      setMessage(response.data.message);
      setOperationId(response.data.operationId);
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred during mass registration.');
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Mass Registration</h2>
      <textarea
        value={phoneNumbers}
        onChange={(e) => setPhoneNumbers(e.target.value)}
        placeholder="Enter phone numbers, one per line"
        className="w-full p-2 bg-gray-700 rounded h-40"
      ></textarea>
      <button
        onClick={handleMassRegister}
        disabled={!!operationId}
        className="w-full p-2 mt-4 bg-blue-600 hover:bg-blue-700 rounded font-bold disabled:bg-gray-500"
      >
        {operationId ? 'Processing...' : 'Start Mass Registration'}
      </button>
      {message && <p className="mt-4 text-center">{message}</p>}
      {progress && (
        <div className="mt-4 p-4 bg-gray-700 rounded">
          <h3 className="font-bold">Progress (ID: {progress.operationId})</h3>
          <p>Status: <span className={`font-semibold ${progress.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{progress.status}</span></p>
          <p>Processed: {progress.processed} / {progress.total}</p>
          <p>Success: <span className="text-green-500">{progress.success}</span></p>
          <p>Failed: <span className="text-red-500">{progress.failures}</span></p>
          {progress.status === 'completed' && <p className="text-green-400 mt-2">Operation finished in {progress.duration} seconds.</p>}
        </div>
      )}
    </div>
  );
};

export default MassRegistration; 