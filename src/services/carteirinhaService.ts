import { supabase } from '../lib/supabase'
import type { Carteirinha, Estudante, ValidarQrCodeResult } from '../types/studentcard'

export const carteirinhaService = {
  /**
   * Envia o PDF do comprovante de matrícula para o Supabase Storage.
   */
  async uploadComprovantePdf(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `documentos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('comprovantes')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro no upload do PDF:', uploadError.message)
      throw new Error('Falha ao enviar o comprovante de matrícula.')
    }

    const { data } = supabase.storage
      .from('comprovantes')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  /**
   * Cadastra o estudante com o comprovante em PDF e solicita a carteirinha com status PENDENTE.
   */
  async solicitarCarteirinha(
    dadosEstudante: Omit<Estudante, 'id' | 'criado_em' | 'url_comprovante_pdf'>,
    arquivoPdf: File,
    dataValidade: string
  ): Promise<Carteirinha | null> {
    // 1. Upload do comprovante em PDF
    const urlComprovantePdf = await this.uploadComprovantePdf(arquivoPdf)

    // 2. Insere o estudante incluindo a URL do PDF
    const { data: estudante, error: errEstudante } = await supabase
      .from('estudantes')
      .insert([
        {
          ...dadosEstudante,
          url_comprovante_pdf: urlComprovantePdf
        }
      ])
      .select()
      .single()

    if (errEstudante) {
      console.error('Erro ao cadastrar estudante:', errEstudante.message)
      throw new Error(errEstudante.message)
    }

    // 3. Gera número da carteirinha
    const numeroCarteirinha = `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`

    // 4. Insere a carteirinha vinculada ao estudante com status PENDENTE
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

    const hoje = new Date().toISOString().split('T')[0]!
    const estaExpirada = data.data_validade < hoje
    const documentoValido = data.status === 'ATIVA' && !estaExpirada

    return {
      status: estaExpirada ? 'EXPIRADA' : data.status,
      nomeEstudante: data.estudantes.nome,
      nomeUniversidade: data.estudantes.universidade || data.estudantes.universidade,
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