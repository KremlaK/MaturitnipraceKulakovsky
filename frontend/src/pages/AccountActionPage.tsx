import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import api from '../api/axios';

type Action = 'verify-email' | 'forgot-password' | 'reset-password';
const TITLES: Record<Action, string> = {
  'verify-email': 'Ověření e-mailu',
  'forgot-password': 'Zapomenuté heslo',
  'reset-password': 'Nové heslo',
};

export default function AccountActionPage({ action }: { action: Action }) {
  const [params] = useSearchParams();
  const token = params.get('token');
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
      setPassword('');
      setConfirmation('');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error || 'Požadavek se nezdařil. Zkus to znovu.' : 'Něco se pokazilo.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full px-3 py-2.5 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge';
  return (
    <div className="min-h-screen bg-asphalt flex items-center justify-center px-4">
      <div className="bg-panel border border-panel-border rounded-xl p-8 w-full max-w-md">
        <h1 className="text-ink font-display font-semibold text-xl mb-6">{TITLES[action]}</h1>
        {missingToken ? (
          <p role="alert" className="text-warning-red">Odkaz neobsahuje platný token. Použij celý odkaz z e-mailu.</p>
        ) : message ? (
          <p role="status" className="text-ink">{message}</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {action === 'forgot-password' && (
              <label className="block text-ink-muted text-sm">E-mail
                <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </label>
            )}
            {action === 'reset-password' && (
              <>
                <label className="block text-ink-muted text-sm">Nové heslo (min. 8 znaků)
                  <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                </label>
                <label className="block text-ink-muted text-sm">Zopakuj nové heslo
                  <input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={inputClass} />
                </label>
              </>
            )}
            {action === 'verify-email' && <p className="text-ink-muted">Kliknutím potvrď svou e-mailovou adresu.</p>}
            {error && <p role="alert" className="text-warning-red text-sm">{error}</p>}
            <button disabled={loading} className="w-full bg-accent text-on-accent py-3 rounded font-mono-gauge font-bold disabled:opacity-50">
              {loading ? 'Odesílám...' : action === 'verify-email' ? 'Ověřit e-mail' : action === 'forgot-password' ? 'Poslat odkaz' : 'Uložit heslo'}
            </button>
          </form>
        )}
        {action === 'reset-password' && <Link to="/forgot-password" className="block mt-4 text-accent text-sm">Vyžádat nový odkaz</Link>}
        <Link to="/login" className="block mt-6 text-ink-muted hover:text-ink text-sm">Zpět na přihlášení</Link>
      </div>
    </div>
  );
}
