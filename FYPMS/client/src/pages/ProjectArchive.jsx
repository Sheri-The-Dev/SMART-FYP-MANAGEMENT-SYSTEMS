import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/layout/Header';
import Loading from '../components/common/Loading';
import { useToast } from '../components/common/Toast';
import SearchFilters from '../components/projects/SearchFilters';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectDetailModal from '../components/projects/ProjectDetailModal';
import { searchProjects, getProjectDetails } from '../services/projectService';

const ProjectArchive = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 0
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-load all projects on component mount (like AdminProjectManagement)
  useEffect(() => {
    handleLoadAll();
  }, []);

  // Handle load all projects
  const handleLoadAll = async (page = 1) => {
    setLoading(true);
    setHasSearched(true);
    try {
      // Empty filters object to load all projects
      const response = await searchProjects({
        page,
        limit: pagination.limit
      });

      // Handle the response structure correctly
      const projectsData = response.projects || [];
      const paginationData = response.pagination || {
        total: 0,
        page: 1,
        limit: pagination.limit,
        totalPages: 0
      };

      setProjects(projectsData);
      setPagination(paginationData);
      setCurrentFilters({});

      if (projectsData.length === 0) {
        showToast('No projects available in the archive', 'info');
      } else {
        showToast(`Loaded ${paginationData.total} project${paginationData.total !== 1 ? 's' : ''}`, 'success');
      }
    } catch (error) {
      console.error('Load all projects error:', error);
      showToast(error.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (filters, page = 1) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await searchProjects({
        ...filters,
        page,
        limit: pagination.limit
      });

      // Handle the response structure correctly
      const projectsData = response.projects || [];
      const paginationData = response.pagination || {
        total: 0,
        page: 1,
        limit: pagination.limit,
        totalPages: 0
      };

      setProjects(projectsData);
      setPagination(paginationData);
      setCurrentFilters(filters);

      if (projectsData.length === 0) {
        showToast('No projects found matching your criteria', 'info');
      }
    } catch (error) {
      console.error('Search projects error:', error);
      showToast(error.message || 'Failed to search projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = async (project) => {
    try {
      const response = await getProjectDetails(project.id);
      setSelectedProject(response);
      setShowDetailModal(true);
    } catch (error) {
      showToast(error.message || 'Failed to load project details', 'error');
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (currentFilters !== null) {
      // Check if it's a "load all" scenario (empty filters object)
      if (Object.keys(currentFilters).length === 0) {
        handleLoadAll(newPage);
      } else {
        handleSearch(currentFilters, newPage);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle reset
  const handleReset = () => {
    setProjects([]);
    setPagination({
      total: 0,
      page: 1,
      limit: 9,
      totalPages: 0
    });
    setCurrentFilters(null);
    setHasSearched(false);
    // Reload all projects after reset
    handleLoadAll();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-[#193869] to-[#234e92] rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#193869]">
                Project Archive
              </h1>
              <p className="text-gray-600 mt-1">
                Search and explore completed Final Year Projects
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Filters */}
        <SearchFilters 
          onSearch={handleSearch} 
          onReset={handleReset}
        />

        {/* Results Section */}
        {loading ? (
          <Loading text="Loading projects..." />
        ) : hasSearched ? (
          <>
            {/* Results Header */}
            {projects.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">
                    Found <span className="font-semibold text-[#193869]">{pagination.total}</span> project{pagination.total !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                </div>
              </div>
            )}

            {/* Projects Grid */}
            {projects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ProjectCard
                        project={project}
                        onViewDetails={handleViewDetails}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </motion.button>

                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      const isCurrentPage = pageNum === pagination.page;
                      
                      // Show only nearby pages
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                      ) {
                        return (
                          <motion.button
                            key={pageNum}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              isCurrentPage
                                ? 'bg-gradient-to-r from-[#193869] to-[#234e92] text-white shadow-lg'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </motion.button>
                        );
                      } else if (
                        pageNum === pagination.page - 3 ||
                        pageNum === pagination.page + 3
                      ) {
                        return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </motion.button>
                  </div>
                )}
              </>
            ) : (
              /* No Results */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <AlertCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Projects Found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search criteria or filters
                </p>
              </motion.div>
            )}
          </>
        ) : (
          /* Initial State - Should not normally show since auto-load happens on mount */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full mb-4">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Loading Projects...
            </h3>
            <p className="text-gray-500 mb-4">
              Please wait while we fetch all archived projects
            </p>
          </motion.div>
        )}
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
};

export default ProjectArchive;