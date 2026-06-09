import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Calendar,
  Building2,
  User,
  Code,
  Award
} from 'lucide-react';
import { getFilterOptions } from '../../services/projectService';
import { useToast } from '../common/Toast';

const SearchFilters = ({ onSearch, onReset }) => {
  const { showToast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    departments: [],
    technologies: [],
    grades: []
  });

  const [filters, setFilters] = useState({
    keyword: '',
    supervisor: '',
    year: '',
    department: '',
    technology: '',
    grade: '',
    operator: 'AND',
    sortBy: 'relevance'
  });

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const response = await getFilterOptions();
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    // Check if at least one filter is set
    const hasFilters = Object.entries(filters).some(([key, value]) => {
      return key !== 'operator' && key !== 'sortBy' && value !== '';
    });

    if (!hasFilters) {
      showToast('Please enter at least one search criteria', 'warning');
      return;
    }

    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      keyword: '',
      supervisor: '',
      year: '',
      department: '',
      technology: '',
      grade: '',
      operator: 'AND',
      sortBy: 'relevance'
    };
    setFilters(resetFilters);
    onReset();
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    return key !== 'operator' && key !== 'sortBy' && value !== '';
  }).length;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      {/* Basic Search */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by keyword (title, abstract, keywords, students)..."
            value={filters.keyword}
            onChange={(e) => handleInputChange('keyword', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent transition-all"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSearch}
          className="px-6 py-3 bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Search
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-6 py-3 bg-white border-2 border-[#193869] text-[#193869] rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Search</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#d29538] text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Supervisor */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-[#d29538]" />
                    Supervisor Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter supervisor name..."
                    value={filters.supervisor}
                    onChange={(e) => handleInputChange('supervisor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-[#d29538]" />
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                  >
                    <option value="">All Years</option>
                    {filterOptions.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 text-[#d29538]" />
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    {filterOptions.departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Technology */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Code className="w-4 h-4 text-[#d29538]" />
                    Technology
                  </label>
                  <select
                    value={filters.technology}
                    onChange={(e) => handleInputChange('technology', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                  >
                    <option value="">All Technologies</option>
                    {filterOptions.technologies.map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Award className="w-4 h-4 text-[#d29538]" />
                    Grade
                  </label>
                  <select
                    value={filters.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                  >
                    <option value="">All Grades</option>
                    {filterOptions.grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleInputChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="year">Year (Newest First)</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Operator Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filter Logic
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="operator"
                      value="AND"
                      checked={filters.operator === 'AND'}
                      onChange={(e) => handleInputChange('operator', e.target.value)}
                      className="text-[#193869] focus:ring-[#193869]"
                    />
                    <span className="text-sm text-gray-700">
                      AND (Match all criteria)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="operator"
                      value="OR"
                      checked={filters.operator === 'OR'}
                      onChange={(e) => handleInputChange('operator', e.target.value)}
                      className="text-[#193869] focus:ring-[#193869]"
                    />
                    <span className="text-sm text-gray-700">
                      OR (Match any criteria)
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Apply Filters
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset All
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilters;