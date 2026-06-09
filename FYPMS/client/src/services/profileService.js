import api from './api';

// ============================================
// GET CURRENT USER PROFILE
// ============================================
export const getMyProfile = async () => {
  try {
    const response = await api.get('/profile');
    console.log('✅ Profile fetched successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch profile:', error);
    throw error;
  }
};

// ============================================
// UPDATE PROFILE
// ============================================
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/profile', profileData);
    console.log('✅ Profile updated successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    throw error;
  }
};

// ============================================
// UPLOAD PROFILE PICTURE
// ============================================
export const uploadProfilePicture = async (file) => {
  try {
    console.log('📤 Uploading profile picture:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    });

    const formData = new FormData();
    formData.append('profile_picture', file);

    const response = await api.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Profile picture uploaded successfully:', response.data);
    return response;
  } catch (error) {
    console.error('❌ Failed to upload profile picture:', error);
    throw error;
  }
};

// ============================================
// DELETE PROFILE PICTURE
// ============================================
export const deleteProfilePicture = async () => {
  try {
    console.log('🗑️ Deleting profile picture...');
    const response = await api.delete('/profile/picture');
    console.log('✅ Profile picture deleted successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to delete profile picture:', error);
    throw error;
  }
};

// ============================================
// CHECK IF USER EXISTS (SAP ID OR EMAIL)
// Used for runtime validation in proposal forms
// ============================================
export const checkUserExists = async ({ sap_id, email, exclude_proposal_id }) => {
  try {
    const params = new URLSearchParams();
    if (sap_id) params.append('sap_id', sap_id);
    if (email) params.append('email', email);
    if (exclude_proposal_id) params.append('exclude_proposal_id', String(exclude_proposal_id));
    const query = params.toString();
    const response = await api.get(`/profile/lookup-user${query ? `?${query}` : ''}`);
    return response.data || response;
  } catch (error) {
    console.error('❌ Failed to check user existence:', error);
    throw error;
  }
};

// ============================================
// CRITICAL FIX: GET PROFILE PICTURE URL
// This function constructs the full URL for accessing profile pictures
// ============================================
export const getProfilePictureUrl = (filename) => {
  if (!filename) {
    console.warn('⚠️ No filename provided');
    return null;
  }

  // Option 1: Use proxy (relative URL)
  if (import.meta.env.DEV) {
    // In development, use proxy
    return `/uploads/${filename}`;
  }
  
  // Option 2: Use full URL (production or if VITE_API_URL is set)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');
  return `${baseUrl}/uploads/${filename}`;
};

// ============================================
// HELPER: VALIDATE IMAGE FILE
// Client-side validation before upload
// ============================================
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP image.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'File size too large. Maximum size is 5MB.' 
    };
  }

  return { valid: true };
};

// ============================================
// HELPER: CREATE IMAGE PREVIEW
// Creates a base64 preview of the image
// ============================================
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      resolve(reader.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};
