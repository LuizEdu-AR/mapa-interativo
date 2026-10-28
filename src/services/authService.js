import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, runTransaction } from "firebase/firestore";
import { auth, db } from "./firebase";

// E-mail interno sintético: o jogador só informa ID e senha.
// Não representa um e-mail real nem é um mecanismo de segurança isolado.
const loginEmail = (id) => `${id}@players.caca-bruxinhas.invalid`;

export function normalizeId(id) {
    const clean = String(id).trim();
    if (!/^[0-9]{1,12}$/.test(clean)) {
        throw new Error("O ID deve conter apenas números (até 12 dígitos).");
    }
    return clean;
}

export async function registerPlayer({ id, name, password }) {
    const playerId = normalizeId(id);
    const playerName = String(name).trim();
    if (playerId === "194") {
        throw new Error("Este ID está reservado. Contate o administrador principal.");
    }
    if (playerName.length < 2 || playerName.length > 32) {
        throw new Error("Informe um nome entre 2 e 32 caracteres.");
    }
    if (password.length < 8) {
        throw new Error("A senha precisa ter pelo menos 8 caracteres.");
    }

    const credential = await createUserWithEmailAndPassword(auth, loginEmail(playerId), password);
    try {
        await runTransaction(db, async (transaction) => {
            const reference = doc(db, "users", credential.user.uid);
            transaction.set(reference, {
                playerId,
                name: playerName,
                role: "player",
                createdAt: new Date().toISOString()
            });
        });
    } catch (error) {
        await signOut(auth);
        throw new Error("Conta autenticada, mas o perfil não foi criado. Contate o suporte.");
    }
    return credential.user;
}

export async function loginPlayer(id, password) {
    const playerId = normalizeId(id);
    return signInWithEmailAndPassword(auth, loginEmail(playerId), password);
}

export function logoutPlayer() {
    return signOut(auth);
}
