import { requireAdmin, getCloudinary } from "./_cloudinaryAuth.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
    try {
        if (!(await requireAdmin(req))) return res.status(403).json({ error: "Acesso administrativo necessário." });
        const { pointId, data } = req.body || {};
        if (!/^(00[1-9]|0[1-9][0-9]|100)$/.test(pointId || "")) return res.status(400).json({ error: "Ponto inválido." });
        const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data || "");
        if (!match) return res.status(400).json({ error: "Formato de imagem inválido." });
        const bytes = Buffer.from(match[2], "base64");
        if (!bytes.length || bytes.length > 5 * 1024 * 1024) return res.status(413).json({ error: "Imagem excede 5 MB." });
        const mime = match[1];
        const signatures = {
            "image/png": bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
            "image/jpeg": bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")),
            "image/webp": bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
        };
        if (!signatures[mime]) return res.status(400).json({ error: "Conteúdo de imagem inválido." });
        const cloud = getCloudinary();
        const result = await new Promise((resolve, reject) => {
            const stream = cloud.uploader.upload_stream({
                folder: `caca-as-bruxinhas/pontos/bruxinha-${pointId}`,
                resource_type: "image", overwrite: false
            }, (error, response) => error ? reject(error) : resolve(response));
            stream.end(bytes);
        });
        return res.status(200).json({ url: result.secure_url, publicId: result.public_id, path: result.public_id });
    } catch (error) {
        console.error("Erro no upload:", error.message);
        return res.status(500).json({ error: "Não foi possível enviar a imagem." });
    }
}
