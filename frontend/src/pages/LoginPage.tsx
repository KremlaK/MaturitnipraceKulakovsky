import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getErrorMessage } from '../api/axios';
import { login as loginRequest } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { PasswordField } from '../components/AuthLayout';
import { fieldClass, labelClass, primaryButton } from '../lib/ui';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Kam se vrátit po přihlášení (PrivateRoute sem uloží původní adresu)
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginRequest(email, password);
      login(res.token, res.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Přihlášení se nepovedlo. Zkus to znovu.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Přihlášení"
      footer={<>Nemáš účet? <Link to="/register" className="text-ink font-semibold underline underline-offset-2">Zaregistruj se</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        <div>
          <label htmlFor="login-email" className={labelClass}>E-mail</label>
          <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        </div>
        <PasswordField id="login-password" label="Heslo" autoComplete="current-password" value={password} onChange={setPassword} />
        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="text-sm text-ink-muted hover:text-ink underline underline-offset-2">Zapomenuté heslo?</Link>
        </div>
        {error && <p role="alert" className="text-warning-red text-sm border border-warning-red/30 bg-warning-red/10 rounded px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? 'Přihlašuji…' : 'Přihlásit se'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
