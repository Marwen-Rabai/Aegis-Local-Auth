import React, { useState } from 'react'
import axios from 'axios'

function MassRegistration() {
  const [phoneNumbers, setPhoneNumbers] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('')
    setProgress(0)
    try {
      const numbers = phoneNumbers.split('\n').filter(num => num.trim() !== '')
      const response = await axios.post('/api/mass-register', { phoneNumbers: numbers })
      setStatus(response.data.message || 'Mass registration started successfully!')
      // Simulate progress for demo; in real app, this would be updated via WebSocket or polling
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsLoading(false)
            return 100
          }
          return prev + 10
        })
      }, 500)
    } catch (error) {
      setStatus(error.response?.data?.error || 'Failed to start mass registration. Please try again.')
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhoneNumbers(event.target.result)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-300">Mass Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumbers" className="block text-sm font-medium text-gray-300 mb-1">Phone Numbers (one per line)</label>
          <textarea
            id="phoneNumbers"
            value={phoneNumbers}
            onChange={(e) => setPhoneNumbers(e.target.value)}
            placeholder="+1234567890\n+1234567891\n+1234567892"
            rows="6"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            required
            disabled={isLoading}
          ></textarea>
        </div>
        <div>
          <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-300 mb-1">Or Upload File</label>
          <input
            type="file"
            id="fileUpload"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all duration-200"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Start Mass Registration'}
        </button>
      </form>
      {isLoading && (
        <div className="mt-4 w-full bg-white/10 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {status && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${status.includes('success') || status.includes('started') ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'} animate-fade-in`}>
          {status}
        </div>
      )}
    </div>
  )
}

export default MassRegistration 