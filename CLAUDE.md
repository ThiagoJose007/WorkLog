# WorkLog — contexto para Claude Code

## Hierarquia de dados (NUNCA violar)
Empresa → Projeto → Demanda → RegistroTempo / DemandaLink / DemandaImagem
Empresa → RegistroDiario → DiarioDemanda (referencia demandas, não cria)

Distinção crítica:
- **Demanda**: unidade de trabalho criada dentro de um projeto. Tem ciclo de vida, prioridade, timer e links.
- **RegistroDiario**: log "o que foi feito hoje". Apenas *referencia* demandas existentes — nunca cria nem duplica.
- RegistroDiario tem `empresa_id` mas **NÃO tem** `projeto_id`. As demandas referenciadas já carregam o projeto.

## Stack
React 18, TypeScript, Vite, Tailwind v3, Zustand, Dexie.js, React Router v6
- PDF: @react-pdf/renderer
- Editor de texto rico: TipTap (ProseMirror)
- Ícones: Lucide React
- Datas: date-fns

## Estrutura de pastas
```
src/
├── app/                  # Rotas e providers globais
├── features/
│   ├── empresas/         # Seletor, CRUD de empresa
│   ├── projetos/         # Lista, form, membros
│   ├── demandas/         # Board, card, timer, links
│   ├── registros/        # Diário, seletor de demandas
│   ├── relatorio/        # Visualização e exportação PDF
│   └── backup/           # Export/import JSON
├── shared/
│   ├── components/       # Button, Input, Badge, Card...
│   ├── hooks/            # useTimer, useActiveEmpresa...
│   └── utils/            # detectTool(url), formatTime...
├── store/                # Zustand stores por domínio
└── db/                   # Dexie schema e queries
```

## Dark mode é primário
bg-base: #0E0E0C | bg-surface: #161614 | bg-elevated: #1E1E1B | bg-input: #252521
border: #2E2E2B | border-hover: #3D3D39
text-primary: #E8E6DE | text-secondary: #9C9A92 | text-muted: #66645E
accent: #7F77DD | accent-hover: #AFA9EC

### Cores semânticas (dark)
- Empresa/nav: fill #26215C · text #CECBF6
- Projeto: fill #042C53 · text #B5D4F4
- Demanda/tarefa: fill #412402 · text #FAC775
- Registro diário: fill #4A1B0C · text #F5C4B3
- Tempo/timer: fill #04342C · text #9FE1CB
- PDF/export: fill #173404 · text #C0DD97
- Sucesso: fill #0F6E56 · text #9FE1CB
- Perigo: fill #791F1F · text #F7C1C1

### Tipografia
- h1 Display: 28px 500 ls-0.03em
- h2: 20px 500 ls-0.01em
- h3: 16px 500
- Body: 14px 400 lh1.6
- Label/badge: 12px 500 ls0.03em
- Caption: 11px 400
- Fonte sugerida: Geist ou Inter (system-ui fallback)

### Espaçamento
- radius: sm=6px md=8px lg=12px xl=16px
- space-base: 8px (múltiplos: 4,8,12,16,24,32,48)
- Borda padrão: 0.5px solid var(--border)
- Sidebar: 220px colapsável

## Schema Dexie (tabelas)
| Tabela | Campos obrigatórios |
|---|---|
| empresas | id, nome, cnpj?, logo_url?, cor_destaque, status(ativo\|arquivado), created_at |
| projetos | id, empresa_id, nome, descricao?, status(ativo\|pausado\|concluido\|cancelado), data_inicio, data_fim? |
| demandas | id, projeto_id, titulo, tipo(tarefa\|reuniao\|alinhamento), prioridade(baixa\|media\|alta\|urgente), status(backlog\|andamento\|revisao\|concluida\|cancelada), descricao?, created_at |
| demandaLinks | id, demanda_id, url, label, ferramenta(jira\|linear\|trello\|github\|asana\|clickup\|figma\|notion\|outro) |
| demandaImagens | id, demanda_id, arquivo(base64), legenda? |
| registrosTempo | id, demanda_id, data, duracao_min, nota?, tipo(timer\|manual) |
| registrosDiarios | id, empresa_id, data, texto?, created_at |
| diarioDemandas | diario_id, demanda_id (N:N) |
| diarioImagens | id, diario_id, arquivo(base64), legenda? |

## Regras de negócio críticas
- RN-01: Todo objeto pertence a exatamente uma empresa. Dados jamais compartilhados entre empresas.
- RN-03: Excluir empresa exclui tudo em cascata. Exige confirmação com digitação do nome.
- RN-04: Demanda DEVE pertencer a um projeto. Não existe demanda solta.
- RN-06: tipo da demanda (tarefa/reunião/alinhamento) é **imutável** após criação.
- RN-08: RegistroDiario NÃO cria demandas. Seleção mostra apenas demandas da empresa ativa.
- RN-09: Registro deve ter ao menos: texto OU demanda referenciada OU imagem. Vazio não salva.
- RN-11: Só um timer ativo por vez. Iniciar novo encerra anterior com aviso.
- RN-12: Demanda concluída/cancelada não aceita novos lançamentos sem reabertura explícita.
- RN-14: URL colada → detectar ferramenta automaticamente por padrão de domínio.
- RN-16: PDF nunca mistura dados de empresas diferentes.
- RN-17: Imagens redimensionadas para max 800px. PDF limitado a 10 MB.

## Persistência
- Dexie.js (IndexedDB) para todos os dados — nunca localStorage para objetos complexos
- localStorage apenas para: empresa ativa (id string), preferências de UI
- Export/import JSON em src/features/backup/ — único mecanismo de portabilidade entre devices
- Modo substituir: limpar tabelas antes do import. Modo mesclar: bulkPut (upsert por id, não bulkAdd)
- Estrutura do backup: { version: "1.0", exported_at: ISO, data: { empresas[], projetos[], ... } }

## Deploy
- SPA estático no Vercel
- vercel.json: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- Sem variáveis de ambiente necessárias para a fase 1
- vite.config.ts com base: '/'

## Regras de código
- Componentes em features/[dominio]/components/
- Cada feature tem seu próprio store Zustand
- Sempre TypeScript strict — sem any
- Demanda sempre tem projeto_id. RegistroDiario sempre tem empresa_id.
- darkMode: 'class' com classe `dark` sempre aplicada no `<html>`

## Roadmap de sprints
- Sprint 1: Setup + empresas + projetos + schema Dexie (prompts 1-4)
- Sprint 2: Demandas completas: tipos, links de ferramentas, imagens (prompt 5)
- Sprint 3: Timer + registros diários com referência a demandas (prompts 6-7)
- Sprint 4: Relatório PDF + polimento visual (prompts 8-9)
- Sprint 5: Export/import JSON + deploy Vercel + README (prompts 10-11)

## Funcionalidades pós-MVP
- Dashboard com gráficos de horas por semana/mês
- Exportação CSV dos registros de tempo
- Templates de relatório PDF customizáveis por empresa
- Dexie Cloud — sync automático entre devices
- PWA com service worker
- Atalhos de teclado globais (command palette)
- Integração Google Calendar para reuniões
- Backend Supabase + autenticação (se virar produto multi-usuário)
