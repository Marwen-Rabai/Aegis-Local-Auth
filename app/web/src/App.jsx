import React, { useState } from 'react'
import Tabs from './components/Tabs'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('registration')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white">
      <header className="p-6 text-center">
        <h1 className="text-4xl font-bold mb-2 animate-pulse">Aegis Local Auth</h1>
        <p className="text-lg">Secure SMS Verification System</p>
      </header>
      <main className="container mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden max-w-4xl mx-auto transition-all duration-300 hover:shadow-3xl">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </main>
      <footer className="p-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Aegis Local Auth. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App 