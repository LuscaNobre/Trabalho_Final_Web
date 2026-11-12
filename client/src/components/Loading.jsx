export default function Loading({ label = 'Carregando...' }) { return <div className="loading-state" role="status"><span className="spinner" />{label}</div>; }
