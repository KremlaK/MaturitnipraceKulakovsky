import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { PasswordField, StrengthMeter } from '../components/AuthLayout';
import { fieldClass, labelClass, primaryButton } from '../lib/ui';

type Action = 'verify-email' | 'forgot-password' | 'reset-password';
const TITLES: Record<Action, string> = {
  'verify-email': 'Ověření e-mailu',
  'forgot-password': 'Zapomenuté heslo',
  'reset-password': 'Nové heslo',
};

export default function AccountActionPage({ action }: { action: Action }) {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { user, updateUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const missingToken = action !== 'forgot-password' && !token;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (action === 'reset-password' && password !== confirmation) {
      setError('Hesla se neshodují.');
      return;
    }
    setLoading(true);
    try {
      const body = action === 'forgot-password' ? { email }
        : action === 'reset-password' ? { token, newPassword: password } : { token };
      const response = await api.post(`/auth/${action}`, body);
      setMessage(response.data.message);
      if (action === 'verify-email' && user) updateUser({ emailVerified: true });
      setPassword('');
      setConfirmation('');
    } catch (err) {
      setError(getErrorMessage(err, 'Požadavek se nezdařil. Zkus to znovu.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={TITLES[action]}
      footer={user
        ? <Link to="/dashboard" className="text-ink font-semibold underline underline-offset-2">Zpět do garáže</Link>
        : <Link to="/login" className="text-ink font-semibold underline underline-offset-2">Zpět na přihlášení</Link>}
    >
      {missingToken ? (
        <p role="alert" className="text-warning-red">Odkaz neobsahuje platný token. Použij celý odkaz z e-mailu.</p>
      ) : message ? (
        <p role="status" className="text-ink">{message}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {action === 'forgot-password' && (
            <>
              <p className="text-ink-muted text-sm">Pošleme ti odkaz, přes který si nastavíš nové heslo.</p>
              <div>
                <label htmlFor="fp-email" className={labelClass}>E-mail</label>
                <input id="fp-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
              </div>
            </>
          )}
          {action === 'reset-password' && (
            <>
              <div>
                <PasswordField id="rp-password" label="Nové heslo" autoComplete="new-password" minLength={8} value={password} onChange={setPassword} describedBy="rp-strength" />
                <StrengthMeter id="rp-strength" password={password} />
              </div>
              <PasswordField id="rp-confirm" label="Nové heslo znovu" autoComplete="new-password" minLength={8} value={confirmation} onChange={setConfirmation} />
            </>
          )}
          {action === 'verify-email' && <p className="text-ink-muted">Kliknutím potvrdíš svou e-mailovou adresu.</p>}
          {error && <p role="alert" className="text-warning-red text-sm border border-warning-red/30 bg-warning-red/10 rounded px-3 py-2">{error}</p>}
          <button disabled={loading} className={primaryButton}>
            {loading ? 'Odesílám…' : action === 'verify-email' ? 'Ověřit e-mail' : action === 'forgot-password' ? 'Poslat odkaz' : 'Uložit heslo'}
          </button>
          {action === 'reset-password' && <Link to="/forgot-password" className="block text-sm text-ink-muted underline underline-offset-2">Vyžádat nový odkaz</Link>}
        </form>
      )}
    </AuthLayout>
  );
}
