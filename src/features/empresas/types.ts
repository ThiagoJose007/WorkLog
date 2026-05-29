export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  logo_base64?: string
  cor_destaque: string
  status: 'ativo' | 'arquivado'
  created_at: number
}
