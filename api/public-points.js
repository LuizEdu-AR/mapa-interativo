import admin from 'firebase-admin';

function initialize() {
  if (admin.apps.length) return;
  const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: key } = process.env;
  if (!projectId || !clientEmail || !key) throw new Error('Firebase Admin não configurado.');
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, '\n') }) });
}

const CATALOG_REF = () => admin.firestore().collection('_system').doc('publicPoints');
const CACHE_MS = 30000;
let cache = null;
let cachedAt = 0;
let bootstrapPromise = null;

async function rebuildCatalog() {
  const snapshot = await admin.firestore().collection('witches').get();
  const points = snapshot.docs.map((entry) => {
    const { number, name, region, difficulty, x, y, images = [], available = true } = entry.data();
    return { id: entry.id, number, name, region, difficulty, x, y, images, available };
  }).sort((a, b) => Number(a.number) - Number(b.number));
  // Um único documento substitui até 100 leituras por requisição ao catálogo.
  // Limite do Firestore: 1 MiB por documento. As imagens devem ser URLs, não bytes.
  await CATALOG_REF().set({ points, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  cache = points;
  cachedAt = Date.now();
  return points;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' });
  try {
    if (process.env.VITE_MAINTENANCE_MODE !== 'false') return res.status(503).json({ error: 'Site em manutenção.' });
    initialize();
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ error: 'Autenticação necessária.' });
    const user = await admin.auth().verifyIdToken(token);

    if (req.method === 'POST') {
      if (!['admin', 'owner'].includes(user.role)) return res.status(403).json({ error: 'Permissão insuficiente.' });
      await rebuildCatalog();
      return res.status(200).json({ success: true });
    }

    if (cache && Date.now() - cachedAt < CACHE_MS) return res.status(200).json({ points: cache });

    const catalog = await CATALOG_REF().get();
    if (catalog.exists && Array.isArray(catalog.data()?.points)) {
      cache = catalog.data().points;
      cachedAt = Date.now();
      return res.status(200).json({ points: cache });
    }

    // Migração automática: se o documento consolidado ainda não existe, cria-o.
    // Em instâncias distintas, no máximo a primeira consulta de cada uma pode
    // realizar essa leitura inicial; depois, a leitura normal é de 1 documento.
    if (!bootstrapPromise) bootstrapPromise = rebuildCatalog().finally(() => { bootstrapPromise = null; });
    const points = await bootstrapPromise;
    return res.status(200).json({ points });
  } catch (error) {
    console.error('Catálogo de pontos:', error);
    return res.status(503).json({ error: 'Catálogo temporariamente indisponível.' });
  }
}
