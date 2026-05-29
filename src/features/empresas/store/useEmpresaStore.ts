import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// O store guarda apenas a preferência de UI (qual empresa está ativa).
// Os dados da empresa (nome, cor, logo) vêm sempre do Dexie via useEmpresa().
interface EmpresaStore {
  empresaAtivaId: string | null
  setEmpresaAtiva: (id: string | null) => void
}

export const useEmpresaStore = create<EmpresaStore>()(
  persist(
    (set) => ({
      empresaAtivaId: null,
      setEmpresaAtiva: (id) => set({ empresaAtivaId: id }),
    }),
    {
      name: 'worklog-empresa-ativa',
    },
  ),
)
