import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Building, Lock, RefreshCw, MinusCircle, X, AlertTriangle, Save } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../common/Toast';
import { updateUser, resetSupervisorWorkload, decrementSupervisorWorkload } from '../../services/adminService';
import { validatePassword, isValidEmail } from '../../utils/validation';
import { ROLES, DEPARTMENTS } from '../../utils/constants';

const EditUserModal = ({ isOpen, onClose, onSuccess, user }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'Student',
    department: '',
    max_supervisees: 5,
    password: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'Student',
        department: user.department || '',
        max_supervisees: user.max_supervisees || 5,
        password: '',
        is_active: user.is_active === 1 || user.is_active === true
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // No hard requirement for department; it can be set for any role

    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      if (formData.department) {
        userData.department = formData.department;
      }

      if (formData.role === ROLES.TEACHER) {
        userData.max_supervisees = formData.max_supervisees;
      }

      const response = await updateUser(user.id, userData);
      
      if (response.success) {
        toast.success('User updated successfully!');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWorkload = async () => {
    setShowResetConfirm(false); // Close confirmation modal
    setLoading(true);
    try {
      const response = await resetSupervisorWorkload(user.id);
      if (response.success) {
        toast.success('Workload reset successfully');
        if (onSuccess) onSuccess(); // Refresh parent data
      }
    } catch (error) {
      toast.error('Failed to reset workload');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrementWorkload = async () => {
    setLoading(true);
    try {
      const response = await decrementSupervisorWorkload(user.id);
      if (response.success) {
        toast.success('Workload decremented successfully');
        if (onSuccess) onSuccess(); // Refresh parent data
      }
    } catch (error) {
      toast.error('Failed to decrement workload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Main Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 relative flex-shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit User Profile</h2>
                    <p className="text-blue-100 text-sm mt-1">Update user information and settings</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {/* Dummy inputs to prevent autofill */}
                <div style={{ position: 'absolute', opacity: 0, zIndex: -1, height: 0, overflow: 'hidden' }}>
                  <input type="text" name="dummy_username_prevent_autofill" tabIndex="-1" autoComplete="off" />
                  <input type="password" name="dummy_password_prevent_autofill" tabIndex="-1" autoComplete="off" />
                </div>

                <div className="space-y-6">
                  {/* Basic Info Section */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Account Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Username"
                        value={formData.username}
                        disabled
                        icon={<User size={20} />}
                        className="bg-gray-100"
                      />
                      <Input
                        label="Email Address"
                        value={formData.email}
                        disabled
                        icon={<Mail size={20} />}
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                        helpText="Email cannot be changed"
                      />
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent bg-white"
                        >
                          {Object.values(ROLES).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Department Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent bg-white"
                        >
                          <option value="">No Department Set / External</option>
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">Security</h3>
                    <Input
                      label="New Password"
                      type="password"
                      name="password"
                      id="edit_user_new_password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      icon={<Lock size={20} />}
                      placeholder="Leave blank to keep current password"
                      autoComplete="new-password"
                      data-lpignore="true"
                    />
                  </div>

                  {/* Teacher Specific Section */}
                  {formData.role === ROLES.TEACHER && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Academic Details</h3>

                        <Input
                          label="Max Supervision Capacity"
                          type="number"
                          name="max_supervisees"
                          value={formData.max_supervisees}
                          onChange={handleChange}
                          min="0"
                          max="20"
                          icon={<User size={20} />}
                        />
                      </div>

                      {/* Workload Management */}
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <RefreshCw size={16} />
                          Workload Management
                        </h4>
                        <p className="text-xs text-amber-700 mb-4">
                          Manually adjust the current number of supervisees. Actions are logged.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDecrementWorkload}
                            disabled={loading}
                            className="bg-white hover:!bg-amber-50 !text-amber-700 hover:!text-amber-700 border-amber-200 hover:border-amber-300"
                            icon={<MinusCircle size={16} />}
                          >
                            Remove One Slot
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResetConfirm(true)}
                            disabled={loading}
                            className="bg-white hover:!bg-red-50 text-red-600 hover:!text-red-600 border-red-200 hover:border-red-300"
                            icon={<RefreshCw size={16} />}
                          >
                            Reset Workload to 0
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Status Toggle */}
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                     <input
                       type="checkbox"
                       id="is_active"
                       name="is_active"
                       checked={formData.is_active}
                       onChange={handleChange}
                       className="w-5 h-5 text-[#193869] rounded focus:ring-[#193869] cursor-pointer"
                     />
                     <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer select-none flex-1">
                       Account Active Status
                     </label>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  icon={<Save size={18} />}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Reset Confirmation Modal */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowResetConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden"
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reset Workload?</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Are you sure you want to reset this supervisor's workload to 0? 
                    <br/><span className="text-red-500 font-medium">This action cannot be undone.</span>
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={handleResetWorkload}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Yes, Reset It
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default EditUserModal;
