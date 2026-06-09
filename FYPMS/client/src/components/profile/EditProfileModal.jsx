import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Mail, Phone, Building, BookOpen, Award, Clock, Camera, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import { 
  updateProfile, 
  uploadProfilePicture, 
  deleteProfilePicture, 
  getProfilePictureUrl,
  validateImageFile,
  createImagePreview
} from '../../services/profileService';

const EditProfileModal = ({ isOpen, onClose, userData, onUpdate }) => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    research_areas: '',
    expertise: '',
    availability_status: 'Available'
  });

  // ============================================
  // INITIALIZE FORM DATA
  // ============================================
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        department: userData.department || '',
        research_areas: userData.research_areas || '',
        expertise: userData.expertise || '',
        availability_status: userData.availability_status || 'Available'
      });
      
      // Set initial image preview
      if (userData.profile_picture) {
        const imageUrl = getProfilePictureUrl(userData.profile_picture);
        console.log('📷 Setting initial profile picture:', imageUrl);
        setImagePreview(imageUrl);
      } else {
        console.log('ℹ️ No profile picture to display');
        setImagePreview(null);
      }
    }
  }, [userData]);

  // ============================================
  // HANDLE FORM INPUT CHANGES
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ============================================
  // HANDLE IMAGE SELECTION
  // ============================================
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📁 File selected:', file.name);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = ''; // Reset file input
      return;
    }

    // Create preview
    try {
      const preview = await createImagePreview(file);
      setImagePreview(preview);
      console.log('✅ Preview created successfully');
    } catch (error) {
      console.error('❌ Failed to create preview:', error);
      toast.error('Failed to preview image');
      return;
    }

    // Upload image
    await handleImageUpload(file);
  };

  // ============================================
  // CRITICAL FIX: HANDLE IMAGE UPLOAD
  // This function uploads the image and updates the AuthContext
  // ============================================
  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      console.log('📤 Starting upload...');
      const response = await uploadProfilePicture(file);
      
      if (response.success) {
        toast.success('Profile picture updated successfully');
        
        // CRITICAL: Update AuthContext with new profile picture
        // This triggers re-render in Header, Profile, and all components using useAuth()
        updateUser({ 
          profile_picture: response.data.profile_picture 
        });
        
        // Update the local preview URL
        const newImageUrl = getProfilePictureUrl(response.data.profile_picture);
        console.log('✅ Upload complete. New URL:', newImageUrl);
        setImagePreview(newImageUrl);
        
        // Notify parent component to refresh profile data
        onUpdate();
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(error.message || 'Failed to upload profile picture');
      
      // Reset preview on error
      if (userData?.profile_picture) {
        setImagePreview(getProfilePictureUrl(userData.profile_picture));
      } else {
        setImagePreview(null);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  // ============================================
  // CRITICAL FIX: HANDLE IMAGE DELETE
  // ============================================
  const handleImageDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setUploadingImage(true);
    try {
      console.log('🗑️ Deleting profile picture...');
      const response = await deleteProfilePicture();
      
      if (response.success) {
        toast.success('Profile picture removed successfully');
        setImagePreview(null);
        
        // CRITICAL: Update AuthContext to remove profile picture
        // This triggers re-render in Header to show default avatar
        updateUser({ 
          profile_picture: null 
        });
        
        console.log('✅ Profile picture removed from all components');
        
        // Notify parent component
        onUpdate();
      }
    } catch (error) {
      console.error('❌ Delete failed:', error);
      toast.error(error.message || 'Failed to remove profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  // ============================================
  // HANDLE PROFILE UPDATE
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('💾 Updating profile...');
      const response = await updateProfile(formData);
      
      if (response.success) {
        toast.success('Profile updated successfully');
        
        // Update AuthContext with new data
        updateUser({
          username: response.data.username,
          email: response.data.email,
          phone: response.data.phone,
          department: response.data.department,
          research_areas: response.data.research_areas,
          expertise: response.data.expertise,
          availability_status: response.data.availability_status
        });
        
        console.log('✅ Profile update complete');
        
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const isTeacher = user?.role === 'Teacher';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Edit Profile"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================ */}
        {/* PROFILE PICTURE SECTION */}
        {/* ============================================ */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Camera size={18} className="text-[#193869]" />
            Profile Picture
          </h3>
          
          <div className="flex flex-col items-center">
            {/* Image Display */}
            <div className="relative group mb-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#193869] shadow-lg"
                    onError={(e) => {
                      console.error('❌ Image failed to load:', imagePreview);
                      e.target.style.display = 'none';
                      setImagePreview(null);
                      toast.error('Failed to load profile picture');
                    }}
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-full flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                      <label className="cursor-pointer bg-white text-[#193869] p-2 rounded-full shadow-lg hover:scale-110 transform transition-transform">
                        <Camera size={20} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={uploadingImage || loading}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleImageDelete}
                        disabled={uploadingImage || loading}
                        className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center border-4 border-[#193869] shadow-lg">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
              
              {/* Upload Status */}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            {!imagePreview && (
              <label className="cursor-pointer">
                <div className="px-6 py-3 bg-[#193869] hover:bg-[#234e92] text-white rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2">
                  <Camera size={18} />
                  <span>Upload Photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploadingImage || loading}
                />
              </label>
            )}

            <p className="text-sm text-gray-600 mt-3 text-center">
              {imagePreview ? 'Hover over image to change or remove' : 'PNG, JPG, GIF or WebP (max 5MB)'}
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* BASIC INFORMATION */}
        {/* ============================================ */}
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              icon={<User size={20} />}
              required
              disabled={loading || uploadingImage}
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail size={20} />}
              required
              disabled={true}
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone size={20} />}
              placeholder="+92 300 1234567"
              disabled={loading || uploadingImage}
            />

            <Input
              label="Department"
              type="text"
              name="department"
              value={formData.department || 'Not Assigned'}
              icon={<Building size={20} />}
              disabled={true}
              helpText="Department is managed by administrators"
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* TEACHER-SPECIFIC FIELDS */}
        {/* ============================================ */}
        {isTeacher && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Academic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <BookOpen size={18} />
                  Research Areas
                </label>
                <textarea
                  name="research_areas"
                  value={formData.research_areas}
                  onChange={handleChange}
                  rows="3"
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent resize-none disabled:bg-gray-100"
                  placeholder="e.g., Machine Learning, Artificial Intelligence, Data Science"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple areas with commas</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Award size={18} />
                  Expertise
                </label>
                <textarea
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  rows="3"
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent resize-none disabled:bg-gray-100"
                  placeholder="Describe your technical expertise and skills..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability Status
                </label>
                <select
                  name="availability_status"
                  value={formData.availability_status}
                  onChange={handleChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Limited Availability">Limited Availability</option>
                  <option value="Busy">Busy</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_accepting_proposals"
                    checked={formData.is_accepting_proposals}
                    onChange={handleChange}
                    disabled={loading || uploadingImage}
                    className="w-4 h-4 text-[#193869] border-gray-300 rounded focus:ring-[#193869]"
                  />
                  <span className="text-sm font-medium text-gray-700">Accepting New Proposals</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ACTION BUTTONS */}
        {/* ============================================ */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            icon={<Save size={18} />}
            loading={loading}
            disabled={uploadingImage}
            fullWidth
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading || uploadingImage}
            fullWidth
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;