# Caça às Bruxinhas

### Mapa Interativo de Colecionáveis para FiveM

O **Caça às Bruxinhas** é uma aplicação web desenvolvida para auxiliar jogadores de uma cidade de FiveM durante um evento especial de Halloween.

O evento consiste em encontrar **100 bruxinhas escondidas pelo mapa**, distribuídas em diferentes regiões do GTA V, incluindo uma expansão territorial personalizada do servidor.

A plataforma permite que os jogadores visualizem a localização das bruxinhas, consultem imagens dos locais, filtrem os pontos por dificuldade e acompanhem seu progresso individual.

Os administradores são responsáveis por cadastrar, editar e gerenciar os pontos disponíveis no mapa.

---

## Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| React JS | Desenvolvimento da interface |
| Vite | Ambiente de desenvolvimento e compilação |
| JavaScript | Lógica da aplicação |
| CSS3 | Estilização e responsividade |
| React Router DOM | Navegação entre páginas |
| Leaflet | Renderização do mapa interativo |
| React Leaflet | Integração do Leaflet com React |
| Firebase Authentication | Autenticação dos usuários |
| Cloud Firestore | Armazenamento dos dados |
| Firebase Admin SDK | Verificação de permissões no backend |
| Cloudinary | Armazenamento das imagens |
| Vercel | Hospedagem e execução das APIs |
| Node.js | Execução das funções do backend |

---

## Funcionalidades

### Autenticação

O sistema possui autenticação individual utilizando:

- ID do jogador no FiveM;
- Nome do personagem;
- Senha.

O ID é o identificador único de cada jogador.

A autenticação é realizada pelo Firebase Authentication, utilizando internamente um identificador associado ao ID informado.

O sistema permite:

- Cadastro de jogadores;
- Login;
- Logout;
- Persistência da sessão;
- Proteção de rotas;
- Identificação de permissões administrativas.

### Mapa interativo

A aplicação utiliza um mapa personalizado do GTA V com expansão territorial do FiveM.

O mapa apresenta uma identidade visual de Halloween, com terrenos escuros, ruas claras e regiões aquáticas em tonalidades de roxo.

Funcionalidades:

- Navegação pelo mapa;
- Zoom;
- Movimentação;
- Visualização de marcadores;
- Seleção de pontos;
- Consulta de imagens;
- Filtros por dificuldade;
- Identificação de pontos concluídos.

O mapa utiliza imagens divididas em tiles WebP para otimizar o carregamento.

### Sistema de dificuldades

Cada bruxinha possui um nível de dificuldade.

| Dificuldade | Cor |
|---|---|
| Fácil | Verde |
| Médio | Amarelo |
| Difícil | Vermelho |

As cores permitem identificar visualmente a dificuldade de cada localização.

### Progresso individual

Cada jogador possui seu próprio progresso, armazenado no Cloud Firestore.

Por exemplo:

| Jogador | Bruxinhas encontradas |
|---|---|
| Jogador A | 50/100 |
| Jogador B | 30/100 |
| Jogador C | 74/100 |

O progresso é independente entre os usuários.

Ao marcar uma bruxinha como concluída, a informação é associada à conta autenticada.

O jogador também pode desmarcar um ponto caso tenha registrado a conclusão incorretamente.

O progresso permanece salvo mesmo quando o usuário acessa a plataforma por outro dispositivo.

### Painel administrativo

O sistema possui uma área administrativa para gerenciamento dos pontos.

Administradores autorizados podem:

- Cadastrar bruxinhas;
- Definir a localização no mapa;
- Selecionar a dificuldade;
- Adicionar até duas imagens;
- Editar pontos;
- Excluir pontos;
- Consultar as localizações cadastradas.

O cadastro de localizações utiliza um modo específico de seleção, evitando que cliques comuns no mapa abram formulários acidentalmente.

### Gerenciamento de imagens

As imagens são armazenadas no Cloudinary.

Cada ponto pode possuir:

- Uma imagem principal;
- Uma segunda imagem opcional.

O Firestore armazena as referências das imagens associadas aos pontos.

Os uploads são processados por uma API protegida, que verifica as permissões administrativas utilizando o Firebase Admin SDK.

As credenciais privadas do Cloudinary não são disponibilizadas ao navegador.

---

## Identidade visual

A interface utiliza uma identidade visual inspirada no Halloween.

### Paleta principal

| Elemento | Cor |
|---|---|
| Fundo externo do mapa | `#1c092b` |
| Roxo principal | `#9146C8` |
| Roxo de destaque | `#B96AE8` |
| Terrenos do mapa | Preto |
| Estradas | Branco e cinza |
| Águas | Tons de roxo e lilás |

O projeto prioriza uma interface escura, organizada e responsiva.

---

## Estrutura do projeto

A organização principal é baseada na seguinte estrutura:

```text
caca-as-bruxinhas/
│
├── api/
│   ├── _cloudinaryAuth.js
│   ├── cloudinary-upload.js
│   └── cloudinary-delete.js
│
├── public/
│   └── maps/
│       ├── mapa_gta_fivem_roxo.png
│       └── tiles/
│
├── scripts/
│   └── setupOwner.cjs
│
├── src/
│   ├── components/
│   │   └── Map/
│   │       ├── GameMap.jsx
│   │       └── GameMap.css
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx
│   │
│   └── services/
│       ├── firebase.js
│       ├── authService.js
│       ├── cloudinaryService.js
│       └── witchService.js
│
├── .env.local
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── README.md
```

A estrutura acima apresenta os principais arquivos e diretórios da aplicação, sem necessariamente listar todos os componentes.

---

## Configuração do ambiente

### Pré-requisitos

Para executar o projeto, é necessário possuir:

- Node.js;
- npm;
- Projeto Firebase configurado;
- Conta Cloudinary;
- Conta Vercel para publicação.

### Instalação

Clone o repositório:

```bash
git clone https://github.com/LuizEdu-AR/mapa-interativo.git
```

Entre na pasta:

```bash
cd mapa-interativo
```

Instale as dependências:

```bash
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto.

#### Firebase — Frontend

```env
VITE_FIREBASE_API_KEY=SUA_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=caca-as-bruxinhas.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=caca-as-bruxinhas
VITE_FIREBASE_STORAGE_BUCKET=caca-as-bruxinhas.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=SEU_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=SEU_APP_ID
```

Essas variáveis são utilizadas pelo React para acessar os serviços públicos do Firebase.

#### Firebase Admin SDK — Backend

```env
FIREBASE_PROJECT_ID=caca-as-bruxinhas
FIREBASE_CLIENT_EMAIL=EMAIL_DA_CONTA_DE_SERVICO
FIREBASE_PRIVATE_KEY=CHAVE_PRIVADA_DA_CONTA_DE_SERVICO
```

Essas variáveis são utilizadas exclusivamente pelo backend para autenticação administrativa.

#### Cloudinary — Backend

```env
CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
CLOUDINARY_API_KEY=SUA_API_KEY
CLOUDINARY_API_SECRET=SEU_API_SECRET
```

As credenciais privadas devem permanecer exclusivamente no servidor.

**Nunca utilize o prefixo `VITE_` em variáveis que contenham chaves privadas.**

---

## Executando o projeto

### Ambiente de desenvolvimento

Para iniciar a interface React:

```bash
npm run dev
```

O Vite disponibilizará um endereço local, normalmente:

```text
http://localhost:5173
```

### Testes com as APIs

Como o projeto utiliza funções serverless da Vercel, o servidor do Vite isoladamente não executa as APIs de upload.

Para testar a integração completa localmente, utilize:

```bash
npx vercel dev
```

A configuração local deve conter as variáveis necessárias para o backend.

---

## Firebase

O Firebase é responsável pela autenticação e pelo armazenamento dos dados da aplicação.

### Authentication

A autenticação utiliza o método E-mail/senha do Firebase.

O jogador informa apenas seu ID e sua senha na interface.

Internamente, o sistema utiliza um identificador de autenticação derivado do ID do jogador.

### Cloud Firestore

O banco de dados utiliza coleções para armazenar usuários, pontos e progresso.

Estrutura conceitual:

```text
Firestore
│
├── users/
│   └── {firebaseUid}/
│       ├── playerId
│       ├── name
│       ├── role
│       └── createdAt
│
│       └── completedWitches/
│           └── {witchId}/
│               └── completedAt
│
└── witches/
    └── {witchId}/
        ├── number
        ├── difficulty
        ├── location
        ├── images
        └── createdAt
