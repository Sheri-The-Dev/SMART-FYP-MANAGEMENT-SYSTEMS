import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { lazy, Suspense } from "react";
import Loading from "./components/common/Loading";

// Lazy load pages for performance
const DefenseSubmission = lazy(() => import("./pages/student/DefenseSubmission"));
const DefenseEvaluation = lazy(() => import("./pages/teacher/DefenseEvaluation"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SecurityChallenge = lazy(() => import("./pages/SecurityChallenge"));
const InvitationResponse = lazy(() => import("./pages/InvitationResponse"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const UserDetails = lazy(() => import("./pages/admin/UserDetails"));
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogsPage"));
const SupervisorWorkload = lazy(() => import("./pages/admin/SupervisorWorkload"));
const AdminProjectManagement = lazy(() => import("./pages/admin/AdminProjectManagement"));
const ProjectArchive = lazy(() => import("./pages/ProjectArchive"));
const BatchManagement = lazy(() => import("./pages/admin/BatchManagement"));
const MasterDashboard = lazy(() => import("./pages/admin/MasterDashboard"));
const CurriculumManagement = lazy(() => import("./pages/admin/CurriculumManagement"));
const StudentMilestones = lazy(() => import("./pages/StudentMilestones"));
const ProposalDashboard = lazy(() => import("./pages/ProposalDashboard"));
const SupervisorProposals = lazy(() => import("./pages/SupervisorProposals"));
const SupervisorMilestoneReview = lazy(() => import("./pages/SupervisorMilestoneReview"));
const SupervisorEvaluationsPage = lazy(() => import("./pages/supervisor/SupervisorEvaluationsPage"));
const ProposalManagement = lazy(() => import("./pages/admin/ProposalManagement"));
const GradeSummary = lazy(() => import("./pages/admin/GradeSummary"));
const EvaluationSessions = lazy(() => import("./pages/admin/EvaluationSessions"));
const CommitteeEvaluation = lazy(() => import("./pages/committee/CommitteeEvaluation"));


// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false, requireCoordinator = false }) => {
  const { isAuthenticated, isAdmin, hasRole, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Verifying authentication..." />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  const isCommittee = hasRole('Committee');

  if (requireCoordinator && !(isAdmin() || isCommittee)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { loading, user } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Initializing..." />;
  }

  return (
    <div>
      <Suspense fallback={<Loading fullScreen text="Loading page..." />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/security-challenge"
            element={
              <PublicRoute>
                <SecurityChallenge />
              </PublicRoute>
            }
          />
          <Route
            path="/invitation-response"
            element={<InvitationResponse />}
          />
          <Route
            path="/invitation/respond"
            element={<InvitationResponse />}
          />

          {/* Common Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-archive"
            element={
              <ProtectedRoute>
                <ProjectArchive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-milestones"
            element={
              <ProtectedRoute>
                <StudentMilestones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proposal-dashboard"
            element={
              <ProtectedRoute>
                <ProposalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor-proposals"
            element={
              <ProtectedRoute>
                <SupervisorProposals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/milestone-review"
            element={
              <ProtectedRoute>
                <SupervisorMilestoneReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/student-evaluations"
            element={
              <ProtectedRoute>
                <SupervisorEvaluationsPage />
              </ProtectedRoute>
            }
          />

          {/* Proposal Defense Submission Route */}
          <Route
            path="/student/defense-submission"
            element={
              <ProtectedRoute>
                <DefenseSubmission />
              </ProtectedRoute>
            }
          />

          {/* Proposal Defense Evaluation Route - accessible to Teachers */}
          <Route
            path="/teacher/evaluations"
            element={
              <ProtectedRoute>
                <DefenseEvaluation />
              </ProtectedRoute>
            }
          />

          {/* Committee Evaluation Route */}
          <Route
            path="/committee/evaluate"
            element={
              <ProtectedRoute requireCoordinator={true}>
                <CommitteeEvaluation />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <UsersManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute requireAdmin={true}>
                <UserDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/supervisor-workload"
            element={
              <ProtectedRoute requireAdmin={true}>
                <SupervisorWorkload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminProjectManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/proposals"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ProposalManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/batches"
            element={
              <ProtectedRoute requireAdmin={true}>
                <BatchManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/evaluation-sessions"
            element={
              <ProtectedRoute requireAdmin={true}>
                <EvaluationSessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/master-dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MasterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/curriculum"
            element={
              <ProtectedRoute requireAdmin={true}>
                <CurriculumManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/grade-summary"
            element={
              <ProtectedRoute requireCoordinator={true}>
                <GradeSummary />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
