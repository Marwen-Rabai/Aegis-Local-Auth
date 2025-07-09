import React, { useState } from 'react';
import axios from 'axios';

const Registration = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleRegister = async () => {
    try {
      setMessage('Sending OTP...');
      const response = await axios.post('/api/register', { phoneNumber });
      setMessage(response.data.message);
      if (response.status === 200) {
        setIsOtpSent(true);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred during registration.');
    }
  };

  const handleVerify = async () => {
    try {
      setMessage('Verifying OTP...');
      const response = await axios.post('/api/verify', { phoneNumber, otp });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred during verification.');
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Single Registration</h2>
      {!isOtpSent ? (
        <div className="space-y-4">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., +1234567890)"
            className="w-full p-2 bg-gray-700 rounded"
          />
          <button
            onClick={handleRegister}
            className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded font-bold"
          >
            Send OTP
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-green-400">OTP sent to {phoneNumber}</p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full p-2 bg-gray-700 rounded"
          />
          <button
            onClick={handleVerify}
            className="w-full p-2 bg-green-600 hover:bg-green-700 rounded font-bold"
          >
            Verify OTP
          </button>
        </div>
      )}
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
};

export default Registration; 