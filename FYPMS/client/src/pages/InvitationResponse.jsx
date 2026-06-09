import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, ArrowRight } from 'lucide-react';
import api from '../services/api';

const InvitationResponse = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const processingRef = useRef(false);
  
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  useEffect(() => {
    const processInvitation = async () => {
      // Prevent double processing in React StrictMode
      if (processingRef.current) return;
      
      if (!token || !action) {
        setStatus('error');
        setMessage('Invalid invitation link. Please check your email.');
        return;
      }

      processingRef.current = true;

      try {
        console.log(`Processing invitation: token=${token}, action=${action}`);
        const response = await api.get('/proposals/invitation/respond', {
          params: { token, action }
        });

        // The api interceptor returns response.data already
        if (response.success) {
          setStatus('success');
          setMessage(response.message);
        } else {
          setStatus('error');
          setMessage(response.message || 'Failed to process invitation.');
        }
      } catch (error) {
        console.error('Invitation response error:', error);
        setStatus('error');
        // Handle error from api interceptor structure
        setMessage(error.message || 'An unexpected error occurred while processing your response.');
      }
    };

    processInvitation();
  }, [token, action]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-[#193869] animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Processing...</h2>
            <p className="text-gray-600">Please wait while we process your response.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
              <p className="text-lg text-gray-600 font-medium">{message}</p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-[#193869] text-white rounded-xl font-bold hover:bg-[#234e92] transition-all flex items-center justify-center gap-2"
              >
                Go to Login <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Oops!</h2>
              <p className="text-lg text-red-600 font-medium">{message}</p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Home size={20} /> Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-gray-500 text-sm">
        © {new Date().getFullYear()} Final Year Project Management System
      </p>
    </div>
  );
};

export default InvitationResponse;
