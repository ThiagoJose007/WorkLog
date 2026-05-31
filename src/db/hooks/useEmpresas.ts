import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../schema'
import type { Empresa } from '../types'

/** Todas as empresas ativas (ou todas se incluirArquivadas=true). */
export function useEmpresas(opts?: { incluirArquivadas?: boolean }) {
  return useLiveQuery(async () => {
    const todas = await db.empresas.toArray()
    const filtradas = opts?.incluirArquivadas
      ? todas
      : todas.filter((e) => e.status === 'ativo')
    return filtradas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [opts?.incluirArquivadas])
}

/** Empresa pelo id. Retorna undefined enquanto carrega, null se não existe. */
export function useEmpresa(id: string | null | undefined) {
  return useLiveQuery(
    () => (id ? db.empresas.get(id) : undefined),
    [id],
  )
}

// ── Mutações ────────────────────────────────────────────────────────────────

export async function createEmpresa(
  data: Omit<Empresa, 'id' | 'created_at'>,
): Promise<string> {
  const id = crypto.randomUUID()
  await db.empresas.add({ ...data, id, created_at: Date.now() })
  return id
}

export async function updateEmpresa(
  id: string,
  data: Partial<Omit<Empresa, 'id' | 'created_at'>>,
): Promise<void> {
  await db.empresas.update(id, data)
}

/** Arquivar empresa (sem exclusão de dados — RN-03 exige confirmação explícita). */
export async function arquivarEmpresa(id: string): Promise<void> {
  await db.empresas.update(id, { status: 'arquivado' })
}

/**
 * Exclui empresa e todos os dados em cascata (RN-03).
 * Chamar apenas após confirmação com digitação do nome.
 */
export async function deleteEmpresaCascade(empresaId: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.empresas,
      db.projetos,
      db.demandas,
      db.demandaLinks,
      db.demandaImagens,
      db.registrosTempo,
      db.registrosDiarios,
      db.diarioDemandas,
      db.diarioImagens,
    ],
    async () => {
      const projetos = await db.projetos
        .where('empresa_id').equals(empresaId).toArray()
      const projetoIds = projetos.map((p) => p.id)

      const demandas = await db.demandas
        .where('projeto_id').anyOf(projetoIds).toArray()
      const demandaIds = demandas.map((d) => d.id)

      await db.demandaLinks.where('demanda_id').anyOf(demandaIds).delete()
      await db.demandaImagens.where('demanda_id').anyOf(demandaIds).delete()
      await db.registrosTempo.where('demanda_id').anyOf(demandaIds).delete()

      const registros = await db.registrosDiarios
        .where('empresa_id').equals(empresaId).toArray()
      const registroIds = registros.map((r) => r.id)

      await db.diarioDemandas.where('diario_id').anyOf(registroIds).delete()
      await db.diarioImagens.where('diario_id').anyOf(registroIds).delete()
      await db.registrosDiarios.where('empresa_id').equals(empresaId).delete()

      await db.demandas.where('projeto_id').anyOf(projetoIds).delete()
      await db.projetos.where('empresa_id').equals(empresaId).delete()
      await db.empresas.delete(empresaId)
    },
  )
}
