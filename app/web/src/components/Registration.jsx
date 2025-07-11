import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PhoneIcon, 
  PaperAirplaneIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'

function Registration() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Input, 2: Processing, 3: Complete

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('')
    setStep(2)
    
    try {
      const response = await axios.post('/api/register', { phoneNumber })
      setStatus(response.data.message || 'Registration successful! SMS sent.')
      setStep(3)
      setTimeout(() => {
        setPhoneNumber('')
        setStep(1)
        setStatus('')
      }, 5000)
    } catch (error) {
      setStatus(error.response?.data?.error || 'Failed to register. Please try again.')
      setStep(1)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/)
    if (match) {
      return !match[2] ? match[1] : `+${match[1]} ${match[2]}${match[3] ? ` ${match[3]}` : ''}`
    }
    return value
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-block p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4"
        >
          <PhoneIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Single User Registration
        </h2>
        <p className="text-white/70">Secure SMS verification for individual users</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-4">
              <motion.div
                whileFocus={{ scale: 1.02 }}
                className="relative"
              >
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-white/90 mb-2">
                  📱 Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+213 XXX XXX XXX"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: phoneNumber ? '100%' : 0 }}
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                  />
                </div>
                <p className="mt-2 text-xs text-white/50">
                  Format: +[country code] [number] (e.g., +213 XXX XXX XXX)
                </p>
              </motion.div>

              <motion.button
                type="submit"
                disabled={isLoading || !phoneNumber}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg hover:shadow-xl ${
                  (!phoneNumber || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>Send Verification SMS</span>
                </div>
              </motion.button>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white/90 mb-1">Security Features:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• End-to-end encrypted SMS transmission</li>
                    <li>• Rate limiting protection (5 requests/minute)</li>
                    <li>• Automatic phone number validation</li>
                    <li>• Real-time delivery confirmation</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.form>
        )}

        {step === 2 && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-400/20 border-t-blue-400 rounded-full mx-auto mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-2">Processing Registration</h3>
            <p className="text-white/70 mb-4">Connecting to SMS gateway...</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-white/50">
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>Est. time: 3-5 seconds</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">SMS Sent Successfully!</h3>
            <p className="text-white/70 mb-4">Verification code sent to {phoneNumber}</p>
            <div className="bg-green-500/20 border border-green-400/20 rounded-xl p-4 text-green-200 text-sm">
              Please check your phone for the verification code
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Messages */}
      <AnimatePresence>
        {status && step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-6 p-4 rounded-xl text-sm flex items-start space-x-3 ${
              status.includes('success') || status.includes('sent')
                ? 'bg-green-500/20 border border-green-400/20 text-green-200'
                : 'bg-red-500/20 border border-red-400/20 text-red-200'
            }`}
          >
            {status.includes('success') || status.includes('sent') ? (
              <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <span>{status}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Registration 