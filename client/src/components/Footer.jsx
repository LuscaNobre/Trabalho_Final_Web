import { Instagram, MapPin, MoveUpRight } from 'lucide-react';
import Brand from './Brand';

export default function Footer() {
  return <footer className="site-footer">
    <div className="wrap footer-main">
      <div><Brand /><p className="footer-note">Corte na rua.<br />Estilo na vida.</p></div>
      <div className="footer-meta"><span>COLA COM A GENTE</span><p><MapPin size={15} /> Boa Vista, Roraima</p><p><Instagram size={15} /> @estudiostreet095</p></div>
      <button type="button" className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Voltar ao topo"><MoveUpRight /></button>
    </div>
    <div className="wrap footer-bottom"><span>© 2026 Estúdio Street 095</span><span>Feito na rua, com atitude.</span></div>
  </footer>;
}
