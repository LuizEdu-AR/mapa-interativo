/* Execute somente no computador de um operador confiável, nunca no frontend. */
const admin = require("firebase-admin");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("Configure GOOGLE_APPLICATION_CREDENTIALS com o caminho de uma chave privada de serviço.");
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });

async function main() {
    const email = "194@players.caca-bruxinhas.invalid";
    const password = process.env.OWNER_INITIAL_PASSWORD;
    if (!password || password.length < 12) {
        throw new Error("Defina OWNER_INITIAL_PASSWORD com pelo menos 12 caracteres.");
    }
    let user;
    try {
        user = await admin.auth().getUserByEmail(email);
        console.log("Conta principal já existe. A senha não será alterada.");
    } catch (error) {
        if (error.code !== "auth/user-not-found") throw error;
        user = await admin.auth().createUser({ email, password, displayName: "Chico Divine" });
    }
    await admin.auth().setCustomUserClaims(user.uid, { role: "owner" });
    await admin.firestore().doc(`users/${user.uid}`).set({
        playerId: "194",
        name: "Chico Divine",
        role: "owner",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Administrador principal configurado: ${user.uid}`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});
