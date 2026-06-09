import Header from '../../components/layout/Header';
import AuditLogs from '../../components/admin/AuditLogs';

const AuditLogsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuditLogs />
      </main>
    </div>
  );
};

export default AuditLogsPage;
