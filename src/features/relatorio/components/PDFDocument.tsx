import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  Link as PDFLink,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatarTempo } from '../../../shared/utils/time'
import type { DemandaTipo, DemandaStatus } from '../../../db/types'
import type { RelatorioData } from '../hooks/useRelatorioData'

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

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1917',
    backgroundColor: '#ffffff',
  },
  // Cover
  cover: {
    flex: 1,
    padding: 48,
    justifyContent: 'flex-end',
  },
  coverLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginBottom: 28,
  },
  coverCompany: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  coverPeriod: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 40,
  },
  coverTotal: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  coverTotalLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
  },
  // Content
  content: {
    padding: '32px 40px 48px',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1917',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#deded9',
  },
  // Project header
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 18,
    marginBottom: 8,
  },
  projectName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  projectTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
  },
  // Demanda card
  demandaCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#deded9',
    backgroundColor: '#f8f8f5',
  },
  demandaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  demandaTitulo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1917',
    flex: 1,
  },
  demandaTime: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1917',
    marginLeft: 8,
  },
  demandaMeta: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  badge: {
    fontSize: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 5,
  },
  demandaDescricao: {
    fontSize: 8,
    color: '#6b6a64',
    lineHeight: 1.5,
    marginTop: 3,
    marginBottom: 5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  linkLabel: {
    fontSize: 8,
    color: '#6b6a64',
    marginRight: 4,
  },
  linkText: {
    fontSize: 8,
    color: '#5b5fc7',
    textDecoration: 'underline',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  demandaImage: {
    width: 100,
    height: 75,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
    objectFit: 'cover',
  },
  // Daily records
  diarioCard: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#deded9',
  },
  diarioDate: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1917',
    marginBottom: 6,
  },
  diarioText: {
    fontSize: 8,
    color: '#3a3936',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  diarioChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  diarioDemandaText: {
    fontSize: 8,
    color: '#3a3936',
    marginLeft: 5,
  },
  // Time table
  table: {
    borderWidth: 0.5,
    borderColor: '#deded9',
    borderRadius: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0eeea',
    borderBottomWidth: 0.5,
    borderBottomColor: '#deded9',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#deded9',
  },
  tableFooterRow: {
    flexDirection: 'row',
    backgroundColor: '#f0eeea',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  tcDemanda: { flex: 3, padding: '5px 10px' },
  tcProjeto: { flex: 2, padding: '5px 10px' },
  tcTempo: { flex: 1, padding: '5px 10px', textAlign: 'right' },
  tcText: { fontSize: 8, color: '#1a1917' },
  tcBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1a1917' },
  tcMuted: { fontSize: 8, color: '#6b6a64' },
  // Page number
  pageNum: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: '#9c9a92',
  },
  // Empty state
  empty: {
    fontSize: 11,
    color: '#9c9a92',
    textAlign: 'center',
    marginTop: 48,
  },
})

// ── Component ─────────────────────────────────────────────────────────────────

