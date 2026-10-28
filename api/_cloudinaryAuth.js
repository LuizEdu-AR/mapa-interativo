import admin from "firebase-admin";
import { v2 as cloudinary } from "cloudinary";

function initFirebase() {
    if (admin.apps.length) return;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) throw new Error("Credenciais do Firebase Admin ausentes no servidor.");
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

export async function requireAdmin(req) {
    initFirebase();
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
    if (!token) return null;
    const claims = await admin.auth().verifyIdToken(token, true);
    if (!["admin", "owner"].includes(claims.role)) return null;
    return claims;
}

export function getCloudinary() {
    for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
        if (!process.env[key]) throw new Error(`Variável ${key} não configurada no servidor.`);
    }
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    return cloudinary;
}
