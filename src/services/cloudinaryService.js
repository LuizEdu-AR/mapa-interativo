import { auth } from "./firebase";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

async function authorizedRequest(url, body) {
    const user = auth.currentUser;
    if (!user) throw new Error("Faça login novamente para enviar imagens.");
    const token = await user.getIdToken();
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Falha na operação com imagens.");
    return result;
}

export async function uploadWitchImage(pointId, file) {
    if (!ACCEPTED.includes(file.type) || file.size > MAX_BYTES || file.size === 0) {
        throw new Error("Envie uma imagem JPG, PNG ou WebP com até 5 MB.");
    }
    const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        reader.readAsDataURL(file);
    });
    return authorizedRequest("/api/cloudinary-upload", { pointId, data });
}

export async function deleteWitchImage(image) {
    if (!image?.publicId) return; // imagens legadas do Firebase Storage não são removidas aqui
    return authorizedRequest("/api/cloudinary-delete", { publicId: image.publicId });
}
