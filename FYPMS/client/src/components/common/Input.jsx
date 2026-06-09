import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  required = false,
  icon = null,
  className = '',
  textarea = false,
  rows = 4
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const inputProps = {
    id: name,
    name: name,
    value: value,
    onChange: onChange,
    onBlur: (e) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    },
    onFocus: () => setIsFocused(true),
    placeholder: placeholder,
    disabled: disabled,
    required: required,
    className: `
      w-full px-4 py-3 rounded-lg border transition-all duration-200
      ${icon ? 'pl-10' : ''}
      ${isPassword ? 'pr-12' : ''}
      ${error 
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-[#193869] focus:border-[#193869]'
      }
      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
      focus:outline-none focus:ring-2
    `,
    animate: {
      scale: isFocused ? 1.01 : 1
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        {textarea ? (
          <motion.textarea {...inputProps} rows={rows} />
        ) : (
          <motion.input {...inputProps} type={inputType} />
        )}
        
        {isPassword && !textarea && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Input;