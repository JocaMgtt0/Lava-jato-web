// Utilitários de data trabalhando sempre em horário local.
// Datas são persistidas como string "YYYY-MM-DD" para evitar problemas de fuso.

export const DIAS_SEMANA_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Date -> "YYYY-MM-DD" (local, não UTC) */
export function toISO(date) {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** "YYYY-MM-DD" -> Date (meia-noite local) */
export function fromISO(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

/** "YYYY-MM-DD" -> "YYYY-MM" (competência mensal) */
export function competenciaDe(iso) {
  return iso.slice(0, 7)
}

export function hojeISO() {
  return toISO(new Date())
}

export function somarDias(date, dias) {
  const nova = new Date(date)
  nova.setDate(nova.getDate() + dias)
  return nova
}

export function somarMeses(date, meses) {
  // Fixa no dia 1 antes de somar para não "pular" mês (ex: 31 de janeiro + 1 mês)
  return new Date(date.getFullYear(), date.getMonth() + meses, 1)
}

export function inicioDaSemana(date) {
  const inicio = new Date(date)
  inicio.setDate(inicio.getDate() - inicio.getDay())
  inicio.setHours(0, 0, 0, 0)
  return inicio
}

/**
 * Grade do mês: sempre 6 semanas (42 dias), começando no domingo,
 * incluindo dias vizinhos para completar as bordas — igual Google Agenda.
 */
export function gradeDoMes(date) {
  const primeiroDoMes = new Date(date.getFullYear(), date.getMonth(), 1)
  const inicio = inicioDaSemana(primeiroDoMes)
  return Array.from({ length: 42 }, (_, i) => somarDias(inicio, i))
}

/** Grade da semana: 7 dias a partir do domingo */
export function gradeDaSemana(date) {
  const inicio = inicioDaSemana(date)
  return Array.from({ length: 7 }, (_, i) => somarDias(inicio, i))
}

/** Todos os dias existentes no mês (sem dias vizinhos) */
export function diasDoMes(date) {
  const ano = date.getFullYear()
  const mes = date.getMonth()
  const total = new Date(ano, mes + 1, 0).getDate()
  return Array.from({ length: total }, (_, i) => new Date(ano, mes, i + 1))
}

export function ehMesmoDia(a, b) {
  return toISO(a) === toISO(b)
}

export function ehMesmoMes(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function ehHoje(date) {
  return toISO(date) === hojeISO()
}

export function rotuloMesAno(date) {
  return `${MESES[date.getMonth()]} de ${date.getFullYear()}`
}

export function rotuloDiaExtenso(iso) {
  const d = fromISO(iso)
  const diaSemana = DIAS_SEMANA_CURTO[d.getDay()]
  const inicial = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)
  return `${inicial}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`
}

export function rotuloIntervaloSemana(date) {
  const dias = gradeDaSemana(date)
  const ini = dias[0]
  const fim = dias[6]

  if (ini.getMonth() === fim.getMonth()) {
    return `${ini.getDate()} – ${fim.getDate()} de ${MESES[ini.getMonth()]} de ${ini.getFullYear()}`
  }
  return `${ini.getDate()} de ${MESES[ini.getMonth()].slice(0, 3)} – ${fim.getDate()} de ${MESES[fim.getMonth()].slice(0, 3)} de ${fim.getFullYear()}`
}

export function rotuloCompetencia(competencia) {
  const [ano, mes] = competencia.split('-').map(Number)
  return `${MESES[mes - 1]} de ${ano}`
}
