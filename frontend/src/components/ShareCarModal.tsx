import { useEffect, useState, type FormEvent } from 'react';
import { getShares, createShare, deleteShare, SHARE_ROLE_LABELS, type CarShare, type ShareRole } from '../api/shares';

interface Props {
  carId: string;
  onClose: () => void;
}

function ShareCarModal({ carId, onClose }: Props) {
  const [shares, setShares] = useState<CarShare[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('SPOLUMAJITEL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  async function loadShares() {
    setLoadingList(true);
    try {
      const data = await getShares(carId);
      setShares(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadShares();
  }, [carId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createShare(carId, email, role);
      setEmail('');
      loadShares();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Něco se pokazilo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(shareId: string) {
    if (!confirm('Opravdu zrušit přístup tomuto uživateli?')) return;
    await deleteShare(shareId);
    loadShares();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
      <div className="bg-panel border border-panel-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-display font-semibold text-lg mb-4 uppercase tracking-wider">Sdílet auto</h2>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">E-mail uživatele</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kolega@email.cz"
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ShareRole)}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            >
              {Object.entries(SHARE_ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <p className="text-slate-600 text-xs mt-1 font-mono-gauge">
              Uživatel musí být v AutoApp už zaregistrovaný.
            </p>
          </div>

          {error && (
            <p className="text-warning-red text-sm font-mono-gauge border border-warning-red/30 bg-warning-red/10 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gauge-yellow hover:brightness-110 text-black py-2 rounded font-mono-gauge font-bold text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Sdílím...' : '+ Sdílet'}
          </button>
        </form>

        <div className="border-t border-panel-border pt-4">
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 font-mono-gauge">Kdo má přístup</h3>

          {loadingList ? (
            <p className="text-slate-500 text-sm font-mono-gauge">Načítám...</p>
          ) : shares.length === 0 ? (
            <p className="text-slate-500 text-sm font-mono-gauge">Auto zatím není s nikým sdílené.</p>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div key={share.id} className="flex justify-between items-center bg-asphalt-light border border-panel-border rounded px-3 py-2">
                  <div>
                    <p className="text-white text-sm font-mono-gauge">{share.user.name || share.user.email}</p>
                    <p className="text-slate-500 text-xs font-mono-gauge">
                      {share.user.email} • {SHARE_ROLE_LABELS[share.role]}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(share.id)}
                    className="text-slate-600 hover:text-warning-red text-xs font-mono-gauge"
                  >
                    Odebrat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 border border-panel-border text-slate-400 hover:text-white hover:border-slate-500 py-2 rounded font-mono-gauge text-sm uppercase tracking-wider"
        >
          Zavřít
        </button>
      </div>
    </div>
  );
}

export default ShareCarModal;