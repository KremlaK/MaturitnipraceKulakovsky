import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';
import StationManager from '../components/StationManager';
import { PasswordField, StrengthMeter } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { changePassword, resendVerification, updateProfile } from '../api/auth';
import { getErrorMessage } from '../api/axios';
import { fieldClass, labelClass } from '../lib/ui';

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="bg-panel border border-panel-border rounded-lg">
      <div className="flex justify-between items-baseline gap-3 px-[18px] py-3 border-b border-panel-border">
        <h2 className="label-caps text-sm">{title}</h2>
        {aside}
      </div>
      <div className="p-[18px]">{children}</div>
    </section>
  );
}

const button = 'h-11 px-5 rounded bg-accent text-on-accent label-caps text-sm disabled:opacity-50';

export default function AccountPage() {
  const { user, updateUser, replaceToken, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [profileMsg, setProfileMsg] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy('profile');
    try {
      const u = await updateProfile(name);
      updateUser({ name: u.name });
      setProfileMsg('Uloženo.');
    } catch (err) {
      setProfileMsg(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    setBusy('verify');
    try {
      setVerifyMsg(await resendVerification());
    } catch (err) {
      setVerifyMsg(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setBusy('password');
    try {
      const res = await changePassword(current, next);
      replaceToken(res.token);
      setCurrent('');
      setNext('');
      setPwMsg({ ok: true, text: res.message });
    } catch (err) {
      setPwMsg({ ok: false, text: getErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <div className="px-4 md:px-7 py-5 md:py-7 max-w-5xl">
        <h1 className="font-display font-bold text-2xl md:text-[32px] uppercase tracking-wide mb-5">Můj účet</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="space-y-5">
            <Section title="Profil">
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label htmlFor="acc-name" className={labelClass}>Jméno</label>
                  <input id="acc-name" value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setProfileMsg(''); }} className={fieldClass} />
                  <p className="text-xs text-ink-muted mt-1">V recenzích se ukazuje jen křestní jméno, nikdy e-mail.</p>
                </div>
                <div>
                  <p className={labelClass}>E-mail</p>
                  <p className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium break-all">{user?.email}</span>
                    {user?.emailVerified ? (
                      <span className="label-caps text-[11px] text-ok border border-ok/40 rounded px-1.5 py-0.5 inline-flex items-center gap-1"><Icon name="check" size={12} /> Ověřený</span>
                    ) : (
                      <span className="label-caps text-[11px] text-accent border border-accent/40 rounded px-1.5 py-0.5">Neověřený</span>
                    )}
                  </p>
                  {!user?.emailVerified && (
                    <p className="text-sm text-ink-muted mt-1.5">
                      Bez ověření ti nepřijdou upozornění na STK a servis.{' '}
                      <button type="button" onClick={resend} disabled={busy === 'verify'} className="text-ink font-semibold underline underline-offset-2">
                        {busy === 'verify' ? 'Posílám…' : 'Poslat ověřovací e-mail znovu'}
                      </button>
                    </p>
                  )}
                  {verifyMsg && <p role="status" className="text-sm mt-1">{verifyMsg}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button disabled={busy === 'profile'} className={button}>Uložit</button>
                  {profileMsg && <span role="status" className="text-sm text-ink-muted">{profileMsg}</span>}
                </div>
              </form>
            </Section>

            <Section title="Změna hesla">
              <form onSubmit={savePassword} className="space-y-4">
                <PasswordField id="acc-current" label="Současné heslo" autoComplete="current-password" value={current} onChange={setCurrent} />
                <div>
                  <PasswordField id="acc-new" label="Nové heslo" autoComplete="new-password" minLength={8} value={next} onChange={setNext} describedBy="acc-strength" />
                  <StrengthMeter id="acc-strength" password={next} />
                </div>
                <p className="text-xs text-ink-muted">Po změně hesla tě odhlásíme na všech ostatních zařízeních.</p>
                {pwMsg && <p role={pwMsg.ok ? 'status' : 'alert'} className={`text-sm ${pwMsg.ok ? 'text-ok' : 'text-warning-red'}`}>{pwMsg.text}</p>}
                <button disabled={busy === 'password'} className={button}>Změnit heslo</button>
              </form>
            </Section>
          </div>

          <div className="space-y-5">
            <Section title="Oblíbené pumpy" aside={<span className="text-xs text-ink-muted">rychlý výběr při tankování</span>}>
              <StationManager />
            </Section>

            <Section title="Ostatní">
              <div className="flex flex-col divide-y divide-panel-border -my-2">
                <button onClick={toggleTheme} className="flex items-center gap-3 py-3 text-left">
                  <Icon name={theme === 'dark' ? 'sun' : 'moon'} /> {theme === 'dark' ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
                </button>
                <Link to="/help" className="flex items-center gap-3 py-3"><Icon name="help" /> Nápověda a nahlášení chyby</Link>
                <Link to="/reviews" className="flex items-center gap-3 py-3"><Icon name="star" /> Recenze aplikace</Link>
                <button onClick={logout} className="flex items-center gap-3 py-3 text-left text-warning-red"><Icon name="logout" /> Odhlásit se</button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
