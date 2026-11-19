import type { ReactNode } from 'react';

// Panel ve stylu výkresu: nadpis v hlavičce, obsah pod linkou
export default function Panel({ title, aside, children, className = '', id }: { title: string; aside?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`bg-panel border border-panel-border rounded-lg ${className}`}>
      <div className="flex justify-between items-baseline gap-3 px-[18px] py-3 border-b border-panel-border label-caps text-sm">
        <h2>{title}</h2>
        {aside && <span className="text-ink-muted font-medium text-right">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
