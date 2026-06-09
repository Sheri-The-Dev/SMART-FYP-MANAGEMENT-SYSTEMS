import { motion } from 'framer-motion';
import { Eye, Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import { deleteUser, adminRequestPasswordReset } from '../../services/adminService';

const UserTable = ({ users, onUpdate, currentUserId }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteModalUser) return;

    setDeleting(true);
    try {
      await deleteUser(deleteModalUser.id);
      toast.success('User deleted successfully');
      setDeleteModalUser(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handlePasswordReset = async (userId, userEmail) => {
    try {
      await adminRequestPasswordReset(userId);
      toast.success(`Password reset email sent to ${userEmail}`);
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Administrator: 'bg-purple-100 text-purple-800',
      Teacher: 'bg-blue-100 text-blue-800',
      Student: 'bg-green-100 text-green-800',
      Committee: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Users Found</h3>
        <p className="text-gray-600 text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">User</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">SAP ID</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Role</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Workload</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Created</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-semibold text-gray-700">Last Login</th>
                <th className="px-4 lg:px-6 py-4 text-right text-xs lg:text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs lg:text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm lg:text-base truncate">{user.username}</p>
                        <p className="text-xs lg:text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-gray-700">
                    {user.sap_id || '-'}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    {user.department && (
                      <div className="text-xs text-gray-500 mt-1">
                        {user.department}
                      </div>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {user.role === 'Teacher' ? (
                        <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{user.current_supervisees || 0}</span>
                                <span className="text-gray-500">/ {user.max_supervisees || 5}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className={`h-1.5 rounded-full ${
                                        (user.current_supervisees || 0) >= (user.max_supervisees || 5) 
                                        ? 'bg-red-500' 
                                        : (user.current_supervisees || 0) >= ((user.max_supervisees || 5) * 0.8)
                                        ? 'bg-orange-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(((user.current_supervisees || 0) / (user.max_supervisees || 5)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-xs lg:text-sm text-gray-700">Active</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="text-xs lg:text-sm text-gray-700">Inactive</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-gray-600">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Never'}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-end gap-1 lg:gap-2">
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} className="lg:w-[18px] lg:h-[18px]" />
                      </button>
                      <button
                        onClick={() => handlePasswordReset(user.id, user.email)}
                        className="p-2 text-[#193869] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Send Password Reset"
                      >
                        <Mail size={16} className="lg:w-[18px] lg:h-[18px]" />
                      </button>
                      <button
                        onClick={() => setDeleteModalUser(user)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete User"
                        disabled={user.role === 'Administrator' || user.id === currentUserId}
                      >
                        <Trash2 size={16} className="lg:w-[18px] lg:h-[18px]" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-md p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{user.username}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              {user.is_active ? (
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              ) : (
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {user.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-800 mt-1">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="text-sm text-gray-800 mt-1">
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => navigate(`/admin/users/${user.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Eye size={16} />
                <span>View</span>
              </button>
              <button
                onClick={() => handlePasswordReset(user.id, user.email)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#193869] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Mail size={16} />
                <span>Reset</span>
              </button>
              <button
                onClick={() => setDeleteModalUser(user)}
                className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={user.role === 'Administrator' || user.id === currentUserId}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        title="Delete User"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-red-700 text-sm">
              You are about to permanently delete <strong>{deleteModalUser?.username}</strong>. 
              All associated data will be removed from the system.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">This will delete:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>User account and profile</li>
              <li>All sessions and login history</li>
              <li>Security questions and settings</li>
              <li>Related audit logs will be anonymized</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="danger"
              fullWidth
              onClick={handleDelete}
              loading={deleting}
            >
              Delete User
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setDeleteModalUser(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserTable;
