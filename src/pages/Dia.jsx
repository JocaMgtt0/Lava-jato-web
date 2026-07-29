import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BotaoVoltar from '../components/BotaoVoltar.jsx'
import FormLavagem from '../components/FormLavagem.jsx'
import FormGasto from '../components/FormGasto.jsx'
import GraficoDonut from '../components/GraficoDonut.jsx'
import { useDados } from '../context/DadosContext.jsx'
import { useAviso } from '../context/AvisoContext.jsx'
import { useConfirmacao } from '../context/ConfirmacaoContext.jsx'
import { moeda } from '../lib/format.js'
import { fromISO, hojeISO, rotuloDiaExtenso, somarDias, toISO } from '../lib/dates.js'

const CORES_SERVICO = ['var(--accent)', '#64d2ff', '#32d74b', '#bf5af2', '#ffd60a', '#ff6961']

function Dia() {
  const { data: dataISO = hojeISO() } = useParams()
  const navegar = useNavigate()

  const {
    lavagensDoDia,
    gastosDoDia,
    resumoDoDia,
    valoresPadrao,
    adicionarLavagem,
    atualizarLavagem,
    removerLavagem,
    adicionarGasto,
    atualizarGasto,
    removerGasto,
  } = useDados()

  const { avisar } = useAviso()
  const { confirmar } = useConfirmacao()

  const [aba, setAba] = useState('cadastro')
  const [tipoCadastro, setTipoCadastro] = useState('lavagem')
  const [tempAberto, setTempAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroServico, setFiltroServico] = useState('todos')
  const [emEdicao, setEmEdicao] = useState(null)

  const lavagens = lavagensDoDia(dataISO)
  const gastos = gastosDoDia(dataISO)
  const resumo = resumoDoDia(dataISO)

  const gastosGerais = gastos.filter((g) => g.categoria !== 'funcionario')
  const gastosEquipe = gastos.filter((g) => g.categoria === 'funcionario')

  const lavagensFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return lavagens.filter((l) => {
      const casaBusca =
        !termo ||
        l.cliente?.toLowerCase().includes(termo) ||
        l.modelo?.toLowerCase().includes(termo) ||
        l.placa?.toLowerCase().includes(termo)

      const casaServico =
        filtroServico === 'todos' ||
        (filtroServico === 'sem' ? !l.servico : l.servico === filtroServico)

      return casaBusca && casaServico
    })
  }, [lavagens, busca, filtroServico])

  const irParaDia = (delta) =>
    navegar(`/dia/${toISO(somarDias(fromISO(dataISO), delta))}`, { replace: true })

  const salvarLavagem = async (dados) => {
    try {
      if (emEdicao?.tipo === 'lavagem') {
        await atualizarLavagem(emEdicao.item.id, dados)
        setEmEdicao(null)
        avisar('Lavagem atualizada')
      } else {
        await adicionarLavagem({ ...dados, data: dataISO })
        avisar(`${dados.modelo} registrado · ${moeda(dados.valor)}`)
      }
    } catch {
      avisar('Não foi possível salvar a lavagem. Tente de novo.', 'erro')
    }
  }

  const salvarGasto = async (dados) => {
    try {
      if (emEdicao?.tipo === 'gasto') {
        await atualizarGasto(emEdicao.item.id, dados)
        setEmEdicao(null)
        avisar('Gasto atualizado')
      } else {
        await adicionarGasto(dados)
        avisar(`Gasto registrado · ${moeda(dados.valor)}`)
      }
    } catch {
      avisar('Não foi possível salvar o gasto. Tente de novo.', 'erro')
    }
  }

  const excluirLavagem = async (l) => {
    const ok = await confirmar({
      mensagem: `Excluir a lavagem de ${l.cliente || l.modelo} (${moeda(l.valor)})? Essa ação não pode ser desfeita.`,
    })
    if (!ok) return
    try {
      await removerLavagem(l.id)
      avisar('Lavagem excluída')
    } catch {
      avisar('Não foi possível excluir. Tente de novo.', 'erro')
    }
  }

  const excluirGasto = async (g) => {
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

  const editarGasto = (g) => {
    setTipoCadastro('gasto')
    setEmEdicao({ tipo: 'gasto', item: g })
    if (g.categoria === 'funcionario') setTempAberto(true)
  }

  const ehHoje = dataISO === hojeISO()

  const ListaGastos = ({ itens, aoEditar }) => (
    <ul className="lista">
      {itens.map((g) => (
        <li className="lista-item" key={g.id}>
          <div className="lista-principal">
            <div className="lista-titulo">
              {g.descricao}
              {g.categoria === 'funcionario' && (
                <span className="etiqueta equipe">equipe</span>
              )}
            </div>
          </div>
          <span className="lista-valor negativo num">− {moeda(g.valor)}</span>
          <div className="lista-acoes">
            <button className="btn-icone" onClick={() => aoEditar(g)} aria-label="Editar gasto">
              ✎
            </button>
            <button
              className="btn-icone perigo"
              onClick={() => excluirGasto(g)}
              aria-label="Excluir gasto"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <BotaoVoltar rotulo="Calendário" />

      <div className="dia-nav">
        <button className="btn-seta" onClick={() => irParaDia(-1)} aria-label="Dia anterior">
          ‹
        </button>
        <div className="dia-titulo">
          <h1>{rotuloDiaExtenso(dataISO)}</h1>
          {ehHoje && <span className="etiqueta destaque">hoje</span>}
        </div>
        <button className="btn-seta" onClick={() => irParaDia(1)} aria-label="Próximo dia">
          ›
        </button>
      </div>

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

      <div className="segmentado largo">
        <button className={aba === 'cadastro' ? 'ativo' : ''} onClick={() => setAba('cadastro')}>
          Cadastro
        </button>
        <button className={aba === 'relatorio' ? 'ativo' : ''} onClick={() => setAba('relatorio')}>
          Relatório do dia
        </button>
      </div>

      {aba === 'cadastro' ? (
        <div className="dia-colunas">
          <section className="painel">
            <div className="painel-topo">
              <div className="segmentado">
                <button
                  className={tipoCadastro === 'lavagem' ? 'ativo' : ''}
                  onClick={() => {
                    setTipoCadastro('lavagem')
                    setEmEdicao(null)
                  }}
                >
                  Lavagem
                </button>
                <button
                  className={tipoCadastro === 'gasto' ? 'ativo' : ''}
                  onClick={() => {
                    setTipoCadastro('gasto')
                    setEmEdicao(null)
                  }}
                >
                  Gasto
                </button>
              </div>
              {emEdicao && <span className="etiqueta destaque">editando</span>}
            </div>

            {tipoCadastro === 'lavagem' ? (
              <FormLavagem
                key={emEdicao?.item?.id ?? 'nova'}
                inicial={emEdicao?.tipo === 'lavagem' ? emEdicao.item : undefined}
                aoSalvar={salvarLavagem}
                aoCancelar={emEdicao ? () => setEmEdicao(null) : undefined}
              />
            ) : (
              <>
                <FormGasto
                  key={emEdicao?.item?.id ?? 'novo'}
                  inicial={
                    emEdicao?.tipo === 'gasto' && emEdicao.item.categoria !== 'funcionario'
                      ? emEdicao.item
                      : undefined
                  }
                  dataPadrao={dataISO}
                  permitirTrocarTipo={false}
                  aoSalvar={salvarGasto}
                  aoCancelar={emEdicao ? () => setEmEdicao(null) : undefined}
                />

                {/* Freelance do dia: mesmo fluxo de gasto, mas marcado como equipe */}
                <div className="expansivel">
                  <button
                    className="expansivel-topo"
                    onClick={() => setTempAberto(!tempAberto)}
                    aria-expanded={tempAberto}
                  >
                    <span className="expansivel-titulo">
                      <span className="expansivel-icone">👷</span>
                      Funcionário temporário
                    </span>
                    <span className={tempAberto ? 'chevron aberto' : 'chevron'}>›</span>
                  </button>

                  {tempAberto && (
                    <div className="expansivel-corpo">
                      <p className="aviso" style={{ marginTop: 0 }}>
                        Diarista ou freelance deste dia. Entra como gasto, mas separado dos
                        demais custos no relatório.
                      </p>
                      <FormGasto
                        key={`temp-${emEdicao?.item?.id ?? 'novo'}`}
                        inicial={
                          emEdicao?.tipo === 'gasto' &&
                          emEdicao.item.categoria === 'funcionario'
                            ? emEdicao.item
                            : undefined
                        }
                        dataPadrao={dataISO}
                        permitirTrocarTipo={false}
                        categoria="funcionario"
                        rotuloDescricao="Nome do funcionário"
                        placeholderDescricao="Ex: João (diária)"
                        textoBotao="Registrar diária"
                        aoSalvar={salvarGasto}
                        aoCancelar={emEdicao ? () => setEmEdicao(null) : undefined}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="painel">
            <div className="painel-topo">
              <h2>Lavagens do dia</h2>
              <span className="contador">{lavagens.length}</span>
            </div>

            <div className="filtros">
              <input
                className="busca"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente, veículo ou placa"
                type="search"
              />
              {valoresPadrao.length > 0 && (
                <div className="select-envolto">
                  <select
                    value={filtroServico}
                    onChange={(e) => setFiltroServico(e.target.value)}
                    aria-label="Filtrar por serviço"
                  >
                    <option value="todos">Todos</option>
                    {valoresPadrao.map((vp) => (
                      <option key={vp.id} value={vp.nome}>
                        {vp.nome}
                      </option>
                    ))}
                    <option value="sem">Sem serviço</option>
                  </select>
                </div>
              )}
            </div>

            {lavagensFiltradas.length === 0 ? (
              <div className="vazio compacto">
                <p>
                  {lavagens.length === 0
                    ? 'Nenhuma lavagem registrada neste dia.'
                    : 'Nenhuma lavagem corresponde ao filtro.'}
                </p>
              </div>
            ) : (
              <ul className="lista">
                {lavagensFiltradas.map((l) => (
                  <li className="lista-item" key={l.id}>
                    <div className="lista-principal">
                      <div className="lista-titulo">
                        {l.cliente ? `${l.cliente} · ${l.modelo}` : l.modelo}
                      </div>
                      <div className="lista-meta">
                        {[l.placa, l.servico].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <span className="lista-valor positivo num">{moeda(l.valor)}</span>
                    <div className="lista-acoes">
                      <button
                        className="btn-icone"
                        onClick={() => {
                          setTipoCadastro('lavagem')
                          setEmEdicao({ tipo: 'lavagem', item: l })
                        }}
                        aria-label="Editar lavagem"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icone perigo"
                        onClick={() => excluirLavagem(l)}
                        aria-label="Excluir lavagem"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="painel-topo" style={{ marginTop: 22 }}>
              <h2>Gastos do dia</h2>
              <span className="contador">{gastosGerais.length}</span>
            </div>
            {gastosGerais.length === 0 ? (
              <div className="vazio compacto">
                <p>Nenhum gasto lançado neste dia.</p>
              </div>
            ) : (
              <ListaGastos itens={gastosGerais} aoEditar={editarGasto} />
            )}

            <div className="painel-topo" style={{ marginTop: 22 }}>
              <h2>Equipe do dia</h2>
              <span className="contador">{gastosEquipe.length}</span>
            </div>
            {gastosEquipe.length === 0 ? (
              <div className="vazio compacto">
                <p>Nenhum funcionário temporário neste dia.</p>
              </div>
            ) : (
              <ListaGastos itens={gastosEquipe} aoEditar={editarGasto} />
            )}
          </section>
        </div>
      ) : (
        <RelatorioDoDia lavagens={lavagens} resumo={resumo} />
      )}
    </>
  )
}

/** Aba "Relatório do dia" */
function RelatorioDoDia({ lavagens, resumo }) {
  const porServico = useMemo(() => {
    const mapa = new Map()
    for (const l of lavagens) {
      const chave = l.servico?.trim() || 'Sem serviço'
      const atual = mapa.get(chave) ?? { nome: chave, total: 0, qtd: 0 }
      atual.total += Number(l.valor || 0)
      atual.qtd += 1
      mapa.set(chave, atual)
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total)
  }, [lavagens])

  if (lavagens.length === 0 && resumo.despesas === 0) {
    return (
      <div className="painel">
        <div className="vazio">
          <div className="vazio-icone">📊</div>
          <p>Sem movimento neste dia ainda.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dia-colunas">
      <section className="painel">
        <div className="painel-topo">
          <h2>Composição do dia</h2>
        </div>
        <GraficoDonut
          dados={[
            { nome: 'Lucro líquido', valor: Math.max(0, resumo.liquido), cor: 'var(--c-lucro)' },
            { nome: 'Despesas', valor: resumo.despesasGerais, cor: 'var(--c-despesa)' },
            {
              nome: 'Equipe',
              valor: resumo.despesasFuncionarios,
              cor: 'var(--c-equipe)',
              detalhe: resumo.gastosFuncionarios.map(
                (g) => `${g.descricao} · ${moeda(g.valor)}`
              ),
            },
          ]}
          centro={{
            rotulo: 'Bruto',
            valor: moeda(resumo.bruto),
            estado: resumo.liquido >= 0 ? 'positivo' : 'negativo',
          }}
        />
      </section>

      <section className="painel">
        <div className="painel-topo">
          <h2>Receita por serviço</h2>
        </div>

        {porServico.length === 0 ? (
          <div className="vazio compacto">
            <p>Nenhuma lavagem registrada.</p>
          </div>
        ) : (
          <GraficoDonut
            dados={porServico.map((s, i) => ({
              nome: s.nome,
              valor: s.total,
              cor: CORES_SERVICO[i % CORES_SERVICO.length],
              detalhe: [`${s.qtd} lavagem(ns)`],
            }))}
            centro={{ rotulo: 'Lavagens', valor: String(lavagens.length) }}
          />
        )}
      </section>
    </div>
  )
}

export default Dia
