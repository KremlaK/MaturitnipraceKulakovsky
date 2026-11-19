import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resendVerification } from '../api/auth';
import { getErrorMessage } from '../api/axios';
import Icon, { type IconName } from './Icon';

interface Props {
  children: ReactNode;
  /** Co udělá tlačítko Tankovat ve spodní liště. Bez něj se otevře výběr auta v garáži. */
  onFuel?: () => void;
}

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/dashboard', label: 'Garáž', icon: 'garage' },
  { to: '/map', label: 'Mapa', icon: 'map' },
  { to: '/help', label: 'Nápověda', icon: 'help' },
];

function AccountPanel({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Element;
      if (target.closest('[data-account-toggle]')) return; // přepínací tlačítko řeší samo
      if (ref.current && !ref.current.contains(target)) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  const item = 'w-full flex items-center gap-3 px-4 py-3 text-ink hover:bg-asphalt-light text-left';
  return (
    <div ref={ref} role="dialog" aria-label="Účet" className="absolute right-0 top-12 w-72 z-50 bg-panel border border-panel-border rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border">
        <p className="label-caps text-xs text-ink-muted">Přihlášen</p>
        <p className="text-ink font-medium truncate">{user?.name || user?.email}</p>
        {user?.name && <p className="text-ink-muted text-sm truncate">{user.email}</p>}
      </div>
      <Link to="/account" className={item} onClick={onClose}><Icon name="user" /> Můj účet a oblíbené pumpy</Link>
      <Link to="/reviews" className={item} onClick={onClose}><Icon name="star" /> Recenze</Link>
      <Link to="/help#nahlasit" className={item} onClick={onClose}><Icon name="bug" /> Nahlásit chybu</Link>
      <button onClick={toggleTheme} className={`${item} border-t border-panel-border`}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} /> {theme === 'dark' ? 'Světlý motiv' : 'Tmavý motiv'}
      </button>
      <button onClick={logout} className={`${item} border-t border-panel-border`}>
        <Icon name="logout" /> Odhlásit se
      </button>
    </div>
  );
}

function readDismissed() {
  try {
    return sessionStorage.getItem('verifyBannerDismissed') === '1';
  } catch {
    return false;
  }
}

// Připomenutí neověřeného e-mailu (bez ověření nechodí upozornění na STK a servis)
function VerifyBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  if (!user || user.emailVerified !== false || dismissed) return null;

  async function resend() {
    setSending(true);
    try {
      setMessage(await resendVerification());
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem('verifyBannerDismissed', '1');
    } catch {
      // jen se nezapamatuje
    }
  }

  return (
    <div className="bg-accent-soft border-b border-panel-border">
      <div className="max-w-[1320px] mx-auto px-4 md:px-7 py-2.5 flex items-center gap-3 text-sm">
        <Icon name="bell" className="text-accent flex-none" />
        <p className="flex-1">
          {message || <>Potvrď prosím svůj e-mail <b>{user.email}</b> – jinak ti nepřijdou upozornění na STK a servis.</>}
        </p>
        {!message && (
          <button onClick={resend} disabled={sending} className="font-semibold underline underline-offset-2 whitespace-nowrap">
            {sending ? 'Posílám…' : 'Poslat znovu'}
          </button>
        )}
        <button onClick={dismiss} className="p-1 text-ink-muted hover:text-ink" aria-label="Skrýt upozornění">
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children, onFuel }: Props) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);

  function handleFuel() {
    if (onFuel) onFuel();
    else navigate('/dashboard', { state: { openFuel: true } });
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 label-caps text-[11px] ${isActive ? 'text-ink' : 'text-ink-muted'}`;

  return (
    <div className="min-h-screen pb-28 md:pb-0">
      <a href="#obsah" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:p-2 focus:bg-panel">Přeskočit na obsah</a>
      <header className="sticky top-0 z-30 bg-panel border-b border-panel-border">
        <div className="max-w-[1320px] mx-auto flex items-center gap-6 px-4 md:px-7 h-16">
          <Link to="/dashboard" className="flex items-center gap-2.5 text-ink">
            <Icon name="logo" size={26} className="text-accent" />
            <span className="font-display font-bold text-[22px] tracking-[0.08em]">AUTOAPP</span>
          </Link>
          <nav aria-label="Hlavní navigace" className="hidden md:flex gap-1 h-full">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `label-caps text-base px-3 flex items-center border-b-2 ${isActive ? 'text-ink border-accent' : 'text-ink-muted border-transparent hover:text-ink'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 relative">
            <button
              onClick={toggleTheme}
              className="grid w-10 h-10 place-items-center border border-panel-border rounded-lg text-ink hover:border-ink-muted"
              aria-label={theme === 'dark' ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
              title="Přepnout motiv"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="hidden md:grid w-10 h-10 place-items-center border border-panel-border rounded-lg text-ink hover:border-ink-muted"
              aria-label="Účet"
              aria-expanded={accountOpen}
              data-account-toggle
            >
              <Icon name="user" />
            </button>
            {accountOpen && <AccountPanel onClose={() => setAccountOpen(false)} />}
          </div>
        </div>
      </header>
      <VerifyBanner />

      <main id="obsah" className="max-w-[1320px] mx-auto">{children}</main>

      {/* Spodní navigace na mobilu: Tankovat je uprostřed na dosah palce */}
      <nav
        aria-label="Spodní navigace"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-panel border-t border-panel-border grid grid-cols-5 items-end px-1.5 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]"
      >
        <NavLink to="/dashboard" className={navClass}><Icon name="garage" size={22} />Garáž</NavLink>
        <NavLink to="/map" className={navClass}><Icon name="map" size={22} />Mapa</NavLink>
        <button onClick={handleFuel} className="flex flex-col items-center gap-1 label-caps text-[11px] text-accent -mt-8">
          <span className="w-[60px] h-[60px] rounded-full bg-accent text-on-accent grid place-items-center shadow-lg">
            <Icon name="fuel" size={26} strokeWidth={2} />
          </span>
          Tankovat
        </button>
        <NavLink to="/help" className={navClass}><Icon name="help" size={22} />Nápověda</NavLink>
        <NavLink to="/account" className={navClass}><Icon name="user" size={22} />Účet</NavLink>
      </nav>
    </div>
  );
}
