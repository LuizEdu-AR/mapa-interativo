import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export function subscribeProgress(uid, callback, onError) {
    let active = true;
    // Leitura única por entrada na página, sem listener em tempo real por jogador.
    getDocs(collection(db, "users", uid, "completedWitches"))
        .then((snapshot) => { if (active) callback(new Set(snapshot.docs.map((entry) => entry.id))); })
        .catch((error) => { if (active && onError) onError(error); });
    return () => { active = false; };
}

export async function toggleCompleted(uid, witchId, completed) {
    const reference = doc(db, "users", uid, "completedWitches", witchId);
    if (completed) {
        await deleteDoc(reference);
    } else {
        await setDoc(reference, { completedAt: serverTimestamp() });
    }
}
