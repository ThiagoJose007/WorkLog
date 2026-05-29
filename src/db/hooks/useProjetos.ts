import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../schema'
import type { Projeto, ProjetoStatus } from '../types'

/** Projetos da empresa ativa, opcionalmente filtrados por status. */
export function useProjetos(
  empresaId: string | null | undefined,
  opts?: { status?: ProjetoStatus | ProjetoStatus[] },
) {
  return useLiveQuery(async () => {
    if (!empresaId) return []

    const todos = await db.projetos
      .where('empresa_id').equals(empresaId)
      .sortBy('nome')

    if (!opts?.status) return todos

    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status]
    return todos.filter((p) => statuses.includes(p.status))
  }, [empresaId, JSON.stringify(opts?.status)])
}

/** Projeto pelo id. */
export function useProjeto(id: string | null | undefined) {
  return useLiveQuery(
    () => (id ? db.projetos.get(id) : undefined),
    [id],
  )
}

/** Total de horas de um projeto (soma dos registrosTempo de todas as demandas). */
export function useTotalHorasProjeto(projetoId: string | null | undefined) {
  return useLiveQuery(async () => {
    if (!projetoId) return 0
    const demandas = await db.demandas
      .where('projeto_id').equals(projetoId).toArray()
    const demandaIds = demandas.map((d) => d.id)
    const registros = await db.registrosTempo
      .where('demanda_id').anyOf(demandaIds).toArray()
    return registros.reduce((acc, r) => acc + r.duracao_min, 0)
  }, [projetoId])
}

/**
 * Stats consolidados de um projeto em uma única query Dexie:
 * quantidade de demandas e total de minutos registrados.
 */
export function useProjetoStats(projetoId: string | null | undefined) {
  return useLiveQuery(async () => {
    if (!projetoId) return { demandaCount: 0, totalMinutos: 0 }

    const demandas = await db.demandas
      .where('projeto_id').equals(projetoId).toArray()

    const demandaIds = demandas.map((d) => d.id)
    const registros =
      demandaIds.length > 0
        ? await db.registrosTempo.where('demanda_id').anyOf(demandaIds).toArray()
        : []

    return {
      demandaCount: demandas.length,
      totalMinutos: registros.reduce((acc, r) => acc + r.duracao_min, 0),
    }
  }, [projetoId])
}

// ── Mutações ────────────────────────────────────────────────────────────────

export async function createProjeto(
  data: Omit<Projeto, 'id' | 'created_at'>,
): Promise<string> {
  const id = crypto.randomUUID()
  await db.projetos.add({ ...data, id, created_at: Date.now() })
  return id
}

export async function updateProjeto(
  id: string,
  data: Partial<Omit<Projeto, 'id' | 'created_at'>>,
): Promise<void> {
  await db.projetos.update(id, data)
}

export async function deleteProjeto(projetoId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.projetos, db.demandas, db.demandaLinks, db.demandaImagens, db.registrosTempo],
    async () => {
      const demandas = await db.demandas
        .where('projeto_id').equals(projetoId).toArray()
      const demandaIds = demandas.map((d) => d.id)

      await db.demandaLinks.where('demanda_id').anyOf(demandaIds).delete()
      await db.demandaImagens.where('demanda_id').anyOf(demandaIds).delete()
      await db.registrosTempo.where('demanda_id').anyOf(demandaIds).delete()
      await db.demandas.where('projeto_id').equals(projetoId).delete()
      await db.projetos.delete(projetoId)
    },
  )
}
