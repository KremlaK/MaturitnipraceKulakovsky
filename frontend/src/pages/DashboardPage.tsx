import { useAuth } from '../context/AuthContext';

function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Vítej, {user?.name || user?.email}! 👋
          </h1>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Odhlásit se
          </button>
        </div>
        <p className="text-slate-400">Tady bude dashboard s auty, servisem, atd.</p>
      </div>
    </div>
  );
}

export default DashboardPage;