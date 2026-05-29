import { formatarTempo } from '../../../shared/utils/time'
import type { DemandaTipo, DemandaStatus } from '../../../db/types'
import type { DemandaRelatorio, ProjetoRelatorio, RegistroDiarioRelatorio, RelatorioData } from '../hooks/useRelatorioData'

// ── Helpers ──────────────────────────────────────────────────────────────────

function htmlToText(html: string | undefined): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const WEEKDAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
]

function formatPeriodLabel(inicio: string, fim: string): string {
  const [iy, im, id] = inicio.split('-').map(Number)
  const [fy, fm, fd] = fim.split('-').map(Number)
  if (im === fm && iy === fy) {
    return `${id} a ${fd} de ${MONTHS[fm - 1]} de ${fy}`
  }
  return `${id} de ${MONTHS[im - 1]} de ${iy} a ${fd} de ${MONTHS[fm - 1]} de ${fy}`
}

function parseDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  return `${WEEKDAYS[date.getDay()]}, ${d} de ${MONTHS[m - 1]} de ${y}`
}

const TIPO_LABEL: Record<DemandaTipo, string> = {
  tarefa: 'Tarefa',
  reuniao: 'Reunião',
  alinhamento: 'Alinhamento',
}

const STATUS_LABEL: Record<DemandaStatus, string> = {
  backlog: 'Backlog',
  andamento: 'Em Andamento',
  revisao: 'Em Revisão',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const FERRAMENTA_LABEL: Record<string, string> = {
  jira: 'Jira', linear: 'Linear', trello: 'Trello', github: 'GitHub',
  asana: 'Asana', clickup: 'ClickUp', figma: 'Figma', notion: 'Notion', outro: 'Link',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: '0 0 12px',
        paddingBottom: 10,
        borderBottom: '0.5px solid var(--border)',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  )
}

function DemandaCard({ dr, accentColor }: { dr: DemandaRelatorio; accentColor: string }) {
  return (
    <div
      style={{
        marginBottom: 8,
        padding: '12px 14px',
        borderRadius: 8,
        border: '0.5px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, flex: 1 }}>
          {dr.demanda.titulo}
        </p>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 12, flexShrink: 0 }}>
          {formatarTempo(dr.totalMinutos)}
        </span>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: dr.demanda.descricao ? 8 : 0 }}>
        <span style={{
          fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
          backgroundColor: '#412402', color: '#FAC775',
        }}>
          {TIPO_LABEL[dr.demanda.tipo]}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
          backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)',
          border: '0.5px solid var(--border)',
        }}>
          {STATUS_LABEL[dr.demanda.status]}
        </span>
      </div>

      {/* Description */}
      {dr.demanda.descricao && (
        <p style={{
          fontSize: 11, color: 'var(--text-secondary)', margin: '6px 0',
          whiteSpace: 'pre-wrap', lineHeight: 1.55,
        }}>
          {htmlToText(dr.demanda.descricao)}
        </p>
      )}

      {/* Links */}
      {dr.links.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {dr.links.map((link) => (
            <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {FERRAMENTA_LABEL[link.ferramenta] ?? link.ferramenta}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 10, color: accentColor, textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {link.label || link.url}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Images */}
      {dr.imagens.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {dr.imagens.map((img) => (
            <img
              key={img.id}
              src={img.arquivo_base64}
              alt={img.legenda ?? ''}
              style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 5, border: '0.5px solid var(--border)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjetoSection({ pr, accentColor }: { pr: ProjetoRelatorio; accentColor: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 10px', borderRadius: 6, marginBottom: 8,
        backgroundColor: accentColor + '22',
        border: `0.5px solid ${accentColor}44`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: accentColor }}>
          {pr.projeto.nome}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: accentColor }}>
          {formatarTempo(pr.totalMinutos)}
        </span>
      </div>

      {pr.demandas.map((dr) => (
        <DemandaCard key={dr.demanda.id} dr={dr} accentColor={accentColor} />
      ))}
    </div>
  )
}

function DiarioCard({ dr }: { dr: RegistroDiarioRelatorio }) {
  return (
    <div style={{
      marginBottom: 10,
      padding: '12px 14px',
      borderRadius: 8,
      border: '0.5px solid var(--border)',
      backgroundColor: 'var(--bg-elevated)',
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        {parseDateLabel(dr.registro.data)}
      </p>

      {dr.registro.texto && (
        <p style={{
          fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px',
          whiteSpace: 'pre-wrap', lineHeight: 1.6,
        }}>
          {htmlToText(dr.registro.texto)}
        </p>
      )}

      {dr.demandas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: dr.imagens.length > 0 ? 8 : 0 }}>
          {dr.demandas.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
                backgroundColor: '#412402', color: '#FAC775', flexShrink: 0,
              }}>
                {TIPO_LABEL[d.tipo]}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{d.titulo}</span>
            </div>
          ))}
        </div>
      )}

      {dr.imagens.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {dr.imagens.map((img) => (
            <img
              key={img.id}
              src={img.arquivo_base64}
              alt={img.legenda ?? ''}
              style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 5, border: '0.5px solid var(--border)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PreviewRelatorio({ data }: { data: RelatorioData }) {
  const accent = data.empresa.cor_destaque || 'var(--accent)'
  const hasContent = data.projetos.length > 0 || data.registrosDiarios.length > 0

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '0.5px solid var(--border)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {/* Cover */}
      <div style={{ backgroundColor: accent, padding: '40px 48px' }}>
        {data.empresa.logo_base64 && (
          <img
            src={data.empresa.logo_base64}
            alt={data.empresa.nome}
            style={{ width: 52, height: 52, borderRadius: 10, marginBottom: 20, display: 'block' }}
          />
        )}
        <p style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {data.empresa.nome}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '0 0 2px' }}>
          Relatório de Atividades
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
          {formatPeriodLabel(data.periodo.inicio, data.periodo.fim)}
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
          {formatarTempo(data.totalMinutos)}
        </p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          tempo registrado no período
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 40px 40px' }}>

        {!hasContent && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', margin: 0 }}>
            Nenhuma atividade registrada no período selecionado.
          </p>
        )}

        {/* Projetos */}
        {data.projetos.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <SectionTitle>Atividades por Projeto</SectionTitle>
            {data.projetos.map((pr) => (
              <ProjetoSection key={pr.projeto.id} pr={pr} accentColor={accent} />
            ))}
          </section>
        )}

        {/* Registros diários */}
        {data.registrosDiarios.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <SectionTitle>Registros Diários</SectionTitle>
            {data.registrosDiarios.map((dr) => (
              <DiarioCard key={dr.registro.id} dr={dr} />
            ))}
          </section>
        )}

        {/* Tabela de tempo */}
        {data.projetos.length > 0 && (
          <section>
            <SectionTitle>Resumo de Tempo</SectionTitle>
            <div style={{ borderRadius: 8, border: '0.5px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-secondary)' }}>
                      Demanda
                    </th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-secondary)' }}>
                      Projeto
                    </th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textAlign: 'right', color: 'var(--text-secondary)' }}>
                      Tempo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.projetos.flatMap((pr) =>
                    pr.demandas.map((dr) => (
                      <tr key={dr.demanda.id} style={{ borderTop: '0.5px solid var(--border)' }}>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: 'var(--text-primary)' }}>
                          {dr.demanda.titulo}
                        </td>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                          {pr.projeto.nome}
                        </td>
                        <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right', color: 'var(--text-primary)' }}>
                          {formatarTempo(dr.totalMinutos)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '0.5px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
                    <td colSpan={2} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Total geral
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)' }}>
                      {formatarTempo(data.totalMinutos)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
