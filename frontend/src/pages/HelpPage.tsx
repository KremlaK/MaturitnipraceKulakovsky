import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import { getMyBugReports, reportBug, type BugStatus, type MyBugReport } from '../api/feedback';
import { getErrorMessage } from '../api/axios';
import { fieldClass, labelClass } from '../lib/ui';

interface Faq {
  q: string;
  a: ReactNode;
  keywords?: string;
}

const FAQ: { group: string; items: Faq[] }[] = [
  {
    group: 'Garáž a auta',
    items: [
      { q: 'Jak přidám auto?', a: <>V garáži klikni na <b>Přidat auto</b> nebo na volné stání. Stačí značka a model, ostatní (VIN, SPZ, rok, nájezd) můžeš doplnit později. Z VIN umíme načíst značku, model a rok.</> },
      { q: 'Co znamenají patra garáže?', a: <>V jednom patře jsou 4 stání. Když máš aut víc, přibude další patro – přepínáš ho šipkami vedle garáže (jako ve výtahu).</>, keywords: 'patro výtah šipky' },
      { q: 'Co znamená kontrolka nad stáním?', a: <>Zelená = nic nehoří. Oranžová = blíží se termín: připomínka podle data do 30 dní nebo podle kilometrů do 2 000 km. Na kontrolku najeď myší a uvidíš které.</>, keywords: 'světlo barva oranžová zelená' },
      { q: 'Jakou fotku auta nahrát?', a: <>Celé auto přesně <b>zepředu</b> nebo přesně <b>z boku</b>, ideálně ve výšce světel a za světla. Při nahrávání zvolíš, odkud je vyfocená – podle toho ji v garáži správně ořízneme. Bez fotky ukážeme obrys podle typu karoserie.</>, keywords: 'fotka obrázek zepředu bok' },
      { q: 'Proč je na výkresu jiný tvar auta?', a: <>Výkres se kreslí podle typu karoserie (hatchback, sedan, kombi, SUV). Vyber ho v <b>Upravit</b> u auta – jinak ho odhadujeme z názvu modelu.</>, keywords: 'karoserie sedan kombi suv hatchback obrys' },
    ],
  },
  {
    group: 'Tankování a spotřeba',
    items: [
      { q: 'Jak se počítá spotřeba?', a: <>Z tankování <b>do plna</b>: litry od jednoho plného tankování do dalšího vydělené ujetými kilometry. Částečná tankování mezi nimi se započítají. Potřebuješ aspoň dvě tankování do plna.</>, keywords: 'litry na 100 km průměr' },
      { q: 'Jak zapsat tankování co nejrychleji?', a: <>Ťukni na <b>Tankovat</b> (na mobilu uprostřed dole). Tachometr i palivo předvyplníme z minula, cenu za litr a litry jde psát i s čárkou. Pumpu vybereš jedním ťuknutím z oblíbených.</>, keywords: 'rychle pumpa' },
      { q: 'Jak si uložím oblíbenou pumpu?', a: <>V <Link to="/account" className="underline underline-offset-2">Můj účet</Link> → Oblíbené pumpy. Můžeš je vyhledat, nebo přidat jedním ťuknutím z míst, kde jsi nedávno tankoval. Při tankování je pak najdeš nahoře u polohy.</>, keywords: 'oblíbené čerpací stanice' },
    ],
  },
  {
    group: 'Připomínky a e-maily',
    items: [
      { q: 'Kdy mi přijde upozornění?', a: <>Každé ráno v 8:00 kontrolujeme připomínky. E-mail přijde 14 dní před termínem nebo 1 000 km před nájezdem a znovu nejdřív za týden, dokud připomínku neodškrtneš.</>, keywords: 'stk olej e-mail notifikace' },
      { q: 'Proč mi nechodí e-maily?', a: <>Upozornění posíláme jen na <b>ověřený e-mail</b> – ověřovací odkaz si můžeš poslat znovu v <Link to="/account" className="underline underline-offset-2">Můj účet</Link>. Zkontroluj taky spam a že má připomínka zapnuté upozornění e-mailem.</>, keywords: 'spam ověření' },
    ],
  },
  {
    group: 'Sdílení a export',
    items: [
      { q: 'Jak nasdílím auto rodině nebo servisu?', a: <>V knize údržby auta klikni na <b>Sdílet</b> a zadej e-mail registrovaného uživatele. <b>Spolumajitel</b> vidí a zapisuje vše a jeho náklady se mu počítají do celkových součtů. <b>Servis</b> může zapisovat záznamy, ale náklady se mu do součtů nepočítají.</>, keywords: 'sdílet rodina servis role' },
      { q: 'Jak si stáhnu servisní knížku?', a: <>V knize údržby auta jsou tlačítka <b>Servisní knížka PDF</b> (pro STK nebo kupce) a <b>Náklady Excel</b>.</>, keywords: 'pdf excel export' },
    ],
  },
  {
    group: 'Účet a bezpečnost',
    items: [
      { q: 'Zapomněl jsem heslo.', a: <>Na přihlašovací stránce klikni na <b>Zapomenuté heslo?</b>. Odkaz platí hodinu a jde použít jen jednou.</> },
      { q: 'Co se stane po změně hesla?', a: <>Odhlásíme tě na všech ostatních zařízeních. Na tom, kde heslo měníš, zůstaneš přihlášený.</>, keywords: 'odhlásit zařízení' },
      { q: 'Kde jsou moje data?', a: <>Záznamy jsou v databázi aplikace, fotky a faktury v úložišti Cloudinary. Hesla ukládáme jen jako bezpečný otisk (bcrypt), takže je nikdo nepřečte. V recenzích se ukazuje jen tvoje křestní jméno.</>, keywords: 'soukromí gdpr data' },
      { q: 'Jak smažu účet?', a: <>Zatím přes hlášení níže – napiš, že chceš účet smazat, a smažeme ho i se všemi auty a záznamy.</>, keywords: 'smazat zrušit' },
    ],
  },
];

