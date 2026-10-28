const admin = require("firebase-admin");

const serviceAccount = require(
    "../secrets/firebase-admin.json"
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const OWNER_UID = "F2M5jQjjbGN3UZFLsLkY0efIaax2";

async function setupOwner() {
    try {
        const user = await auth.getUser(OWNER_UID);

        if (
            user.email !==
            "194@players.caca-bruxinhas.invalid"
        ) {
            throw new Error(
                "O UID informado não pertence ao ID 194."
            );
        }

        await auth.setCustomUserClaims(OWNER_UID, {
            role: "owner",
        });

        await db.collection("users").doc(OWNER_UID).set(
            {
                playerId: "194",
                name: "Chico Divine",
                role: "owner",
                createdAt: new Date().toISOString(),
            },
            {
                merge: true,
            }
        );

        console.log(
            "Administrador principal configurado com sucesso!"
        );
    } catch (error) {
        console.error(
            "Erro ao configurar administrador:",
            error
        );

        process.exitCode = 1;
    }
}

setupOwner();