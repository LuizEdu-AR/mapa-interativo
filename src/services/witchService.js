import { collection, doc, onSnapshot, deleteDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db, auth } from "./firebase";
import { uploadWitchImage, deleteWitchImage } from "./cloudinaryService";

// O mapa público consulta um catálogo compartilhado na CDN, sem listeners Firestore.
// A administração faz uma leitura pontual somente quando abre a página ou salva algo.
let cachedPoints = null;
let cachedAt = 0;
const CACHE_MS = 120000;

export function invalidatePoints() { cachedAt = 0; }

export function subscribeWitches(callback, onError, { adminView = false } = {}) {
    let active = true;
    async function load() {
        try {
            if (!adminView && cachedPoints && Date.now() - cachedAt < CACHE_MS) {
                callback(cachedPoints);
                return;
            }
            let points;
            if (adminView) {
                const { getDocs } = await import('firebase/firestore');
                const snapshot = await getDocs(collection(db, 'witches'));
                points = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
            } else {
                const token = await auth.currentUser?.getIdToken();
                if (!token) throw new Error('Faça login para consultar o mapa.');
                const response = await fetch('/api/public-points', { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error('Falha ao consultar catálogo de pontos.');
                const data = await response.json();
                points = data.points || [];
                cachedPoints = points;
                cachedAt = Date.now();
            }
            points.sort((a, b) => Number(a.number) - Number(b.number));
            if (active) callback(points);
        } catch (error) { if (active && onError) onError(error); }
    }
    load();
    const refresh = () => { if (active) load(); };
    window.addEventListener('witches-updated', refresh);
    return () => { active = false; window.removeEventListener('witches-updated', refresh); };
}

export async function saveWitch({ number, name, region, difficulty, x, y, files = [], existingImages = [], id: editingId }) {
    const n = Number(number);
    if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("Escolha um número de 1 a 100.");
    if (!name || !name.trim() || name.trim().length > 80) throw new Error("Informe o nome do local (até 80 caracteres).");
    if (!["north", "south"].includes(region)) throw new Error("Selecione Norte ou Sul.");
    if (!["easy", "medium", "hard"].includes(difficulty)) throw new Error("Dificuldade inválida.");
    if (![x, y].every((value) => typeof value === "number" && value >= 0 && value <= 1)) throw new Error("Selecione uma posição válida no mapa.");
    if (existingImages.length + files.length > 2) throw new Error("São permitidas no máximo duas imagens.");
    const id = String(n).padStart(3, "0");
    const pointRef = doc(db, "witches", id);
    // A verificação de conflito acontece na própria transação: dispensa um getDoc
    // adicional, sem abrir mão da proteção contra números duplicados.
    let previousImages = [];
    const uploaded = [];
    try {
        for (const file of files) {
            const image = await uploadWitchImage(id, file);
            uploaded.push(image);
        }
        const images = [...existingImages, ...uploaded];
        await runTransaction(db, async (transaction) => {
            const current = await transaction.get(pointRef);
            if (!editingId && current.exists()) throw new Error("Outro administrador cadastrou esse número. Reabra o formulário e tente novamente.");
            if (editingId && String(editingId) !== id) throw new Error("Não é possível alterar o número de um ponto existente.");
            if (editingId && !current.exists()) throw new Error("Este ponto foi excluído por outro administrador.");
            previousImages = current.exists() ? (current.data().images || []) : [];
            transaction.set(pointRef, { number: n, name: name.trim(), region, difficulty, x, y, images, updatedAt: serverTimestamp() });
        });
        // A exclusão das imagens removidas é posterior à gravação para não perder dados em caso de erro.
        const retained = new Set(images.map((image) => image.publicId || image.path));
        invalidatePoints();
        window.dispatchEvent(new Event("witches-updated"));
        await Promise.allSettled(previousImages.filter((image) => !retained.has(image.publicId || image.path)).map(deleteWitchImage));
    } catch (error) {
        await Promise.allSettled(uploaded.map(deleteWitchImage));
        throw error;
    }
}

export async function removeWitch(witch) {
    await deleteDoc(doc(db, "witches", witch.id));
    invalidatePoints();
    window.dispatchEvent(new Event("witches-updated"));
    await Promise.allSettled((witch.images || []).map(deleteWitchImage));
}
