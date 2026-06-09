import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Download,
  RefreshCw,
  X,
  Calendar,
  Building,
  User,
  Award,
  TrendingUp,
  Database
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import ProjectUploadModal from '../../components/projects/ProjectUploadModal';
import BulkImportModal from '../../components/projects/BulkImportModal';
import ProjectDetailModal from '../../components/projects/ProjectDetailModal';
import { 
  searchProjects, 
  deleteProject, 
  getProjectDetails,
  getProjectStats 
} from '../../services/projectService';

const AdminProjectManagement = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteModalProject, setDeleteModalProject] = useState(null);

  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selection state
  const [selectedProjects, setSelectedProjects] = useState([]);

  useEffect(() => {
    const initializePage = async () => {
      setInitialLoading(true);
      try {
        await fetchStats();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    initializePage();
  }, []);

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const filters = {
        keyword: searchKeyword || undefined,
        year: filterYear || undefined,
        department: filterDepartment || undefined,
        page,
        limit: pagination.limit,
        sortBy: 'year'
      };

      const response = await searchProjects(filters);
      setProjects(response.projects || []);
      setPagination(response.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
      setHasSearched(true);
    } catch (error) {
      console.error('Fetch projects error:', error);
      showToast(error.message || 'Failed to load projects', 'error');
      setProjects([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getProjectStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        total: 0,
        byYear: [],
        byDepartment: [],
        byTechnology: [],
        topSupervisors: []
      });
    }
  };

  const handleSearch = () => {
    if (!searchKeyword && !filterYear && !filterDepartment) {
      showToast('Please enter search criteria or use filters', 'info');
      return;
    }
    fetchProjects(1);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setFilterYear('');
    setFilterDepartment('');
    setProjects([]);
    setHasSearched(false);
    setShowFilters(false);
  };

  const handleLoadAll = () => {
    setSearchKeyword('');
    setFilterYear('');
    setFilterDepartment('');
    fetchProjects(1);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setShowUploadModal(true);
  };

  // ============================================
  // CRITICAL FIX: Fetch full project details before editing
  // ============================================
  const handleEditProject = async (project) => {
    try {
      // Show loading state
      showToast('Loading project details...', 'info');
      
      // Fetch complete project data including full abstract
      const response = await getProjectDetails(project.id);
      
      // Set the complete project data for editing
      setEditingProject(response);
      setShowUploadModal(true);
      
      console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Full project data loaded for editing:', response);
    } catch (error) {
      console.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Failed to load project for editing:', error);
      showToast(error.message || 'Failed to load project details', 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteModalProject) return;

    try {
      await deleteProject(deleteModalProject.id);
      showToast('Project deleted successfully', 'success');
      setDeleteModalProject(null);
      fetchProjects(pagination.page);
      fetchStats();
    } catch (error) {
      showToast(error.message || 'Failed to delete project', 'error');
    }
  };

  // Checkbox selection handlers
  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) return;

    try {
      // Delete all selected projects
      await Promise.all(selectedProjects.map(id => deleteProject(id)));
      showToast(`${selectedProjects.length} project(s) deleted successfully`, 'success');
      setSelectedProjects([]);
      setDeleteModalProject(null);
      fetchProjects(pagination.page);
      fetchStats();
    } catch (error) {
      showToast(error.message || 'Failed to delete projects', 'error');
    }
  };

  const isProjectSelected = (projectId) => selectedProjects.includes(projectId);

  const handleViewDetails = async (project) => {
    try {
      const response = await getProjectDetails(project.id);
      setSelectedProject(response);
      setShowDetailModal(true);
    } catch (error) {
      showToast(error.message || 'Failed to load project details', 'error');
    }
  };

  const handleModalSuccess = () => {
    // ============================================
    // FIXED: Always refresh projects and stats after modal success
    // If user hasn't searched yet, trigger a search to load all projects
    // ============================================
    console.log('✅ Modal success - refreshing data...');
    
    // If user has already done a search, refresh that search
    if (hasSearched) {
      fetchProjects(pagination.page || 1);
    } else {
      // If no search done yet, load all projects to show the newly added ones
      setHasSearched(true);
      fetchProjects(1);
    }
    
    // Always refresh stats
    fetchStats();
  };

  const handlePageChange = (newPage) => {
    fetchProjects(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Loading text="Loading project management..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== PAGE HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r text-[#000] bg-clip-text mb-2">
                Project Management
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Database size={16} />
                Add, edit, and manage archived Final Year Projects
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                icon={<Upload size={20} />}
                onClick={() => setShowBulkImportModal(true)}
                className="border-[#193869] text-[#193869] hover:bg-[#193869] hover:text-white transition-all"
              >
                Bulk Import
              </Button>
              <Button
                variant="primary"
                icon={<Plus size={20} />}
                onClick={handleAddProject}
                className="bg-gradient-to-r from-[#193869] to-[#234e92] hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Add Project
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ==================== STATISTICS CARDS ==================== */}
        {stats && stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Total Projects */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gradient-to-br from-[#193869] to-[#234e92] rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-blue-100 text-sm font-medium">Total Projects</p>
                  <Database className="w-8 h-8 text-blue-200 opacity-80" />
                </div>
                <p className="text-5xl font-bold mb-1">{stats.total}</p>
                <p className="text-blue-200 text-xs flex items-center gap-1">
                  <TrendingUp size={12} />
                  In archive
                </p>
              </div>
            </motion.div>

            {/* Departments */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-[#d29538] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm font-medium">Departments</p>
                <Building className="w-8 h-8 text-[#d29538]" />
              </div>
              <p className="text-5xl font-bold text-gray-800 mb-1">
                {stats.byDepartment?.length || 0}
              </p>
              <p className="text-gray-500 text-xs">Active departments</p>
            </motion.div>

            {/* Latest Year */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-[#234e92] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm font-medium">Latest Year</p>
                <Calendar className="w-8 h-8 text-[#234e92]" />
              </div>
              <p className="text-5xl font-bold text-gray-800 mb-1">
                {stats.byYear?.[0]?.year || 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">
                {stats.byYear?.[0]?.count || 0} projects
              </p>
            </motion.div>

            {/* Top Supervisor */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-gradient-to-br from-[#d29538] to-[#e0a84a] rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-yellow-100 text-sm font-medium">Top Supervisor</p>
                  <Award className="w-8 h-8 text-yellow-100" />
                </div>
                <p className="text-xl font-bold mb-1 truncate">
                  {stats.topSupervisors?.[0]?.supervisor_name || 'N/A'}
                </p>
                <p className="text-yellow-100 text-xs">
                  {stats.topSupervisors?.[0]?.count || 0} projects supervised
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ==================== SEARCH AND FILTERS ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title, keywords, students, or supervisor..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:border-transparent transition-all"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              icon={<Filter size={18} />}
              className={`border-2 transition-all ${
                showFilters 
                  ? 'border-[#193869] bg-[#193869] text-white' 
                  : 'border-gray-200 hover:border-[#193869]'
              }`}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t-2 border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Year Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar size={16} />
                        Year
                      </label>
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:border-transparent transition-all"
                      >
                        <option value="">All Years</option>
                        {stats?.byYear?.map(year => (
                          <option key={year.year} value={year.year}>
                            {year.year} ({year.count} projects)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Department Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Building size={16} />
                        Department
                      </label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:border-transparent transition-all"
                      >
                        <option value="">All Departments</option>
                        {stats?.byDepartment?.map(dept => (
                          <option key={dept.department} value={dept.department}>
                            {dept.department} ({dept.count} projects)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSearch} 
              icon={<Search size={18} />}
              className="bg-gradient-to-r from-[#193869] to-[#234e92] hover:shadow-lg"
            >
              Search Projects
            </Button>
            <Button 
              onClick={handleLoadAll} 
              variant="outline"
              icon={<RefreshCw size={18} />}
              className="border-[#234e92] text-[#234e92] hover:bg-[#234e92] hover:text-white"
            >
              Load All Projects
            </Button>
            {(searchKeyword || filterYear || filterDepartment) && (
              <Button 
                onClick={handleReset} 
                variant="outline"
                icon={<X size={18} />}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>

        {/* ==================== PROJECTS TABLE ==================== */}
        {loading ? (
          <Loading text="Searching projects..." />
        ) : hasSearched && projects.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
            >
              {/* Table Header */}
              <div className="bg-gradient-to-r from-[#193869] to-[#234e92] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database size={20} />
                  Projects ({pagination.total} total)
                </h2>
                {selectedProjects.length > 0 && (
                  <Button
                    variant="danger"
                    onClick={() => setDeleteModalProject({ bulk: true })}
                    icon={<Trash2 size={18} />}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete Selected ({selectedProjects.length})
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedProjects.length === projects.length && projects.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#193869] border-gray-300 rounded focus:ring-[#193869] cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Year</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Supervisor</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map((project, index) => (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-blue-50 transition-colors ${
                          isProjectSelected(project.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isProjectSelected(project.id)}
                            onChange={() => handleSelectProject(project.id)}
                            className="w-4 h-4 text-[#193869] border-gray-300 rounded focus:ring-[#193869] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="font-semibold text-gray-800 truncate">{project.title}</p>
                            <p className="text-sm text-gray-500 mt-1 truncate">{project.abstract_preview}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#234e92] text-white">
                            {project.year}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">{project.department}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">{project.supervisor_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {isProjectSelected(project.id) ? (
                              // Show only delete button when selected
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setDeleteModalProject(project)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </motion.button>
                            ) : (
                              // Show all action buttons when not selected
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleViewDetails(project)}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditProject(project)}
                                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setDeleteModalProject(project)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </motion.button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} projects
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>
                      <div className="flex gap-2">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => {
                          if (
                            pageNum === 1 ||
                            pageNum === pagination.totalPages ||
                            (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-4 py-2 rounded-lg transition-all ${
                                  pageNum === pagination.page
                                    ? 'bg-gradient-to-r from-[#193869] to-[#234e92] text-white shadow-lg'
                                    : 'border-2 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === pagination.page - 2 ||
                            pageNum === pagination.page + 2
                          ) {
                            return <span key={pageNum} className="px-2">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : hasSearched ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Filter className="w-12 h-12 text-gray-400" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No Projects Found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchKeyword || filterYear || filterDepartment
                ? 'No projects match your search criteria. Try adjusting your filters or search terms.'
                : 'Search for projects or load all projects to get started.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleAddProject} 
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-[#193869] to-[#234e92]"
              >
                Add First Project
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkImportModal(true)}
                icon={<Upload size={18} />}
                className="border-[#193869] text-[#193869] hover:bg-[#193869] hover:text-white"
              >
                Bulk Import
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#193869] to-[#234e92] rounded-2xl shadow-2xl p-12 text-center text-white"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Search className="w-12 h-12 text-white" />
            </motion.div>
            <h3 className="text-3xl font-bold mb-4">Ready to Search?</h3>
            <p className="text-blue-100 mb-8 max-w-md mx-auto text-lg">
              Use the search bar above to find projects, or load all projects to browse the complete archive.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleLoadAll}
                variant="outline"
                icon={<Database size={20} />}
                className="bg-white text-[#193869] hover:bg-gray-100 hover:text-[#000000] border-0 px-8 py-3 text-lg font-semibold"
              >
                Load All Projects
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      {/* ==================== MODALS ==================== */}
      <ProjectUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setEditingProject(null);
        }}
        onSuccess={handleModalSuccess}
        editProject={editingProject}
      />

      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={handleModalSuccess}
      />

      <ProjectDetailModal
        project={selectedProject}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProject(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalProject}
        onClose={() => setDeleteModalProject(null)}
        title={deleteModalProject?.bulk ? "Delete Selected Projects" : "Delete Project"}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">Ã¢Å¡Â Ã¯Â¸Â Warning: This action cannot be undone!</p>
            <p className="text-red-700 text-sm">
              {deleteModalProject?.bulk ? (
                <>
                  You are about to delete <strong>{selectedProjects.length} project(s)</strong>. All associated data will be permanently removed.
                </>
              ) : (
                <>
                  You are about to delete project <strong>{deleteModalProject?.title}</strong>. All associated data will be permanently removed.
                </>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="danger"
              fullWidth
              onClick={deleteModalProject?.bulk ? handleBulkDelete : handleDeleteProject}
            >
              {deleteModalProject?.bulk ? `Delete ${selectedProjects.length} Projects` : "Delete Project"}
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setDeleteModalProject(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProjectManagement;