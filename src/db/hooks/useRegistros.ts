import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../schema'
import type { Demanda, DiarioImagem, RegistroDiario } from '../types'

// ── Registros diários ────────────────────────────────────────────────────────

/**
 * Registros diários de uma empresa, do mais recente para o mais antigo.
 * Opcionalmente filtrado por período.
 */
export function useRegistrosDiarios(
  empresaId: string | null | undefined,
  opts?: { dataInicio?: string; dataFim?: string },
) {
  return useLiveQuery(async () => {
    if (!empresaId) return []

    let registros = await db.registrosDiarios
      .where('empresa_id').equals(empresaId)
      .sortBy('data')

    if (opts?.dataInicio) {
      registros = registros.filter((r) => r.data >= opts.dataInicio!)
    }
    if (opts?.dataFim) {
      registros = registros.filter((r) => r.data <= opts.dataFim!)
    }

    return registros.reverse()
  }, [empresaId, opts?.dataInicio, opts?.dataFim])
}

/** Registro diário pelo id. */
export function useRegistroDiario(id: string | null | undefined) {
  return useLiveQuery(
    () => (id ? db.registrosDiarios.get(id) : undefined),
    [id],
  )
}

/**
 * Registro diário de uma empresa em uma data específica.
 * Usa índice composto [empresa_id+data] para eficiência.
 */
export function useRegistroDiarioPorData(
  empresaId: string | null | undefined,
  data: string | null | undefined, // YYYY-MM-DD
) {
  return useLiveQuery(
    () =>
      empresaId && data
        ? db.registrosDiarios.get({ empresa_id: empresaId, data })
        : undefined,
    [empresaId, data],
  )
}

// ── Demandas vinculadas ao registro (N:N) ────────────────────────────────────

/**
 * Demandas referenciadas em um registro diário.
 * Faz o join: diarioDemandas → demandas.
 */
export function useDiarioDemandas(diarioId: string | null | undefined) {
  return useLiveQuery(async (): Promise<Demanda[]> => {
    if (!diarioId) return []

    const junctions = await db.diarioDemandas
      .where('diario_id').equals(diarioId).toArray()

    if (junctions.length === 0) return []

    const demandaIds = junctions.map((j) => j.demanda_id)
    const demandas = await db.demandas.bulkGet(demandaIds)

    return demandas.filter((d): d is Demanda => d !== undefined)
  }, [diarioId])
}

/** Imagens de um registro diário. */
export function useDiarioImagens(diarioId: string | null | undefined) {
  return useLiveQuery(
    () =>
      diarioId
        ? db.diarioImagens
            .where('diario_id').equals(diarioId)
            .sortBy('created_at')
        : [],
    [diarioId],
  )
}

// ── Mutações ─────────────────────────────────────────────────────────────────

/**
 * Cria ou obtém o registro diário de uma empresa em uma data.
 * RN-09: registro vazio não é salvo — validar antes de chamar.
 */
export async function upsertRegistroDiario(
  empresaId: string,
  data: string, // YYYY-MM-DD
): Promise<string> {
  const existente = await db.registrosDiarios.get({ empresa_id: empresaId, data })
  if (existente) return existente.id

  const id = crypto.randomUUID()
  await db.registrosDiarios.add({
    id,
    empresa_id: empresaId,
    data,
    created_at: Date.now(),
  })
  return id
}

export async function updateRegistroDiario(
  id: string,
  data: Partial<Pick<RegistroDiario, 'texto'>>,
): Promise<void> {
  await db.registrosDiarios.update(id, data)
}

/** Vincula uma demanda a um registro (cria DiarioDemanda se não existir). */
export async function vincularDemandaAoRegistro(
  diarioId: string,
  demandaId: string,
): Promise<void> {
  const existe = await db.diarioDemandas.get([diarioId, demandaId])
  if (!existe) {
    await db.diarioDemandas.add({ diario_id: diarioId, demanda_id: demandaId })
  }
}

/** Remove o vínculo entre demanda e registro. */
export async function desvincularDemandaDoRegistro(
  diarioId: string,
  demandaId: string,
): Promise<void> {
  await db.diarioDemandas.delete([diarioId, demandaId])
}

export async function addDiarioImagem(
  data: Omit<DiarioImagem, 'id' | 'created_at'>,
): Promise<string> {
  const id = crypto.randomUUID()
  await db.diarioImagens.add({ ...data, id, created_at: Date.now() })
  return id
}

export async function deleteDiarioImagem(id: string): Promise<void> {
  await db.diarioImagens.delete(id)
}

/**
 * Exclui um registro diário e seus vínculos e imagens.
 * Não exclui as demandas referenciadas (apenas o vínculo).
 */
export async function deleteRegistroDiario(diarioId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.registrosDiarios, db.diarioDemandas, db.diarioImagens],
    async () => {
      await db.diarioDemandas.where('diario_id').equals(diarioId).delete()
      await db.diarioImagens.where('diario_id').equals(diarioId).delete()
      await db.registrosDiarios.delete(diarioId)
    },
  )
}