export function PDFDocument({ data }: { data: RelatorioData }) {
  const accent = data.empresa.cor_destaque || '#7F77DD'
  const hasContent = data.projetos.length > 0 || data.registrosDiarios.length > 0

  return (
    <Document>
      {/* ── Cover page ── */}
      <Page size="A4" style={s.page}>
        <View style={[s.cover, { backgroundColor: accent }]}>
          {data.empresa.logo_base64 && (
            <PDFImage src={data.empresa.logo_base64} style={s.coverLogo} />
          )}
          <Text style={s.coverCompany}>{data.empresa.nome}</Text>
          <Text style={s.coverSubtitle}>Relatório de Atividades</Text>
          <Text style={s.coverPeriod}>
            {formatPeriodLabel(data.periodo.inicio, data.periodo.fim)}
          </Text>
          <Text style={s.coverTotal}>{formatarTempo(data.totalMinutos)}</Text>
          <Text style={s.coverTotalLabel}>tempo registrado no período</Text>
        </View>
      </Page>

      {/* ── Content pages ── */}
      <Page size="A4" style={s.page}>
        <View style={s.content}>

          {!hasContent && (
            <Text style={s.empty}>
              Nenhuma atividade registrada no período selecionado.
            </Text>
          )}

          {/* ── Projetos e demandas ── */}
          {data.projetos.length > 0 && (
            <View>
              <Text style={s.sectionTitle}>Atividades por Projeto</Text>

              {data.projetos.map((pr) => (
                <View key={pr.projeto.id}>
                  <View style={[s.projectBadge, { backgroundColor: accent }]}>
                    <Text style={s.projectName}>{pr.projeto.nome}</Text>
                    <Text style={s.projectTime}>{formatarTempo(pr.totalMinutos)}</Text>
                  </View>

                  {pr.demandas.map((dr) => (
                    <View key={dr.demanda.id} style={s.demandaCard} wrap={false}>
                      <View style={s.demandaRow}>
                        <Text style={s.demandaTitulo}>{dr.demanda.titulo}</Text>
                        <Text style={s.demandaTime}>{formatarTempo(dr.totalMinutos)}</Text>
                      </View>

                      <View style={s.demandaMeta}>
                        <Text style={[s.badge, { backgroundColor: '#3a2003', color: '#FAC775' }]}>
                          {TIPO_LABEL[dr.demanda.tipo]}
                        </Text>
                        <Text style={[s.badge, { backgroundColor: '#1e2e40', color: '#8ec8f5' }]}>
                          {STATUS_LABEL[dr.demanda.status]}
                        </Text>
                      </View>

                      {dr.demanda.descricao && (
                        <Text style={s.demandaDescricao}>
                          {htmlToText(dr.demanda.descricao)}
                        </Text>
                      )}

                      {dr.links.map((link) => (
                        <View key={link.id} style={s.linkRow}>
                          <Text style={s.linkLabel}>{link.label || link.ferramenta}:</Text>
                          <PDFLink src={link.url} style={s.linkText}>
                            <Text style={s.linkText}>{link.url}</Text>
                          </PDFLink>
                        </View>
                      ))}

                      {dr.imagens.length > 0 && (
                        <View style={s.imagesGrid}>
                          {dr.imagens.slice(0, 4).map((img) => (
                            <PDFImage
                              key={img.id}
                              src={img.arquivo_base64}
                              style={s.demandaImage}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ── Registros diários ── */}
          {data.registrosDiarios.length > 0 && (
            <View style={data.projetos.length > 0 ? { marginTop: 24 } : undefined}>
              <Text style={s.sectionTitle}>Registros Diários</Text>

              {data.registrosDiarios.map((dr) => (
                <View key={dr.registro.id} style={s.diarioCard} wrap={false}>
                  <Text style={s.diarioDate}>{parseDateLabel(dr.registro.data)}</Text>

                  {dr.registro.texto && (
                    <Text style={s.diarioText}>{htmlToText(dr.registro.texto)}</Text>
                  )}

                  {dr.demandas.map((d) => (
                    <View key={d.id} style={s.diarioChipRow}>
                      <Text style={[s.badge, { backgroundColor: '#3a2003', color: '#FAC775' }]}>
                        {TIPO_LABEL[d.tipo]}
                      </Text>
                      <Text style={s.diarioDemandaText}>{d.titulo}</Text>
                    </View>
                  ))}

                  {dr.imagens.length > 0 && (
                    <View style={[s.imagesGrid, { marginTop: 6 }]}>
                      {dr.imagens.slice(0, 4).map((img) => (
                        <PDFImage
                          key={img.id}
                          src={img.arquivo_base64}
                          style={s.demandaImage}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* ── Tabela de tempo ── */}
          {data.projetos.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={s.sectionTitle}>Resumo de Tempo</Text>

              <View style={s.table}>
                <View style={s.tableHeaderRow}>
                  <View style={s.tcDemanda}><Text style={s.tcBold}>Demanda</Text></View>
                  <View style={s.tcProjeto}><Text style={s.tcBold}>Projeto</Text></View>
                  <View style={s.tcTempo}><Text style={[s.tcBold, { textAlign: 'right' }]}>Tempo</Text></View>
                </View>

                {data.projetos.flatMap((pr) =>
                  pr.demandas.map((dr) => (
                    <View key={dr.demanda.id} style={s.tableRow}>
                      <View style={s.tcDemanda}><Text style={s.tcText}>{dr.demanda.titulo}</Text></View>
                      <View style={s.tcProjeto}><Text style={s.tcMuted}>{pr.projeto.nome}</Text></View>
                      <View style={s.tcTempo}><Text style={[s.tcText, { textAlign: 'right' }]}>{formatarTempo(dr.totalMinutos)}</Text></View>
                    </View>
                  ))
                )}

                <View style={s.tableFooterRow}>
                  <View style={{ flex: 5, padding: '5px 10px' }}>
                    <Text style={s.tcBold}>Total geral</Text>
                  </View>
                  <View style={s.tcTempo}>
                    <Text style={[s.tcBold, { textAlign: 'right' }]}>
                      {formatarTempo(data.totalMinutos)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

        </View>

        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
