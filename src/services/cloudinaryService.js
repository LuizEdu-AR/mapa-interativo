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
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error(result.error || "Sem permissão administrativa. Faça login novamente.");
        }
        throw new Error(result.error || `Falha na operação com imagens (HTTP ${response.status}).`);
    }
    return result;
}

export async function uploadWitchImage(pointId, file) {
    if (!file || !ACCEPTED.includes(file.type) || file.size > MAX_BYTES || file.size === 0) {
        throw new Error("Envie uma imagem JPG, PNG ou WebP com até 5 MB.");
    }
    const id = String(pointId);
    const signed = await authorizedRequest("/api/cloudinary-sign", { pointId: id });
    const form = new FormData();
    form.append("file", file);
    for (const key of ["apiKey", "timestamp", "folder", "public_id", "overwrite", "signature"]) {
        form.append(key === "apiKey" ? "api_key" : key, String(signed[key]));
    }
    let response;
    try {
        response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, {
            method: "POST",
            body: form
        });
    } catch {
        throw new Error("Não foi possível conectar ao Cloudinary. Verifique sua conexão.");
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        const detail = result.error?.message || `HTTP ${response.status}`;
        throw new Error(`Falha no upload para o Cloudinary: ${detail}`);
    }
    if (!result.secure_url || !result.public_id) throw new Error("O Cloudinary não retornou os dados da imagem.");
    return { url: result.secure_url, publicId: result.public_id, path: result.public_id };
}

export async function deleteWitchImage(image) {
    if (!image?.publicId) return;
    return authorizedRequest("/api/cloudinary-delete", { publicId: image.publicId });
}
