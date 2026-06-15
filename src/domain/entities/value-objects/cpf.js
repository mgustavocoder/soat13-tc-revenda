class CPF {
  static limparFormatacao(cpf) {
    if (!cpf) return ''
    return String(cpf).replaceAll(/\D/g, '')
  }

  static isValid(cpf) {
    if (!cpf) return false
    const cleaned = CPF.limparFormatacao(cpf)
    return cleaned.length === 11
  }
}

export { CPF }
