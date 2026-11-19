import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../api/axios';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { PasswordField, StrengthMeter } from '../components/AuthLayout';
import { fieldClass, labelClass, primaryButton } from '../lib/ui';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Heslo musí mít alespoň 8 znaků.');
    if (password !== confirm) return setError('Hesla se neshodují.');
    setLoading(true);
    try {
      const res = await register({ email, password, name });
      // Účet je rovnou přihlášený; ověření e-mailu připomene lišta v aplikaci
      login(res.token, res.user);
      navigate('/dashboard', { replace: true, state: { welcome: true, emailSent: res.emailSent } });
    } catch (err) {
      setError(getErrorMessage(err, 'Registrace se nepovedla. Zkus to znovu.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Nový účet"
      footer={<>Už máš účet? <Link to="/login" className="text-ink font-semibold underline underline-offset-2">Přihlas se</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className={labelClass}>Jméno <span className="normal-case tracking-normal font-normal">(nepovinné)</span></label>
          <input id="reg-name" type="text" autoComplete="given-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="reg-email" className={labelClass}>E-mail</label>
          <input id="reg-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <PasswordField id="reg-password" label="Heslo" autoComplete="new-password" minLength={8} value={password} onChange={setPassword} describedBy="reg-strength" />
          <StrengthMeter id="reg-strength" password={password} />
        </div>
        <div>
          <PasswordField id="reg-confirm" label="Heslo znovu" autoComplete="new-password" minLength={8} value={confirm} onChange={setConfirm} describedBy="reg-confirm-hint" />
          <p id="reg-confirm-hint" className={`text-xs mt-1 ${mismatch ? 'text-warning-red' : 'text-ink-muted'}`}>
            {mismatch ? 'Hesla se neshodují.' : confirm && confirm === password ? 'Hesla se shodují.' : ' '}
          </p>
        </div>
        {error && <p role="alert" className="text-warning-red text-sm border border-warning-red/30 bg-warning-red/10 rounded px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? 'Zakládám účet…' : 'Vytvořit účet'}
        </button>
        <p className="text-xs text-ink-muted">
          Po registraci ti pošleme odkaz na ověření e-mailu. Aplikaci můžeš používat hned.
        </p>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
