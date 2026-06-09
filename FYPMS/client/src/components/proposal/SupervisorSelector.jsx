import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import proposalService from '../../services/proposalService';

// ============================================
// SUPERVISOR SELECTOR COMPONENT
// ============================================
// Displays available supervisors with workload info
// Shows availability status
// Adds Department Filter
// ============================================

const SupervisorSelector = ({ value, onChange, error, supervisors: propSupervisors, departments: propDepartments }) => {
  const [internalSupervisors, setInternalSupervisors] = useState([]);
  const [loading, setLoading] = useState(!propSupervisors);
  const [fetchError, setFetchError] = useState(null);
  const [selectedDept, setSelectedDept] = useState('All');

  const supervisors = propSupervisors || internalSupervisors;
  
  // Use passed departments or derive from supervisors
  const departmentOptions = ['All', ...(propDepartments || [...new Set(supervisors.map(s => s.department).filter(Boolean))])];

  const filteredSupervisors = selectedDept === 'All' 
    ? supervisors 
    : supervisors.filter(s => s.department === selectedDept);

  useEffect(() => {
    if (!propSupervisors) {
      fetchSupervisors();
    } else {
      setLoading(false);
    }
  }, [propSupervisors]);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching supervisors from API...');
      
      const response = await proposalService.getAvailableSupervisors();
      const supervisorsData = response.data || response || [];
      
      if (!Array.isArray(supervisorsData)) {
        console.warn('⚠️ Supervisors data is not an array:', typeof supervisorsData);
        setInternalSupervisors([]);
      } else {
        setInternalSupervisors(supervisorsData);
      }
      
      setFetchError(null);
    } catch (err) {
      console.error('❌ Error fetching supervisors:', err);
      const errorMessage = err.message || 'Failed to load supervisors. Please try again.';
      setFetchError(errorMessage);
      setInternalSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityStatus = (supervisor) => {
    // Check manual availability status first
    if (supervisor.availability_status === 'Unavailable') {
      return {
        text: 'Unavailable',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }

    if (supervisor.availability_status === 'Busy') {
      return {
        text: 'Busy',
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    }
    
    if (supervisor.availability_status === 'Limited Availability') {
      return {
        text: 'Limited Availability',
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      };
    }

    if (!supervisor.is_accepting_proposals) {
      return {
        text: 'Not Accepting',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }

    const availableSlots = supervisor.available_slots;
    
    if (availableSlots <= 0) {
      return {
        text: 'Full',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    } else if (availableSlots <= 2) {
      return {
        text: `${availableSlots} slot${availableSlots > 1 ? 's' : ''} left`,
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    } else {
      return {
        text: `${availableSlots} slots available`,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Supervisor <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <h4 className="text-sm font-semibold text-red-800 mb-2">Error Loading Supervisors</h4>
        <p className="text-sm text-red-700 mb-3">{fetchError}</p>
        <button
          type="button"
          onClick={fetchSupervisors}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Supervisor <span className="text-red-500">*</span>
        </label>
      </div>

      {/* Department Filter */}
      {departmentOptions.length > 1 && (
        <div className="mb-3">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-[#193869] focus:border-[#193869] sm:text-sm rounded-md"
                >
                    {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                        {dept === 'All' ? 'All Departments' : dept}
                    </option>
                    ))}
                </select>
            </div>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {!filteredSupervisors || filteredSupervisors.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Users className="w-16 h-16 mx-auto mb-3 text-gray-400" />
            <h4 className="text-lg font-semibold text-gray-700 mb-1">No Supervisors Available</h4>
            <p className="text-sm text-gray-500 mb-3">
              {selectedDept !== 'All' 
                ? 'No supervisor at the time' 
                : 'There are currently no supervisors accepting proposals.'}
            </p>
            <button
              type="button"
              onClick={() => setSelectedDept('All')}
              className="text-sm text-[#193869] hover:text-[#234e92] font-medium"
            >
              Clear Filter
            </button>
          </div>
        ) : (
            filteredSupervisors.map((supervisor) => {
            const status = getAvailabilityStatus(supervisor);
            const StatusIcon = status.icon;
            const isDisabled = !supervisor.is_accepting_proposals || supervisor.available_slots <= 0 || supervisor.availability_status === 'Busy';
            const isSelected = value === supervisor.id;

            return (
              <div
                key={supervisor.id}
                onClick={() => {
                  if (isDisabled) return;
                  if (isSelected) {
                    onChange(null);
                  } else {
                    onChange(supervisor.id);
                  }
                }}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-[#193869] bg-blue-50 shadow-md'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-200 hover:border-[#234e92] hover:bg-gray-50 cursor-pointer hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-base">
                        {supervisor.username}
                      </h4>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-[#193869]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm text-gray-600">
                        {supervisor.email}
                        </p>
                        {supervisor.department && (
                            <span className="text-xs text-gray-500 mt-0.5">
                                {supervisor.department}
                            </span>
                        )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.text}
                  </div>
                </div>

                {/* Workload bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                    <span className="font-medium">Workload</span>
                    <span className="font-semibold">{supervisor.current_supervisees}/{supervisor.max_supervisees} students</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#193869] to-[#234e92] transition-all duration-300"
                      style={{
                        width: `${Math.min((supervisor.current_supervisees / supervisor.max_supervisees) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}

      {/* Legend */}
      {supervisors && supervisors.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-700 flex items-center flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <span className="font-medium">Available</span>
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
              <span className="font-medium">Limited</span>
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              <span className="font-medium">Unavailable</span>
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SupervisorSelector;
