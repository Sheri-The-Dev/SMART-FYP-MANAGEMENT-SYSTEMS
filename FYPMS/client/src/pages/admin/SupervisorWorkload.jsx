import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  AlertTriangle,
  Download,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  BarChart2
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import { getWorkloadReport, getSupervisorAlerts } from '../../services/adminService';

const SupervisorWorkload = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, overloaded, near_capacity
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workloadRes, alertsRes] = await Promise.all([
        getWorkloadReport('json'),
        getSupervisorAlerts()
      ]);

      if (workloadRes.success) {
        setSupervisors(workloadRes.data);
      }

      if (alertsRes.success) {
        setAlerts(alertsRes.data);
      }
    } catch (error) {
      console.error('Fetch workload error:', error);
      toast.error('Failed to load workload data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await getWorkloadReport('csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supervisor_workload_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Overloaded':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Near Capacity':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getProgressColor = (current, max) => {
    const ratio = current / max;
    if (ratio >= 1) return 'bg-red-500';
    if (ratio >= 0.8) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const filteredSupervisors = supervisors.filter(supervisor => {
    const matchesSearch =
      supervisor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.department?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'overloaded') return matchesSearch && supervisor.workload_status === 'Overloaded';
    if (filter === 'near_capacity') return matchesSearch && supervisor.workload_status === 'Near Capacity';

    return matchesSearch;
  });

  if (loading) {
    return <Loading fullScreen text="Loading workload data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supervisor Workload</h1>
            <p className="text-gray-600 mt-1">Monitor supervision capacity and workload distribution</p>
          </div>
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">Capacity Alerts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.map(alert => (
                      <div key={alert.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{alert.username}</p>
                          <p className="text-xs text-gray-500">{alert.department}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${alert.alert_type === 'Exceeded' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                            {alert.alert_type}
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            {alert.current_supervisees} / {alert.max_supervisees}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search supervisors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all'
                      ? 'bg-[#193869] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All Supervisors
                </button>
                <button
                  onClick={() => setFilter('near_capacity')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'near_capacity'
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    }`}
                >
                  Near Capacity
                </button>
                <button
                  onClick={() => setFilter('overloaded')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'overloaded'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                >
                  Overloaded
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {supervisors.reduce((acc, curr) => acc + curr.current_supervisees, 0)}
                <span className="text-gray-400 text-lg font-normal"> /
                  {supervisors.reduce((acc, curr) => acc + curr.max_supervisees, 0)}
                </span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <BarChart2 className="w-6 h-6 text-[#193869]" />
            </div>
          </div>
        </div>

        {/* Supervisors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupervisors.map((supervisor) => (
            <motion.div
              key={supervisor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{supervisor.username}</h3>
                    <p className="text-sm text-gray-600">{supervisor.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{supervisor.department}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(supervisor.workload_status)}`}>
                    {supervisor.workload_status}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Capacity Usage</span>
                      <span className="font-medium text-gray-900">
                        {Math.round((supervisor.current_supervisees / supervisor.max_supervisees) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(supervisor.current_supervisees, supervisor.max_supervisees)}`}
                        style={{ width: `${Math.min((supervisor.current_supervisees / supervisor.max_supervisees) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{supervisor.current_supervisees} Active Projects</span>
                      <span>Max: {supervisor.max_supervisees}</span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${supervisor.availability_status === 'Available'
                        ? 'bg-green-100 text-green-700'
                        : supervisor.availability_status === 'Busy'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                      {supervisor.availability_status || 'Available'}
                    </span>

                    <span className={`px-2 py-1 rounded text-xs font-medium ${supervisor.is_accepting_proposals
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      {supervisor.is_accepting_proposals ? 'Accepting Proposals' : 'Not Accepting'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSupervisors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No supervisors found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupervisorWorkload;
