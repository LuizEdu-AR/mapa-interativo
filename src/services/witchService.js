import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, getDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { uploadWitchImage, deleteWitchImage } from "./cloudinaryService";

export function subscribeWitches(callback, onError) {
    return onSnapshot(collection(db, "witches"), (snapshot) => {
        const witches = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
        witches.sort((a, b) => Number(a.number) - Number(b.number));
        callback(witches);
    }, onError);
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
    const previous = await getDoc(pointRef);
    if (previous.exists() && !editingId) throw new Error("Este número acabou de ser ocupado. Feche e abra o cadastro para receber outro.");
    const previousImages = previous.exists() ? (previous.data().images || []) : [];
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
            if (editingId && !current.exists()) throw new Error("Este ponto foi excluído por outro administrador.");
            transaction.set(pointRef, { number: n, name: name.trim(), region, difficulty, x, y, images, updatedAt: serverTimestamp() });
        });
        // A exclusão das imagens removidas é posterior à gravação para não perder dados em caso de erro.
        const retained = new Set(images.map((image) => image.publicId || image.path));
        await Promise.allSettled(previousImages.filter((image) => !retained.has(image.publicId || image.path)).map(deleteWitchImage));
    } catch (error) {
        await Promise.allSettled(uploaded.map(deleteWitchImage));
        throw error;
    }
}

export async function removeWitch(witch) {
    await deleteDoc(doc(db, "witches", witch.id));
    await Promise.allSettled((witch.images || []).map(deleteWitchImage));
}
