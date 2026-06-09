import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Filter, Calendar } from 'lucide-react';
import Button from '../common/Button';
import Loading from '../common/Loading';
import { useToast } from '../common/Toast';
import { getAuditLogs } from '../../services/adminService';

const UserActivityLog = ({ userId }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (userId) {
      fetchLogs();
    }
  }, [userId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        userId,
        limit: 50,
        ...filters
      };

      const response = await getAuditLogs(params);
      if (response.success) {
        setLogs(response.data.logs);
      }
    } catch (error) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const getActionColor = (action) => {
    const colors = {
      LOGIN_SUCCESS: 'bg-green-100 text-green-800',
      LOGIN_FAILED: 'bg-red-100 text-red-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      PROFILE_UPDATED: 'bg-blue-100 text-blue-800',
      PROFILE_PICTURE_UPDATED: 'bg-purple-100 text-purple-800',
      PROFILE_PICTURE_DELETED: 'bg-orange-100 text-orange-800',
      PASSWORD_CHANGED: 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const formatAction = (action) => {
    return action.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading && logs.length === 0) {
    return <Loading />;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={24} className="text-[#193869]" />
        <h3 className="text-xl font-bold text-gray-800">User Activity Log</h3>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="PROFILE_UPDATED">Profile Updated</option>
              <option value="PROFILE_PICTURE_UPDATED">Picture Updated</option>
              <option value="PASSWORD_CHANGED">Password Changed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button variant="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                    {log.details && (
                      <div className="mt-2 text-sm text-gray-600">
                        <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded">
                          {JSON.stringify(JSON.parse(log.details), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(log.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {log.ip_address && (
                      <div className="text-xs text-gray-500 mt-1">
                        IP: {log.ip_address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity logs found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityLog;