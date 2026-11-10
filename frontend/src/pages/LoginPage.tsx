import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

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
    } catch (err) {
      setError(getErrorMessage(err, 'Něco se pokazilo.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-asphalt flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Icon name="logo" size={40} className="text-accent mx-auto mb-2" />
          <h1 className="text-3xl font-display font-bold text-ink tracking-[0.08em]">AUTOAPP</h1>
          <p className="text-ink-muted text-sm mt-1">Kniha jízd a servisní knížka tvého auta</p>
        </div>

        <div className="bg-panel border border-panel-border rounded-xl p-8">
          <h2 className="text-ink font-display font-semibold text-lg mb-6 uppercase tracking-wider">Přihlášení</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
              />
            </div>

            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
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
              className="w-full bg-accent hover:brightness-110 text-on-accent py-3 rounded font-mono-gauge font-bold uppercase tracking-wider disabled:opacity-50 transition"
            >
              {loading ? 'Přihlašuji…' : 'Přihlásit se'}
            </button>
          </form>

          <p className="text-ink-muted text-sm mt-6 text-center font-mono-gauge">
            Nemáš účet?{' '}
            <Link to="/register" className="text-accent hover:underline">
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