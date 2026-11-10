import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Icon, { type IconName } from './Icon';

interface Props {
  children: ReactNode;
  /** Co udělá tlačítko Tankovat ve spodní liště. Bez něj otevře tankování na Přehledu. */
  onFuel?: () => void;
}

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/dashboard', label: 'Přehled', icon: 'overview', end: true },
  { to: '/cars', label: 'Moje auta', icon: 'car' },
  { to: '/map', label: 'Mapa', icon: 'map' },
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

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Účet"
      className="fixed inset-x-4 bottom-24 md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-12 md:w-72 z-50 bg-panel border border-panel-border rounded-lg shadow-lg"
    >
      <div className="px-4 py-3 border-b border-panel-border">
        <p className="label-caps text-xs text-ink-muted">Přihlášen</p>
        <p className="text-ink font-medium truncate">{user?.name || user?.email}</p>
        {user?.name && <p className="text-ink-muted text-sm truncate">{user.email}</p>}
      </div>
      <button
        onClick={toggleTheme}
        className="w-full flex items-center gap-3 px-4 py-3 text-ink hover:bg-asphalt-light text-left"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        {theme === 'dark' ? 'Světlý motiv' : 'Tmavý motiv'}
      </button>
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-4 py-3 text-ink hover:bg-asphalt-light text-left border-t border-panel-border rounded-b-lg"
      >
        <Icon name="logout" />
        Odhlásit se
      </button>
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

  return (
    <div className="min-h-screen pb-28 md:pb-0">
      <header className="sticky top-0 z-30 bg-panel border-b border-panel-border">
        <div className="max-w-[1320px] mx-auto flex items-center gap-6 px-4 md:px-7 h-16">
          <Link to="/dashboard" className="flex items-center gap-2.5 text-ink">
            <Icon name="logo" size={26} className="text-accent" />
            <span className="font-display font-bold text-[22px] tracking-[0.08em]">AUTOAPP</span>
          </Link>
          <nav aria-label="Hlavní navigace" className="hidden md:flex gap-1 h-full">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `label-caps text-base px-3 flex items-center border-b-2 ${
                    isActive ? 'text-ink border-accent' : 'text-ink-muted border-transparent hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 relative">
            <button
              onClick={toggleTheme}
              className="hidden md:grid w-10 h-10 place-items-center border border-panel-border rounded-lg text-ink hover:border-ink-muted"
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
            <button
              onClick={toggleTheme}
              className="md:hidden grid w-10 h-10 place-items-center border border-panel-border rounded-lg text-ink"
              aria-label={theme === 'dark' ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            {accountOpen && <AccountPanel onClose={() => setAccountOpen(false)} />}
          </div>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto">{children}</main>

      {/* Spodní navigace na mobilu: Tankovat je uprostřed na dosah palce */}
      <nav
        aria-label="Spodní navigace"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-panel border-t border-panel-border grid grid-cols-5 items-end px-1.5 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]"
      >
        {NAV.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 label-caps text-[11px] ${isActive ? 'text-ink' : 'text-ink-muted'}`
            }
          >
            <Icon name={item.icon} size={22} />
            {item.label === 'Moje auta' ? 'Auta' : item.label}
          </NavLink>
        ))}
        <button onClick={handleFuel} className="flex flex-col items-center gap-1 label-caps text-[11px] text-accent -mt-8">
          <span className="w-[60px] h-[60px] rounded-full bg-accent text-on-accent grid place-items-center shadow-lg">
            <Icon name="fuel" size={26} strokeWidth={2} />
          </span>
          Tankovat
        </button>
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 label-caps text-[11px] ${isActive ? 'text-ink' : 'text-ink-muted'}`
          }
        >
          <Icon name="map" size={22} />
          Mapa
        </NavLink>
        <button
          onClick={() => setAccountOpen((v) => !v)}
          className="flex flex-col items-center gap-1 label-caps text-[11px] text-ink-muted"
          aria-expanded={accountOpen}
          data-account-toggle
        >
          <Icon name="user" size={22} />
          Účet
        </button>
      </nav>
    </div>
  );
}
