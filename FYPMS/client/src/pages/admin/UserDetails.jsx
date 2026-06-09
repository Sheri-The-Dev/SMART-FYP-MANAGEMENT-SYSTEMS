import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User, Mail, Shield, Calendar, Phone, Building,
  Edit, Trash2, RefreshCw, Lock, CheckCircle, XCircle,
  BookOpen, Award, Clock
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import UserActivityLog from '../../components/admin/UserActivityLog';
import EditUserModal from '../../components/admin/EditUserModal';
import { useToast } from '../../components/common/Toast';
import { getUserById, deleteUser, updateUser } from '../../services/adminService';
import { getProfilePictureUrl } from '../../services/profileService';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await getUserById(id);
      if (response.success) {
        setUserData(response.data);
      }
    } catch (error) {
      toast.error('Failed to load user details');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteUser(id);
      if (response.success) {
        toast.success('User deleted successfully');
        navigate('/admin/users');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
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

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!userData) {
    return null;
  }

  const isTeacher = userData.role === 'Teacher';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/admin/users')}
          className="mb-6"
        >
          Back to Users
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-md p-6 text-center"
            >
              {/* Profile Picture */}
              {userData.profile_picture ? (
                <img
                  src={getProfilePictureUrl(userData.profile_picture)}
                  alt={userData.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#193869] mx-auto mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-800 mb-2">{userData.username}</h2>
              <p className="text-sm text-gray-600 mb-4 break-all">{userData.email}</p>

              <div className="flex flex-col gap-2 items-center mb-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getRoleBadgeColor(userData.role)}`}>
                  {userData.role}
                </span>

                {isTeacher && userData.availability_status && (
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getAvailabilityColor(userData.availability_status)}`}>
                    {userData.availability_status}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {userData.is_active ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Inactive</span>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {new Date(userData.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {userData.last_login && (
                    <div className="text-xs text-gray-500">
                      Last login: {new Date(userData.last_login).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  variant="primary"
                  icon={<Edit size={18} />}
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full"
                >
                  Edit User
                </Button>
                <Button
                  variant="outline"
                  icon={<Lock size={18} />}
                  onClick={() => navigate(`/admin/users/${id}/reset-password`)}
                  className="w-full"
                >
                  Reset Password
                </Button>
                <Button
                  variant="danger"
                  icon={<Trash2 size={18} />}
                  onClick={handleDelete}
                  className="w-full"
                >
                  Delete User
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - User Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-800">{userData.username}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-800 break-all">{userData.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-800">{userData.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Department</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-800">{userData.department || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {userData.created_by_username && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Created by: <span className="font-medium text-gray-800">{userData.created_by_username}</span>
                  </p>
                </div>
              )}
            </motion.div>

            {/* Teacher-Specific Information */}
            {isTeacher && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6">Academic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <BookOpen className="w-5 h-5" />
                      Research Areas
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {userData.research_areas || 'Not provided'}
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
                        {userData.expertise || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <Clock className="w-5 h-5" />
                      Availability Status
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(userData.availability_status)}`}>
                        {userData.availability_status || 'Available'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Activity Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <UserActivityLog userId={id} />
            </motion.div>
          </div>
        </div>
      </main>
      {/* Edit User Modal */}
      {userData && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={fetchUserDetails}
          user={userData}
        />
      )}
    </div>
  );
};

export default UserDetails;