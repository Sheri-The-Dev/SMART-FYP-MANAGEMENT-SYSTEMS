import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  User, 
  Award, 
  Tag, 
  BookOpen,
  Users,
  Code,
  FileText
} from 'lucide-react';

const ProjectDetailModal = ({ project, isOpen, onClose }) => {
  if (!project) return null;

  const keywords = project.keywords 
    ? project.keywords.split(',').map(k => k.trim())
    : [];

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 relative">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <h2 className="text-2xl font-bold text-white pr-12 mb-3">
                  {project.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{project.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{project.department}</span>
                  </div>
                  {project.final_grade && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Award className="w-4 h-4" />
                      <span className="font-medium">{project.final_grade}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Supervisor */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-[#193869] font-semibold mb-2">
                    <User className="w-5 h-5 text-[#d29538]" />
                    <h3>Supervisor</h3>
                  </div>
                  <p className="text-gray-700 ml-7">{project.supervisor_name}</p>
                </div>

                {/* Students */}
                {project.student_names && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-2">
                      <Users className="w-5 h-5 text-[#d29538]" />
                      <h3>Students</h3>
                    </div>
                    <p className="text-gray-700 ml-7">{project.student_names}</p>
                  </div>
                )}

                {/* Technology */}
                {project.technology_type && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-2">
                      <Code className="w-5 h-5 text-[#d29538]" />
                      <h3>Technology Type</h3>
                    </div>
                    <p className="text-gray-700 ml-7">{project.technology_type}</p>
                  </div>
                )}

                {/* Abstract */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-[#193869] font-semibold mb-2">
                    <FileText className="w-5 h-5 text-[#d29538]" />
                    <h3>Abstract</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed ml-7 text-justify">
                    {project.abstract}
                  </p>
                </div>

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                      <Tag className="w-5 h-5 text-[#d29538]" />
                      <h3>Keywords</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-7">
                      {keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Archived on: {new Date(project.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectDetailModal;
