import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from 'react-error-boundary'
import Tabs from './components/Tabs'
import './index.css'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center text-white"
    >
      <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">🚨 System Error</h2>
        <p className="mb-6 text-red-200">Something went wrong. Please refresh the page.</p>
        <button 
          onClick={resetErrorBoundary}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </motion.div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('registration')
  const [isLoading, setIsLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState('online')

  useEffect(() => {
    // Simulate loading and check system status
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Aegis Local Auth</h1>
          <p className="text-white/70">Initializing secure SMS system...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, -100, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{ 
              x: [0, -100, 0],
              y: [0, 100, 0],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-pink-400/20 to-red-400/20 rounded-full blur-xl"
          />
        </div>

        {/* Header */}
        <motion.header 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 p-6 text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              🛡️ Aegis Local Auth
            </h1>
          </motion.div>
          <p className="text-xl text-white/80 font-light">
            Ultra-Secure SMS Verification System
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-3 h-3 rounded-full ${systemStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`}
            />
            <span className="text-sm text-white/60">System Status: {systemStatus}</span>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="container mx-auto p-6 relative z-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto border border-white/20"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </motion.div>
        </motion.main>

        {/* Footer */}
        <motion.footer 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative z-10 p-6 text-center"
        >
          <div className="text-sm text-white/50 space-y-2">
            <p>&copy; {new Date().getFullYear()} Aegis Local Auth. All rights reserved.</p>
            <p className="flex items-center justify-center space-x-4">
              <span>🔒 Enterprise Security</span>
              <span>⚡ Real-time Processing</span>
              <span>🚀 Production Ready</span>
            </p>
          </div>
        </motion.footer>
      </div>
    </ErrorBoundary>
  )
}

export default App 