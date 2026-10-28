import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

export function subscribeWitches(callback, onError) {
    return onSnapshot(collection(db, "witches"), (snapshot) => {
        const witches = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
        witches.sort((a, b) => Number(a.number) - Number(b.number));
        callback(witches);
    }, onError);
}

export async function saveWitch({ number, difficulty, x, y, files = [], existingImages = [] }) {
    const n = Number(number);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
        throw new Error("Escolha um número de 1 a 100.");
    }
    if (!["easy", "medium", "hard"].includes(difficulty)) {
        throw new Error("Dificuldade inválida.");
    }
    if (![x, y].every((value) => typeof value === "number" && value >= 0 && value <= 1)) {
        throw new Error("Selecione uma posição válida no mapa.");
    }
    if (existingImages.length + files.length > 2) {
        throw new Error("São permitidas no máximo duas imagens.");
    }
    const id = String(n).padStart(3, "0");
    const images = [...existingImages];
    for (const file of files) {
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            throw new Error("Cada imagem deve ter até 5 MB e ser uma imagem válida.");
        }
        const path = `witches/${id}/${crypto.randomUUID()}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file, { contentType: file.type });
        images.push({ url: await getDownloadURL(fileRef), path });
    }
    await setDoc(doc(db, "witches", id), {
        number: n,
        difficulty,
        x,
        y,
        images,
        updatedAt: serverTimestamp()
    });
}

export async function removeWitch(witch) {
    await deleteDoc(doc(db, "witches", witch.id));
    await Promise.allSettled((witch.images || []).map((image) => deleteObject(ref(storage, image.path))));
}
