import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Edit, Trash2, Mail, Shield, Eye, Users, Building, Download } from 'lucide-react';
import Header from '../../components/layout/Header';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useToast } from '../../components/common/Toast';
import { getAllUsers, createUser, deleteUser, exportWorkloadReport, exportUsers } from '../../services/adminService';
import { ROLES, DEPARTMENTS } from '../../utils/constants';
import { validatePassword, isValidEmail, isValidUsername } from '../../utils/validation';
import BulkCreateUsersModal from '../../components/admin/BulkCreateUsersModal';
import EditUserModal from '../../components/admin/EditUserModal';

const UsersManagement = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [editModalUser, setEditModalUser] = useState(null);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFields, setExportFields] = useState({
    username: true, email: true, sap_id: true, role: true, department: true, status: true, date_joined: true
  });

  // Selection state for bulk delete
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    sap_id: '',
    role: 'Student',
    department: '',
    max_supervisees: 5,
    password: '',
    sendEmail: true
  });
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, departmentFilter]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        role: roleFilter,
        department: departmentFilter !== 'all' ? departmentFilter : undefined
      };

      const response = await getAllUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleExportWorkload = async () => {
    try {
      const response = await exportWorkloadReport('csv');

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workload-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Workload report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export workload report');
    }
  };

  const handleExportUsers = async () => {
    try {
      setShowExportModal(false);
      toast.success('Generating export...', { autoClose: 2000 });
      const selectedFields = Object.keys(exportFields).filter(k => exportFields[k]);
      const payload = {
        role: roleFilter !== 'all' ? roleFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        search: searchTerm || undefined,
        fields: selectedFields,
        userIds: selectedUsers.length > 0 ? selectedUsers : undefined
      };
      // response IS the blob because axios interceptor unwraps .data
      const response = await exportUsers(payload);

      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export users');
    }
  };

  const handleCreateUser = async () => {
    // Validate
    const errors = {};

    if (!isValidUsername(createFormData.username)) {
      errors.username = 'Username must be 3-50 characters (letters, numbers, -, _)';
    }

    if (!isValidEmail(createFormData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!createFormData.sap_id) {
      errors.sap_id = 'SAP ID is required';
    } else if (!/^\d+$/.test(createFormData.sap_id)) {
      errors.sap_id = 'SAP ID must contain only digits';
    }

    if (createFormData.role === ROLES.TEACHER && !createFormData.department) {
      errors.department = 'Department is required for teachers';
    }

    if (createFormData.password && !createFormData.sendEmail) {
      const passwordValidation = validatePassword(createFormData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0];
      }
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreating(true);

    try {
      const userData = {
        username: createFormData.username,
        email: createFormData.email,
        sap_id: createFormData.sap_id,
        role: createFormData.role,
        department: createFormData.department || null,
        sendEmail: createFormData.sendEmail
      };

      if (createFormData.role === ROLES.TEACHER) {
        userData.max_supervisees = createFormData.max_supervisees;
      }


      if (!createFormData.sendEmail && createFormData.password) {
        userData.password = createFormData.password;
      }

      await createUser(userData);
      toast.success('User created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;

    try {
      await deleteUser(deleteModalUser.id);
      toast.success('User deleted successfully');
      setDeleteModalUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    try {
      // Delete all selected users
      await Promise.all(selectedUsers.map(id => deleteUser(id)));
      toast.success(`${selectedUsers.length} user(s) deleted successfully`);
      setSelectedUsers([]);
      setDeleteModalUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete users');
    }
  };

  // Checkbox selection handlers
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    // Get all selectable users (not Administrators)
    const selectableUsers = users.filter(u => u.role !== 'Administrator').map(u => u.id);

    // Check if all selectable users are already selected
    const allSelected = selectableUsers.length > 0 && selectableUsers.every(id => selectedUsers.includes(id));

    if (allSelected) {
      // If all are selected, deselect all
      setSelectedUsers([]);
    } else {
      // If not all are selected, select all
      setSelectedUsers(selectableUsers);
    }
  };

  const isUserSelected = (userId) => selectedUsers.includes(userId);

  const handleBulkCreateSuccess = (data) => {
    const { created, failed, total } = data.data;
    if (created > 0) {
      toast.success(`Successfully created ${created} user${created !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`);
      fetchUsers();
    } else {
      toast.error('Failed to create users');
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      username: '',
      email: '',
      sap_id: '',
      role: 'Student',
      department: '',
      password: '',
      sendEmail: true
    });
    setCreateErrors({});
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

  if (loading && users.length === 0) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
            <p className="text-gray-600 mt-1">Create and manage user accounts</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              icon={<Download size={20} />}
              onClick={() => setShowExportModal(true)}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              icon={<Users size={20} />}
              onClick={() => setShowBulkCreateModal(true)}
            >
              Create Bulk Users
            </Button>
            <Button
              variant="primary"
              icon={<UserPlus size={20} />}
              onClick={() => setShowCreateModal(true)}
            >
              Create User
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="user_management_search"
                id="user_management_search"
                autoComplete="off"
                data-lpignore="true"
                placeholder="Search by username, email, or SAP ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Committee">Committee</option>
              <option value="Administrator">Administrator</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Table Header with Bulk Delete Button */}
          <div className="bg-gradient-to-r from-[#193869] to-[#234e92] px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={20} />
              Users ({pagination.total || users.length} total)
            </h2>
            {selectedUsers.length > 0 && (
              <Button
                variant="danger"
                onClick={() => setDeleteModalUser({ bulk: true })}
                icon={<Trash2 size={18} />}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Selected ({selectedUsers.length})
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.filter(u => u.role !== 'Administrator').length && users.filter(u => u.role !== 'Administrator').length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-[#193869] border-gray-300 rounded focus:ring-[#193869] cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SAP ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-gray-50 transition-colors ${isUserSelected(user.id) ? 'bg-blue-50' : ''
                      }`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isUserSelected(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        disabled={user.role === 'Administrator'}
                        className="w-4 h-4 text-[#193869] border-gray-300 rounded focus:ring-[#193869] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.sap_id || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isUserSelected(user.id) ? (
                          // Show only delete button when selected
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteModalUser(user)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        ) : (
                          // Show all action buttons when not selected
                          <>
                            <button
                              onClick={() => setEditModalUser(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="p-2 text-[#193869] hover:bg-blue-50 rounded-lg transition-colors"
                              title="Reset Password"
                            >
                              <Mail size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteModalUser(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                              disabled={user.role === 'Administrator'}
                            >
                              <Trash2 size={18} />
                            </button>
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
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editModalUser && (
          <EditUserModal
            isOpen={!!editModalUser}
            user={editModalUser}
            onClose={() => setEditModalUser(null)}
            onSuccess={() => {
              fetchUsers();
            }}
          />
        )}

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetCreateForm();
          }}
          title="Create New User"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Username"
              name="username"
              value={createFormData.username}
              onChange={(e) => {
                setCreateFormData(prev => ({ ...prev, username: e.target.value }));
                setCreateErrors(prev => ({ ...prev, username: '' }));
              }}
              error={createErrors.username}
              placeholder="Enter username"
              required
            />

            <Input
              label="SAP ID"
              name="sap_id"
              value={createFormData.sap_id}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, '');
                setCreateFormData(prev => ({ ...prev, sap_id: numericValue }));
                setCreateErrors(prev => ({ ...prev, sap_id: '' }));
              }}
              error={createErrors.sap_id}
              placeholder="Enter SAP ID"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={createFormData.email}
              onChange={(e) => {
                setCreateFormData(prev => ({ ...prev, email: e.target.value }));
                setCreateErrors(prev => ({ ...prev, email: '' }));
              }}
              error={createErrors.email}
              placeholder="Enter email address"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={createFormData.role}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
              >
                {Object.values(ROLES).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Department - optional for all, required for Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department {createFormData.role === ROLES.TEACHER && <span className="text-red-500">*</span>}
                {createFormData.role !== ROLES.TEACHER && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={createFormData.department}
                  onChange={(e) => {
                    setCreateFormData(prev => ({ ...prev, department: e.target.value }));
                    setCreateErrors(prev => ({ ...prev, department: '' }));
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent bg-white ${createErrors.department ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              {createErrors.department && (
                <p className="text-xs text-red-500 mt-1">{createErrors.department}</p>
              )}
            </div>

            {/* Max supervisees — Teacher only */}
            {createFormData.role === ROLES.TEACHER && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  label="Max Supervision Capacity"
                  type="number"
                  name="max_supervisees"
                  value={createFormData.max_supervisees}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, max_supervisees: e.target.value }))}
                  placeholder="5"
                  min="1"
                  icon={<Shield size={20} />}
                />
              </motion.div>
            )}


            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="sendEmail"
                checked={createFormData.sendEmail}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                className="w-4 h-4 text-[#193869] rounded focus:ring-[#193869]"
              />
              <label htmlFor="sendEmail" className="text-sm text-gray-700">
                Send account details via email (recommended)
              </label>
            </div>

            {!createFormData.sendEmail && (
              <Input
                label="Temporary Password"
                type="password"
                name="password"
                value={createFormData.password}
                onChange={(e) => {
                  setCreateFormData(prev => ({ ...prev, password: e.target.value }));
                  setCreateErrors(prev => ({ ...prev, password: '' }));
                }}
                error={createErrors.password}
                placeholder="Enter temporary password"
                required
              />
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                fullWidth
                onClick={handleCreateUser}
                loading={creating}
              >
                Create User
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          title={deleteModalUser?.bulk ? "Delete Selected Users" : "Delete User"}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
              <p className="text-red-700 text-sm">
                {deleteModalUser?.bulk ? (
                  <>
                    You are about to delete <strong>{selectedUsers.length} user(s)</strong>. All associated data will be permanently removed.
                  </>
                ) : (
                  <>
                    You are about to delete user <strong>{deleteModalUser?.username}</strong>. All associated data will be permanently removed.
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                onClick={deleteModalUser?.bulk ? handleBulkDelete : handleDeleteUser}
              >
                {deleteModalUser?.bulk ? `Delete ${selectedUsers.length} Users` : "Delete User"}
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setDeleteModalUser(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Export Fields Modal */}
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Export CSV"
        >
          <div className="p-4 space-y-4">
            {/* Scope banner */}
            {selectedUsers.length > 0 ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
                <Users size={16} /> Exporting <strong className="mx-1">{selectedUsers.length} selected</strong> user(s) only.
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                <Download size={16} /> Exporting <strong className="mx-1">all users</strong> matching current filters.
              </div>
            )}
            <p className="text-sm text-gray-600">Select the columns to include in your export:</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(exportFields).map(field => (
                <label key={field} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                  <input type="checkbox" checked={exportFields[field]} onChange={(e) => setExportFields({ ...exportFields, [field]: e.target.checked })} className="w-4 h-4 text-[#193869] border-gray-300 rounded focus:ring-[#193869]" />
                  <span className="text-sm font-medium text-gray-700 capitalize">{field.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleExportUsers} icon={<Download size={18} />}>
                Download CSV
              </Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Create Users Modal */}
        <BulkCreateUsersModal
          isOpen={showBulkCreateModal}
          onClose={() => setShowBulkCreateModal(false)}
          onSuccess={handleBulkCreateSuccess}
        />
      </main>
    </div>
  );
};

export default UsersManagement;