const STATUS: Record<BugStatus, string> = { NEW: 'Přijato', SEEN: 'Řešíme', FIXED: 'Opraveno' };

export default function HelpPage() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [mine, setMine] = useState<MyBugReport[]>([]);

  const loadMine = useCallback(() => getMyBugReports().then(setMine).catch(() => setMine([])), []);
  useEffect(() => {
    loadMine();
  }, [loadMine]);

  useEffect(() => {
    if (location.hash === '#nahlasit') document.getElementById('nahlasit')?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  const q = query.trim().toLowerCase();
  const groups = FAQ.map((g) => ({
    ...g,
    items: g.items.filter((f) => !q || `${f.q} ${f.keywords ?? ''} ${g.group}`.toLowerCase().includes(q)),
  })).filter((g) => g.items.length);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      // přiložíme stránku, odkud uživatel přišel (pomůže chybu najít)
      const from = (location.state as { from?: string } | null)?.from ?? document.referrer;
      const text = await reportBug({ title, description, pageUrl: from ? String(from).slice(0, 500) : undefined });
      setResult({ ok: true, text });
      setTitle('');
      setDescription('');
      loadMine();
    } catch (err) {
      setResult({ ok: false, text: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <div className="px-4 md:px-7 py-5 md:py-7">
        <h1 className="font-display font-bold text-2xl md:text-[32px] uppercase tracking-wide">Nápověda</h1>
        <p className="text-ink-muted mt-1">Odpovědi na časté otázky. Nenašel jsi, co hledáš? Napiš nám dole.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 mt-5 items-start">
          <div className="space-y-5">
            <div>
              <label htmlFor="faq-search" className="sr-only">Hledat v nápovědě</label>
              <div className="relative">
                <Icon name="help" className="absolute left-3 top-3.5 text-ink-muted" />
                <input id="faq-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Hledat, např. spotřeba, STK, heslo…" className={`${fieldClass} pl-10`} />
              </div>
            </div>
            {groups.length === 0 && <p className="text-ink-muted">Nic jsme nenašli. Zkus jiné slovo nebo nám napiš.</p>}
            {groups.map((g) => (
              <Panel key={g.group} title={g.group}>
                <div className="divide-y divide-panel-border">
                  {g.items.map((f) => (
                    <details key={f.q} className="group px-[18px] py-1" open={!!q}>
                      <summary className="flex items-center justify-between gap-3 py-3 cursor-pointer list-none font-medium">
                        {f.q}
                        <Icon name="chevronDown" size={18} className="text-ink-muted transition-transform group-open:rotate-180 flex-none" />
                      </summary>
                      <p className="pb-3.5 text-ink-muted leading-relaxed">{f.a}</p>
                    </details>
                  ))}
                </div>
              </Panel>
            ))}
          </div>

          <div className="space-y-5 lg:sticky lg:top-24">
            <Panel title="Nahlásit chybu" id="nahlasit">
              <form onSubmit={submit} className="p-[18px] space-y-3">
                <div>
                  <label htmlFor="bug-title" className={labelClass}>Co nefunguje</label>
                  <input id="bug-title" required minLength={3} maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="např. Nejde uložit tankování" className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="bug-desc" className={labelClass}>Popis</label>
                  <textarea id="bug-desc" required minLength={10} maxLength={5000} rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Co jsi dělal, co se stalo a co jsi čekal." className={`${fieldClass} h-auto py-2.5`} />
                </div>
                <p className="text-xs text-ink-muted">Pošleme i typ prohlížeče, ať chybu snáz najdeme. Hesla ani data aut neposíláme.</p>
                {result && <p role={result.ok ? 'status' : 'alert'} className={`text-sm ${result.ok ? 'text-ok' : 'text-warning-red'}`}>{result.text}</p>}
                <button disabled={sending} className="h-11 px-5 rounded bg-accent text-on-accent label-caps text-sm disabled:opacity-50 inline-flex items-center gap-2">
                  <Icon name="bug" size={16} /> {sending ? 'Odesílám…' : 'Odeslat hlášení'}
                </button>
              </form>
              {mine.length > 0 && (
                <div className="border-t border-panel-border">
                  <p className="px-[18px] pt-3 label-caps text-xs text-ink-muted">Moje hlášení</p>
                  <ul className="px-[18px] pb-3">
                    {mine.map((b) => (
                      <li key={b.id} className="flex items-center gap-3 py-2 text-sm border-b border-panel-border last:border-b-0">
                        <span className="flex-1 truncate">{b.title}</span>
                        <span className={`label-caps text-[11px] ${b.status === 'FIXED' ? 'text-ok' : 'text-ink-muted'}`}>{STATUS[b.status]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            <Link to="/reviews" className="flex items-center gap-3 bg-panel border border-panel-border rounded-lg px-[18px] py-4 hover:border-ink-muted">
              <Icon name="star" className="text-accent" size={22} />
              <span className="flex-1"><b className="block">Jak se ti AutoApp líbí?</b><span className="text-sm text-ink-muted">Napiš recenzi – pomůže nám vědět, co zlepšit.</span></span>
              <Icon name="arrowRight" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
