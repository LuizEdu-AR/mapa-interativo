import { useEffect, useRef, useState } from "react";
import { Plus, Save, Trash2, X, MapPin, Pencil, Upload, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../services/firebase";
import GameMap from "../components/Map/GameMap";
import { subscribeWitches, saveWitch, removeWitch } from "../services/witchService";

const empty = { name: "", number: "", difficulty: "easy", region: "south", x: null, y: null, images: [] };

export default function AdminPage() {
    const { isOwner } = useAuth();
    const [tab, setTab] = useState("points");
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState("");
    const normalizeSearch = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const visibleUsers = users.filter((item) => {
        const query = normalizeSearch(userSearch).replace(/^#/, "");
        return normalizeSearch(item.name).includes(query) || String(item.playerId ?? "").toLowerCase().includes(query);
    });
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [roleBusy, setRoleBusy] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [witches, setWitches] = useState([]);
    const [form, setForm] = useState(empty);
    const [files, setFiles] = useState([]);
    const pasteAreaRef = useRef(null);
    const editSectionRef = useRef(null);
    const scrollToEditRef = useRef(false);
    const [fileError, setFileError] = useState("");
    const [editing, setEditing] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => subscribeWitches(setWitches, () => setError("Falha ao carregar pontos.")), []);

    function nextAvailable(points) {
        return Array.from({ length: 100 }, (_, index) => index + 1).find((number) => !points.some((witch) => Number(witch.number) === number));
    }

    async function ownerRequest(action, uid, role) {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch("/api/manage-users", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action, uid, role })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha ao gerenciar usuários.");
        return data;
    }

    async function loadUsers() {
        if (!isOwner) return;
        setLoadingUsers(true);
        try {
            const data = await ownerRequest("list");
            setUsers(data.users || []);
        } catch (caught) { setError(caught.message); }
        finally { setLoadingUsers(false); }
    }

    useEffect(() => { if (tab === "users" && isOwner) loadUsers(); }, [tab, isOwner]);

    async function changeRole(uid, role) {
        setRoleBusy(uid); setError("");
        try {
            await ownerRequest("role", uid, role);
            setMessage("Permissões atualizadas. O usuário deve entrar novamente para atualizar o acesso.");
            await loadUsers();
        } catch (caught) { setError(caught.message); }
        finally { setRoleBusy(""); }
    }

    const regionOf = (witch) => witch.region || (witch.y < 0.5 ? "north" : "south");

    function startNew(region = "south") {
        const available = nextAvailable(witches);
        if (!available) { setError("Todos os 100 números já estão ocupados."); return; }
        setForm((previous) => ({ ...empty, number: String(available), region, difficulty: previous.difficulty || "easy" }));
        setFiles([]);
        setFileError("");
        scrollToEditRef.current = true;
        setEditing(true);
        setPlacing(true);
        setMessage("");
        setError("");
    }

    useEffect(() => {
        if (!editing || !scrollToEditRef.current) return;
        scrollToEditRef.current = false;
        const frame = window.requestAnimationFrame(() => {
            const target = editSectionRef.current;
            if (!target) return;
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [editing, form.id]);

    function startEdit(witch) {
        scrollToEditRef.current = true;
        setForm({ ...witch, name: witch.name || "Bruxinha", region: witch.region || (witch.y < 0.5 ? "north" : "south") });
        setFiles([]);
        setFileError("");
        setEditing(true);
        setPlacing(false);
        setMessage("");
        setError("");
    }

    function addImages(incoming) {
        const images = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
        if (!images.length) return;
        if (images.some((file) => file.size > 5 * 1024 * 1024)) {
            setFileError("Cada imagem deve ter no máximo 5 MB.");
            return;
        }
        const slots = 2 - (form.images?.length || 0) - files.length;
        if (images.length > slots) {
            setFileError("São permitidas no máximo duas imagens por bruxinha. Remova uma imagem para adicionar outra.");
            return;
        }
        setFiles((previous) => [...previous, ...images]);
        setFileError("");
    }

    function handlePaste(event) {
        const images = Array.from(event.clipboardData?.items || [])
            .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
            .map((item) => item.getAsFile())
            .filter(Boolean);
        if (!images.length) return;
        event.preventDefault();
        addImages(images);
    }

    async function handleSave(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const wasEditing = Boolean(form.id);
            await saveWitch({
                ...form,
                number: Number(form.number),
                name: form.name.trim(),
                files,
                existingImages: form.images || []
            });
            const savedNumber = Number(form.number);
            if (wasEditing) {
                setEditing(false);
                setPlacing(false);
            } else {
                const next = nextAvailable([...witches, { number: savedNumber }]);
                setForm({ ...empty, number: next ? String(next) : "", region: form.region, difficulty: form.difficulty });
                setFiles([]);
                setPlacing(Boolean(next));
                if (!next) setEditing(false);
            }
            setMessage(`Bruxinha #${String(savedNumber).padStart(3, "0")} salva com sucesso!`);
        } catch (caught) {
            setError(caught.message || "Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(witch) {
        if (deleting) return;
        setDeleting(true);
        setError("");
        try {
            await removeWitch(witch);
            setConfirmDelete(null);
            setMessage("Ponto excluído.");
        } catch (caught) { setError(caught.message || "Não foi possível excluir."); }
        finally { setDeleting(false); }
    }

    useEffect(() => {
        if (!confirmDelete) return;
        const onKeyDown = (event) => { if (event.key === "Escape" && !deleting) setConfirmDelete(null); };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [confirmDelete, deleting]);

    useEffect(() => {
        if (!message && !error) return;
        const timeout = window.setTimeout(() => { setMessage(""); setError(""); }, 5000);
        return () => window.clearTimeout(timeout);
    }, [message, error]);

    return (
        <main className="page-content">
            <div className="admin-tabs"><button className={tab === "points" ? "active" : ""} onClick={() => setTab("points")}>Pontos cadastrados</button>{isOwner && <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><Users size={15} /> Usuários e administradores</button>}</div>
            {tab === "points" ? <>
            <div className="section-header">
                <div><span className="eyebrow">ÁREA RESTRITA</span><h1>Gerenciar Bruxinhas</h1><p className="muted">{witches.length} de 100 pontos cadastrados</p></div>

            </div>
            {(message || error) && <div className="toast-stack" aria-live="polite">{message && <div className="message success toast" role="status">{message}<button type="button" aria-label="Fechar notificação" onClick={() => setMessage("")}><X size={16}/></button></div>}{error && <div className="message error toast" role="alert">{error}<button type="button" aria-label="Fechar notificação" onClick={() => setError("")}><X size={16}/></button></div>}</div>}
            {editing && (
                <div className="admin-grid" ref={editSectionRef}>
                    <form className="panel admin-form" onSubmit={handleSave} onPaste={handlePaste}>
                        <div className="section-header"><h2>Dados do ponto</h2><button type="button" className="icon-button" onClick={() => { setEditing(false); setPlacing(false); }}><X size={20} /></button></div>
                        <label htmlFor="name">Nome do local</label>
                        <input id="name" type="text" maxLength="80" placeholder="Ex.: Duto do Vanilla" value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                        <p className="muted">Número automático: #{String(form.number).padStart(3, "0")}</p>
                        <label htmlFor="region">Região</label>
                        <select id="region" value={form.region || "south"} onChange={(event) => setForm({ ...form, region: event.target.value })}>
                            <option value="south">Sul</option>
                            <option value="north">Norte</option>
                        </select>
                        <label htmlFor="difficulty">Dificuldade</label>
                        <select id="difficulty" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
                            <option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option>
                        </select>
                        <label>Localização</label>
                        <div className="coordinate-box">{form.x === null ? "Selecione um local no mapa" : `X: ${form.x.toFixed(5)} | Y: ${form.y.toFixed(5)}`}</div>
                        <button type="button" className={`button ${placing ? "primary" : "secondary"}`} onClick={() => setPlacing(!placing)}><MapPin size={17} /> {placing ? "Clique no mapa para posicionar" : "Alterar posição no mapa"}</button>
                        <label htmlFor="images">Fotos (até 2, máximo 5 MB cada)</label>
                        <label className="upload-button" htmlFor="images"><Upload size={17} /> Selecionar imagens <span>{files.length ? `${files.length} nova(s)` : "Até 2 fotos"}</span></label>
                        <input className="visually-hidden" id="images" type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); event.target.value = ""; }} />
                        <div ref={pasteAreaRef} className="image-paste-zone" tabIndex={0} onPaste={(event) => { event.stopPropagation(); handlePaste(event); }} aria-label="Cole imagens aqui com Control V">
                            Clique aqui e pressione <strong>Ctrl + V</strong> para colar um print da área de transferência.
                        </div>
                        {fileError && <p className="message error" role="alert">{fileError}</p>}
                        {files.length > 0 && <div className="photo-grid">{files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="image-edit">
                                <img src={URL.createObjectURL(file)} alt={`Nova imagem ${index + 1}`} onLoad={(event) => URL.revokeObjectURL(event.currentTarget.src)} />
                                <button type="button" onClick={() => setFiles((previous) => previous.filter((_, position) => position !== index))}>Remover nova imagem</button>
                            </div>
                        ))}</div>}
                        {Boolean(form.images?.length) && <div className="photo-grid">{form.images.map((image) => <div key={image.path} className="image-edit"><img src={image.url} alt="Foto cadastrada" /><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((item) => item.path !== image.path) })}>Remover</button></div>)}</div>}
                        <button className="button primary full" type="submit" disabled={saving || form.x === null || form.y === null}><Save size={17} /> {saving ? "Salvando..." : "Salvar bruxinha"}</button>
                    </form>
                    <div className="admin-map"><GameMap points={witches} selectionMode={placing} onMapSelect={(point) => { setForm((previous) => ({ ...previous, ...point })); setPlacing(false); }} /></div>
                </div>
            )}
            <div className="region-manager-list">
                {["south", "north"].map((region) => {
                    const regionWitches = witches.filter((witch) => regionOf(witch) === region);
                    const label = region === "south" ? "Sul" : "Norte";
                    return (
                        <section className="panel region-manager-panel" key={region} aria-label={`Bruxinhas do ${label}`}>
                            <div className="region-manager-header">
                                <div>
                                    <h2>Bruxinhas do {label}</h2>
                                    <p className="muted">{regionWitches.length}/50 bruxinhas catalogadas nesta região</p>
                                </div>
                                <button className="button primary" type="button" onClick={() => startNew(region)} disabled={witches.length >= 100 || regionWitches.length >= 50}>
                                    <Plus size={18} /> Adicionar bruxinha
                                </button>
                            </div>
                            {regionWitches.length === 0 ? (
                                <p className="muted">Nenhuma bruxinha cadastrada nesta região.</p>
                            ) : (
                                <div className="admin-table-scroll">
                                    <table className="admin-table region-points-table">
                                        <thead><tr><th>Nome do ponto</th><th>Dificuldade</th><th><span className="visually-hidden">Editar ou excluir</span></th></tr></thead>
                                        <tbody>{regionWitches.map((witch) => (
                                            <tr key={witch.id}>
                                                <td><span className={`difficulty-dot ${witch.difficulty}`} /> <strong>{witch.name?.trim() || "Bruxinha"} #{String(witch.number).padStart(3, "0")}</strong></td>
                                                <td>{witch.difficulty === "easy" ? "Fácil" : witch.difficulty === "medium" ? "Médio" : "Difícil"}</td>
                                                <td><div className="table-actions"><button className="icon-button" title="Editar" aria-label={`Editar ${witch.name}`} onClick={() => startEdit(witch)}><Pencil size={16} /></button><button className="icon-button danger" title="Excluir" aria-label={`Excluir ${witch.name}`} onClick={() => setConfirmDelete(witch)}><Trash2 size={16} /></button></div></td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
            </> : <section className="panel"><div className="section-header"><div><h2>Usuários cadastrados</h2><p className="muted">Somente o proprietário pode alterar permissões.</p></div><button className="button secondary" onClick={loadUsers} disabled={loadingUsers}>{loadingUsers ? "Carregando..." : "Atualizar lista"}</button></div><div className="user-search-row"><label className="visually-hidden" htmlFor="user-search">Pesquisar usuários por nome ou ID</label><input id="user-search" type="search" placeholder="Pesquisar por nome ou ID..." value={userSearch} onChange={(event) => setUserSearch(event.target.value)} autoComplete="off" /><span className="muted" aria-live="polite">{visibleUsers.length} de {users.length} usuários</span></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Nome</th><th>ID</th><th>Permissão</th><th>Ação</th></tr></thead><tbody>{visibleUsers.map((item) => <tr key={item.uid}><td>{item.name || "Sem nome"}</td><td>#{item.playerId}</td><td>{item.role === "owner" ? "Proprietário" : item.role === "admin" ? "Administrador" : "Jogador"}</td><td>{item.role === "owner" ? "Protegido" : <button className="button secondary" disabled={Boolean(roleBusy)} onClick={() => changeRole(item.uid, item.role === "admin" ? "player" : "admin")}>{roleBusy === item.uid ? "Salvando..." : item.role === "admin" ? "Remover admin" : "Tornar admin"}</button>}</td></tr>)}</tbody></table></div>{!users.length && !loadingUsers && <p className="muted">Nenhum usuário carregado.</p>}{users.length > 0 && visibleUsers.length === 0 && <p className="muted">Nenhum usuário encontrado.</p>}</section>}
            {confirmDelete && <div className="modal-backdrop" onClick={() => { if (!deleting) setConfirmDelete(null); }}><section className="modal confirm-modal" role="dialog" aria-modal="true" aria-label="Confirmar exclusão" onClick={(event) => event.stopPropagation()}><h2>Excluir ponto?</h2><p>Deseja excluir {confirmDelete.name} #{String(confirmDelete.number).padStart(3, "0")}? Esta ação não pode ser desfeita.</p><div className="confirm-actions"><button className="button secondary" disabled={deleting} onClick={() => setConfirmDelete(null)}>Cancelar</button><button className="button danger-button" disabled={deleting} onClick={() => handleDelete(confirmDelete)}>{deleting ? "Excluindo..." : "Excluir ponto"}</button></div></section></div>}
        </main>
    );
}
