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
        if (action === "lookup") {
            const playerId = String(req.body?.playerId || '').trim();
            if (!/^[0-9]{1,12}$/.test(playerId)) return res.status(400).json({ error: 'Informe um ID válido.' });
            // Consulta indexada, limitada a um documento: nunca lista todos os jogadores.
            const found = await store.collection('users').where('playerId', '==', playerId).limit(1).get();
            if (found.empty) return res.status(404).json({ error: 'Jogador não encontrado.' });
            const entry = found.docs[0];
            return res.status(200).json({ user: { uid: entry.id, playerId: entry.data().playerId, name: entry.data().name, role: entry.data().role || 'player' } });
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
