import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Shield, Calendar, Edit, Phone, Building,
  BookOpen, Award, Clock, Camera, RefreshCw, Layers, GraduationCap
} from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import EditProfileModal from '../components/profile/EditProfileModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import { getMyProfile, getProfilePictureUrl } from '../services/profileService';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);

  useEffect(() => {
    fetchProfile();
    if (user?.role === 'Student') fetchBatchInfo();
  }, []);

  useEffect(() => {
    if (profileData?.profile_picture) {
      const url = getProfilePictureUrl(profileData.profile_picture);
      setProfilePictureUrl(url);
      setImageLoadError(false);
    } else {
      setProfilePictureUrl(null);
      setImageLoadError(false);
    }
  }, [profileData]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getMyProfile();
      if (response.success) {
        setProfileData(response.data);
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchInfo = async () => {
    try {
      const res = await api.get('/curriculum/batches/my-batch');
      if (res.success) setBatchInfo(res.data);
    } catch {
      // non-critical
    }
  };

  const handleProfileUpdate = () => {
    fetchProfile();
    if (user?.role === 'Student') fetchBatchInfo();
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Administrator: 'bg-purple-100 text-purple-800 border-purple-200',
      Teacher: 'bg-blue-100 text-blue-800 border-blue-200',
      Student: 'bg-green-100 text-green-800 border-green-200',
      Committee: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getAvailabilityColor = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-800 border-green-200',
      Busy: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Unavailable: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    setProfilePictureUrl(null);
    setImageLoadError(true);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const isTeacher = user?.role === 'Teacher';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account information</p>
          </div>
          <Button
            variant="outline"
            icon={<RefreshCw size={18} />}
            onClick={fetchProfile}
            className="hidden sm:flex"
          >
            Refresh
          </Button>
        </motion.div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 text-center">
              {/* Profile Picture */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-4">
                {profilePictureUrl && !imageLoadError ? (
                  <img
                    src={profilePictureUrl}
                    alt={profileData?.username}
                    className="w-full h-full rounded-full object-cover border-4 border-[#193869] shadow-lg"
                    onError={handleImageError}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', profilePictureUrl);
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center border-4 border-[#193869] shadow-lg">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-[#d29538] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#b87f2d] transition-colors"
                  title="Edit profile"
                >
                  <Camera size={18} />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 break-words">
                {profileData?.username}
              </h2>
              <p className="text-sm text-gray-600 mb-4 break-all">{profileData?.email}</p>

              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getRoleBadgeColor(profileData?.role)}`}>
                {profileData?.role}
              </span>

              {isTeacher && profileData?.availability_status && (
                <div className="mt-3">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getAvailabilityColor(profileData.availability_status)}`}>
                    {profileData.availability_status}
                  </span>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Joined {new Date(profileData?.created_at || Date.now()).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="primary"
                  icon={<Edit size={18} />}
                  onClick={() => setEditModalOpen(true)}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-xl shadow-md p-6 text-white"
            >
              <h3 className="font-bold mb-3 text-sm sm:text-base">Account Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-blue-100">Status</span>
                  <span className="font-semibold">Active</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-blue-100">Security</span>
                  <span className="font-semibold">Verified</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-blue-100">Last Login</span>
                  <span className="font-semibold">
                    {profileData?.last_login ? new Date(profileData.last_login).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Academic Status Card - Students only */}
          {user?.role === 'Student' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-4"
            >
              {!batchInfo ? (
                /* Not Enrolled */
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-amber-200" />
                    <h3 className="font-bold text-sm">Academic Status</h3>
                  </div>
                  <div className="bg-white/15 rounded-lg p-3 backdrop-blur-sm">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
                      NOT ENROLLED
                    </span>
                    <p className="text-amber-100 text-xs mt-1">
                      Contact your admin for batch enrollment.
                    </p>
                  </div>
                </div>
              ) : batchInfo.state === 'Active' ? (
                /* Active Batch */
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl shadow-md p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-emerald-200" />
                    <h3 className="font-bold text-sm">Academic Status</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-200">📚 Batch</span>
                      <span className="font-bold truncate ml-2">{batchInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-200">🎓 Phase</span>
                      <span className="font-bold">{batchInfo.fyp_phase}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-200">Status</span>
                      <span className="font-bold px-2 py-0.5 rounded-full text-xs bg-green-300/30 text-green-100">
                        ✅ ACTIVE
                      </span>
                    </div>
                    {batchInfo.track_name && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-200">🗂️ Track</span>
                        <span className="font-bold truncate ml-2">{batchInfo.track_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : batchInfo.state === 'Draft' ? (
                /* Draft Batch */
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-blue-200" />
                    <h3 className="font-bold text-sm">Academic Status</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-200">📚 Batch</span>
                      <span className="font-bold truncate ml-2">{batchInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-200">🎓 Phase</span>
                      <span className="font-bold">{batchInfo.fyp_phase}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-200">Status</span>
                      <span className="font-bold px-2 py-0.5 rounded-full text-xs bg-orange-400/30 text-orange-200">
                        ⏳ WAITING FOR ACTIVATION
                      </span>
                    </div>
                  </div>
                  <p className="text-blue-200 text-xs mt-3 italic">Batch will be activated shortly by admin.</p>
                </div>
              ) : (
                /* Frozen / Archived */
                <div className="bg-gradient-to-br from-gray-600 to-slate-700 rounded-xl shadow-md p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-gray-300" />
                    <h3 className="font-bold text-sm">Academic Status</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">📚 Batch</span>
                      <span className="font-bold truncate ml-2">{batchInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">Status</span>
                      <span className="font-bold px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">
                        {batchInfo.state}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs mt-3 italic">Contact admin for details.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Right Column - Profile Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Basic Information</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800 break-all">{profileData?.username}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">SAP ID</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800 break-all">{profileData?.sap_id || 'Not set'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-800 break-all">{profileData?.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">{profileData?.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Department</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Building className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">{profileData?.department || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Academic Batch</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      {user?.role === 'Student' ? (
                        batchInfo ? (
                          <span className="text-gray-800 font-medium">{batchInfo.name}</span>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Not Enrolled</span>
                        )
                      ) : (
                        <span className="text-gray-800">{profileData?.batch_name || 'N/A'}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">FYP Phase</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Award className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      {user?.role === 'Student' ? (
                        batchInfo ? (
                          <span className="text-gray-800 flex items-center gap-2 font-medium">
                            {batchInfo.fyp_phase}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${batchInfo.state === 'Active' ? 'bg-green-100 text-green-700' :
                              batchInfo.state === 'Draft' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                              {batchInfo.state}
                            </span>
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Pending Enrollment</span>
                        )
                      ) : (
                        <span className="text-gray-800">{profileData?.fyp_phase || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-800 font-medium">{profileData?.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher-Specific Information */}
            {isTeacher && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Academic Information</h3>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <BookOpen className="w-5 h-5" />
                      Research Areas
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {profileData?.research_areas || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <Award className="w-5 h-5" />
                      Expertise
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {profileData?.expertise || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <Clock className="w-5 h-5" />
                      Availability Status
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(profileData?.availability_status)}`}>
                        {profileData?.availability_status || 'Available'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Security</h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Password</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Last changed {profileData?.updated_at ? new Date(profileData.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/change-password'}
                    className="w-full sm:w-auto"
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userData={profileData}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default Profile;
