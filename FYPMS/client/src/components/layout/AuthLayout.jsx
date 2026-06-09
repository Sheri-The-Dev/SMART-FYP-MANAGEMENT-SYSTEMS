import { motion } from 'framer-motion';

const AuthLayout = ({ children, title, subtitle, icon }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#193869] via-[#234e92] to-[#193869] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {icon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                {icon}
              </div>
            </motion.div>
          )}
          {title && (
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          )}
          {subtitle && (
            <p className="text-blue-100">{subtitle}</p>
          )}
        </div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          {children}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-blue-100 text-sm">
            © 2025 FYP Authentication System. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;