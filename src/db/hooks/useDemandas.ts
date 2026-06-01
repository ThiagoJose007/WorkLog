import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../schema'
import type {
  Demanda,
  DemandaLink,
  DemandaImagem,
  DemandaStatus,
  Projeto,
  RegistroTempo,
  FerramentaLink,
} from '../types'

export interface DemandaComProjeto {
  demanda: Demanda
  projeto: Projeto
}

/** Todas as demandas da empresa, com info do projeto. Útil para seletores globais. */
export function useDemandasComProjeto(empresaId: string | null | undefined): DemandaComProjeto[] | undefined {
  return useLiveQuery(async (): Promise<DemandaComProjeto[]> => {
    if (!empresaId) return []
    const projetos = await db.projetos.where('empresa_id').equals(empresaId).toArray()
    if (projetos.length === 0) return []
    const projetoMap = new Map(projetos.map((p) => [p.id, p]))
    const demandas = await db.demandas
      .where('projeto_id').anyOf(projetos.map((p) => p.id))
      .sortBy('titulo')
    return demandas
      .map((d) => ({ demanda: d, projeto: projetoMap.get(d.projeto_id)! }))
      .filter((x) => x.projeto !== undefined)
  }, [empresaId])
}
import { hoje } from '../../shared/utils/time'

// ── Demandas ────────────────────────────────────────────────────────────────

/** Demandas de um projeto, opcionalmente filtradas por status. */
export function useDemandas(
  projetoId: string | null | undefined,
  opts?: { status?: DemandaStatus | DemandaStatus[] },
) {
  return useLiveQuery(async () => {
    if (!projetoId) return []

    const todas = await db.demandas
      .where('projeto_id').equals(projetoId)
      .sortBy('created_at')

    if (!opts?.status) return todas

    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status]
    return todas.filter((d) => statuses.includes(d.status))
  }, [projetoId, JSON.stringify(opts?.status)])
}

/** Demandas de múltiplos projetos (usado no seletor de registro diário). */
export function useDemandasDeProjetos(projetoIds: string[]) {
  return useLiveQuery(
    () =>
      projetoIds.length > 0
        ? db.demandas.where('projeto_id').anyOf(projetoIds).sortBy('titulo')
        : [],
    [projetoIds.join(',')],
  )
}

/** Demanda pelo id. */
export function useDemanda(id: string | null | undefined) {
  return useLiveQuery(
    () => (id ? db.demandas.get(id) : undefined),
    [id],
  )
}

// ── Links de ferramentas ─────────────────────────────────────────────────────

/** Links de uma demanda. */
export function useDemandaLinks(demandaId: string | null | undefined) {
  return useLiveQuery(
    () =>
      demandaId
        ? db.demandaLinks.where('demanda_id').equals(demandaId).toArray()
        : [],
    [demandaId],
  )
}

export async function addDemandaLink(
  data: Omit<DemandaLink, 'id'>,
): Promise<string> {
  const id = crypto.randomUUID()
  await db.demandaLinks.add({ ...data, id })
  return id
}

export async function deleteDemandaLink(id: string): Promise<void> {
  await db.demandaLinks.delete(id)
}

// ── Imagens da demanda ───────────────────────────────────────────────────────

/** Imagens de uma demanda. */
export function useDemandaImagens(demandaId: string | null | undefined) {
  return useLiveQuery(
    () =>
      demandaId
        ? db.demandaImagens
            .where('demanda_id').equals(demandaId)
            .sortBy('created_at')
        : [],
    [demandaId],
  )
}

export async function addDemandaImagem(
  data: Omit<DemandaImagem, 'id' | 'created_at'>,
): Promise<string> {
  const id = crypto.randomUUID()
  await db.demandaImagens.add({ ...data, id, created_at: Date.now() })
  return id
}

export async function deleteDemandaImagem(id: string): Promise<void> {
  await db.demandaImagens.delete(id)
}

// ── Registro de tempo ────────────────────────────────────────────────────────

/** Todos os registros de tempo de uma demanda, ordenados por data. */
export function useRegistrosTempo(demandaId: string | null | undefined) {
  return useLiveQuery(
    () =>
      demandaId
        ? db.registrosTempo
            .where('demanda_id').equals(demandaId)
            .sortBy('data')
        : [],
    [demandaId],
  )
}

