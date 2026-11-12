import { ArrowUpRight, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/api';

export default function ServiceCard({ service, index = 0 }) {
  return <article className={`service-card ${service.featured ? 'service-featured' : ''}`} style={{ '--card-index': index }}>
    <div className="service-card-top"><span className="service-number">{String(index + 1).padStart(2, '0')}</span><span className="service-duration"><Clock3 size={14} /> {service.durationMinutes} min</span></div>
    <div className="service-card-body"><span className="eyebrow service-category">{service.category}</span><h3>{service.name}</h3><p>{service.description}</p></div>
    <div className="service-card-bottom"><div><strong>{service.priceNote || formatCurrency(service.price)}</strong><span>por sessão</span></div><Link to={`/agendar?serviceId=${service._id}`} className="service-arrow" aria-label={`Agendar ${service.name}`}><ArrowUpRight size={19} /></Link></div>
  </article>;
}
