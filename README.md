# ✈️ DR TravelHub (Gestão de Viagens)

Bem-vindo ao repositório do **DR TravelHub** (Gestão de Viagens). Este sistema foi desenvolvido para gerenciar e otimizar as passagens e viagens corporativas, integrando-se com Firebase e TOTVS RM.

Este documento foi preparado para facilitar o *onboarding* do próximo desenvolvedor responsável pelo projeto.

---

## 🏗️ Arquitetura e Tecnologias

O projeto é um front-end moderno, construído utilizando as seguintes tecnologias:

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend / Database / Auth:** [Firebase 12](https://firebase.google.com/) (Firestore, Auth)
- **Integração Externa:** [TOTVS RM API](https://tdn.totvs.com/display/public/RM/TOTVS+API) (Consultas SQL Server via API)
- **Gráficos e Dashboards:** [Recharts](https://recharts.org/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/)
- **IA e Automação (Opcional):** Integração com Gemini via `@google/genai`

---

## 📂 Estrutura do Projeto

Abaixo, a estrutura principal de diretórios:

```text
gestao_viagens/
├── public/                 # Assets estáticos
├── src/                    # Código fonte da aplicação React
│   ├── components/         # Componentes reutilizáveis de UI
│   ├── pages/              # Páginas e views da aplicação
│   ├── services/           # Regras de negócio e chamadas de API externas (Firebase, TOTVS)
│   ├── hooks/              # Custom React Hooks
│   ├── context/            # React Contexts para estado global
│   ├── utils/              # Funções utilitárias e helpers
│   └── App.tsx / main.tsx  # Entradas principais da aplicação
├── backend/                # Funções ou scripts de backend auxiliares
├── .env.example            # Exemplo das variáveis de ambiente necessárias
├── vite.config.ts          # Configurações do Vite
├── firestore.rules         # Regras de segurança do Firestore
└── package.json            # Dependências e scripts
```

---

## ⚙️ Pré-requisitos e Instalação

Para rodar a aplicação localmente, certifique-se de ter instalado:
- **Node.js** (versão 18+ recomendada)
- **NPM** (ou Yarn/PNPM)
- Uma conta no Firebase (para acessar o console do projeto)
- Acesso à API do TOTVS RM (credentials de base64)

### 1. Clonando o Repositório

```bash
git clone https://github.com/Grupo-DR/gestao_viagens.git
cd gestao_viagens
```

### 2. Instalando as Dependências

```bash
npm install
```

### 3. Configurando as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto, baseado no arquivo `.env.example`:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha as chaves:
- Chaves do **Firebase** (podem ser obtidas no Console do Firebase > Project Settings > General)
- Informações do **TOTVS RM** (Authorization base64)

> ⚠️ **Aviso:** Nunca versione o arquivo `.env` para o repositório público!

---

## 🚀 Rodando o Projeto Localmente

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível por padrão em `http://localhost:3000` (ou na porta definida no console). O host `0.0.0.0` está configurado para acesso na rede local se necessário.

Outros scripts úteis disponíveis:
- `npm run build` - Gera a build otimizada para produção.
- `npm run preview` - Inicia um servidor estático local para visualizar a build de produção.
- `npm run lint` - Verifica erros de tipagem com o TypeScript.
- `npm run test` - Roda os testes configurados no Vitest.

---

## 🔒 Firebase e Banco de Dados

A aplicação utiliza o **Firestore** como banco de dados NoSQL principal.
- **Regras de Segurança:** O arquivo `firestore.rules` contém as regras atuais para leitura/gravação. Ao atualizar, lembre-se de fazer o deploy pelo Firebase CLI: `firebase deploy --only firestore:rules`.
- É importante revisar os arquivos de metadados como `firebase-applet-config.json` se houver integrações externas com Firebase Extensions ou scripts autômatos.

---

## 🤝 Fluxo de Trabalho (Onboarding)

Ao assumir o projeto, recomenda-se:
1. Ler o **`HOMOLOGATION_CHECKLIST.md`** e **`SPRINT_4_REPORT.md`** na raiz do projeto, para entender o status atual e últimas homologações feitas.
2. Analisar o arquivo `ts_errors.txt` para checar os débitos técnicos de tipagem pendentes.
3. Obter acesso de "Owner" ou "Editor" no projeto do Firebase associado com a diretoria.
4. Validar os acessos à API do RM.

### Contato e Passagem de Bastão

Este repositório está sendo transferido devido a mudanças na equipe de engenharia. Qualquer dúvida sobre o projeto, regras de negócio passadas e acessos às APIs do cliente deve ser direcionada ao gestor de TI ou engenheiro líder da empresa atual.

Sucesso no desenvolvimento e manutenção do **DR TravelHub**! 🚀
