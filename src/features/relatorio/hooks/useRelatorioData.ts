import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../db/schema'
import type {
  Demanda,
  DemandaImagem,
  DemandaLink,
  DiarioImagem,
  Empresa,
  Projeto,
  RegistroDiario,
  RegistroTempo,
} from '../../../db/types'

export interface DemandaRelatorio {
  demanda: Demanda
  links: DemandaLink[]
  imagens: DemandaImagem[]
  registrosTempo: RegistroTempo[]
  totalMinutos: number
}

export interface ProjetoRelatorio {
  projeto: Projeto
  demandas: DemandaRelatorio[]
  totalMinutos: number
}

export interface RegistroDiarioRelatorio {
  registro: RegistroDiario
  demandas: Demanda[]
  imagens: DiarioImagem[]
}

export interface RelatorioData {
  empresa: Empresa
  periodo: { inicio: string; fim: string }
  projetos: ProjetoRelatorio[]
  registrosDiarios: RegistroDiarioRelatorio[]
  totalMinutos: number
}

export function useRelatorioData(
  empresaId: string | null | undefined,
  inicio: string,
  fim: string,
): RelatorioData | undefined {
  return useLiveQuery(async () => {
    if (!empresaId || !inicio || !fim) return undefined

    const empresa = await db.empresas.get(empresaId)
    if (!empresa) return undefined

    const projetos = await db.projetos
      .where('empresa_id').equals(empresaId)
      .sortBy('nome')

    const registrosDiariosRaw = await db.registrosDiarios
      .where('empresa_id').equals(empresaId)
      .filter((r) => r.data >= inicio && r.data <= fim)
      .sortBy('data')

    // Only include projects that have demandas with time logged in the period
    const projetosRelatorio: ProjetoRelatorio[] = []

    for (const projeto of projetos) {
      const demandasDoProjeto = await db.demandas
        .where('projeto_id').equals(projeto.id)
        .filter((d) => d.status !== 'cancelada')
        .sortBy('created_at')

      const demandasRelatorio: DemandaRelatorio[] = []

      for (const demanda of demandasDoProjeto) {
        const registrosTempo = await db.registrosTempo
          .where('demanda_id').equals(demanda.id)
          .filter((r) => r.data >= inicio && r.data <= fim && r.duracao_min > 0)
          .sortBy('data')

        if (registrosTempo.length === 0) continue

        const [links, imagens] = await Promise.all([
          db.demandaLinks.where('demanda_id').equals(demanda.id).toArray(),
          db.demandaImagens.where('demanda_id').equals(demanda.id).sortBy('created_at'),
        ])

        const totalMinutos = registrosTempo.reduce((acc, r) => acc + r.duracao_min, 0)
        demandasRelatorio.push({ demanda, links, imagens, registrosTempo, totalMinutos })
      }

      if (demandasRelatorio.length === 0) continue

      const totalMinutos = demandasRelatorio.reduce((acc, d) => acc + d.totalMinutos, 0)
      projetosRelatorio.push({ projeto, demandas: demandasRelatorio, totalMinutos })
    }

    // Daily records with their linked demandas and images
    const registrosDiarios: RegistroDiarioRelatorio[] = []

    for (const registro of registrosDiariosRaw) {
      const [junctions, imagens] = await Promise.all([
        db.diarioDemandas.where('diario_id').equals(registro.id).toArray(),
        db.diarioImagens.where('diario_id').equals(registro.id).sortBy('created_at'),
      ])

      const demandaIds = junctions.map((j) => j.demanda_id)
      const demandasRaw = demandaIds.length > 0 ? await db.demandas.bulkGet(demandaIds) : []
      const demandas = demandasRaw.filter((d): d is Demanda => d !== undefined)

      registrosDiarios.push({ registro, demandas, imagens })
    }

    const totalMinutos = projetosRelatorio.reduce((acc, p) => acc + p.totalMinutos, 0)

    return {
      empresa,
      periodo: { inicio, fim },
      projetos: projetosRelatorio,
      registrosDiarios,
      totalMinutos,
    }
  }, [empresaId, inicio, fim])
}
