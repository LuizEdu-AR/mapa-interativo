import { Link } from 'react-router-dom';
import { Map, Sparkles } from 'lucide-react';

export default function EventClosed() {
  return <main className="event-closed">
    <div className="event-closed-glow" aria-hidden="true" />
    <div className="event-closed-content">
      <span className="event-closed-kicker">RUA 2 · HALLOWEEN 2026</span>
      <video className="event-closed-witch" src="/bruxinha_coleta.webm" autoPlay muted loop playsInline preload="metadata" poster="/bruxinha.png" aria-label="Bruxinha animada" />
      <div className="event-closed-pill"><Sparkles size={15}/> EVENTO ENCERRADO</div>
      <h1>A caça às bruxinhas<br/><em>chegou ao fim!</em></h1>
      <p>As 100 bruxinhas foram encontradas! Obrigado a cada jogador que explorou a cidade e fez parte dessa aventura.</p>
      <p className="event-closed-next">Aguarde até a próxima caçada. Novas surpresas estão por vir!</p>
      <Link to="/mapa" className="event-closed-map-link"><Map size={19}/> Olhar mapa da Caça às Bruxinhas</Link>
      <span className="event-closed-hint">Mapa histórico público · Somente visualização</span>
      <div className="event-closed-partners"><span>COM APOIO DE</span><div><img src="/LOGO_BRANCA.png" alt="Rua 2"/><img src="/villains-logo.png" alt="Villains"/></div></div>
    </div>
  </main>;
}
