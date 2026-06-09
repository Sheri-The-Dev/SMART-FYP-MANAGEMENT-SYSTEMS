import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  User, 
  Award, 
  Tag, 
  ChevronRight,
  BookOpen 
} from 'lucide-react';

const ProjectCard = ({ project, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extract year and format
  const projectYear = project.year || 'N/A';
  
  // Truncate abstract for preview
  const abstractPreview = project.abstract_preview || project.abstract;
  const truncatedAbstract = abstractPreview && abstractPreview.length > 150
    ? abstractPreview.substring(0, 150) + '...'
    : abstractPreview;

  // Parse keywords
  const keywords = project.keywords 
    ? project.keywords.split(',').slice(0, 3).map(k => k.trim())
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg line-clamp-2 mb-2">
              {project.title}
            </h3>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{projectYear}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{project.department}</span>
              </div>
            </div>
          </div>
          {project.final_grade && (
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <div className="flex items-center gap-1 text-white text-sm font-medium">
                <Award className="w-4 h-4" />
                <span>{project.final_grade}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Supervisor */}
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <User className="w-4 h-4 text-[#d29538]" />
          <span className="text-sm">
            <span className="font-medium">Supervisor:</span> {project.supervisor_name}
          </span>
        </div>

        {/* Abstract Preview */}
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {truncatedAbstract}
        </p>

        {/* Technology/Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
              >
                <Tag className="w-3 h-3" />
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* Student Names */}
        {project.student_names && (
          <div className="text-xs text-gray-500 mb-3">
            <span className="font-medium">Students:</span> {project.student_names}
          </div>
        )}

        {/* View Details Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onViewDetails(project)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#193869] to-[#234e92] text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
        >
          <FileText className="w-4 h-4" />
          <span>View Full Details</span>
          <motion.div
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
