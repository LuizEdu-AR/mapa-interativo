# Caça às Bruxinhas — FiveM

Site React + Vite, mapa GTA V com expansão FiveM em tiles WebP, Firebase Auth/Firestore/Storage e deploy Vercel.

## 1. Executar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com as credenciais públicas do projeto Firebase (Configuração do projeto → Seus apps → Web). Ative **Authentication → Email/Password**, **Cloud Firestore** e **Storage** no console Firebase. A conta do jogador usa ID no formulário e um endereço sintético interno para o Firebase Auth; não é um e-mail real. **Recuperação de senha por e-mail não está implementada**: será necessário um fluxo administrativo seguro.

## 2. Regras de segurança

Instale Firebase CLI e publique as regras antes de usar:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```

Apenas contas com *custom claims* `role: admin` ou `role: owner` podem modificar pontos. A conta 194 não pode ser criada pelo cadastro público. A coleção `users` só pode ser criada com `role: player` por contas comuns. Usuários só alteram seu próprio progresso.

## 3. Criar administrador principal — ID 194 / Chico Divine

**Nunca envie a chave privada ao chat, publique no GitHub ou inclua na Vercel.** Execute no seu computador:

```bash
npm install --no-save firebase-admin
# Configure GOOGLE_APPLICATION_CREDENTIALS apontando para a chave de serviço do Firebase
# Configure OWNER_INITIAL_PASSWORD com uma senha forte de 12+ caracteres
node scripts/bootstrap-owner.cjs
```

A conta inicial é criada diretamente pelo Admin SDK, com custom claim `owner`. Depois entre no site com ID **194** e a senha configurada. Para promover outro usuário, use `node scripts/set-admin.cjs UID admin` no ambiente confiável. Esse fluxo é deliberadamente externo à interface, pois gerenciamento de cargos exige backend privilegiado. Para produção, recomenda-se implementar um endpoint autenticado de gestão de administradores.

## 4. Publicar na Vercel

Importe o repositório, escolha **Vite**, build `npm run build`, saída `dist`, e configure todas as variáveis `VITE_FIREBASE_*`. Adicione o domínio da Vercel em **Firebase Authentication → Authorized domains**. `vercel.json` configura fallback de rotas do React Router.

## 5. Recursos

- Cadastro e login com ID, nome e senha; contas novas são jogadores.
- Mapa interativo com expansão FiveM e 17 tiles WebP.
- Marcadores por dificuldade, filtros, fotos e seleção de ponto.
- Progresso individual sincronizado no Firestore.
- Painel administrativo com modo explícito de posicionamento, edição e exclusão.
- Imagens no Firebase Storage (máximo 2 por ponto, 5 MB cada).
- Layout roxo e preto responsivo.

## Limitações e observações

- O mapa usa os tiles da entrega anterior. O zoom acima do nível nativo amplia pixels, não inventa detalhes.
- `window.confirm` é utilizado somente na exclusão administrativa nesta versão inicial.
- Remover uma imagem existente de um ponto a retira do documento; a limpeza do objeto órfão do Storage ainda não é automática.
- IDs sintéticos do Firebase Auth são únicos pela combinação de e-mail, mas contas Auth criadas sem perfil por falha de rede podem precisar de reparo manual. Para operação em escala, recomenda-se um backend transacional de provisionamento.
- Para validar e implantar, configure um projeto Firebase real e teste com contas de jogador e administrador.
