import admin from "firebase-admin";

function initializeAdmin() {
    if (admin.apps.length) return;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\\n");
    if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin não configurado.");
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
    try {
        initializeAdmin();
        const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
        if (!token) return res.status(401).json({ error: "Autenticação necessária." });
        const identity = await admin.auth().verifyIdToken(token, true);
        const store = admin.firestore();
        const userRef = store.collection("users").doc(identity.uid);
        const summaryRef = userRef.collection("progress").doc("summary");
        // Uma transação garante que solicitações de migração simultâneas não sobrescrevam o resumo.
        const result = await store.runTransaction(async (tx) => {
            const profile = await tx.get(userRef);
            if (!profile.exists) throw Object.assign(new Error("Perfil não encontrado."), { status: 404 });
            const current = await tx.get(summaryRef);
            if (current.exists) return { completedIds: current.data().completedIds || [] };
            const legacy = await tx.get(userRef.collection("completedWitches"));
            const completedIds = legacy.docs.map((item) => item.id).filter((id) => /^\\d{3}$/.test(id));
            tx.create(summaryRef, { completedIds, migratedAt: admin.firestore.FieldValue.serverTimestamp() });
            return { completedIds };
        });
        return res.status(200).json(result);
    } catch (error) {
        console.error("Migração do progresso:", error);
        return res.status(error.status || 500).json({ error: "Não foi possível preparar o progresso." });
    }
}
