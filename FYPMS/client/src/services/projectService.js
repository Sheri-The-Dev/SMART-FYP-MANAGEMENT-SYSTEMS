import api from './api';

// ============================================
// SEARCH PROJECTS (All Roles)
// ============================================
export const searchProjects = async (filters) => {
  try {
    const params = new URLSearchParams();
    
    // Only add parameters if they have values
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.supervisor) params.append('supervisor', filters.supervisor);
    if (filters.year) params.append('year', filters.year);
    if (filters.department) params.append('department', filters.department);
    if (filters.technology) params.append('technology', filters.technology);
    if (filters.grade) params.append('grade', filters.grade);
    if (filters.operator) params.append('operator', filters.operator);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    
    // Always include pagination parameters
    params.append('page', filters.page || 1);
    params.append('limit', filters.limit || 10);

    const response = await api.get(`/projects/search?${params.toString()}`);
    
    // API interceptor returns response.data which is { success, data: { projects, pagination } }
    // So we need to return response.data (which contains projects and pagination)
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search projects' };
  }
};

// ============================================
// GET PROJECT DETAILS (All Roles)
// ============================================
export const getProjectDetails = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    // API interceptor returns response.data which is { success, data: projectObject }
    // So we need to return response.data (the actual project object)
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get project details' };
  }
};

// ============================================
// GET FILTER OPTIONS (All Roles)
// ============================================
export const getFilterOptions = async () => {
  try {
    const response = await api.get('/projects/filters/options');
    // API interceptor returns response.data which is { success, data: { years, departments, ... } }
    // So we need to return response (which contains data property)
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get filter options' };
  }
};

// ============================================
// ADMIN: CREATE PROJECT
// ============================================
export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create project' };
  }
};

// ============================================
// ADMIN: UPDATE PROJECT
// ============================================
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.put(`/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update project' };
  }
};

// ============================================
// ADMIN: DELETE PROJECT
// ============================================
export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete project' };
  }
};

// ============================================
// ADMIN: BULK IMPORT PROJECTS
// ============================================
export const bulkImportProjects = async (projects) => {
  try {
    // API interceptor returns response.data which is { success, message, data }
    // Then we return response.data to get just the 'data' property
    // This makes it consistent with other service methods
    const response = await api.post('/projects/bulk-import', { projects });
    return response; // Return full response to access both success flag and data
  } catch (error) {
    throw error;
  }
};

// ============================================
// ADMIN: GET PROJECT STATISTICS
// ============================================
export const getProjectStats = async () => {
  try {
    const response = await api.get('/projects/stats/overview');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get project statistics' };
  }
};

// ============================================
// HELPER: Parse CSV File
// ============================================
export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        
        if (!text || text.trim().length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file must have at least a header row and one data row'));
          return;
        }

        // Helper function to properly parse CSV line with quoted fields
        const parseCSVLine = (line) => {
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
              } else {
                // Toggle quote state
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // End of field
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          
          // Add last field
          values.push(current.trim());
          
          return values;
        };

        // Parse header
        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        
        // Required fields
        const requiredFields = ['title', 'year', 'abstract', 'department', 'supervisor_name'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          reject(new Error(`Missing required columns: ${missingFields.join(', ')}`));
          return;
        }

        // Parse data rows
        const projects = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          // Skip empty rows
          if (values.every(v => !v)) {
            continue;
          }
          
          if (values.length !== headers.length) {
            console.warn(`Row ${i + 1} has mismatched columns (expected ${headers.length}, got ${values.length}). Skipping.`);
            continue;
          }

          const project = {};
          headers.forEach((header, index) => {
            // Remove surrounding quotes and trim
            let value = values[index].replace(/^"|"$/g, '').trim();
            project[header] = value || null;
          });

          // Map to correct field names and clean data
          projects.push({
            title: project.title || '',
            year: project.year || '',
            abstract: project.abstract || '',
            department: project.department || '',
            supervisor_name: project.supervisor_name || '',
            supervisor_id: project.supervisor_id && project.supervisor_id !== '' ? project.supervisor_id : null,
            technology_type: project.technology_type || project.technology || null,
            final_grade: project.final_grade || project.grade || null,
            keywords: project.keywords || null,
            student_names: project.student_names || project.students || null
          });
        }

        if (projects.length === 0) {
          reject(new Error('No valid project rows found in CSV file. Please check your file format.'));
          return;
        }

        console.log(`Successfully parsed ${projects.length} projects from CSV`);
        resolve(projects);
      } catch (error) {
        console.error('CSV parsing error:', error);
        reject(new Error('Failed to parse CSV file: ' + error.message));
      }
    };

    reader.onerror = () => {
      console.error('File reading error');
      reject(new Error('Failed to read file. Please try again.'));
    };
    
    reader.readAsText(file, 'UTF-8'); // Explicitly specify UTF-8 encoding
  });
};

// ============================================
// HELPER: Parse Excel File
// ============================================
export const parseExcelFile = async (file) => {
  // This would require a library like xlsx
  // For now, return a promise that guides the user
  return new Promise((resolve, reject) => {
    reject(new Error('Excel parsing requires additional library. Please use CSV format or convert Excel to CSV first.'));
  });
};

// ============================================
// HELPER: Validate Project Data
// ============================================
export const validateProjectData = (project) => {
  const errors = [];

  if (!project.title || project.title.length < 5) {
    errors.push('Title must be at least 5 characters');
  }

  if (!project.year || !/^\d{4}$/.test(project.year)) {
    errors.push('Year must be a valid 4-digit number');
  }

  if (!project.abstract || project.abstract.length < 50) {
    errors.push('Abstract must be at least 50 characters');
  }

  if (!project.department) {
    errors.push('Department is required');
  }

  if (!project.supervisor_name) {
    errors.push('Supervisor name is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};