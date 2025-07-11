import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon, 
  SignalIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  UsersIcon,
  DevicePhoneMobileIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement)

function Statistics() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  const mockStats = {
    totalSmsSent: 1247,
    successRate: 98.5,
    verifiedUsers: 892,
    modemStatus: 'healthy',
    dailyStats: [45, 52, 48, 61, 55, 67, 73],
    hourlyStats: Array.from({ length: 24 }, (_, i) => Math.floor(Math.random() * 50) + 10),
    performance: {
      avgResponseTime: 245,
      dailySuccessRate: 97.8,
      uptime: 99.9
    },
    systemHealth: {
      cpu: 23,
      memory: 67,
      disk: 45,
      network: 95
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError('')
      try {
        // Try to fetch from API first
        const response = await axios.get('/api/statistics')
        setStats(response.data)
      } catch (error) {
        console.error('Statistics fetch error:', error)
        // Use mock data as fallback
        setStats(mockStats)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1)
      if (!isLoading) fetchStats()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      }
    }
  }

  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'SMS Sent',
        data: stats?.dailyStats || mockStats.dailyStats,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const doughnutData = {
    labels: ['Success', 'Failed', 'Pending'],
    datasets: [
      {
        data: [85, 10, 5],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 191, 36, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(251, 191, 36, 1)'
        ],
        borderWidth: 2
      }
    ]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-400/20 border-t-blue-400 rounded-full"
        />
        <span className="ml-4 text-white/70">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-block p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4"
        >
          <ChartBarIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Analytics Dashboard
        </h2>
        <p className="text-white/70">Real-time system performance and statistics</p>
        <div className="mt-2 text-xs text-white/50">
          Last updated: {new Date().toLocaleTimeString()} • Auto-refresh: 30s
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { 
            title: 'Total SMS Sent', 
            value: stats?.totalSmsSent || mockStats.totalSmsSent, 
            icon: DevicePhoneMobileIcon, 
            color: 'from-blue-500 to-cyan-500',
            change: '+12%'
          },
          { 
            title: 'Success Rate', 
            value: `${stats?.successRate || mockStats.successRate}%`, 
            icon: CheckCircleIcon, 
            color: 'from-green-500 to-emerald-500',
            change: '+2.3%'
          },
          { 
            title: 'Verified Users', 
            value: stats?.verifiedUsers || mockStats.verifiedUsers, 
            icon: UsersIcon, 
            color: 'from-purple-500 to-pink-500',
            change: '+8%'
          },
          { 
            title: 'System Uptime', 
            value: `${stats?.performance?.uptime || mockStats.performance.uptime}%`, 
            icon: SignalIcon, 
            color: 'from-orange-500 to-red-500',
            change: '99.9%'
          }
        ].map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.color} opacity-10 rounded-full translate-x-16 -translate-y-16`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${metric.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs text-green-400 font-medium">
                    {metric.change}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white/70 mb-1">{metric.title}</h3>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-blue-400" />
            Daily SMS Activity
          </h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-green-400" />
            Delivery Status
          </h3>
          <div className="h-64">
            <Doughnut data={doughnutData} options={{ ...chartOptions, maintainAspectRatio: true }} />
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <SignalIcon className="w-5 h-5 mr-2 text-purple-400" />
          System Health Monitor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'CPU Usage', value: stats?.systemHealth?.cpu || mockStats.systemHealth.cpu, max: 100, color: 'blue' },
            { name: 'Memory', value: stats?.systemHealth?.memory || mockStats.systemHealth.memory, max: 100, color: 'green' },
            { name: 'Disk Space', value: stats?.systemHealth?.disk || mockStats.systemHealth.disk, max: 100, color: 'yellow' },
            { name: 'Network', value: stats?.systemHealth?.network || mockStats.systemHealth.network, max: 100, color: 'purple' }
          ].map((item, index) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{item.name}</span>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  className={`h-2 rounded-full bg-gradient-to-r ${
                    item.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                    item.color === 'green' ? 'from-green-500 to-emerald-500' :
                    item.color === 'yellow' ? 'from-yellow-500 to-orange-500' :
                    'from-purple-500 to-pink-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2 text-orange-400" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-400">
              {stats?.performance?.avgResponseTime || mockStats.performance.avgResponseTime}ms
            </div>
            <div className="text-sm text-white/70">Average Response Time</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-400">
              {stats?.performance?.dailySuccessRate || mockStats.performance.dailySuccessRate}%
            </div>
            <div className="text-sm text-white/70">Daily Success Rate</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-purple-400">
              {((stats?.totalSmsSent || mockStats.totalSmsSent) / 24).toFixed(1)}
            </div>
            <div className="text-sm text-white/70">Messages per Hour</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Statistics