import React, { useState } from 'react';
import Registration from './components/Registration';
import MassRegistration from './components/MassRegistration';
import Statistics from './components/Statistics';

function App() {
  const [tab, setTab] = useState('register');

  return (
    <div className='bg-gray-900 text-white min-h-screen'>
      <h1 className='text-4xl font-bold text-center py-4'>Aegis Local Auth</h1>
      <div className='flex justify-center space-x-4 mb-4'>
        <button onClick={() => setTab('register')} className={'py-2 px-4 rounded ' + (tab === 'register' ? 'bg-blue-600' : 'bg-gray-700')}>
          Single Registration
        </button>
        <button onClick={() => setTab('mass')} className={'py-2 px-4 rounded ' + (tab === 'mass' ? 'bg-blue-600' : 'bg-gray-700')}>
          Mass Registration
        </button>
        <button onClick={() => setTab('stats')} className={'py-2 px-4 rounded ' + (tab === 'stats' ? 'bg-blue-600' : 'bg-gray-700')}>
          Statistics
        </button>
      </div>
      <div className='max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-md'>
        {tab === 'register' && <Registration />}
        {tab === 'mass' && <MassRegistration />}
        {tab === 'stats' && <Statistics />}
      </div>
    </div>
  );
}

export default App; 