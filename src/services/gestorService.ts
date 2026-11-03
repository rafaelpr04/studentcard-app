import { supabase } from '../lib/supabase'
import type { Carteirinha, StatusCarteirinha } from '../types/studentcard'

export const gestorService = {
  /**
   * Lista todas as carteirinhas filtradas por status (ex: PENDENTE).
   */
  async listarSolicitacoes(status?: StatusCarteirinha): Promise<Carteirinha[]> {
    let query = supabase
      .from('carteirinhas')
      .select('*, estudantes(*)')
      .order('criado_em', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar solicitações:', error.message)
      return []
    }

    return data as Carteirinha[]
  },

  /**
   * Atualiza o status de uma carteirinha (ex: ATIVA ou BLOQUEADA).
   */
  async atualizarStatusCarteirinha(id: string, novoStatus: StatusCarteirinha): Promise<boolean> {
    const { error } = await supabase
      .from('carteirinhas')
      .update({ status: novoStatus })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar status da carteirinha:', error.message)
      return false
    }

    return true
  }
}