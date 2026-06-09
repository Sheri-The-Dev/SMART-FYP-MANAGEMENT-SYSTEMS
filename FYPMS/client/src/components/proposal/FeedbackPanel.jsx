import { MessageSquare, User, Calendar, AlertCircle } from 'lucide-react';

const FeedbackPanel = ({ feedback, supervisorName, responseDate, status }) => {
  // Don't show if no feedback
  if (!feedback) {
    return null;
  }

  // Get color scheme based on status
  const getColorScheme = () => {
    if (status === 'rejected') {
      return {
        borderColor: 'border-red-200',
        bgGradient: 'from-red-50 to-pink-50',
        headerBg: 'from-red-600 to-red-700',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
        alertBg: 'bg-red-100',
        alertText: 'text-red-900'
      };
    } else if (status === 'revision_requested') {
      return {
        borderColor: 'border-orange-200',
        bgGradient: 'from-orange-50 to-amber-50',
        headerBg: 'from-orange-600 to-amber-600',
        iconColor: 'text-orange-600',
        textColor: 'text-orange-900',
        alertBg: 'bg-orange-100',
        alertText: 'text-orange-900'
      };
    } else {
      return {
        borderColor: 'border-blue-200',
        bgGradient: 'from-blue-50 to-indigo-50',
        headerBg: 'from-blue-600 to-indigo-600',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-900',
        alertBg: 'bg-blue-100',
        alertText: 'text-blue-900'
      };
    }
  };

  const colors = getColorScheme();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`rounded-lg border-2 ${colors.borderColor} bg-gradient-to-br ${colors.bgGradient} overflow-hidden`}>
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${colors.headerBg} px-5 py-4`}>
        <div className="flex items-center gap-3 text-white">
          <MessageSquare className="w-6 h-6" />
          <h3 className="font-bold text-lg">Supervisor Feedback</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Supervisor & Date Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
            <User className={`w-4 h-4 ${colors.iconColor}`} />
            <span className="font-semibold text-gray-900">{supervisorName}</span>
          </div>
          {responseDate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <Calendar className={`w-4 h-4 ${colors.iconColor}`} />
              <span className="text-gray-700">{formatDate(responseDate)}</span>
            </div>
          )}
        </div>

        {/* Feedback text */}
        <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {feedback}
          </p>
        </div>

        {/* Action hint for revision */}
        {status === 'revision_requested' && (
          <div className={`flex items-start gap-3 p-4 ${colors.alertBg} rounded-lg border border-orange-300`}>
            <AlertCircle className={`w-5 h-5 ${colors.iconColor} flex-shrink-0 mt-0.5`} />
            <p className={`text-sm font-medium ${colors.alertText}`}>
              Please address the feedback above and resubmit your proposal with the requested changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;