/** Total de minutos registrados em uma demanda. */
export function useTotalMinutosDemanda(demandaId: string | null | undefined) {
  return useLiveQuery(async () => {
    if (!demandaId) return 0
    const registros = await db.registrosTempo
      .where('demanda_id').equals(demandaId).toArray()
    return registros.reduce((acc, r) => acc + r.duracao_min, 0)
  }, [demandaId])
}

/**
 * Timer ativo no momento (tipo='timer' com fim indefinido).
 * RN-11: só pode haver um por vez.
 */
export function useTimerAtivo() {
  return useLiveQuery(
    () =>
      db.registrosTempo
        .where('tipo').equals('timer')
        .filter((r) => r.fim === undefined || r.fim === null)
        .first(),
    [],
  )
}

// ── Mutações de demanda ──────────────────────────────────────────────────────

export async function createDemanda(
  data: Omit<Demanda, 'id' | 'created_at'>,
): Promise<string> {
  const id = crypto.randomUUID()
  await db.demandas.add({ ...data, id, created_at: Date.now() })
  return id
}

export async function updateDemanda(
  id: string,
  data: Partial<Omit<Demanda, 'id' | 'created_at' | 'tipo'>>,
): Promise<void> {
  // tipo é imutável (RN-06) — não pode ser alterado aqui
  await db.demandas.update(id, data)
}

export async function updateDemandaStatus(
  id: string,
  status: DemandaStatus,
): Promise<void> {
  await db.demandas.update(id, { status })
}

export async function deleteDemanda(demandaId: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.demandas,
      db.demandaLinks,
      db.demandaImagens,
      db.registrosTempo,
      db.diarioDemandas,
    ],
    async () => {
      await db.demandaLinks.where('demanda_id').equals(demandaId).delete()
      await db.demandaImagens.where('demanda_id').equals(demandaId).delete()
      await db.registrosTempo.where('demanda_id').equals(demandaId).delete()
      await db.diarioDemandas.where('demanda_id').equals(demandaId).delete()
      await db.demandas.delete(demandaId)
    },
  )
}

// ── Mutações de registro de tempo ────────────────────────────────────────────

export async function addRegistroTempoManual(
  data: Pick<RegistroTempo, 'demanda_id' | 'data' | 'duracao_min' | 'nota'>,
): Promise<string> {
  const id = crypto.randomUUID()
  await db.registrosTempo.add({
    ...data,
    id,
    tipo: 'manual',
    created_at: Date.now(),
  })
  return id
}

export async function deleteRegistroTempo(id: string): Promise<void> {
  await db.registrosTempo.delete(id)
}

/** Cria um registro de tempo do tipo timer (inicio=now, fim=indefinido). RN-11. */
export async function iniciarTimer(demandaId: string): Promise<string> {
  const id = crypto.randomUUID()
  await db.registrosTempo.add({
    id,
    demanda_id: demandaId,
    data: hoje(),
    duracao_min: 0,
    tipo: 'timer',
    inicio: Date.now(),
    created_at: Date.now(),
  })
  return id
}

/** Encerra um timer ativo: grava fim e duracao_min calculada. */
export async function encerrarTimerAtivo(
  registroId: string,
  elapsedMs: number,
): Promise<void> {
  const duracao_min = Math.max(1, Math.round(elapsedMs / 60000))
  await db.registrosTempo.update(registroId, { fim: Date.now(), duracao_min })
}

// ── Detecção automática de ferramenta por URL (RN-14) ───────────────────────

const TOOL_PATTERNS: Array<{ pattern: RegExp; ferramenta: FerramentaLink }> = [
  { pattern: /atlassian\.net|jira\.com/i, ferramenta: 'jira' },
  { pattern: /linear\.app/i, ferramenta: 'linear' },
  { pattern: /trello\.com/i, ferramenta: 'trello' },
  { pattern: /github\.com/i, ferramenta: 'github' },
  { pattern: /app\.asana\.com|asana\.com/i, ferramenta: 'asana' },
  { pattern: /app\.clickup\.com|clickup\.com/i, ferramenta: 'clickup' },
  { pattern: /figma\.com/i, ferramenta: 'figma' },
  { pattern: /notion\.so|notion\.site/i, ferramenta: 'notion' },
]

export function detectarFerramenta(url: string): FerramentaLink {
  const match = TOOL_PATTERNS.find(({ pattern }) => pattern.test(url))
  return match?.ferramenta ?? 'outro'
}
