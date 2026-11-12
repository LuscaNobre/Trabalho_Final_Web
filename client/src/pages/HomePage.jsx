import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Clock3, Instagram, MapPin, Scissors, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import ServiceCard from '../components/ServiceCard';
import { barberPhoto } from '../lib/barberPhotos';
import Loading from '../components/Loading';

const categories = ['Todos', 'Cortes & Estilos', 'Barba & Rosto', 'Tratamentos & Rituais'];

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [category, setCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/services'), api('/barbers')]).then(([serviceData, barberData]) => {
      setServices(serviceData.services); setBarbers(barberData.barbers);
    }).catch((issue) => setError(issue.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => category === 'Todos' ? services : services.filter((service) => service.category === category), [services, category]);

  return <>
    <main id="top">
      <section className="hero-section">
        <div className="hero-grid wrap">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="live-dot" /> RORAIMA · BRASIL <span className="kicker-line" /> EST. MMXXIV</div>
            <h1>Seu corte.<br /><span>Sua</span> <em>assinatura.</em></h1>
            <p className="hero-lede">Mais que corte, é presença. Chega junto no Estúdio Street 095 e deixa o visual falar por você.</p>
            <div className="hero-actions"><Link to="/agendar" className="button button-primary button-large">Reservar meu horário <ArrowUpRight size={19} /></Link><a href="#servicos" className="button button-ghost">Explorar serviços <ArrowDown size={16} /></a></div>
            <div className="hero-proof"><div className="proof-avatars"><span className="proof-photo"><img src="/images/barbeiro-nox-avatar.webp" alt="" /></span><span className="proof-photo"><img src="/images/barbeiro-kruz-avatar.webp" alt="" /></span><span className="proof-photo"><img src="/images/barbeiro-luan-avatar.webp" alt="" /></span></div><div><strong>Chega mais, crew.</strong><small>Seu próximo corte começa aqui.</small></div></div>
          </div>
          <div className="hero-art">
            <div className="art-tape">STREET<br />095</div><div className="art-circle art-circle-one" /><div className="art-circle art-circle-two" />
            <div className="art-frame"><div className="art-backdrop art-photo"><img src="/images/hero-cadeira.webp" alt="Cadeira de barbeiro sob um aro de neon verde, com parede de cartazes rasgados e grafite laranja" width="1024" height="1536" fetchpriority="high" /><div className="art-side-label">CORTE<br />NA RUA</div></div></div>
            <div className="art-caption"><span>01 / 03</span><span>ATITUDE DE RUA.</span><span>BOA VISTA, RR</span></div>
            <div className="hero-sticker"><Scissors size={18} /><span>NO FRESH<br />CUTS ONLY</span></div>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true"><div>FADE LIMPO BARBA NA RÉGUA PRESENÇA NA RUA FADE LIMPO BARBA NA RÉGUA PRESENÇA NA RUA</div></div>
      </section>

      <section className="section services-section" id="servicos">
        <div className="wrap">
          <div className="section-heading"><div><span className="eyebrow"><span className="section-index">01</span> / O MENU</span><h2>Escolhe teu <em>movimento.</em></h2><p>Serviço de responsa, detalhe por detalhe.</p></div><Link className="text-link desktop-only" to="/agendar">Ver horários disponíveis <ArrowRight size={16} /></Link></div>
          <div className="filter-row" aria-label="Filtrar serviços">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`filter-chip ${category === item ? 'filter-active' : ''}`}>{item}</button>)}</div>
          {loading ? <Loading label="Buscando o menu..." /> : error ? <div className="notice notice-error">{error}<button className="text-button" onClick={() => window.location.reload()}>Tentar de novo</button></div> : filtered.length ? <div className="services-grid">{filtered.map((service, index) => <ServiceCard key={service._id} service={service} index={index} />)}</div> : <div className="empty-state">Os serviços aparecem aqui quando o servidor estiver conectado.</div>}
          <Link className="text-link mobile-only" to="/agendar">Ver horários disponíveis <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="manifesto-section">
        <div className="manifesto-noise" />
        <div className="wrap manifesto-content"><span className="eyebrow"><span className="section-index">02</span> / NOSSA VISÃO</span><div className="manifesto-stamp">095<br /><small>RR</small></div><h2>Não é só<br />um <em>corte.</em></h2><div className="manifesto-bottom"><p>É chegar junto, trocar ideia e sair com aquela confiança de quem tá pronto pra qualquer corre. A rua é nossa. A cadeira também.</p><span className="manifesto-mark">BEM-VINDO À CREW.</span></div></div>
      </section>

      <section className="section crew-section" id="equipe">
        <div className="wrap"><div className="section-heading"><div><span className="eyebrow"><span className="section-index">03</span> / QUEM FAZ</span><h2>Na cadeira, <em>os brabos.</em></h2><p>Visão, técnica e aquele papo reto.</p></div><div className="crew-tag"><BadgeCheck size={17} /> CREW STREET 095</div></div>
          {loading ? <Loading label="Apresentando a crew..." /> : barbers.length ? <div className="barber-grid">{barbers.map((barber, index) => <article className="barber-card" key={barber._id}><div className={`barber-portrait portrait-${index % 3}`}>{barberPhoto(barber) ? <img src={barberPhoto(barber)} alt={`Retrato do barbeiro ${barber.name}`} loading="lazy" /> : <><span className="portrait-number">0{index + 1}</span><span className="portrait-initial">{barber.name.charAt(0)}</span><span className="portrait-graffiti">STREET</span></>}</div><div className="barber-info"><div><h3>{barber.name}</h3><span>{barber.specialty}</span></div><Link to="/agendar" className="barber-book" aria-label={`Agendar com ${barber.name}`}><ArrowUpRight size={18} /></Link></div><p>{barber.bio}</p></article>)}</div> : <p className="empty-state">Nossa equipe vai aparecer aqui.</p>}
        </div>
      </section>

      <section className="booking-banner"><img className="banner-photo" src="/images/ferramentas-banner.webp" alt="" aria-hidden="true" loading="lazy" /><div className="wrap booking-banner-inner"><div><span className="eyebrow">A RUA TE CHAMA</span><h2>Teu próximo<br /><em>corte tá logo ali.</em></h2></div><Link to="/agendar" className="button button-dark button-large">Bora marcar <ArrowUpRight size={18} /></Link></div></section>

      <section className="visit-section"><div className="wrap visit-grid"><div><span className="eyebrow"><span className="section-index">04</span> / ENCOSTA AÍ</span><h2>Na rua ou<br /><em>na cadeira.</em></h2></div><div className="visit-details"><div className="visit-detail"><MapPin /><div><strong>Boa Vista, Roraima</strong><span>Estúdio Street 095 · cola com a gente</span></div></div><div className="visit-detail"><Clock3 /><div><strong>Ter a sáb · 9h às 19h</strong><span>Intervalo da crew: 12h às 13h</span></div></div><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="visit-social"><Instagram size={17} /> Siga a crew no Instagram <ArrowUpRight size={15} /></a></div></div></section>
    </main>
  </>;
}
