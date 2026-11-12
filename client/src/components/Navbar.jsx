import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Menu, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  function logout() { signOut(); setOpen(false); navigate('/'); }
  return <header className="site-header">
    <div className="header-inner wrap">
      <Link to="/" className="brand-link" onClick={() => setOpen(false)}><Brand /></Link>
      <button className="menu-toggle" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${open ? 'nav-open' : ''}`}>
        <Link to="/#servicos" onClick={() => setOpen(false)}>Serviços</Link>
        <Link to="/#equipe" onClick={() => setOpen(false)}>A crew</Link>
        {user ? <Link to={isAdmin ? '/admin' : '/minha-conta'} className="nav-account" onClick={() => setOpen(false)}><UserRound size={16} /> {isAdmin ? 'Painel' : 'Minha conta'}</Link> : <Link to="/entrar" className="nav-account" onClick={() => setOpen(false)}><UserRound size={16} /> Entrar</Link>}
        <Link to="/agendar" className="button button-primary nav-cta" onClick={() => setOpen(false)}>Agendar agora <ArrowUpRight size={16} /></Link>
        {user && <button className="nav-logout" onClick={logout}>Sair</button>}
      </nav>
    </div>
  </header>;
}
