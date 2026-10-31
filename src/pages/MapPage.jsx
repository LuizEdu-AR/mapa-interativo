import { useEffect, useMemo, useState } from "react";
import { Check, Filter, MapPin, Plus, X } from "lucide-react";
import GameMap from "../components/Map/GameMap";
import { useAuth } from "../contexts/AuthContext";
import { subscribeWitches } from "../services/witchService";
import { subscribeProgress, toggleCompleted } from "../services/progressService";
import { Link } from "react-router-dom";

const labels = { easy: "Fácil", medium: "Médio", hard: "Difícil" };

export default function MapPage() {
    const { user, isAdmin } = useAuth();
    const [witches, setWitches] = useState([]);
    const [completed, setCompleted] = useState(new Set());
    const [progressReady, setProgressReady] = useState(false);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("all");
    const [status, setStatus] = useState("all");
    const [region, setRegion] = useState("all");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => subscribeWitches(setWitches, () => setError("Não foi possível carregar os pontos.")), []);
    useEffect(() => {
        setProgressReady(false);
        setCompleted(new Set());
        if (!user) return;
        return subscribeProgress(user.uid, (ids) => {
            setCompleted(ids);
            setProgressReady(true);
        }, () => setError("Não foi possível carregar seu progresso. Tente atualizar a página."));
    }, [user]);

    const visibleWitches = useMemo(() => witches.filter((witch) => witch.available !== false), [witches]);
    const hiddenNorth = witches.filter((witch) => witch.region === "north" && witch.available === false).length;
    const filtered = useMemo(() => visibleWitches.filter((witch) => {
        if (region !== "all" && (witch.region || (witch.y < 0.5 ? "north" : "south")) !== region) return false;
        if (filter !== "all" && witch.difficulty !== filter) return false;
        if (status === "done" && !completed.has(witch.id)) return false;
        if (status === "pending" && completed.has(witch.id)) return false;
        return true;
    }), [visibleWitches, completed, filter, status, region]);
    const mapped = useMemo(() => filtered.map((witch) => ({ ...witch, completed: completed.has(witch.id) })), [filtered, completed]);
    const count = witches.filter((witch) => completed.has(witch.id)).length;
    const regionalCounts = useMemo(() => witches.reduce((totals, witch) => {
        const region = witch.region || (witch.y < 0.5 ? "north" : "south");
        if (region === "north" || region === "south") totals[region] += 1;
        return totals;
    }, { north: 0, south: 0 }), [witches]);
    const active = visibleWitches.find((witch) => witch.id === selected);

    async function handleToggle() {
        if (!active || !user || !progressReady) return;
        setBusy(true);
        try {
            await toggleCompleted(user.uid, active.id, completed.has(active.id));
            setCompleted((previous) => { const next = new Set(previous); if (next.has(active.id)) next.delete(active.id); else next.add(active.id); return next; });
        } catch (caught) {
            setError(caught.message || "Não foi possível atualizar o progresso.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="page-content">
            <section className="hero-card"><div className="hero-copy">
                <span className="eyebrow">EVENTO DE HALLOWEEN</span>
                <h1>Caça às Bruxinhas</h1>
                <p>100 bruxinhas estão escondidas pela cidade. Explore o mapa, encontre cada uma e acompanhe sua coleção!</p>
                <div className="progress-label"><strong>{count}</strong> de 100 coletadas</div>
                <div className="progress-track"><div style={{ width: `${Math.min(100, count)}%` }} /></div>
                <small>Restam {Math.max(0, 100 - count)} bruxinhas para completar sua coleção</small>
                </div><div className="hero-witch" aria-label="Bruxinha do evento de Halloween girando na vassoura" role="img">
                    <video
                        className="hero-witch-video"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster="/bruxinha.png"
                        aria-hidden="true"
                    >
                        <source src="/bruxinha_coleta.webm" type="video/webm" />
                    </video>
                </div>
            </section>
            <section className="region-catalog-section" aria-label="Bruxinhas catalogadas por região">
                <div className="region-progress-grid" aria-label="Catalogação por região">
                    {[
                        { label: "Bruxinhas do Norte catalogadas para quem pegou as da ilha", value: regionalCounts.north, description: "Inclui os pontos da antiga ilha que aguardam realocação." },
                        { label: "Bruxinhas do Norte catalogadas para quem NÃO pegou as da ilha", value: regionalCounts.north - hiddenNorth, description: "Pontos com localização disponível no momento." },
                        { label: "Bruxinhas do Sul catalogadas", value: regionalCounts.south }
                    ].map(({ label, value, description }) => (
                        <div className="region-progress-card" key={label}>
                            <div className="region-progress-heading"><span>{label}</span><strong>{value}/50</strong></div>
                            <div className="region-progress-track" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={50}>
                                <div style={{ width: `${Math.min(100, value * 2)}%` }} />
                            </div>
                            {description && <small className="muted">{description}</small>}
                        </div>
                    ))}
                </div>
            </section>
            <section className="map-section">
                <div className="section-header">
                    <div><span className="eyebrow">EXPLORE A CIDADE</span><h2>Mapa das Bruxinhas</h2></div>
                    {isAdmin && <Link className="button primary" to="/admin"><Plus size={17} /> Gerenciar pontos</Link>}
                </div>
                <div className="message island-notice" role="note">
                    <strong>Atualização da Região Norte — retirada da ilha</strong>
                    <p>Devido à retirada da ilha da cidade, 11 bruxinhas terão suas localizações realocadas para outros pontos do Norte. As localizações antigas serão retiradas do mapa conforme a atualização.</p>
                    <p>Quem já resgatou essas bruxinhas mantém suas conquistas e não precisará resgatá-las novamente. {hiddenNorth > 0 ? `${hiddenNorth} ponto(s) aguardando nova localização no momento.` : "Acompanhe as atualizações das localizações."}</p>
                </div>
                <div className="filters">
                    <Filter size={17} />
                    <select aria-label="Filtrar dificuldade" value={filter} onChange={(event) => setFilter(event.target.value)}>
                        <option value="all">Todas as dificuldades</option>
                        <option value="easy">Fácil</option>
                        <option value="medium">Médio</option>
                        <option value="hard">Difícil</option>
                    </select>
                    <select aria-label="Filtrar região" value={region} onChange={(event) => setRegion(event.target.value)}>
                        <option value="all">Norte e Sul</option>
                        <option value="north">Norte</option>
                        <option value="south">Sul</option>
                    </select>
                    <select aria-label="Filtrar conclusão" value={status} onChange={(event) => setStatus(event.target.value)}>
                        <option value="all">Todos os pontos</option>
                        <option value="done">Concluídos</option>
                        <option value="pending">Pendentes</option>
                    </select>
                    <span className="result-count">{filtered.length} pontos</span>
                </div>
                {error && <div className="message error">{error}</div>}
                <div className="map-layout">
                    <div className="map-wrapper"><GameMap points={mapped} selectedId={selected} onPointClick={(witch) => setSelected(witch.id)} /></div>
                    <aside className="points-panel">
                        <h3><MapPin size={18} /> Localizações</h3>
                        <div className="points-list">
                            {filtered.length === 0 && <p className="muted">Nenhum ponto encontrado. Os administradores podem cadastrar as bruxinhas.</p>}
                            {filtered.map((witch) => (
                                <button key={witch.id} className={`point-item ${selected === witch.id ? "selected" : ""}`} onClick={() => setSelected(witch.id)}>
                                    <span className={`difficulty-dot ${completed.has(witch.id) ? "completed" : witch.difficulty}`} />
                                    <span><strong>{witch.name?.trim() || "Bruxinha"} #{String(witch.number).padStart(3, "0")}</strong><small>{(witch.region || (witch.y < 0.5 ? "north" : "south")) === "north" ? "Norte" : "Sul"} · {labels[witch.difficulty]}</small></span>
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>
            {active && (
                <div className="modal-backdrop" onClick={() => setSelected(null)}>
                    <section className="modal" role="dialog" aria-modal="true" aria-label="Detalhes da bruxinha" onClick={(event) => event.stopPropagation()}>
                        <button className="icon-button close" onClick={() => setSelected(null)} aria-label="Fechar"><X size={20} /></button>
                        <span className="eyebrow">LOCALIZAÇÃO ENCONTRADA</span>
                        <h2>{active.name?.trim() || "Bruxinha"} #{String(active.number).padStart(3, "0")}</h2>
                        <span className={`badge ${active.difficulty}`}>{labels[active.difficulty]}</span>
                        <div className="photo-grid">
                            {(active.images || []).map((image, index) => <a key={image.path || index} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={`Localização da bruxinha, foto ${index + 1}`} /></a>)}
                            {!active.images?.length && <p className="muted">Nenhuma imagem cadastrada.</p>}
                        </div>
                        <button className={`button full ${completed.has(active.id) ? "secondary" : "primary"}`} onClick={handleToggle} disabled={busy || !progressReady}>
                            <Check size={18} /> {completed.has(active.id) ? "Desmarcar conclusão" : "Marcar como concluída"}
                        </button>
                    </section>
                </div>
            )}
        </main>
    );
}
