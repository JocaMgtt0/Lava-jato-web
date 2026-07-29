import { useMemo, useState } from 'react'
import BotaoVoltar from '../components/BotaoVoltar.jsx'
import GraficoBarras from '../components/GraficoBarras.jsx'
import GraficoDonut from '../components/GraficoDonut.jsx'
import { useDados } from '../context/DadosContext.jsx'
import { useAviso } from '../context/AvisoContext.jsx'
import { moeda } from '../lib/format.js'
import { competenciaDe, hojeISO, rotuloCompetencia } from '../lib/dates.js'

const CORES_SERVICO = ['var(--accent)', '#64d2ff', '#32d74b', '#bf5af2', '#ffd60a', '#ff6961']

function Variacao({ valor }) {
  if (!Number.isFinite(valor) || valor === 0) {
    return <span className="variacao neutra">estável</span>
  }
  const positiva = valor > 0
  return (
    <span className={positiva ? 'variacao positiva' : 'variacao negativa'}>
      {positiva ? '▲' : '▼'} {Math.abs(valor).toFixed(0)}%
    </span>
  )
}

function Relatorio() {
  const {
    resumoDoMes,
    seriesDoMes,
    receitaPorServico,
    comparativoMensal,
    gastosMensaisDoMes,
    gastosDiariosDoMes,
    lavagensDoMes,
    valoresPadrao,
    funcionarios,
    custoMensalFolha,
    adicionarGasto,
  } = useDados()

  const { avisar } = useAviso()

  const [modo, setModo] = useState('detalhado')
  const [competencia, setCompetencia] = useState(competenciaDe(hojeISO()))
  const [filtroServico, setFiltroServico] = useState('todos')

  const resumo = resumoDoMes(competencia)
  const serie = seriesDoMes(competencia)
  const comparativo = comparativoMensal(competencia)

  const todosGastos = [...gastosDiariosDoMes(competencia), ...gastosMensaisDoMes(competencia)]
  const fixosGerais = gastosMensaisDoMes(competencia).filter(
    (g) => g.categoria !== 'funcionario'
  )
  const gastosEquipe = todosGastos.filter((g) => g.categoria === 'funcionario')

  const servicos = useMemo(() => {
    const todos = receitaPorServico(competencia)
    if (filtroServico === 'todos') return todos
    return todos.filter((s) =>
      filtroServico === 'sem' ? s.nome === 'Sem serviço definido' : s.nome === filtroServico
    )
  }, [receitaPorServico, competencia, filtroServico])

  const qtdLavagens = useMemo(() => {
    const todas = lavagensDoMes(competencia)
    if (filtroServico === 'todos') return todas.length
    return todas.filter((l) => (filtroServico === 'sem' ? !l.servico : l.servico === filtroServico))
      .length
  }, [lavagensDoMes, competencia, filtroServico])

  const comMovimento = serie.filter((d) => d.bruto > 0 || d.despesas > 0)
  const melhorDia = comMovimento.reduce((m, d) => (!m || d.bruto > m.bruto ? d : m), null)
  const maiorGasto = comMovimento.reduce((m, d) => (!m || d.despesas > m.despesas ? d : m), null)
  const diasLucro = comMovimento.filter((d) => d.liquido > 0)
  const diasPrejuizo = comMovimento.filter((d) => d.liquido < 0)

  const folha = custoMensalFolha()
  const folhaJaLancada = gastosEquipe.some((g) => g.descricao === 'Folha de pagamento')

  const lancarFolha = async () => {
    try {
      await adicionarGasto({
        tipo: 'mensal',
        categoria: 'funcionario',
        descricao: 'Folha de pagamento',
        valor: folha,
        competencia,
      })
      avisar(`Folha de ${moeda(folha)} lançada`)
    } catch {
      avisar('Não foi possível lançar a folha. Tente de novo.', 'erro')
    }
  }

  return (
    <>
      <BotaoVoltar />

      <div className="pagina-topo nao-imprimir">
        <div className="pagina-titulo">
          <h1>Relatório</h1>
          <p className="pagina-subtitulo">{rotuloCompetencia(competencia)}</p>
        </div>

        <div className="controles">
          <input
            className="entrada-inline"
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            aria-label="Mês de referência"
          />
          <button className="btn btn-primario btn-pequeno" onClick={() => window.print()}>
            Baixar PDF
          </button>
        </div>
      </div>

      <div className="segmentado largo nao-imprimir">
        <button className={modo === 'detalhado' ? 'ativo' : ''} onClick={() => setModo('detalhado')}>
          Detalhado
        </button>
        <button className={modo === 'simples' ? 'ativo' : ''} onClick={() => setModo('simples')}>
          Simples
        </button>
      </div>

      <div className="somente-impressao cabecalho-impressao">
        <h1>Garage WM Lava Car — {rotuloCompetencia(competencia)}</h1>
      </div>

      <div className="cartoes">
        <div className="cartao">
          <span className="cartao-rotulo">Receita bruta</span>
          <div className="cartao-valor num">{moeda(resumo.bruto)}</div>
          <div className="cartao-nota">
            <Variacao valor={comparativo.variacaoBruto} /> vs mês anterior
          </div>
        </div>
        <div className="cartao">
          <span className="cartao-rotulo">Despesas</span>
          <div className="cartao-valor num negativo">{moeda(resumo.despesas)}</div>
          <div className="cartao-nota">
            {moeda(resumo.despesasGerais)} custos · {moeda(resumo.despesasFuncionarios)} equipe
          </div>
        </div>
        <div className={resumo.liquido < 0 ? 'cartao destaque negativo' : 'cartao destaque'}>
          <span className="cartao-rotulo">Lucro líquido</span>
          <div className="cartao-valor num">{moeda(resumo.liquido)}</div>
          <div className="cartao-nota">
            <Variacao valor={comparativo.variacaoLiquido} /> vs mês anterior
          </div>
        </div>
      </div>

      {/* Composição do faturamento: para onde foi o bruto */}
      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>Composição do faturamento</h2>
            <p className="pagina-subtitulo">Passe o mouse nas fatias para ver o detalhe</p>
          </div>
        </div>
        <GraficoDonut
          tamanho={210}
          dados={[
            { nome: 'Lucro líquido', valor: Math.max(0, resumo.liquido), cor: 'var(--c-lucro)' },
            { nome: 'Despesas', valor: resumo.despesasGerais, cor: 'var(--c-despesa)' },
            {
              nome: 'Equipe',
              valor: resumo.despesasFuncionarios,
              cor: 'var(--c-equipe)',
              detalhe: gastosEquipe.map((g) => `${g.descricao} · ${moeda(g.valor)}`),
            },
          ]}
          centro={{
            rotulo: 'Receita bruta',
            valor: moeda(resumo.bruto),
            estado: resumo.liquido >= 0 ? 'positivo' : 'negativo',
          }}
        />
      </section>

      {modo === 'detalhado' && (
        <>
          <section className="painel">
            <div className="painel-topo">
              <div>
                <h2>Receita por dia</h2>
                <p className="pagina-subtitulo">
                  {melhorDia
                    ? `Pico no dia ${melhorDia.dia} com ${moeda(melhorDia.bruto)}`
                    : 'Sem movimento no mês'}
                </p>
              </div>
            </div>
            <GraficoBarras
              dados={serie.map((d) => ({
                chave: d.iso,
                rotulo: String(d.dia),
                valor: d.bruto,
                destaque: melhorDia?.iso === d.iso && d.bruto > 0,
              }))}
              cor="var(--c-lucro)"
            />
          </section>

          <section className="painel">
            <div className="painel-topo">
              <div>
                <h2>Gastos por dia</h2>
                <p className="pagina-subtitulo">
                  {maiorGasto && maiorGasto.despesas > 0
                    ? `Maior gasto no dia ${maiorGasto.dia} com ${moeda(maiorGasto.despesas)}`
                    : 'Nenhum gasto avulso no mês'}
                </p>
              </div>
            </div>
            <GraficoBarras
              dados={serie.map((d) => ({
                chave: d.iso,
                rotulo: String(d.dia),
                valor: d.despesas,
                destaque: maiorGasto?.iso === d.iso && d.despesas > 0,
              }))}
              cor="var(--c-despesa)"
            />
          </section>

          <div className="dia-colunas">
            <section className="painel">
              <div className="painel-topo">
                <h2>Dias com lucro</h2>
                <span className="contador positivo">{diasLucro.length}</span>
              </div>
              {diasLucro.length === 0 ? (
                <div className="vazio compacto">
                  <p>Nenhum dia positivo neste mês.</p>
                </div>
              ) : (
                <ul className="lista">
                  {[...diasLucro]
                    .sort((a, b) => b.liquido - a.liquido)
                    .map((d) => (
                      <li className="lista-item" key={d.iso}>
                        <div className="lista-principal">
                          <div className="lista-titulo">Dia {d.dia}</div>
                          <div className="lista-meta">
                            {d.qtd} lavagem(ns) · {moeda(d.bruto)} bruto
                          </div>
                        </div>
                        <span className="lista-valor positivo num">{moeda(d.liquido)}</span>
                      </li>
                    ))}
                </ul>
              )}
            </section>

            <section className="painel">
              <div className="painel-topo">
                <h2>Dias com prejuízo</h2>
                <span className="contador negativo">{diasPrejuizo.length}</span>
              </div>
              {diasPrejuizo.length === 0 ? (
                <div className="vazio compacto">
                  <p>Nenhum dia negativo neste mês.</p>
                </div>
              ) : (
                <ul className="lista">
                  {[...diasPrejuizo]
                    .sort((a, b) => a.liquido - b.liquido)
                    .map((d) => (
                      <li className="lista-item" key={d.iso}>
                        <div className="lista-principal">
                          <div className="lista-titulo">Dia {d.dia}</div>
                          <div className="lista-meta">
                            {moeda(d.bruto)} bruto · {moeda(d.despesas)} gastos
                          </div>
                        </div>
                        <span className="lista-valor negativo num">{moeda(d.liquido)}</span>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>Receita por serviço</h2>
            <p className="pagina-subtitulo">{qtdLavagens} lavagem(ns)</p>
          </div>
          {valoresPadrao.length > 0 && (
            <div className="select-envolto nao-imprimir">
              <select
                value={filtroServico}
                onChange={(e) => setFiltroServico(e.target.value)}
                aria-label="Filtrar por serviço"
              >
                <option value="todos">Todos os serviços</option>
                {valoresPadrao.map((vp) => (
                  <option key={vp.id} value={vp.nome}>
                    {vp.nome}
                  </option>
                ))}
                <option value="sem">Sem serviço definido</option>
              </select>
            </div>
          )}
        </div>

        {servicos.length === 0 ? (
          <div className="vazio compacto">
            <p>Nenhuma lavagem para este filtro.</p>
          </div>
        ) : (
          <GraficoDonut
            dados={servicos.map((s, i) => ({
              nome: s.nome,
              valor: s.total,
              cor: CORES_SERVICO[i % CORES_SERVICO.length],
              detalhe: [`${s.qtd} lavagem(ns)`],
            }))}
            centro={{
              rotulo: 'Total',
              valor: moeda(servicos.reduce((acc, s) => acc + s.total, 0)),
            }}
          />
        )}
      </section>

      {/* Equipe: seção própria, separada dos demais gastos */}
      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>Equipe no mês</h2>
            <p className="pagina-subtitulo">Mão de obra fixa e temporária</p>
          </div>
          <span className="contador equipe">{moeda(resumo.despesasFuncionarios)}</span>
        </div>

        {gastosEquipe.length === 0 ? (
          <div className="vazio compacto">
            <p>Nenhum custo de equipe lançado neste mês.</p>
          </div>
        ) : (
          <ul className="lista">
            {gastosEquipe.map((g) => (
              <li className="lista-item" key={g.id}>
                <div className="lista-principal">
                  <div className="lista-titulo">{g.descricao}</div>
                  <div className="lista-meta">
                    {g.tipo === 'mensal' ? 'Custo fixo do mês' : `Diária · ${g.data}`}
                  </div>
                </div>
                <span className="lista-valor negativo num">− {moeda(g.valor)}</span>
              </li>
            ))}
          </ul>
        )}

        {funcionarios.length > 0 && (
          <div className="folha-total">
            <div>
              <span>Folha cadastrada ({funcionarios.length} funcionário(s))</span>
              <strong className="num">{moeda(folha)}</strong>
            </div>
            <button
              className="btn btn-suave btn-pequeno nao-imprimir"
              onClick={lancarFolha}
              disabled={folhaJaLancada}
            >
              {folhaJaLancada ? 'Folha lançada' : 'Lançar folha'}
            </button>
          </div>
        )}
      </section>

      <section className="painel">
        <div className="painel-topo">
          <h2>Custos fixos do mês</h2>
        </div>
        {fixosGerais.length === 0 ? (
          <div className="vazio compacto">
            <p>Nenhum custo fixo lançado.</p>
          </div>
        ) : (
          <ul className="lista">
            {fixosGerais.map((g) => (
              <li className="lista-item" key={g.id}>
                <div className="lista-principal">
                  <div className="lista-titulo">{g.descricao}</div>
                </div>
                <span className="lista-valor negativo num">− {moeda(g.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="painel">
        <div className="painel-topo">
          <h2>Fechamento do mês</h2>
        </div>
        <table className="tabela">
          <tbody>
            <tr>
              <td>Receita bruta</td>
              <td className="num">{moeda(resumo.bruto)}</td>
            </tr>
            <tr>
              <td>(−) Custos e produtos</td>
              <td className="num negativo">− {moeda(resumo.despesasGerais)}</td>
            </tr>
            <tr>
              <td>(−) Equipe</td>
              <td className="num negativo">− {moeda(resumo.despesasFuncionarios)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Lucro líquido</td>
              <td className={resumo.liquido < 0 ? 'num negativo' : 'num positivo'}>
                {moeda(resumo.liquido)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </>
  )
}

export default Relatorio
