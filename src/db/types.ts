// ─────────────────────────────────────────────
// Empresa
// ─────────────────────────────────────────────
export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  logo_base64?: string
  cor_destaque: string
  status: 'ativo' | 'arquivado'
  created_at: number
}

// ─────────────────────────────────────────────
// Projeto
// ─────────────────────────────────────────────
export type ProjetoStatus = 'ativo' | 'pausado' | 'concluido' | 'cancelado'

export interface Projeto {
  id: string
  empresa_id: string
  nome: string
  descricao?: string
  status: ProjetoStatus
  data_inicio: string  // YYYY-MM-DD
  data_fim?: string    // YYYY-MM-DD, nullable
  created_at: number
}

// ─────────────────────────────────────────────
// Membro
// ─────────────────────────────────────────────
export interface Membro {
  id: string
  nome: string
  email?: string
  created_at: number
}

export interface MembroProjeto {
  membro_id: string
  projeto_id: string
  papel: string  // ex: 'dev' | 'pm' | 'designer'
}

// ─────────────────────────────────────────────
// Demanda — SEMPRE tem projeto_id (nunca solta)
// ─────────────────────────────────────────────
export type DemandaTipo = 'tarefa' | 'reuniao' | 'alinhamento'
export type DemandaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente'
export type DemandaStatus =
  | 'backlog'
  | 'andamento'
  | 'revisao'
  | 'concluida'
  | 'cancelada'

export interface Demanda {
  id: string
  projeto_id: string       // FK obrigatório — demanda sem projeto não existe
  titulo: string
  tipo: DemandaTipo        // imutável após criação (RN-06)
  prioridade: DemandaPrioridade
  status: DemandaStatus
  descricao?: string
  created_at: number
}

// ─────────────────────────────────────────────
// Links de ferramentas (filhos de Demanda)
// ─────────────────────────────────────────────
export type FerramentaLink =
  | 'jira'
  | 'linear'
  | 'trello'
  | 'github'
  | 'asana'
  | 'clickup'
  | 'figma'
  | 'notion'
  | 'outro'

export interface DemandaLink {
  id: string
  demanda_id: string
  url: string
  label: string
  ferramenta: FerramentaLink
}

// ─────────────────────────────────────────────
// Imagens de demanda
// ─────────────────────────────────────────────
export interface DemandaImagem {
  id: string
  demanda_id: string
  arquivo_base64: string
  legenda?: string
  created_at: number
}

// ─────────────────────────────────────────────
// Registro de tempo (filho de Demanda)
// ─────────────────────────────────────────────
export type RegistroTempoTipo = 'timer' | 'manual'

export interface RegistroTempo {
  id: string
  demanda_id: string
  data: string          // YYYY-MM-DD
  duracao_min: number   // duração em minutos (mínimo 1 — RN-13)
  nota?: string
  tipo: RegistroTempoTipo
  inicio?: number       // timestamp ms — preenchido pelo timer ao iniciar
  fim?: number          // timestamp ms — null = timer ainda rodando (RN-11)
  created_at: number
}

// ─────────────────────────────────────────────
// Registro diário — tem empresa_id, NÃO tem projeto_id (RN-07/08)
// Referencia demandas existentes, nunca as cria
// ─────────────────────────────────────────────
export interface RegistroDiario {
  id: string
  empresa_id: string  // pertence à empresa, não ao projeto
  data: string        // YYYY-MM-DD
  texto?: string      // texto livre (pode ser vazio se houver demandas ou imagens)
  created_at: number
}

// Vínculo N:N entre RegistroDiario e Demanda
export interface DiarioDemanda {
  diario_id: string
  demanda_id: string
}

// Imagens do registro diário (evidências)
export interface DiarioImagem {
  id: string
  diario_id: string
  arquivo_base64: string
  legenda?: string
  created_at: number
}
