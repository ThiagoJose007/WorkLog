import Dexie, { type Table } from 'dexie'
import type {
  Empresa,
  Projeto,
  Membro,
  MembroProjeto,
  Demanda,
  DemandaLink,
  DemandaImagem,
  RegistroTempo,
  RegistroDiario,
  DiarioDemanda,
  DiarioImagem,
} from './types'

class WorkLogDB extends Dexie {
  empresas!: Table<Empresa, string>
  projetos!: Table<Projeto, string>
  membros!: Table<Membro, string>
  membroProjeto!: Table<MembroProjeto, [string, string]>
  demandas!: Table<Demanda, string>
  demandaLinks!: Table<DemandaLink, string>
  demandaImagens!: Table<DemandaImagem, string>
  registrosTempo!: Table<RegistroTempo, string>
  registrosDiarios!: Table<RegistroDiario, string>
  diarioDemandas!: Table<DiarioDemanda, [string, string]>
  diarioImagens!: Table<DiarioImagem, string>

  constructor() {
    super('worklog-db')

    this.version(1).stores({
      // Empresa — raiz da hierarquia
      empresas: 'id, status, created_at',

      // Projeto — filho de empresa
      projetos: 'id, empresa_id, status, created_at',

      // Membros e vínculo N:N com projeto
      membros: 'id, created_at',
      membroProjeto: '[membro_id+projeto_id], membro_id, projeto_id',

      // Demanda — filho de projeto (projeto_id obrigatório)
      demandas: 'id, projeto_id, status, tipo, prioridade, created_at',

      // Filhos de Demanda
      demandaLinks: 'id, demanda_id, ferramenta',
      demandaImagens: 'id, demanda_id, created_at',
      // [demanda_id+data] permite buscar registros de tempo por demanda+data
      registrosTempo: 'id, demanda_id, data, tipo, [demanda_id+data], created_at',

      // Registro diário — filho de empresa, NÃO de projeto
      // [empresa_id+data] permite buscar o registro de um dia específico
      registrosDiarios: 'id, empresa_id, data, created_at, [empresa_id+data]',

      // Vínculo N:N entre registro diário e demanda
      diarioDemandas: '[diario_id+demanda_id], diario_id, demanda_id',

      // Imagens do registro diário
      diarioImagens: 'id, diario_id, created_at',
    })
  }
}

export const db = new WorkLogDB()
