import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Něco se pokazilo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-asphalt flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-gauge-yellow font-mono-gauge text-xs uppercase tracking-[0.3em] mb-1">Nastartuj</p>
          <h1 className="text-3xl font-display font-bold text-ink">AutoApp</h1>
        </div>

        <div className="bg-panel border border-panel-border rounded-xl p-8">
          <h2 className="text-ink font-display font-semibold text-lg mb-6 uppercase tracking-wider">Přihlášení</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-ink-muted text-xs uppercase tracking-wider mb-1 font-mono-gauge">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>

            <div>
              <label className="block text-ink-muted text-xs uppercase tracking-wider mb-1 font-mono-gauge">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
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
              {loading ? 'Startuji...' : '▶ Nastartovat'}
            </button>
          </form>

          <p className="text-ink-muted text-sm mt-6 text-center font-mono-gauge">
            Nemáš účet?{' '}
            <Link to="/register" className="text-gauge-yellow hover:underline">
              Zaregistruj se
            </Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link to="/forgot-password" className="text-ink-muted hover:text-ink text-xs font-mono-gauge">
            Zapomenuté heslo?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;