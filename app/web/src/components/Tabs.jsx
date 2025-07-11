import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tab } from '@headlessui/react'
import { 
  UserIcon, 
  UsersIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import Registration from './Registration'
import MassRegistration from './MassRegistration'
import Statistics from './Statistics'

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'registration',
      label: 'Single Registration',
      icon: UserIcon,
      gradient: 'from-blue-500 to-cyan-500',
      component: Registration,
      description: 'Register individual users with SMS verification'
    },
    {
      id: 'mass-registration',
      label: 'Mass Registration',
      icon: UsersIcon,
      gradient: 'from-purple-500 to-pink-500',
      component: MassRegistration,
      description: 'Bulk register multiple users simultaneously'
    },
    {
      id: 'statistics',
      label: 'Analytics Dashboard',
      icon: ChartBarIcon,
      gradient: 'from-green-500 to-emerald-500',
      component: Statistics,
      description: 'Real-time system performance metrics'
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="w-full">
      {/* Enhanced Tab Navigation */}
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-xl" />
        
        <div className="relative flex border-b border-white/10 bg-white/5 backdrop-blur-sm">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 px-6 py-6 text-center font-medium transition-all duration-300 group ${
                  isActive
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/90'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active tab indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-20 rounded-t-xl`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Tab content */}
                <div className="relative z-10 flex flex-col items-center space-y-2">
                  <motion.div
                    className={`p-2 rounded-xl ${isActive ? `bg-gradient-to-r ${tab.gradient} text-white` : 'text-white/60 group-hover:text-white'}`}
                    animate={{ 
                      rotate: isActive ? [0, 5, -5, 0] : 0,
                      scale: isActive ? 1.1 : 1
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <span className="text-sm font-semibold">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className={`h-0.5 bg-gradient-to-r ${tab.gradient} rounded-full`}
                    />
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tab Description */}
      <AnimatePresence mode="wait">
        {activeTabData && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 py-4 bg-white/5 border-b border-white/10"
          >
            <p className="text-white/70 text-sm text-center">{activeTabData.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content with animations */}
      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          {tabs.map((tab) => {
            const Component = tab.component
            if (activeTab !== tab.id) return null
            
            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
                className="absolute inset-0 p-8"
              >
                <div className={`h-full rounded-xl bg-gradient-to-br ${tab.gradient} p-0.5`}>
                  <div className="h-full bg-black/20 backdrop-blur-sm rounded-xl p-6">
                    <Component />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* System Status Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center justify-between px-6 py-3 bg-white/5 border-t border-white/10 text-xs text-white/50"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <ShieldCheckIcon className="w-4 h-4 text-green-400" />
            <span>Security: Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <CpuChipIcon className="w-4 h-4 text-blue-400" />
            <span>ADB: Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <SignalIcon className="w-4 h-4 text-purple-400" />
            <span>Network: Stable</span>
          </div>
        </div>
        <div className="text-white/30">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </motion.div>
    </div>
  )
}

export default Tabs