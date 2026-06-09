import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import PasswordStrength from '../components/common/PasswordStrength';
import { useToast } from '../components/common/Toast';
import { changePassword } from '../services/authService';
import { validatePassword } from '../utils/validation';

const ChangePassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.errors[0];
    }

    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      setSuccess(true);
      toast.success('Password changed successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Changed!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. You can continue using your account with the new password.
            </p>

            <p className="text-sm text-gray-500 mb-6">Redirecting to dashboard...</p>

            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
            <p className="text-gray-600">Update your account password</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium mb-2">🔒 Password Requirements:</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            <div className="space-y-6">
              <Input
                label="Current Password"
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                error={errors.currentPassword}
                icon={<Lock size={20} />}
                required
              />

              <div>
                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  error={errors.newPassword}
                  icon={<Lock size={20} />}
                  required
                />
                <PasswordStrength password={formData.newPassword} />
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                error={errors.confirmPassword}
                icon={<Lock size={20} />}
                required
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Change Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="mt-6 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-xl p-6 text-white">
            <h3 className="font-bold mb-3">Security Tips</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>• Use a unique password for each account</li>
              <li>• Never share your password with anyone</li>
              <li>• Change your password regularly</li>
              <li>• Avoid using personal information in passwords</li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ChangePassword;