import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Shield, Activity, TrendingUp, AlertCircle,
  FolderOpen, Upload, Search, Database, BookOpen, LayoutDashboard,
  Layers, FileText, GraduationCap, Clock, CheckCircle, Calendar, ClipboardList
} from "lucide-react";
import Header from "../../components/layout/Header";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";
import { getDashboardStats } from "../../services/adminService";
import { getProjectStats } from "../../services/projectService";
import { useToast } from "../../components/common/Toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [projectStats, setProjectStats] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchProjectStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    try {
      const response = await getProjectStats();
      setProjectStats(response);
    } catch (error) {
      console.error("Failed to load project statistics:", error);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const totalUsers = stats?.userStats?.reduce((sum, stat) => sum + stat.count, 0) || 0;
  const activeUsers = stats?.userStats?.reduce((sum, stat) => sum + stat.active_count, 0) || 0;
  const totalProjects = projectStats?.total || 0;
  const batchStats = stats?.batchStats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, batches, proposals, and system settings</p>
          </div>
          <Button variant="primary" icon={<UserPlus size={20} />} onClick={() => navigate("/admin/users")}>
            Create User
          </Button>
        </div>

        {/* Top 4 stat tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <StatTile icon={<Users className="w-8 h-8" />} label="Total Users" value={totalUsers} sub={`${activeUsers} active`} gradient="from-blue-500 to-blue-600" />
          <StatTile icon={<GraduationCap className="w-8 h-8" />} label="Enrolled Students" value={batchStats.enrolledStudents ?? '—'} sub="In active batches" gradient="from-emerald-500 to-green-600" />
          <StatTile icon={<Layers className="w-8 h-8" />} label="Active Batches" value={batchStats.activeBatches ?? '—'} sub="Running now" gradient="from-purple-500 to-purple-600" />
          <StatTile icon={<FileText className="w-8 h-8" />} label="Pending Proposals" value={batchStats.pendingProposals ?? '—'} sub="Awaiting review" gradient="from-amber-500 to-orange-500" />
        </motion.div>

        {/* Batch & Academic Operations Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#193869] via-[#1e4a8a] to-[#234e92] rounded-2xl shadow-xl p-7 text-white mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">Academic Lifecycle Management</h2>
                <p className="text-blue-200 text-sm">Create batches, enroll students, assign curriculum tracks, and manage FYP transitions.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/admin/batches")}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-[#193869] rounded-xl font-bold hover:bg-blue-50 transition-all text-xs sm:text-sm shadow-lg"
              >
                Manage Batches
              </button>
              <button
                onClick={() => navigate("/admin/curriculum")}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-all text-xs sm:text-sm border border-white/30"
              >
                Curriculum Builder
              </button>
              <button
                onClick={() => navigate("/admin/master-dashboard")}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-all text-xs sm:text-sm border border-white/30"
              >
                Master Dashboard
              </button>
            </div>
          </div>
        </motion.div>

        {/* System Management Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <ActionCard icon={<Users className="w-6 h-6 text-blue-600" />} bg="bg-blue-50" title="User Management" desc="Create, edit and manage all system users" onClick={() => navigate("/admin/users")} />
          <ActionCard icon={<FileText className="w-6 h-6 text-amber-600" />} bg="bg-amber-50" title="Proposals" desc="Review and manage student proposals" onClick={() => navigate("/admin/proposals")} />
          <ActionCard icon={<Calendar className="w-6 h-6 text-emerald-600" />} bg="bg-emerald-50" title="Proposal Defense" desc="Schedule and manage defenses" onClick={() => navigate("/admin/proposals?tab=defense")} />
          <ActionCard icon={<ClipboardList className="w-6 h-6 text-rose-600" />} bg="bg-rose-50" title="Evaluation Sessions" desc="Schedule & Manage committee evals" onClick={() => navigate("/admin/evaluation-sessions")} />
        </motion.div>

        {/* System Management Action Cards (Row 2) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <ActionCard icon={<Users className="w-6 h-6 text-purple-600" />} bg="bg-purple-50" title="Supervisor Workload" desc="Monitor capacity & assignments" onClick={() => navigate("/admin/supervisor-workload")} />
          <ActionCard icon={<TrendingUp className="w-6 h-6 text-indigo-600" />} bg="bg-indigo-50" title="Grade Summary" desc="View student grades & stats" onClick={() => navigate("/admin/grade-summary")} />
          <ActionCard icon={<Activity className="w-6 h-6 text-emerald-600" />} bg="bg-emerald-50" title="Audit Logs" desc="View system activity & logs" onClick={() => navigate("/admin/audit-logs")} />
        </motion.div>

        {/* Users by Role + Recent Activity side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Users by Role */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-md p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-4">Users by Role</h2>
            <div className="space-y-3">
              {stats?.userStats?.map((stat) => {
                const roleColors = {
                  Administrator: 'bg-purple-100 text-purple-700',
                  Teacher: 'bg-blue-100 text-blue-700',
                  Student: 'bg-green-100 text-green-700',
                  Committee: 'bg-yellow-100 text-yellow-700'
                };
                const pct = totalUsers ? Math.round((stat.count / totalUsers) * 100) : 0;
                return (
                  <div key={stat.role} className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[110px] text-center ${roleColors[stat.role] || 'bg-gray-100 text-gray-700'}`}>
                      {stat.role}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-[#193869] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-8 text-right">{stat.count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activity Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-md p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity (24h)</h2>
            <div className="space-y-3">
              <ActivityRow icon={<CheckCircle className="w-4 h-4 text-green-500" />} label="Successful Logins" value={stats?.recentActivity?.recentLogins || 0} color="text-green-600" />
              <ActivityRow icon={<AlertCircle className="w-4 h-4 text-red-500" />} label="Failed Login Attempts" value={stats?.recentActivity?.failedLogins || 0} color="text-red-600" />
              <ActivityRow icon={<Clock className="w-4 h-4 text-amber-500" />} label="Password Resets (7d)" value={stats?.recentActivity?.passwordResets || 0} color="text-amber-600" />
              <ActivityRow icon={<UserPlus className="w-4 h-4 text-blue-500" />} label="New Users (30d)" value={stats?.recentActivity?.newUsers || 0} color="text-blue-600" />
            </div>
            <button
              onClick={() => navigate("/admin/audit-logs")}
              className="mt-4 w-full text-center text-sm text-[#193869] font-bold hover:underline"
            >
              View Full Audit Log →
            </button>
          </motion.div>
        </div>

        {/* Project Archive Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#193869] to-[#234e92] rounded-2xl shadow-xl p-7 text-white"
        >
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">Project Archive Management</h2>
              <p className="text-blue-200 text-sm">Manage the complete database of archived Final Year Projects</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Projects</p>
              <p className="text-3xl font-black">{totalProjects}</p>
            </div>
            {projectStats?.byYear?.[0] && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Latest Year</p>
                <p className="text-3xl font-black">{projectStats.byYear[0].year}</p>
                <p className="text-blue-300 text-xs mt-1">{projectStats.byYear[0].count} projects</p>
              </div>
            )}
            {projectStats?.byDepartment?.[0] && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Top Department</p>
                <p className="text-xl font-black truncate">{projectStats.byDepartment[0].department}</p>
                <p className="text-blue-300 text-xs mt-1">{projectStats.byDepartment[0].count} projects</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/project-archive")} className="px-5 py-2.5 bg-white text-[#193869] rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" /> Search Projects
            </button>
            <button onClick={() => navigate("/admin/projects")} className="px-5 py-2.5 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30 text-sm">
              <Upload className="w-4 h-4" /> Add Projects
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// ── Helper sub-components ────────────────────────────────────────────────────

const StatTile = ({ icon, label, value, sub, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg p-5 text-white`}>
    <div className="flex items-center justify-between mb-3">
      <div className="opacity-90">{icon}</div>
      <TrendingUp className="w-4 h-4 opacity-50" />
    </div>
    <p className="text-3xl font-black mb-0.5">{value}</p>
    <p className="text-white/80 text-sm font-semibold">{label}</p>
    <p className="text-white/60 text-xs mt-1">{sub}</p>
  </div>
);

const ActionCard = ({ icon, bg, title, desc, onClick }) => (
  <motion.button
    whileHover={{ y: -4 }}
    onClick={onClick}
    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all text-left w-full group"
  >
    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="font-bold text-gray-800 text-sm mb-1">{title}</h3>
    <p className="text-xs text-gray-500">{desc}</p>
  </motion.button>
);

const ActivityRow = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
    <div className="flex items-center gap-2 text-sm text-gray-700">
      {icon}
      <span>{label}</span>
    </div>
    <span className={`font-black text-lg ${color}`}>{value}</span>
  </div>
);

export default AdminDashboard;