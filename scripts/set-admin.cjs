/* Uso: node scripts/set-admin.cjs <UID> <admin|player> */
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault() });

async function main() {
    const [, , uid, role] = process.argv;
    if (!uid || !["admin", "player"].includes(role)) throw new Error("Informe UID e admin|player.");
    const user = await admin.auth().getUser(uid);
    if (user.email === "194@players.caca-bruxinhas.invalid") throw new Error("O proprietário não pode ser alterado.");
    await admin.auth().setCustomUserClaims(uid, role === "admin" ? { role: "admin" } : {});
    await admin.firestore().doc(`users/${uid}`).update({ role });
    console.log(`Permissão atualizada: ${uid} -> ${role}. Usuário deve entrar novamente.`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});
