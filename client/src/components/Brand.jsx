export default function Brand({ compact = false }) {
  return <span className={`brand-lockup ${compact ? 'brand-compact' : ''}`} aria-label="Estúdio Street 095">
    <span className="brand-mark">095</span><span className="brand-word">ESTÚDIO<br /><b>STREET</b></span>
  </span>;
}
