import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFuncionarios, apiGastos, apiLavagens, apiValoresPadrao } from '../lib/api.js'
import { competenciaDe, diasDoMes, fromISO, toISO } from '../lib/dates.js'
import { useAuth } from './AuthContext.jsx'

/**
 * Modelo de dados (Supabase — ver supabase/schema.sql)
 *
 * Lavagem  { id, data: "YYYY-MM-DD", cliente, modelo, placa, servico, valor }
 * Gasto    { id, descricao, valor, tipo: "diario" | "mensal",
 *            categoria: "geral" | "funcionario",
 *            data?: "YYYY-MM-DD"  (quando diário),
 *            competencia?: "YYYY-MM" (quando mensal) }
 * ValorPadrao  { id, nome, valor }
 * Funcionario  { id, nome, salario, periodicidade: "mensal"|"semanal"|"diario" }
 *
 * Não existe "Agenda": a lavagem é um registro solto, e o dia é só um campo.
 */

const FATOR_MENSAL = { mensal: 1, semanal: 4.345, diario: 30 }

const DadosContext = createContext(null)

export function DadosProvider({ children }) {
  const { usuario } = useAuth()

  const [lavagens, setLavagens] = useState([])
  const [gastos, setGastos] = useState([])
  const [valoresPadrao, setValoresPadrao] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(null)

  // Só busca dado depois de logado — antes disso o Supabase nem deixaria.
  useEffect(() => {
    if (!usuario) {
      setLavagens([])
      setGastos([])
      setValoresPadrao([])
      setFuncionarios([])
      setCarregando(false)
      return
    }

    let cancelado = false
    setCarregando(true)
    setErroCarregamento(null)

    Promise.all([
      apiLavagens.listar(),
      apiGastos.listar(),
      apiValoresPadrao.listar(),
      apiFuncionarios.listar(),
    ]).then(([lav, gas, vp, func]) => {
      if (cancelado) return

      const primeiroErro = [lav, gas, vp, func].find((r) => r.error)?.error
      if (primeiroErro) {
        setErroCarregamento(primeiroErro.message)
      } else {
        setLavagens(lav.data ?? [])
        setGastos(gas.data ?? [])
        setValoresPadrao(vp.data ?? [])
        setFuncionarios(func.data ?? [])
      }
      setCarregando(false)
    })

    return () => {
      cancelado = true
    }
  }, [usuario])

  const valor = useMemo(() => {
    const soma = (lista) => lista.reduce((acc, item) => acc + Number(item.valor || 0), 0)
    const ehFuncionario = (g) => g.categoria === 'funcionario'

    // ---- Lavagens ----
    const adicionarLavagem = async (dados) => {
      const { data, error } = await apiLavagens.criar(dados)
      if (error) throw error
      setLavagens((atual) => [...atual, data])
    }

    const atualizarLavagem = async (id, dados) => {
      const { data, error } = await apiLavagens.atualizar(id, dados)
      if (error) throw error
      setLavagens((atual) => atual.map((l) => (l.id === id ? data : l)))
    }

    const removerLavagem = async (id) => {
      const { error } = await apiLavagens.remover(id)
      if (error) throw error
      setLavagens((atual) => atual.filter((l) => l.id !== id))
    }

    const lavagensDoDia = (iso) => lavagens.filter((l) => l.data === iso)
    const lavagensDoMes = (competencia) =>
      lavagens.filter((l) => competenciaDe(l.data) === competencia)

    // ---- Gastos ----
    const adicionarGasto = async (dados) => {
      const { data, error } = await apiGastos.criar(dados)
      if (error) throw error
      setGastos((atual) => [...atual, data])
    }

    const atualizarGasto = async (id, dados) => {
      const { data, error } = await apiGastos.atualizar(id, dados)
      if (error) throw error
      setGastos((atual) => atual.map((g) => (g.id === id ? data : g)))
    }

    const removerGasto = async (id) => {
      const { error } = await apiGastos.remover(id)
      if (error) throw error
      setGastos((atual) => atual.filter((g) => g.id !== id))
    }

    const gastosDoDia = (iso) => gastos.filter((g) => g.tipo === 'diario' && g.data === iso)
    const gastosDiariosDoMes = (competencia) =>
      gastos.filter((g) => g.tipo === 'diario' && competenciaDe(g.data) === competencia)
    const gastosMensaisDoMes = (competencia) =>
      gastos.filter((g) => g.tipo === 'mensal' && g.competencia === competencia)

    // ---- Valores padrão ----
    const adicionarValorPadrao = async (dados) => {
      const { data, error } = await apiValoresPadrao.criar(dados)
      if (error) throw error
      setValoresPadrao((atual) => [...atual, data])
    }

    const atualizarValorPadrao = async (id, dados) => {
      const { data, error } = await apiValoresPadrao.atualizar(id, dados)
      if (error) throw error
      setValoresPadrao((atual) => atual.map((v) => (v.id === id ? data : v)))
    }

    const removerValorPadrao = async (id) => {
      const { error } = await apiValoresPadrao.remover(id)
      if (error) throw error
      setValoresPadrao((atual) => atual.filter((v) => v.id !== id))
    }

    // ---- Funcionários ----
    const adicionarFuncionario = async (dados) => {
      const { data, error } = await apiFuncionarios.criar(dados)
      if (error) throw error
      setFuncionarios((atual) => [...atual, data])
    }

    const atualizarFuncionario = async (id, dados) => {
      const { data, error } = await apiFuncionarios.atualizar(id, dados)
      if (error) throw error
      setFuncionarios((atual) => atual.map((f) => (f.id === id ? data : f)))
    }

    const removerFuncionario = async (id) => {
      const { error } = await apiFuncionarios.remover(id)
      if (error) throw error
      setFuncionarios((atual) => atual.filter((f) => f.id !== id))
    }

    const custoMensalFolha = () =>
      funcionarios.reduce(
        (acc, f) => acc + Number(f.salario || 0) * (FATOR_MENSAL[f.periodicidade] ?? 1),
        0
      )

    // ---- Totais (mesma lógica de sempre, agora sobre o estado vindo do Supabase) ----

    const resumoDoDia = (iso) => {
      const bruto = soma(lavagensDoDia(iso))
      const doDia = gastosDoDia(iso)
      const despesas = soma(doDia)
      const despesasFuncionarios = soma(doDia.filter(ehFuncionario))
      return {
        bruto,
        despesas,
        despesasFuncionarios,
        despesasGerais: despesas - despesasFuncionarios,
        gastosFuncionarios: doDia.filter(ehFuncionario),
        liquido: bruto - despesas,
      }
    }

    const resumoDoMes = (competencia) => {
      const bruto = soma(lavagensDoMes(competencia))
      const diarios = gastosDiariosDoMes(competencia)
      const fixos = gastosMensaisDoMes(competencia)

      const despesasDiarias = soma(diarios)
      const despesasFixas = soma(fixos)
      const despesas = despesasDiarias + despesasFixas

      const todosGastos = [...diarios, ...fixos]
      const comFuncionarios = todosGastos.filter(ehFuncionario)
      const despesasFuncionarios = soma(comFuncionarios)
      const despesasGerais = despesas - despesasFuncionarios

      return {
        bruto,
        despesasDiarias,
        despesasFixas,
        despesas,
        despesasFuncionarios,
        despesasGerais,
        gastosFuncionarios: comFuncionarios,
        liquido: bruto - despesas,
      }
    }

    const seriesDoMes = (competencia) =>
      diasDoMes(fromISO(`${competencia}-01`)).map((data) => {
        const iso = toISO(data)
        const bruto = soma(lavagensDoDia(iso))
        const despesas = soma(gastosDoDia(iso))
        return {
          iso,
          dia: data.getDate(),
          qtd: lavagensDoDia(iso).length,
          bruto,
          despesas,
          liquido: bruto - despesas,
        }
      })

    const receitaPorServico = (competencia) => {
      const mapa = new Map()
      for (const l of lavagensDoMes(competencia)) {
        const chave = l.servico?.trim() || 'Sem serviço definido'
        const atual = mapa.get(chave) ?? { nome: chave, total: 0, qtd: 0 }
        atual.total += Number(l.valor || 0)
        atual.qtd += 1
        mapa.set(chave, atual)
      }
      return [...mapa.values()].sort((a, b) => b.total - a.total)
    }

    const comparativoMensal = (competencia) => {
      const [ano, mes] = competencia.split('-').map(Number)
      const anteriorData = new Date(ano, mes - 2, 1)
      const anterior = `${anteriorData.getFullYear()}-${String(
        anteriorData.getMonth() + 1
      ).padStart(2, '0')}`

      const atual = resumoDoMes(competencia)
      const passado = resumoDoMes(anterior)

      const variacao = (agora, antes) => {
        if (antes === 0) return agora === 0 ? 0 : 100
        return ((agora - antes) / Math.abs(antes)) * 100
      }

      return {
        anterior,
        atual,
        passado,
        variacaoBruto: variacao(atual.bruto, passado.bruto),
        variacaoLiquido: variacao(atual.liquido, passado.liquido),
      }
    }

    return {
      lavagens,
      gastos,
      valoresPadrao,
      funcionarios,
      carregando,
      erroCarregamento,
      adicionarLavagem,
      atualizarLavagem,
      removerLavagem,
      lavagensDoDia,
      lavagensDoMes,
      adicionarGasto,
      atualizarGasto,
      removerGasto,
      gastosDoDia,
      gastosDiariosDoMes,
      gastosMensaisDoMes,
      adicionarValorPadrao,
      atualizarValorPadrao,
      removerValorPadrao,
      adicionarFuncionario,
      atualizarFuncionario,
      removerFuncionario,
      custoMensalFolha,
      resumoDoDia,
      resumoDoMes,
      seriesDoMes,
      receitaPorServico,
      comparativoMensal,
    }
  }, [lavagens, gastos, valoresPadrao, funcionarios, carregando, erroCarregamento])

  return <DadosContext.Provider value={valor}>{children}</DadosContext.Provider>
}

export function useDados() {
  const ctx = useContext(DadosContext)
  if (!ctx) throw new Error('useDados precisa estar dentro de <DadosProvider>')
  return ctx
}
