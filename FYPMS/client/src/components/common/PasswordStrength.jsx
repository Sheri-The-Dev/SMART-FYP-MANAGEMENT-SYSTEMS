import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const PasswordStrength = ({ password }) => {
  if (!password) return null;

  // Calculate password strength
  const calculateStrength = () => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    // Calculate score
    if (checks.length) strength += 20;
    if (password.length >= 12) strength += 10;
    if (checks.uppercase) strength += 20;
    if (checks.lowercase) strength += 20;
    if (checks.number) strength += 15;
    if (checks.special) strength += 15;

    return { strength: Math.min(strength, 100), checks };
  };

  const { strength, checks } = calculateStrength();

  // Determine strength label and color
  const getStrengthInfo = () => {
    if (strength < 40) return { label: 'Weak', color: '#ef4444', bgColor: 'bg-red-500' };
    if (strength < 60) return { label: 'Fair', color: '#f59e0b', bgColor: 'bg-yellow-500' };
    if (strength < 80) return { label: 'Good', color: '#3b82f6', bgColor: 'bg-blue-500' };
    return { label: 'Strong', color: '#10b981', bgColor: 'bg-green-500' };
  };

  const { label, color, bgColor } = getStrengthInfo();

  const requirements = [
    { key: 'length', label: 'At least 8 characters', met: checks.length },
    { key: 'uppercase', label: 'One uppercase letter', met: checks.uppercase },
    { key: 'lowercase', label: 'One lowercase letter', met: checks.lowercase },
    { key: 'number', label: 'One number', met: checks.number },
    { key: 'special', label: 'One special character', met: checks.special }
  ];

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">Password Strength:</span>
          <span className="text-xs font-bold" style={{ color }}>
            {label}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${bgColor} rounded-full`}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">Requirements:</p>
        {requirements.map((req) => (
          <motion.div
            key={req.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            {req.met ? (
              <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
            ) : (
              <XCircle size={14} className="text-gray-400 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${
                req.met ? 'text-green-700 font-medium' : 'text-gray-600'
              }`}
            >
              {req.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;