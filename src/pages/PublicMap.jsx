import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, MapPin, X, ArrowLeft } from 'lucide-react';
import GameMap from '../components/Map/GameMap';
const labels = { easy:'Fácil', medium:'Médio', hard:'Difícil' };
let pointsCache = null;
let pointsCachedAt = 0;
const CACHE_MS = 120000;
export default function PublicMap() {
  const [points,setPoints] = useState(pointsCache || []);
  const [loading,setLoading] = useState(!pointsCache);
  const [error,setError] = useState('');
  const [difficulty,setDifficulty] = useState('all');
  const [region,setRegion] = useState('all');
  const [selected,setSelected] = useState(null);
  useEffect(() => {
    let active = true;
    if (pointsCache && Date.now() - pointsCachedAt < CACHE_MS) return;
    fetch('/api/public-points').then(async r => { if (!r.ok) throw new Error('Catálogo temporariamente indisponível.'); return r.json(); })
      .then(data => { if (!active) return; const next = Array.isArray(data.points) ? data.points : []; pointsCache = next; pointsCachedAt = Date.now(); setPoints(next); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => points.filter(p => p.available !== false && (difficulty === 'all' || p.difficulty === difficulty) && (region === 'all' || p.region === region)), [points,difficulty,region]);
  const activePoint = visible.find(p => p.id === selected);
  return <main className="public-map-page">
    <header className="public-map-header"><Link to="/" className="public-back"><ArrowLeft size={18}/> Voltar ao encerramento</Link><span>RUA 2 · MAPA HISTÓRICO</span></header>
    <div className="public-map-body">
      <div className="public-map-title"><div><span className="eyebrow">EVENTO ENCERRADO</span><h1>Mapa da Caça às Bruxinhas</h1><p>Explore as localizações catalogadas durante o Halloween. O mapa é público e somente para consulta.</p></div><span className="public-map-readonly">Somente visualização</span></div>
      <div className="filters"><Filter size={17}/><select aria-label="Filtrar dificuldade" value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="all">Todas as dificuldades</option><option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option></select><select aria-label="Filtrar região" value={region} onChange={e=>setRegion(e.target.value)}><option value="all">Norte e Sul</option><option value="north">Norte</option><option value="south">Sul</option></select><span className="result-count">{visible.length} pontos</span></div>
      {loading && <div className="message">Carregando mapa histórico...</div>}{error && <div className="message error">{error}</div>}
      <div className="map-layout"><div className="map-wrapper"><GameMap points={visible} selectedId={selected} onPointClick={p=>setSelected(p.id)}/></div><aside className="points-panel"><h3><MapPin size={18}/> Localizações</h3><div className="points-list">{visible.map(p=><button key={p.id} className={`point-item ${selected === p.id ? 'selected':''}`} onClick={()=>setSelected(p.id)}><span className={`difficulty-dot ${p.difficulty}`}/><span><strong>{p.name?.trim() || 'Bruxinha'} #{String(p.number).padStart(3,'0')}</strong><small>{p.region==='north'?'Norte':'Sul'} · {labels[p.difficulty] || '—'}</small></span></button>)}</div></aside></div>
    </div>
    {activePoint && <div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-label="Detalhes da bruxinha" onClick={e=>e.stopPropagation()}><button className="icon-button close" onClick={()=>setSelected(null)} aria-label="Fechar"><X size={20}/></button><span className="eyebrow">ARQUIVO DA CAÇADA</span><h2>{activePoint.name?.trim() || 'Bruxinha'} #{String(activePoint.number).padStart(3,'0')}</h2><span className={`badge ${activePoint.difficulty}`}>{labels[activePoint.difficulty]}</span><div className="photo-grid">{(activePoint.images || []).map((img,i)=><a key={img.path || i} href={img.url} target="_blank" rel="noreferrer"><img src={img.url} alt={`Localização da bruxinha, foto ${i+1}`}/></a>)}{!activePoint.images?.length && <p className="muted">Nenhuma imagem cadastrada.</p>}</div><p className="public-map-note">A caçada foi encerrada. Este mapa está disponível apenas para consulta.</p></section></div>}
  </main>;
}
