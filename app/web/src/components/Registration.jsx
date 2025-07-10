import React, { useState } from 'react'
import axios from 'axios'

function Registration() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('')
    try {
      const response = await axios.post('/api/register', { phoneNumber })
      setStatus(response.data.message || 'Registration successful!')
      setPhoneNumber('')
    } catch (error) {
      setStatus(error.response?.data?.error || 'Failed to register. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-300">Single Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Register & Send OTP'}
        </button>
      </form>
      {status && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${status.includes('success') ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'} animate-fade-in`}>
          {status}
        </div>
      )}
    </div>
  )
}

export default Registration 