import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { useToast } from '../components/common/Toast';
import { getSecurityQuestions, verifySecurityAnswers, completePasswordReset } from '../services/adminService';
import { validatePassword } from '../utils/validation';
import PasswordStrength from '../components/common/PasswordStrength';

const SecurityChallenge = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [step, setStep] = useState('questions'); // 'questions' or 'password'
  const [userInfo, setUserInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [token]);

  const loadQuestions = async () => {
    if (!token) {
      setTokenValid(false);
      setLoading(false);
      return;
    }

    try {
      const response = await getSecurityQuestions(token);
      if (response.success) {
        setQuestions(response.data.questions);
        setUserInfo({ username: response.data.username });
        setTokenValid(true);
        
        // Initialize answers object
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      setTokenValid(false);
      toast.error('Invalid or expired challenge link');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (errors[`answer_${questionId}`]) {
      setErrors(prev => ({ ...prev, [`answer_${questionId}`]: '' }));
    }
  };

  const handleVerifyAnswers = async () => {
    // Validate all answers are filled
    const newErrors = {};
    questions.forEach(q => {
      if (!answers[q.id]?.trim()) {
        newErrors[`answer_${q.id}`] = 'Answer is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id]
      }));

      const response = await verifySecurityAnswers(token, formattedAnswers);
      
      if (response.success) {
        toast.success('Identity verified! Please set a new password.');
        setStep('password');
      } else {
        toast.error('Incorrect answers. Please try again.');
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    // Validate password
    const newErrors = {};
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.errors[0];
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      await completePasswordReset(token, newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#193869] via-[#234e92] to-[#193869] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Challenge</h2>
            <p className="text-gray-600 mb-6">
              This security challenge link is invalid or has expired. Please contact an administrator for assistance.
            </p>

            <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#193869] via-[#234e92] to-[#193869] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully by the administrator. You can now log in with your new password.
            </p>

            <p className="text-sm text-gray-500 mb-6">Redirecting to login...</p>

            <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#193869] via-[#234e92] to-[#193869] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            {step === 'questions' ? (
              <Shield className="w-10 h-10 text-[#193869]" />
            ) : (
              <Lock className="w-10 h-10 text-[#193869]" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 'questions' ? 'Security Verification' : 'Set New Password'}
          </h1>
          <p className="text-blue-100">
            {step === 'questions' 
              ? `Verify your identity for ${userInfo?.username}`
              : 'Choose a strong password for your account'}
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          {step === 'questions' ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Important:</p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Answer all security questions correctly</li>
                  <li>Answers are case-insensitive</li>
                  <li>You have limited attempts</li>
                </ul>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Input
                      label={`Question ${index + 1}: ${question.question}`}
                      type="text"
                      name={`answer_${question.id}`}
                      value={answers[question.id]}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Enter your answer"
                      error={errors[`answer_${question.id}`]}
                      required
                    />
                  </motion.div>
                ))}

                <Button
                  type="button"
                  onClick={handleVerifyAnswers}
                  variant="primary"
                  fullWidth
                  loading={submitting}
                  icon={<Shield size={20} />}
                >
                  Verify Identity
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 font-medium mb-2">✓ Identity Verified</p>
                <p className="text-sm text-green-700">
                  Please set a new password for your account.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors(prev => ({ ...prev, newPassword: '' }));
                    }}
                    placeholder="Enter new password"
                    error={errors.newPassword}
                    icon={<Lock size={20} />}
                    required
                  />
                  <PasswordStrength password={newPassword} />
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="Confirm new password"
                  error={errors.confirmPassword}
                  icon={<Lock size={20} />}
                  required
                />

                <Button
                  type="button"
                  onClick={handleResetPassword}
                  variant="primary"
                  fullWidth
                  loading={submitting}
                  icon={<Lock size={20} />}
                >
                  Reset Password
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SecurityChallenge;