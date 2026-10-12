import { useState, useEffect, useRef } from 'react'
import './AdminCardapio.css'
import { API_URL } from './config'

const PROTEINAS_SUGERIDAS = [
  'Churrasco',
  'Frango Grelhado',
  'Linguiça Artesanal',
  'Frango Cozido'
]

const GUARNICOES_FIXAS = [
  'Arroz',
  'Feijão',
  'Feijão Tropeiro',
  'Macarrão',
  'Leguminosas',
  'Farofa',
  'Salada (Alface e tomate)',
  'Vinagrete',
  'Maionese'
]

function dataHojeFormatada() {
  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, '0')
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

function dataHojeISO() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function AdminCardapio({ voltar, pedidos, authToken, logout }) {
  const [data, setData] = useState(dataHojeISO())
  const [preco, setPreco] = useState('18.00')

  const [opcoes, setOpcoes] = useState({
    carne: ['Churrasco', 'Frango Grelhado'],
    guarnicao: ['Arroz', 'Feijão', 'Farofa', 'Salada (Alface e tomate)']
  })

  const [novaOpcao, setNovaOpcao] = useState({
    carne: '',
    guarnicao: ''
  })

  const [modoEdicao, setModoEdicao] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const consultaId = useRef(0)

  useEffect(() => {
    verificarCardapio(dataHojeISO())
  }, [])

  async function verificarCardapio(dataEscolhida) {
    if (!dataEscolhida) return
    const idConsulta = ++consultaId.current
    setConsultando(true)

    try {
      const resposta = await fetch(`${API_URL}/cardapios/${dataEscolhida}`)
      if (idConsulta !== consultaId.current) return

      if (resposta.status === 404) {
        setModoEdicao(false)
        setMensagem('Novo card\u00e1pio para esta data.')
        return
      }
      if (!resposta.ok) throw new Error('Erro ao consultar card\u00e1pio')

      const dados = await resposta.json()
      if (idConsulta !== consultaId.current) return
      setModoEdicao(true)
      setMensagem('Card\u00e1pio encontrado. Voc\u00ea est\u00e1 editando.')
      setPreco(String(dados.preco || '18.00'))

      const novasOpcoes = { carne: [], guarnicao: [] }
      ;(Array.isArray(dados.opcoes) ? dados.opcoes : []).forEach((opcao) => {
        if (novasOpcoes[opcao.categoria]) novasOpcoes[opcao.categoria].push(opcao.nome)
      })
      setOpcoes(novasOpcoes)
    } catch (erro) {
      console.error(erro)
      if (idConsulta === consultaId.current) setMensagem('N\u00e3o foi poss\u00edvel carregar o card\u00e1pio do servidor.')
    } finally {
      if (idConsulta === consultaId.current) setConsultando(false)
    }
  }

  async function salvarCardapio() {
    if (salvando || consultando) return
    setSalvando(true)
    try {
      const opcoesFormatadas = Object.entries(opcoes).flatMap(([categoria, itens]) =>
        itens.map((nome) => ({ categoria, nome }))
      )
      const metodo = modoEdicao ? 'PUT' : 'POST'
      const url = modoEdicao ? `${API_URL}/cardapios/${data}` : `${API_URL}/cardapios`
      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ data, preco: Number(preco), opcoes: opcoesFormatadas })
      })
      const resultado = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        if (resposta.status === 401) logout?.()
        if (resposta.status === 409 && resultado.id) {
          await verificarCardapio(data)
          setMensagem('Este card\u00e1pio j\u00e1 estava salvo. Confira os dados carregados e salve novamente para atualizar.')
        }
        alert(resultado.erro || 'Erro ao salvar card\u00e1pio.')
        return
      }

      alert(modoEdicao ? 'Card\u00e1pio atualizado e publicado com sucesso!' : 'Card\u00e1pio criado e publicado com sucesso!')
      setModoEdicao(true)
    } catch (erro) {
      console.error(erro)
      await verificarCardapio(data)
      alert('A conex\u00e3o caiu durante o salvamento. Verifique se o card\u00e1pio foi carregado antes de tentar novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function adicionarOpcao(categoria) {
    const nome = novaOpcao[categoria].trim()
    if (!nome) return

    if (opcoes[categoria].includes(nome)) {
      setNovaOpcao({ ...novaOpcao, [categoria]: '' })
      return
    }

    setOpcoes({
      ...opcoes,
      [categoria]: [...opcoes[categoria], nome]
    })

    setNovaOpcao({
      ...novaOpcao,
      [categoria]: ''
    })
  }

  function removerOpcao(categoria, index) {
    setOpcoes({
      ...opcoes,
      [categoria]: opcoes[categoria].filter((_, i) => i !== index)
    })
  }

  function alternarProteina(nome) {
    setOpcoes((atual) => {
      const jaSelecionada = atual.carne.includes(nome)
      return {
        ...atual,
        carne: jaSelecionada
          ? atual.carne.filter((item) => item !== nome)
          : [...atual.carne, nome]
      }
    })
  }

  function alternarGuarnicao(nome) {
    setOpcoes((atual) => {
      const jaSelecionada = atual.guarnicao.includes(nome)
      return {
        ...atual,
        guarnicao: jaSelecionada
          ? atual.guarnicao.filter((item) => item !== nome)
          : [...atual.guarnicao, nome]
      }
    })
  }

  return (
    <div className="admin-page">

      {/* BARRA SUPERIOR */}
      <header className="admin-header">
        <div className="admin-header-esquerda">
          <h1>EL SHADDAY • PAINEL ADMIN</h1>
        </div>

        <div className="admin-header-direita">
          <label className="admin-status-toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-switch"></span>
            <span className="toggle-texto">Restaurante Aberto</span>
          </label>

          <button onClick={voltar} className="admin-sair-btn" title="Ir para o site">
            Ver site
          </button>
        </div>
      </header>

      {/* ABAS DE NAVEGAÇÃO DO ADMIN */}
      <div className="admin-abas-nav">
        <button className="admin-aba-btn admin-aba-ativa">
          Gerenciar Cardápio
        </button>

        <button className="admin-aba-btn" onClick={pedidos}>
          Pedidos Recebidos
        </button>
      </div>

      <main className="admin-content">

        <section className="admin-card">

          <div className="admin-card-cabecalho">
            <h2>Criar Cardápio do Dia</h2>
            <p className="admin-subtitulo">
              Prepare o cardápio que estará disponível para os clientes hoje.
            </p>
          </div>

          <div className="admin-campos-linha">
            <div className="campo">
              <label>Data do Cardápio</label>
              <input
                type="date"
                value={data}
                onChange={(e) => {
                  const novaData = e.target.value
                  setData(novaData)
                  setModoEdicao(false)
                  verificarCardapio(novaData)
                }}
              />
            </div>

            <div className="campo">
              <label>Preço da marmita (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="18.00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </div>
          </div>

          {mensagem && <p className="mensagem-admin">{mensagem}</p>}

          <div className="admin-divisor"></div>

          {/* PROTEÍNAS DO DIA */}
          <div className="categoria-admin">
            <h3>Proteínas do Dia</h3>
            <p className="categoria-info">
              Selecione as opções de carne disponíveis para hoje:
            </p>

            {/* Chips de proteínas frequentes */}
            <div className="chips-grid">
              {PROTEINAS_SUGERIDAS.map((nome) => {
                const ativa = opcoes.carne.includes(nome)
                return (
                  <button
                    type="button"
                    key={nome}
                    className={`chip-btn ${ativa ? 'chip-btn-ativo' : ''}`}
                    onClick={() => alternarProteina(nome)}
                  >
                    {ativa ? '✓ ' : '+ '}
                    {nome}
                  </button>
                )
              })}
            </div>

            {/* Campo para adicionar proteína personalizada */}
            <div className="adicionar-opcao">
              <input
                type="text"
                placeholder="Adicionar carne"
                value={novaOpcao.carne}
                onChange={(e) =>
                  setNovaOpcao({ ...novaOpcao, carne: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && adicionarOpcao('carne')}
              />
              <button
                type="button"
                className="adicionar-btn"
                onClick={() => adicionarOpcao('carne')}
              >
                +
              </button>
            </div>

            {/* Lista de carnes ativas personalizadas */}
            {opcoes.carne.filter((c) => !PROTEINAS_SUGERIDAS.includes(c)).length > 0 && (
              <div className="lista-opcoes-extras">
                {opcoes.carne
                  .filter((c) => !PROTEINAS_SUGERIDAS.includes(c))
                  .map((opcao, index) => (
                    <div className="opcao-admin-extra" key={index}>
                      <span>✓ {opcao}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpcoes({
                            ...opcoes,
                            carne: opcoes.carne.filter((item) => item !== opcao)
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="admin-divisor"></div>

          {/* GUARNIÇÕES DO DIA */}
          <div className="categoria-admin">
            <h3>Guarnições do Dia</h3>
            <p className="categoria-info">
              Toque para ativar ou desativar as opções do dia:
            </p>

            <div className="chips-grid">
              {GUARNICOES_FIXAS.map((nome) => {
                const ativa = opcoes.guarnicao.includes(nome)
                return (
                  <button
                    type="button"
                    key={nome}
                    className={`chip-btn ${ativa ? 'chip-btn-ativo' : ''}`}
                    onClick={() => alternarGuarnicao(nome)}
                  >
                    {ativa ? '✓ ' : '+ '}
                    {nome}
                  </button>
                )
              })}
            </div>

            <div className="adicionar-opcao">
              <input
                type="text"
                placeholder="Adicionar outra guarnição"
                value={novaOpcao.guarnicao}
                onChange={(e) =>
                  setNovaOpcao({ ...novaOpcao, guarnicao: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && adicionarOpcao('guarnicao')}
              />
              <button
                type="button"
                className="adicionar-btn"
                onClick={() => adicionarOpcao('guarnicao')}
              >
                +
              </button>
            </div>

            {opcoes.guarnicao.filter((g) => !GUARNICOES_FIXAS.includes(g)).length > 0 && (
              <div className="lista-opcoes-extras">
                {opcoes.guarnicao
                  .filter((g) => !GUARNICOES_FIXAS.includes(g))
                  .map((opcao, index) => (
                    <div className="opcao-admin-extra" key={index}>
                      <span>✓ {opcao}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpcoes({
                            ...opcoes,
                            guarnicao: opcoes.guarnicao.filter((item) => item !== opcao)
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="salvar-cardapio-btn"
            onClick={salvarCardapio}
            disabled={salvando || consultando}
          >
            {salvando ? 'SALVANDO...' : 'SALVAR E PUBLICAR CARD\u00c1PIO \u2192'}
          </button>

        </section>

      </main>

    </div>
  )
}

export default AdminCardapio
