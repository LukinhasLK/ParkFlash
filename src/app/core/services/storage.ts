/** Persistência best-effort em localStorage — o app funciona sem ela. */
export function carregar<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

export function salvar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* modo privado / cota cheia — segue sem persistir */
  }
}

export function remover(chave: string): void {
  try {
    localStorage.removeItem(chave);
  } catch {
    /* ignora */
  }
}
