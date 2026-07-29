const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function moeda(valor) {
  return formatadorBRL.format(Number(valor) || 0)
}

/** Aceita "50,00" ou "50.00" e devolve número. NaN se inválido. */
export function paraNumero(texto) {
  if (typeof texto === 'number') return texto
  if (!texto) return NaN
  return Number(String(texto).replace(/\./g, '').replace(',', '.'))
}

export function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
