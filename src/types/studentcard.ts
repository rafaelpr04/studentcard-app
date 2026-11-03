export type StatusCarteirinha = 'PENDENTE' | 'ATIVA' | 'BLOQUEADA' | 'EXPIRADA';
export type NivelAcessoGestor = 'ADMIN' | 'ANALISTA';

export interface Gestor {
    id: string
    criado_em?: string
    nome: string
    email: string
    cargo: string
    nivel_acesso: NivelAcessoGestor
    
}

export interface Estudante {
    id: string
    criado_em?: string
    nome: string
    cpf: string
    data_nascimento: string
    email: string
    telefone: string
    universidade: string
    url_foto?: string
    url_comprovante_pdf: string
    dias_aula: string
}

export interface Carteirinha {
    id: string
    criado_em?: string
    estudante_id: string
    numero_carteirinha: string
    data_emissao: string
    data_validade: string
    status: StatusCarteirinha
    qr_code_conteudo: string

    estudantes?: Estudante   //complementa quando fizer uma consulta da carteirinha com JOIN
}

export interface ValidarQrCodeResult {
    status: StatusCarteirinha
    nomeEstudante: string
    nomeUniversidade: string
    dataValidade: string
    urlFoto?: string
    documentoValido: boolean
}