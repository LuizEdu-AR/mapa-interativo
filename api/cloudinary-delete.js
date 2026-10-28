import { requireAdmin, getCloudinary } from "./_cloudinaryAuth.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
    try {
        if (!(await requireAdmin(req))) return res.status(403).json({ error: "Acesso administrativo necessário." });
        const { publicId } = req.body || {};
        if (typeof publicId !== "string" || !/^caca-as-bruxinhas\/pontos\/bruxinha-(00[1-9]|0[1-9][0-9]|100)\/[a-zA-Z0-9_-]+$/.test(publicId)) {
            return res.status(400).json({ error: "Identificador inválido." });
        }
        const result = await getCloudinary().uploader.destroy(publicId, { resource_type: "image" });
        return res.status(200).json({ result: result.result });
    } catch (error) {
        console.error("Erro ao excluir:", error.message);
        return res.status(500).json({ error: "Não foi possível excluir a imagem." });
    }
}
