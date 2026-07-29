/**
 * Camada de persistência.
 *
 * Hoje grava no localStorage do navegador. Quando o Supabase entrar, basta
 * reimplementar estas funções (as telas não conhecem de onde o dado vem).
 */

const CHAVES = {
  lavagens: 'lavajato:lavagens',
  gastos: 'lavajato:gastos',
  valoresPadrao: 'lavajato:valores-padrao',
  funcionarios: 'lavajato:funcionarios',
  tema: 'lavajato:tema',
}

function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? JSON.parse(bruto) : padrao
  } catch {
    return padrao
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // Sem espaço ou modo privado: segue em memória, sem quebrar a tela.
  }
}

export const repositorio = {
  carregarLavagens: () => ler(CHAVES.lavagens, []),
  salvarLavagens: (lista) => gravar(CHAVES.lavagens, lista),

  carregarGastos: () => ler(CHAVES.gastos, []),
  salvarGastos: (lista) => gravar(CHAVES.gastos, lista),

  carregarValoresPadrao: () => ler(CHAVES.valoresPadrao, []),
  salvarValoresPadrao: (lista) => gravar(CHAVES.valoresPadrao, lista),

  carregarFuncionarios: () => ler(CHAVES.funcionarios, []),
  salvarFuncionarios: (lista) => gravar(CHAVES.funcionarios, lista),

  carregarTema: () => ler(CHAVES.tema, null),
  salvarTema: (tema) => gravar(CHAVES.tema, tema),
}
