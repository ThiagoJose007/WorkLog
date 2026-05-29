import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Empresa } from '../types'

interface EmpresaStore {
  empresaAtivaId: string | null
  empresas: Empresa[]
  empresaAtiva: Empresa | null
  setEmpresaAtiva: (id: string | null) => void
  setEmpresas: (empresas: Empresa[]) => void
}

export const useEmpresaStore = create<EmpresaStore>()(
  persist(
    (set) => ({
      empresaAtivaId: null,
      empresas: [],
      empresaAtiva: null,
      setEmpresaAtiva: (id) =>
        set((state) => ({
          empresaAtivaId: id,
          empresaAtiva: id ? (state.empresas.find((e) => e.id === id) ?? null) : null,
        })),
      setEmpresas: (empresas) =>
        set((state) => ({
          empresas,
          // recalcula referência após atualizar a lista
          empresaAtiva: state.empresaAtivaId
            ? (empresas.find((e) => e.id === state.empresaAtivaId) ?? null)
            : null,
        })),
    }),
    {
      name: 'worklog-empresa-ativa',
      // persiste apenas o id — dados vêm do Dexie
      partialize: (state) => ({ empresaAtivaId: state.empresaAtivaId }),
    },
  ),
)
