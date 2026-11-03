import { supabase } from '../lib/supabase'
import type { Carteirinha, Estudante, ValidarQrCodeResult } from '../types/studentcard'

export const carteirinhaService = {
  /**
   * Cadastra o estudante e solicita uma nova carteirinha com status PENDENTE.
   */
  async solicitarCarteirinha(
    dadosEstudante: Omit<Estudante, 'id' | 'criado_em'>,
    dataValidade: string
  ): Promise<Carteirinha | null> {
    // 1. Insere o estudante
    const { data: estudante, error: errEstudante } = await supabase
      .from('estudantes')
      .insert([dadosEstudante])
      .select()
      .single()

    if (errEstudante) {
      console.error('Erro ao cadastrar estudante:', errEstudante.message)
      throw new Error(errEstudante.message)
    }

    // 2. Gera um número de carteirinha simples (Ano + 4 dígitos aleatórios)
    const numeroCarteirinha = `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`

    // 3. Insere a carteirinha vinculada ao estudante
    const { data: carteirinha, error: errCarteirinha } = await supabase
      .from('carteirinhas')
      .insert([
        {
          estudante_id: estudante.id,
          numero_carteirinha: numeroCarteirinha,
          data_validade: dataValidade,
          status: 'PENDENTE'
        }
      ])
      .select('*, estudantes(*)')
      .single()

    if (errCarteirinha) {
      console.error('Erro ao solicitar carteirinha:', errCarteirinha.message)
      throw new Error(errCarteirinha.message)
    }

    return carteirinha as Carteirinha
  },

  /**
   * Busca uma carteirinha pelo UUID do QR Code e valida seu status/validade.
   */
  async validarPorQrCode(qrCodeConteudo: string): Promise<ValidarQrCodeResult | null> {
    const { data, error } = await supabase
      .from('carteirinhas')
      .select('*, estudantes(*)')
      .eq('qr_code_conteudo', qrCodeConteudo)
      .single()

    if (error || !data || !data.estudantes) {
      return null
    }

    const hoje = new Date().toISOString().split('T')[0]
    const estaExpirada = data.data_validade < data.hoje
    const documentoValido = data.status === 'ATIVA' && !estaExpirada

    return {
      status: estaExpirada ? 'EXPIRADA' : data.status,
      nomeEstudante: data.estudantes.nome,
      nomeUniversidade: data.estudantes.nome_universidade,
      dataValidade: data.data_validade,
      urlFoto: data.estudantes.url_foto,
      documentoValido
    }
  },

  /**
   * Busca carteirinhas filtradas pelo CPF do estudante.
   */
  async buscarPorCpf(cpf: string): Promise<Carteirinha[]> {
    const { data, error } = await supabase
      .from('carteirinhas')
      .select('*, estudantes!inner(*)')
      .eq('estudantes.cpf', cpf)

    if (error) {
      console.error('Erro ao buscar carteirinha por CPF:', error.message)
      return []
    }

    return data as Carteirinha[]
  }
}