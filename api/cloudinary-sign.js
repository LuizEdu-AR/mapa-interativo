import { randomUUID } from "node:crypto";
import { requireAdmin, getCloudinary } from "./_cloudinaryAuth.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
    try {
        if (!(await requireAdmin(req))) return res.status(403).json({ error: "Acesso administrativo necessário." });
        const { pointId } = req.body || {};
        if (typeof pointId !== "string" || !/^(00[1-9]|0[1-9][0-9]|100)$/.test(pointId)) {
            return res.status(400).json({ error: "Ponto inválido." });
        }
        const cloud = getCloudinary();
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = `caca-as-bruxinhas/pontos/bruxinha-${pointId}`;
        const public_id = randomUUID();
        const overwrite = "false";
        const params = { timestamp, folder, public_id, overwrite };
        const signature = cloud.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            signature,
            ...params
        });
    } catch (error) {
        console.error("Erro ao assinar upload:", error.message);
        return res.status(500).json({ error: "Não foi possível autorizar o envio da imagem." });
    }
}
