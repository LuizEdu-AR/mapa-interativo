import admin from "firebase-admin";
import { requireAdmin } from "./_cloudinaryAuth.js";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
    try {
        const actor = await requireAdmin(req);
        if (!actor || actor.role !== "owner") return res.status(403).json({ error: "Apenas o proprietário pode gerenciar usuários." });
        const { action, uid, role } = req.body || {};
        const store = admin.firestore();
        if (action === "list") {
            const snap = await store.collection("users").get();
            const users = snap.docs.map((entry) => ({ uid: entry.id, playerId: entry.data().playerId, name: entry.data().name, role: entry.data().role || "player" }));
            users.sort((a, b) => Number(a.playerId) - Number(b.playerId));
            return res.status(200).json({ users });
        }
        if (action !== "role" || typeof uid !== "string" || !/^[\w-]{20,128}$/.test(uid) || !["player", "admin"].includes(role)) {
            return res.status(400).json({ error: "Solicitação inválida." });
        }
        if (uid === actor.uid) return res.status(400).json({ error: "Não é permitido alterar sua própria permissão." });
        const target = await admin.auth().getUser(uid);
        if (target.customClaims?.role === "owner") return res.status(403).json({ error: "O proprietário não pode ser alterado." });
        const ref = store.collection("users").doc(uid);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ error: "Usuário não encontrado." });
        // Primeiro altera as claims, que são a fonte de autorização nas regras do Firestore.
        await admin.auth().setCustomUserClaims(uid, { ...(target.customClaims || {}), role });
        await ref.update({ role });
        await admin.auth().revokeRefreshTokens(uid);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Gerenciamento de usuários:", error);
        return res.status(500).json({ error: "Não foi possível concluir a operação." });
    }
}
