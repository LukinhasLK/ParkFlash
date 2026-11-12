/** Persistência best-effort em localStorage — o app funciona sem ela. */

/** Sobe a versão quando o formato dos dados muda; dados antigos são ignorados. */
const VERSAO = 'v2';
const chaveVersionada = (chave: string) => chave.replace(/^parkflash\./, `parkflash.${VERSAO}.`);

/** Remove chaves de versões anteriores (ex.: `parkflash.fichas`, que guardava a unidade pelo nome). */
export function limparVersoesAntigas(): void {
  try {
    Object.keys(localStorage)
      .filter((chave) => chave.startsWith('parkflash.') && !chave.startsWith(`parkflash.${VERSAO}.`))
      .forEach((chave) => localStorage.removeItem(chave));
  } catch {
    /* ignora */
  }
}

limparVersoesAntigas();

export function carregar<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chaveVersionada(chave));
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

export function salvar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chaveVersionada(chave), JSON.stringify(valor));
  } catch {
    /* modo privado / cota cheia — segue sem persistir */
  }
}

export function remover(chave: string): void {
  try {
    localStorage.removeItem(chaveVersionada(chave));
  } catch {
    /* ignora */
  }
}
