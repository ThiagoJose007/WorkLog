# WorkLog

Aplicativo de registro de tempo e atividades para freelancers e consultores. Organize seu trabalho por empresa, projeto e demanda — tudo salvo localmente no navegador, sem conta e sem servidor.

## Funcionalidades

- Gerenciamento de empresas, projetos e demandas com prioridade e status
- Timer integrado por demanda + lançamento manual de tempo
- Registro diário de atividades com editor de texto rico e imagens
- Relatório PDF por empresa e período
- Export/import JSON para backup e portabilidade entre dispositivos

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v3 · Dexie.js (IndexedDB) · Zustand · React Router v6 · TipTap · @react-pdf/renderer

## Instalação local

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Build de produção

```bash
npm run build   # gera a pasta dist/
npm run preview # serve o build localmente para conferência
```

## Deploy no Vercel

1. Faça push do repositório para o GitHub
2. No [Vercel](https://vercel.com), clique em **Add New Project** e importe o repositório
3. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Clique em **Deploy** — nenhuma variável de ambiente é necessária

O arquivo `vercel.json` já inclui o rewrite de SPA (`/* → /index.html`) para que o React Router funcione corretamente em produção.

## Persistência de dados

Todos os dados ficam no **IndexedDB** do navegador (via Dexie.js) — nenhum dado é enviado para servidores externos.

Para transferir dados entre dispositivos ou fazer backup, use a funcionalidade **Backup → Exportar** dentro do próprio aplicativo. O arquivo `.json` gerado pode ser importado em qualquer navegador com o WorkLog aberto.
