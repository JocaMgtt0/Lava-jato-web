import { useState } from 'react'
import BotaoVoltar from '../components/BotaoVoltar.jsx'
import FormGasto from '../components/FormGasto.jsx'
import { useDados } from '../context/DadosContext.jsx'
import { useAviso } from '../context/AvisoContext.jsx'
import { useConfirmacao } from '../context/ConfirmacaoContext.jsx'
import { moeda } from '../lib/format.js'
import {
  competenciaDe,
  hojeISO,
  rotuloCompetencia,
  rotuloDiaExtenso,
} from '../lib/dates.js'

function Gastos() {
  const {
    gastosDoDia,
    gastosDiariosDoMes,
    gastosMensaisDoMes,
    resumoDoDia,
    resumoDoMes,
    adicionarGasto,
    atualizarGasto,
    removerGasto,
  } = useDados()

  const { avisar } = useAviso()
  const { confirmar } = useConfirmacao()

  const [escopo, setEscopo] = useState('mes')
  const [dia, setDia] = useState(hojeISO())
  const [competencia, setCompetencia] = useState(competenciaDe(hojeISO()))
  const [formAberto, setFormAberto] = useState(false)
  const [edicao, setEdicao] = useState(null)

  const porDia = escopo === 'dia'

  const diarios = porDia ? gastosDoDia(dia) : gastosDiariosDoMes(competencia)
  const fixos = porDia ? [] : gastosMensaisDoMes(competencia)
  const resumo = porDia ? resumoDoDia(dia) : resumoDoMes(competencia)

  const salvar = async (dados) => {
    try {
      if (edicao) {
        await atualizarGasto(edicao.id, dados)
        setEdicao(null)
        setFormAberto(false)
        avisar('Gasto atualizado')
      } else {
        await adicionarGasto(dados)
        avisar(`Gasto registrado · ${moeda(dados.valor)}`)
      }
    } catch {
      avisar('Não foi possível salvar o gasto. Tente de novo.', 'erro')
    }
  }

  const excluir = async (g) => {
    const ok = await confirmar({
      mensagem: `Excluir "${g.descricao}" (${moeda(g.valor)})? Essa ação não pode ser desfeita.`,
    })
    if (!ok) return
    try {
      await removerGasto(g.id)
      avisar('Gasto excluído')
    } catch {
      avisar('Não foi possível excluir. Tente de novo.', 'erro')
    }
  }

  const abrirEdicao = (g) => {
    setEdicao(g)
    setFormAberto(true)
  }

  const fecharForm = () => {
    setEdicao(null)
    setFormAberto(false)
  }

  return (
    <>
      <BotaoVoltar />

      <div className="pagina-topo">
        <div className="pagina-titulo">
          <h1>Gastos</h1>
          <p className="pagina-subtitulo">
            {porDia ? rotuloDiaExtenso(dia) : rotuloCompetencia(competencia)}
          </p>
        </div>

        <button
          className={formAberto ? 'btn btn-suave' : 'btn btn-primario'}
          onClick={() => (formAberto ? fecharForm() : setFormAberto(true))}
        >
          {formAberto ? 'Fechar' : '+ Novo gasto'}
        </button>
      </div>

      <div className="barra-periodo">
        <div className="segmentado">
          <button className={porDia ? 'ativo' : ''} onClick={() => setEscopo('dia')}>
            Por dia
          </button>
          <button className={!porDia ? 'ativo' : ''} onClick={() => setEscopo('mes')}>
            Por mês
          </button>
        </div>

        {porDia ? (
          <input
            className="entrada-inline"
            type="date"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
          />
        ) : (
          <input
            className="entrada-inline"
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
        )}
      </div>

      {formAberto && (
        <section className="painel">
          <div className="painel-topo">
            <h2>{edicao ? 'Editar gasto' : 'Novo gasto'}</h2>
          </div>
          <FormGasto
            key={edicao?.id ?? 'novo'}
            inicial={edicao}
            dataPadrao={porDia ? dia : `${competencia}-01`}
            aoSalvar={salvar}
            aoCancelar={fecharForm}
          />
        </section>
      )}

      <div className="resumo-linha">
        <div className="resumo-item">
          <span>Bruto</span>
          <strong className="num">{moeda(resumo.bruto)}</strong>
        </div>
        <div className="resumo-item">
          <span>Gastos</span>
          <strong className="num negativo">{moeda(resumo.despesas)}</strong>
        </div>
        <div className="resumo-item">
          <span>Líquido</span>
          <strong className={resumo.liquido < 0 ? 'num negativo' : 'num positivo'}>
            {moeda(resumo.liquido)}
          </strong>
        </div>
      </div>

      {!porDia && (
        <section className="painel">
          <div className="painel-topo">
            <h2>Custos fixos</h2>
            <span className="contador">{fixos.length}</span>
          </div>
          {fixos.length === 0 ? (
            <div className="vazio compacto">
              <p>Nenhum custo fixo lançado neste mês.</p>
            </div>
          ) : (
            <ul className="lista">
              {fixos.map((g) => (
                <li className="lista-item" key={g.id}>
                  <div className="lista-principal">
                    <div className="lista-titulo">
                      {g.descricao} <span className="etiqueta fixo">fixo</span>
                    </div>
                    <div className="lista-meta">{rotuloCompetencia(g.competencia)}</div>
                  </div>
                  <span className="lista-valor negativo num">− {moeda(g.valor)}</span>
                  <div className="lista-acoes">
                    <button className="btn-icone" onClick={() => abrirEdicao(g)} aria-label="Editar">
                      ✎
                    </button>
                    <button
                      className="btn-icone perigo"
                      onClick={() => excluir(g)}
                      aria-label="Excluir"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="painel">
        <div className="painel-topo">
          <h2>{porDia ? 'Gastos do dia' : 'Gastos avulsos'}</h2>
          <span className="contador">{diarios.length}</span>
        </div>
        {diarios.length === 0 ? (
          <div className="vazio compacto">
            <p>Nenhum gasto avulso neste período.</p>
          </div>
        ) : (
          <ul className="lista">
            {diarios.map((g) => (
              <li className="lista-item" key={g.id}>
                <div className="lista-principal">
                  <div className="lista-titulo">{g.descricao}</div>
                  <div className="lista-meta">{rotuloDiaExtenso(g.data)}</div>
                </div>
                <span className="lista-valor negativo num">− {moeda(g.valor)}</span>
                <div className="lista-acoes">
                  <button className="btn-icone" onClick={() => abrirEdicao(g)} aria-label="Editar">
                    ✎
                  </button>
                  <button
                    className="btn-icone perigo"
                    onClick={() => excluir(g)}
                    aria-label="Excluir"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default Gastos
