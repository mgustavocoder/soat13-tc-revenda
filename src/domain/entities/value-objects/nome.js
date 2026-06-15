class Nome {
  static isValid(nome) {
    if (!nome || typeof nome !== 'string') return false
    return nome.trim().length >= 3
  }
}

export { Nome }
