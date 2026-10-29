import admin from 'firebase-admin';

function initialize() {
  if (admin.apps.length) return;
  const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: key } = process.env;
  if (!projectId || !clientEmail || !key) throw new Error('Firebase Admin não configurado.');
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, '\n') }) });
}

let catalogCache = null;
let catalogUpdatedAt = 0;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    if (process.env.VITE_MAINTENANCE_MODE !== 'false') return res.status(503).json({ error: 'Site em manutenção.' });
    initialize();
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária.' });
    await admin.auth().verifyIdToken(token);
    if (catalogCache && Date.now() - catalogUpdatedAt < 120000) {
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).json({ points: catalogCache });
    }
    const snapshot = await admin.firestore().collection('witches').get();
    const points = snapshot.docs.map((entry) => {
      const { number, name, region, difficulty, x, y, images = [] } = entry.data();
      return { id: entry.id, number, name, region, difficulty, x, y, images };
    }).sort((a, b) => Number(a.number) - Number(b.number));
    // Cache em memória por instância; nunca publica coordenadas em cache público.
    catalogCache = points;
    catalogUpdatedAt = Date.now();
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ points });
  } catch (error) {
    console.error('Catálogo público:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Catálogo temporariamente indisponível.' });
  }
}
