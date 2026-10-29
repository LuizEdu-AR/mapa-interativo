import { collection, doc, getDoc, getDocs, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

const inFlight = new Map();

function summaryRef(uid) {
    return doc(db, "users", uid, "progress", "summary");
}

function cleanIds(ids) {
    return [...new Set((Array.isArray(ids) ? ids : []).filter(
        (id) => typeof id === "string" && /^[0-9]{3}$/.test(id)
    ))].sort();
}

// Migração sob demanda, sem apagar documentos antigos.
// A transação impede que duas abas sobrescrevam uma migração simultânea.
async function ensureSummary(uid) {
    if (inFlight.has(uid)) return inFlight.get(uid);
    const pending = (async () => {
        const reference = summaryRef(uid);
        const existing = await getDoc(reference);
        if (existing.exists()) return cleanIds(existing.data().completedIds);
        const old = await getDocs(collection(db, "users", uid, "completedWitches"));
        const legacyIds = cleanIds(old.docs.map((entry) => entry.id));
        return runTransaction(db, async (transaction) => {
            const current = await transaction.get(reference);
            if (current.exists()) return cleanIds(current.data().completedIds);
            transaction.set(reference, { completedIds: legacyIds, version: 1 });
            return legacyIds;
        });
    })();
    inFlight.set(uid, pending);
    try { return await pending; }
    finally { if (inFlight.get(uid) === pending) inFlight.delete(uid); }
}

export function subscribeProgress(uid, callback, onError) {
    let active = true;
    ensureSummary(uid)
        .then((ids) => { if (active) callback(new Set(ids)); })
        .catch((error) => { if (active && onError) onError(error); });
    return () => { active = false; };
}

export async function toggleCompleted(uid, witchId, completed) {
    if (!/^[0-9]{3}$/.test(witchId)) throw new Error("Identificador de bruxinha inválido.");
    await ensureSummary(uid);
    const reference = summaryRef(uid);
    await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) throw new Error("Progresso não inicializado. Recarregue a página.");
        const ids = new Set(cleanIds(snapshot.data().completedIds));
        if (completed) ids.delete(witchId);
        else ids.add(witchId);
        transaction.update(reference, { completedIds: [...ids].sort() });
    });
}
