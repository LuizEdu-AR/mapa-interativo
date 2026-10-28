import { useEffect, useRef, useState } from "react";
import { Plus, Save, Trash2, X, MapPin } from "lucide-react";
import GameMap from "../components/Map/GameMap";
import { subscribeWitches, saveWitch, removeWitch } from "../services/witchService";

const empty = { number: "", difficulty: "easy", x: null, y: null, images: [] };

export default function AdminPage() {
    const [witches, setWitches] = useState([]);
    const [form, setForm] = useState(empty);
    const [files, setFiles] = useState([]);
    const pasteAreaRef = useRef(null);
    const [fileError, setFileError] = useState("");
    const [editing, setEditing] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => subscribeWitches(setWitches, () => setError("Falha ao carregar pontos.")), []);

    function startNew() {
        setForm({ ...empty, number: String(Array.from({ length: 100 }, (_, index) => index + 1).find((number) => !witches.some((witch) => Number(witch.number) === number)) || 100) });
        setFiles([]);
        setFileError("");
        setEditing(true);
        setPlacing(true);
        setMessage("");
        setError("");
    }

    function startEdit(witch) {
        setForm({ ...witch });
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
            await saveWitch({
                ...form,
                number: Number(form.number),
                files,
                existingImages: form.images || []
            });
            setEditing(false);
            setPlacing(false);
            setMessage("Bruxinha salva com sucesso!");
        } catch (caught) {
            setError(caught.message || "Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(witch) {
        if (!window.confirm(`Excluir a bruxinha #${witch.number}?`)) return;
        setError("");
        try {
            await removeWitch(witch);
            setMessage("Ponto excluído.");
        } catch (caught) {
            setError(caught.message || "Não foi possível excluir.");
        }
    }

    return (
        <main className="page-content">
            <div className="section-header">
                <div><span className="eyebrow">ÁREA RESTRITA</span><h1>Gerenciar Bruxinhas</h1><p className="muted">{witches.length} de 100 pontos cadastrados</p></div>
                <button className="button primary" onClick={startNew} disabled={witches.length >= 100}><Plus size={18} /> Adicionar bruxinha</button>
            </div>
            {message && <div className="message success">{message}</div>}
            {error && <div className="message error">{error}</div>}
            {editing && (
                <div className="admin-grid">
                    <form className="panel admin-form" onSubmit={handleSave} onPaste={handlePaste}>
                        <div className="section-header"><h2>Dados do ponto</h2><button type="button" className="icon-button" onClick={() => { setEditing(false); setPlacing(false); }}><X size={20} /></button></div>
                        <label htmlFor="number">Número (1–100)</label>
                        <input id="number" type="number" min="1" max="100" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} required disabled={Boolean(form.id)} />
                        <label htmlFor="difficulty">Dificuldade</label>
                        <select id="difficulty" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
                            <option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option>
                        </select>
                        <label>Localização</label>
                        <div className="coordinate-box">{form.x === null ? "Selecione um local no mapa" : `X: ${form.x.toFixed(5)} | Y: ${form.y.toFixed(5)}`}</div>
                        <button type="button" className={`button ${placing ? "primary" : "secondary"}`} onClick={() => setPlacing(!placing)}><MapPin size={17} /> {placing ? "Clique no mapa para posicionar" : "Alterar posição no mapa"}</button>
                        <label htmlFor="images">Fotos (até 2, máximo 5 MB cada)</label>
                        <input id="images" type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); event.target.value = ""; }} />
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
            <section className="panel">
                <h2>Pontos cadastrados</h2>
                {!witches.length && <p className="muted">Nenhum ponto cadastrado ainda.</p>}
                <div className="admin-list">{witches.map((witch) => (
                    <div className="admin-row" key={witch.id}>
                        <span className={`difficulty-dot ${witch.difficulty}`} />
                        <strong>Bruxinha #{String(witch.number).padStart(3, "0")}</strong>
                        <span className="muted">{witch.difficulty === "easy" ? "Fácil" : witch.difficulty === "medium" ? "Médio" : "Difícil"}</span>
                        <button className="button secondary" onClick={() => startEdit(witch)}>Editar</button>
                        <button className="icon-button danger" onClick={() => handleDelete(witch)} aria-label="Excluir"><Trash2 size={18} /></button>
                    </div>
                ))}</div>
            </section>
            <p className="muted footnote">A promoção de administradores é uma operação privilegiada realizada pelo backend, nunca pelo navegador.</p>
        </main>
    );
}
