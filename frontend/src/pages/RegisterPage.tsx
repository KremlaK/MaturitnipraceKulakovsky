import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', { email, password, name });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Něco se pokazilo.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-asphalt flex items-center justify-center px-4">
        <div className="bg-panel border border-panel-border rounded-xl p-8 w-full max-w-md text-center">
          <p className="text-gauge-yellow text-4xl mb-3">🏁</p>
          <h1 className="text-xl font-display font-bold text-white mb-2">Motor nastartován!</h1>
          <p className="text-slate-400 font-mono-gauge text-sm">
            Zkontroluj svůj e-mail pro ověření účtu. Za chvíli tě přesměrujeme na přihlášení...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-asphalt flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-gauge-yellow font-mono-gauge text-xs uppercase tracking-[0.3em] mb-1">Vítej v garáži</p>
          <h1 className="text-3xl font-display font-bold text-white">AutoApp</h1>
        </div>

        <div className="bg-panel border border-panel-border rounded-xl p-8">
          <h2 className="text-white font-display font-semibold text-lg mb-6 uppercase tracking-wider">Registrace</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Jméno</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Heslo (min. 8 znaků)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>

            {error && (
              <p className="text-warning-red text-sm font-mono-gauge border border-warning-red/30 bg-warning-red/10 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gauge-yellow hover:brightness-110 text-black py-3 rounded font-mono-gauge font-bold uppercase tracking-wider disabled:opacity-50 transition"
            >
              {loading ? 'Registruji...' : '🏁 Vjet do garáže'}
            </button>
          </form>

          <p className="text-slate-500 text-sm mt-6 text-center font-mono-gauge">
            Už máš účet?{' '}
            <Link to="/login" className="text-gauge-yellow hover:underline">
              Přihlas se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;