```

### Segurança

As regras do Firestore são responsáveis por restringir as operações de acordo com a identidade do usuário.

Os jogadores podem consultar os pontos disponíveis e gerenciar seu próprio progresso.

O gerenciamento global dos pontos é reservado aos administradores.

As permissões administrativas são verificadas utilizando custom claims do Firebase Authentication.

---

## Cloudinary

O Cloudinary é responsável pelo armazenamento das imagens associadas às bruxinhas.

Organização prevista:

```text
caca-as-bruxinhas/
└── pontos/
    ├── bruxinha-001/
    ├── bruxinha-002/
    ├── bruxinha-003/
    └── ...
```

O processo de upload utiliza a API da Vercel.

### Fluxo de upload

1. O administrador seleciona as imagens.
2. O React envia uma requisição autenticada ao backend.
3. A API valida o token do Firebase.
4. O backend verifica a permissão administrativa.
5. As imagens são enviadas ao Cloudinary.
6. As referências são associadas ao ponto no Firestore.

O sistema também prevê a exclusão de imagens associadas a pontos removidos ou editados.

---

## Permissões

O projeto possui três níveis principais de acesso.

| Cargo | Permissão |
|---|---|
| `player` | Visualizar pontos e gerenciar o próprio progresso |
| `admin` | Gerenciar os pontos e suas imagens |
| `owner` | Administrador principal |

O administrador principal é configurado por meio do Firebase Admin SDK.

A atribuição de permissões administrativas não pode ser realizada diretamente pelo cadastro público.

---

## Publicação na Vercel

A aplicação foi desenvolvida para publicação na Vercel.

### Configurações

| Configuração | Valor |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Root Directory | `./` |

### Variáveis de ambiente

As variáveis utilizadas pelo React e pelo backend devem ser cadastradas em:

**Vercel → Project → Settings → Environment Variables**

As variáveis `VITE_` são incorporadas ao frontend durante a compilação.

As credenciais privadas do Firebase Admin SDK e do Cloudinary devem permanecer acessíveis somente ao backend.

Após modificar variáveis de ambiente, é necessário realizar um novo deploy para atualizar a aplicação publicada.

---

## Segurança

O projeto utiliza mecanismos para proteger informações e operações administrativas.

Entre as medidas adotadas estão:

- Autenticação pelo Firebase;
- Identificação individual dos usuários;
- Regras de segurança do Firestore;
- Custom claims para permissões administrativas;
- Validação de tokens no backend;
- Proteção das credenciais privadas;
- Restrição de uploads aos administradores;
- Separação entre frontend e backend.

Arquivos com credenciais não devem ser enviados ao repositório.

Exemplo de `.gitignore`:

```gitignore
node_modules/
dist/

.env
.env.local
.env.*.local

secrets/
serviceAccountKey.json

.vercel/
```

---

## Estado do desenvolvimento

O projeto encontra-se em desenvolvimento e integração.

### Funcionalidades implementadas no código

- Estrutura React;
- Autenticação com Firebase;
- Cadastro por ID;
- Mapa interativo com Leaflet;
- Mapa personalizado do GTA V e expansão FiveM;
- Marcadores por dificuldade;
- Sistema de progresso individual;
- Painel administrativo;
- Integração com Firestore;
- API de integração com Cloudinary;
- Configuração de publicação na Vercel.

### Validações pendentes

- Confirmar o funcionamento completo do ambiente publicado;
- Validar o upload de imagens no Cloudinary;
- Testar o cadastro, a edição e a exclusão dos pontos;
- Verificar o progresso individual com diferentes usuários;
- Testar a interface em dispositivos móveis;
- Validar as permissões administrativas em produção.

---

## Objetivo do projeto

O Caça às Bruxinhas foi desenvolvido para proporcionar uma experiência mais organizada e acessível durante eventos de coleta de itens em servidores FiveM.

A aplicação centraliza informações sobre as localizações, facilita a identificação dos pontos e permite que cada jogador acompanhe sua evolução sem interferir no progresso dos demais.

---

## Desenvolvedor

**Luiz Eduardo**

Desenvolvimento Web • React JS • Firebase • UI/UX Design

GitHub: LuizEdu-AR

---

**Caça às Bruxinhas — Encontre, marque e complete sua coleção.**