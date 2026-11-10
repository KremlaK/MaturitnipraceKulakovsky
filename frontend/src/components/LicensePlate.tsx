interface Props {
  plate: string;
  /** Rok platnosti STK (dvojčíslí) pro kulatou nálepku, když ho známe. */
  stkYear?: string | null;
  size?: 'md' | 'sm';
}

// Česká SPZ: bílá s modrým pruhem EU. Nálepka STK se vkládá mezi první a druhou část.
export default function LicensePlate({ plate, stkYear, size = 'md' }: Props) {
  // Backend ukládá SPZ i bez mezery („2BN6183“) – rozdělí se za třetím znakem jako na značce
  const compact = plate.replace(/\s+/g, '').toUpperCase();
  const first = compact.slice(0, 3);
  const rest = compact.slice(3);
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-stretch border-2 border-[#1d1d1d] rounded-[5px] bg-white text-[#111] overflow-hidden flex-none ${sm ? 'h-8' : 'h-[46px]'}`}
      aria-label={`SPZ ${plate}${stkYear ? `, STK do roku 20${stkYear}` : ''}`}
    >
      <span className={`bg-[#1f4fbf] text-[#fff] flex flex-col justify-end items-center font-semibold ${sm ? 'w-4 pb-0.5 text-[8px]' : 'w-[22px] pb-1 text-[10px]'}`}>
        CZ
      </span>
      <span className={`flex items-center font-mono-gauge font-semibold tracking-[0.06em] ${sm ? 'gap-1.5 px-2 text-sm' : 'gap-2 px-3 text-2xl'}`}>
        <span>{first}</span>
        {stkYear && !sm && (
          <span className="w-5 h-5 rounded-full border-[1.5px] border-[#2f6b4f] text-[#2f6b4f] grid place-items-center text-[8px] font-semibold" title={`STK do roku 20${stkYear}`}>
            {stkYear}
          </span>
        )}
        <span>{rest}</span>
      </span>
    </span>
  );
}
