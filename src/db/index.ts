// Instância do banco
export { db } from './schema'

// Todos os tipos
export type {
  Empresa,
  Projeto,
  ProjetoStatus,
  Membro,
  MembroProjeto,
  Demanda,
  DemandaTipo,
  DemandaPrioridade,
  DemandaStatus,
  DemandaLink,
  FerramentaLink,
  DemandaImagem,
  RegistroTempo,
  RegistroTempoTipo,
  RegistroDiario,
  DiarioDemanda,
  DiarioImagem,
} from './types'

// Hooks e mutações — empresas
export {
  useEmpresas,
  useEmpresa,
  createEmpresa,
  updateEmpresa,
  arquivarEmpresa,
  deleteEmpresaCascade,
} from './hooks/useEmpresas'

// Hooks e mutações — projetos
export {
  useProjetos,
  useProjeto,
  useProjetoStats,
  useTotalHorasProjeto,
  createProjeto,
  updateProjeto,
  deleteProjeto,
} from './hooks/useProjetos'

// Hooks e mutações — demandas, links, imagens, tempo
export {
  useDemandas,
  useDemandasDeProjetos,
  useDemanda,
  useDemandaLinks,
  useDemandaImagens,
  useRegistrosTempo,
  useTotalMinutosDemanda,
  useTimerAtivo,
  createDemanda,
  updateDemanda,
  updateDemandaStatus,
  deleteDemanda,
  addDemandaLink,
  deleteDemandaLink,
  addDemandaImagem,
  deleteDemandaImagem,
  addRegistroTempoManual,
  deleteRegistroTempo,
  detectarFerramenta,
} from './hooks/useDemandas'

// Hooks e mutações — registros diários
export {
  useRegistrosDiarios,
  useRegistroDiario,
  useRegistroDiarioPorData,
  useDiarioDemandas,
  useDiarioImagens,
  upsertRegistroDiario,
  updateRegistroDiario,
  vincularDemandaAoRegistro,
  desvincularDemandaDoRegistro,
  addDiarioImagem,
  deleteDiarioImagem,
  deleteRegistroDiario,
} from './hooks/useRegistros'
