import { db } from '../../../db/schema'

export interface BackupData {
  version: '1.0'
  exported_at: string
  data: {
    empresas: unknown[]
    projetos: unknown[]
    membros: unknown[]
    membroProjeto: unknown[]
    demandas: unknown[]
    demandaLinks: unknown[]
    demandaImagens: unknown[]
    registrosTempo: unknown[]
    registrosDiarios: unknown[]
    diarioDemandas: unknown[]
    diarioImagens: unknown[]
  }
}

export interface BackupSummary {
  empresas: number
  projetos: number
  membros: number
  demandas: number
  registrosDiarios: number
  registrosTempo: number
}

export async function exportBackup(): Promise<void> {
  const [
    empresas,
    projetos,
    membros,
    membroProjeto,
    demandas,
    demandaLinks,
    demandaImagens,
    registrosTempo,
    registrosDiarios,
    diarioDemandas,
    diarioImagens,
  ] = await Promise.all([
    db.empresas.toArray(),
    db.projetos.toArray(),
    db.membros.toArray(),
    db.membroProjeto.toArray(),
    db.demandas.toArray(),
    db.demandaLinks.toArray(),
    db.demandaImagens.toArray(),
    db.registrosTempo.toArray(),
    db.registrosDiarios.toArray(),
    db.diarioDemandas.toArray(),
    db.diarioImagens.toArray(),
  ])

  const backup: BackupData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      empresas,
      projetos,
      membros,
      membroProjeto,
      demandas,
      demandaLinks,
      demandaImagens,
      registrosTempo,
      registrosDiarios,
      diarioDemandas,
      diarioImagens,
    },
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `worklog-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        if (parsed?.version !== '1.0') {
          reject(new Error('Versão de backup inválida ou não reconhecida.'))
          return
        }
        if (!parsed?.data || typeof parsed.data !== 'object') {
          reject(new Error('Estrutura do arquivo de backup inválida.'))
          return
        }
        resolve(parsed as BackupData)
      } catch {
        reject(new Error('Arquivo JSON inválido.'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'))
    reader.readAsText(file)
  })
}

export function getBackupSummary(backup: BackupData): BackupSummary {
  return {
    empresas: backup.data.empresas?.length ?? 0,
    projetos: backup.data.projetos?.length ?? 0,
    membros: backup.data.membros?.length ?? 0,
    demandas: backup.data.demandas?.length ?? 0,
    registrosDiarios: backup.data.registrosDiarios?.length ?? 0,
    registrosTempo: backup.data.registrosTempo?.length ?? 0,
  }
}

export async function importBackup(
  backup: BackupData,
  mode: 'replace' | 'merge',
  onProgress?: (step: string) => void,
): Promise<void> {
  const d = backup.data

  if (mode === 'replace') {
    onProgress?.('Limpando dados existentes…')
    await db.transaction(
      'rw',
      [
        db.empresas, db.projetos, db.membros, db.membroProjeto,
        db.demandas, db.demandaLinks, db.demandaImagens,
        db.registrosTempo, db.registrosDiarios, db.diarioDemandas, db.diarioImagens,
      ],
      async () => {
        await Promise.all([
          db.empresas.clear(),
          db.projetos.clear(),
          db.membros.clear(),
          db.membroProjeto.clear(),
          db.demandas.clear(),
          db.demandaLinks.clear(),
          db.demandaImagens.clear(),
          db.registrosTempo.clear(),
          db.registrosDiarios.clear(),
          db.diarioDemandas.clear(),
          db.diarioImagens.clear(),
        ])
      }
    )
  }

  onProgress?.('Importando empresas e projetos…')
  await db.empresas.bulkPut(d.empresas as never[])
  await db.projetos.bulkPut(d.projetos as never[])
  await db.membros.bulkPut(d.membros as never[])
  await db.membroProjeto.bulkPut(d.membroProjeto as never[])

  onProgress?.('Importando demandas e registros…')
  await db.demandas.bulkPut(d.demandas as never[])
  await db.demandaLinks.bulkPut(d.demandaLinks as never[])
  await db.demandaImagens.bulkPut(d.demandaImagens as never[])
  await db.registrosTempo.bulkPut(d.registrosTempo as never[])

  onProgress?.('Importando registros diários…')
  await db.registrosDiarios.bulkPut(d.registrosDiarios as never[])
  await db.diarioDemandas.bulkPut(d.diarioDemandas as never[])
  await db.diarioImagens.bulkPut(d.diarioImagens as never[])
}
