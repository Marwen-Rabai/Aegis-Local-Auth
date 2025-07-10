import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Statistics() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await axios.get('/api/statistics')
        setStats(response.data)
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to fetch statistics. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return <div className="text-center py-10 text-gray-400">Loading statistics...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-300">{error}</div>
  }

  if (!stats) {
    return <div className="text-center py-10 text-gray-400">No statistics available.</div>
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-300">System Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-medium text-gray-300 mb-1">Total SMS Sent</h3>
          <p className="text-3xl font-bold text-indigo-400">{stats.totalSmsSent}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-medium text-gray-300 mb-1">Success Rate</h3>
          <p className="text-3xl font-bold text-green-400">{stats.successRate}%</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-medium text-gray-300 mb-1">Verified Users</h3>
          <p className="text-3xl font-bold text-blue-400">{stats.verifiedUsers}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-medium text-gray-300 mb-1">Modem Status</h3>
          <p className={`text-xl font-semibold ${stats.modemStatus === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>{stats.modemStatus}</p>
        </div>
      </div>
      <div className="mt-6 bg-white/5 backdrop-blur-md p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-300 mb-2">Performance Metrics</h3>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Average Response Time</span>
              <span className="text-indigo-400 font-medium">{stats.performance?.avgResponseTime || 'N/A'} ms</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min(stats.performance?.avgResponseTime / 1000 * 100, 100) || 0}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Daily Success Rate</span>
              <span className="text-green-400 font-medium">{stats.performance?.dailySuccessRate || 'N/A'}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${stats.performance?.dailySuccessRate || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics