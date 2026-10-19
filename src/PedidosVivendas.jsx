import { useEffect, useRef, useState } from 'react'
import './PedidosVivendas.css'
import { rotuloPagamento, textoTroco } from './formasPagamento'
import { API_URL } from './config'


function formatarHora(criadoEm) {
  if (!criadoEm) return ''
  const dataUtc = new Date(criadoEm.replace(' ', 'T') + 'Z')
  if (Number.isNaN(dataUtc.getTime())) return ''
  return dataUtc.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function tempoDecorrido(criadoEm) {
  if (!criadoEm) return 'há 1 min'
  try {
    const agora = new Date()
    const dataUtc = new Date(criadoEm.replace(' ', 'T') + 'Z')
    const diffMs = agora - dataUtc
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin <= 1) return 'há 1 min'
    if (diffMin < 60) return `há ${diffMin} min`
    const diffHoras = Math.floor(diffMin / 60)
    if (diffHoras === 1) return 'há 1 hora'
    return `há ${diffHoras} horas`
  } catch (e) {
    return 'recente'
  }
}

function dataLocalDoPedido(criadoEm) {
  if (!criadoEm) return ''
  // O SQLite grava CURRENT_TIMESTAMP em UTC sem sufixo. Converter esse instante
  // para o fuso local antes de agrupar por dia evita esconder pedidos noturnos.
  const valor = criadoEm.includes('T') ? criadoEm : `${criadoEm.replace(' ', 'T')}Z`
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return ''
  const partes = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]))
  return `${valores.year}-${valores.month}-${valores.day}`
}

const CHAVE_DATA_PEDIDOS = 'admin_pedidos_data_selecionada'

function dataInicialPedidos() {
  // Ao abrir a tela, começar no dia atual para que pedidos novos não fiquem
  // escondidos por uma data antiga salva no navegador.
  return hojeLocal()
}

function hojeLocal() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function formatarDataSelecionada(dataStr) {
  const [ano, mes, dia] = dataStr.split('-')
  if (dataStr === hojeLocal()) return `Hoje, ${dia}/${mes}`
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  const ontemStr = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`
  if (dataStr === ontemStr) return `Ontem, ${dia}/${mes}`
  return `${dia}/${mes}`
}

function mudarDia(dataStr, delta) {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  data.setDate(data.getDate() + delta)
  const novoAno = data.getFullYear()
  const novoMes = String(data.getMonth() + 1).padStart(2, '0')
  const novoDia = String(data.getDate()).padStart(2, '0')
  return `${novoAno}-${novoMes}-${novoDia}`
}

function limparTexto(texto) {
  if (!texto) return ''
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '-')
}

function normalizarStatus(status) {
  const statusNormalizado = String(status || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')

  const aliases = {
    aguardando_aprovacao: 'aguardando',
    pendente: 'aguardando',
    aprovado: 'aprovado',
    em_preparo: 'em_preparo',
    preparando: 'em_preparo',
    pronto: 'pronto',
    recusado: 'recusado'
  }

  return aliases[statusNormalizado] || statusNormalizado
}

function rotuloStatus(status) {
  const statusNormalizado = normalizarStatus(status)
  const rotulos = {
    aguardando: 'Aguardando Aprovação',
    aprovado: 'Aprovado',
    em_preparo: 'Em Preparo',
    pronto: 'Prontos / Entrega',
    recusado: 'Recusado'
  }
  return rotulos[statusNormalizado] || status
}

function formatarReais(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

function formatarTelefone(tel) {
  if (!tel) return ''
  const num = tel.replace(/\D/g, '')
  if (num.length === 11) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`
  }
  if (num.length === 10) {
    return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`
  }
  return tel
}

function ehClienteComum(pedido) {
  const origem = String(pedido.origem || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')

  return ['cliente_comum', 'cliente'].includes(origem)
}

function rotuloOrigem(pedido) {
  const rotulos = {
    cliente_comum: 'Cliente Comum',
    vivendas: 'Vivendas'
  }
  return rotulos[ehClienteComum(pedido) ? 'cliente_comum' : 'vivendas']
}

function textoCarne(pedido) {
  return pedido.carne || pedido.opcao_carne || ''
}

function listarMarmitas(pedido) {
  if (Array.isArray(pedido.marmitas) && pedido.marmitas.length) return pedido.marmitas
  try {
    const itens = JSON.parse(pedido.marmitas_json || '[]')
    if (Array.isArray(itens) && itens.length) return itens
  } catch {}
  return [{
    carne: textoCarne(pedido),
    guarnicao: pedido.guarnicao || '',
    refrigerante_sabor: pedido.refrigerante_sabor || '',
    refrigerante_tamanho: pedido.refrigerante_tamanho || '',
    agua_tipo: pedido.agua_tipo || ''
  }]
}

function textoBebidaMarmita(marmita) {
  const partes = []
  if (marmita.refrigerante_sabor) partes.push(marmita.refrigerante_sabor)
  if (marmita.agua_tipo) partes.push(marmita.agua_tipo)
  return partes.join(' + ')
}

function textoBebida(pedido) {
  const partes = []
  if (pedido.refrigerante_sabor) {
    const tamanho = pedido.refrigerante_tamanho ? ` - ${pedido.refrigerante_tamanho}` : ''
    partes.push(`${pedido.refrigerante_sabor}${tamanho}`)
  }
  if (pedido.agua_tipo) {
    partes.push(pedido.agua_tipo)
  }
  return partes.join(' + ')
}

function textoFaixaCobranca(pedido) {
  const total = Number(pedido.valor_cobrar !== undefined && pedido.valor_cobrar !== null ? pedido.valor_cobrar : pedido.preco || 0)
  const forma = pedido.forma_pagamento ? rotuloPagamento(pedido.forma_pagamento) : 'na entrega'

  if (!ehClienteComum(pedido) && total === 0) {
    return 'Total a cobrar: R$ 0,00 • Marmita coberta pelo convênio Vivendas'
  }

  let texto = `Total a cobrar: ${formatarReais(total)} • Pagamento na entrega: ${forma}`
  if (pedido.forma_pagamento === 'dinheiro' && pedido.troco_para) {
    const levar = Number(pedido.troco_para) - total
    if (levar > 0) {
      texto += ` (Levar troco para ${formatarReais(pedido.troco_para)})`
    }
  }
  return texto
}

function PedidosVivendas({ voltar, authToken, logout }) {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [apiStatus, setApiStatus] = useState('checking')
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)
  const [filtro, setFiltro] = useState('aguardando')
  const [dataSelecionada, setDataSelecionada] = useState(dataInicialPedidos)
  const [proximoCursor, setProximoCursor] = useState('')
  const [temMais, setTemMais] = useState(false)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const proximoCursorRef = useRef('')
  const historicoCarregadoRef = useRef(false)
  const pedidosConhecidosRef = useRef(null)
  const carregamentoPedidosRef = useRef(false)
  const contextoAudioRef = useRef(null)
  const alertaPendenteRef = useRef(false)

  function tocarAlertaNovoPedido() {
    const contexto = contextoAudioRef.current
    if (!contexto || contexto.state !== 'running') {
      alertaPendenteRef.current = true
      return
    }

    const agora = contexto.currentTime
    ;[880, 660].forEach((frequencia, indice) => {
      const inicio = agora + indice * 0.22
      const oscilador = contexto.createOscillator()
      const volume = contexto.createGain()
      oscilador.type = 'sine'
      oscilador.frequency.value = frequencia
      volume.gain.setValueAtTime(0.0001, inicio)
      volume.gain.exponentialRampToValueAtTime(0.18, inicio + 0.025)
      volume.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.28)
      oscilador.connect(volume)
      volume.connect(contexto.destination)
      oscilador.start(inicio)
      oscilador.stop(inicio + 0.3)
    })

    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      const avisoFalado = new SpeechSynthesisUtterance('Pedido na tela')
      avisoFalado.lang = 'pt-BR'
      avisoFalado.rate = 1
      avisoFalado.pitch = 1
      avisoFalado.volume = 1
      window.speechSynthesis.speak(avisoFalado)
    }
  }

  useEffect(() => {
    function liberarAudio() {
      try {
        const AudioContextNativo = window.AudioContext || window.webkitAudioContext
        if (!AudioContextNativo) return
        if (!contextoAudioRef.current) contextoAudioRef.current = new AudioContextNativo()
        const contexto = contextoAudioRef.current
        if (contexto.state === 'suspended') {
          contexto.resume().then(() => {
            if (alertaPendenteRef.current) {
              alertaPendenteRef.current = false
              tocarAlertaNovoPedido()
            }
          }).catch(() => {})
        } else if (alertaPendenteRef.current) {
          alertaPendenteRef.current = false
          tocarAlertaNovoPedido()
        }
      } catch {}
    }

    window.addEventListener('pointerdown', liberarAudio)
    window.addEventListener('keydown', liberarAudio)
    return () => {
      window.removeEventListener('pointerdown', liberarAudio)
      window.removeEventListener('keydown', liberarAudio)
      contextoAudioRef.current?.close()
      contextoAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem(CHAVE_DATA_PEDIDOS, dataSelecionada) } catch {}
  }, [dataSelecionada])

  async function requisicaoAdmin(url, opcoes = {}) {
    const resposta = await fetch(url, {
      ...opcoes,
      headers: { ...opcoes.headers, Authorization: `Bearer ${authToken}` }
    })
    if (resposta.status === 401) logout?.()
    return resposta
  }

  async function carregarPedidos(mostrarErro = true, cursor = '', carregarMais = false) {
    if (carregamentoPedidosRef.current) return
    carregamentoPedidosRef.current = true
    try {
      const parametroCursor = cursor ? `&beforeId=${encodeURIComponent(cursor)}` : ''
      const resposta = await requisicaoAdmin(`${API_URL}/pedidos?limit=100${parametroCursor}`)
      if (!resposta.ok) throw new Error('Erro ao buscar pedidos')
      const dados = await resposta.json()
      if (!Array.isArray(dados)) throw new Error('Resposta inválida ao buscar pedidos')

      const conhecidos = pedidosConhecidosRef.current
      if (conhecidos) {
        const atuais = new Map(dados.map((pedido) => [String(pedido.id), normalizarStatus(pedido.status)]))
        const entrouEmAguardando = dados.some((pedido) => {
          if (normalizarStatus(pedido.status) !== 'aguardando') return false
          const id = String(pedido.id)
          return !conhecidos.has(id) || conhecidos.get(id) !== 'aguardando'
        })
        if (entrouEmAguardando) tocarAlertaNovoPedido()
        pedidosConhecidosRef.current = atuais
      } else {
        // A primeira consulta estabelece a referência sem tocar para pedidos antigos.
        pedidosConhecidosRef.current = new Map(dados.map((pedido) => [String(pedido.id), normalizarStatus(pedido.status)]))
      }

      setApiStatus('online')
      setUltimaAtualizacao(new Date())
      if (carregarMais) historicoCarregadoRef.current = true
      setPedidos((atuais) => {
        const idsPagina = new Set(dados.map((pedido) => pedido.id))
        return carregarMais
          ? [...atuais, ...dados.filter((pedido) => !atuais.some((atual) => atual.id === pedido.id))]
          : [...dados, ...atuais.filter((pedido) => !idsPagina.has(pedido.id))]
      })
      if (carregarMais || !historicoCarregadoRef.current) {
        const ultimoId = dados[dados.length - 1]?.id
        const novoCursor = resposta.headers.get('X-Next-Cursor') || (ultimoId ? String(ultimoId) : '')
        proximoCursorRef.current = novoCursor
        setProximoCursor(novoCursor)
        setTemMais(resposta.headers.get('X-Has-More') === 'true')
      }
    } catch (erro) {
      console.error(erro)
      setApiStatus('offline')
      if (mostrarErro) alert('N\u00e3o foi poss\u00edvel carregar os pedidos.')
    } finally {
      carregamentoPedidosRef.current = false
      setCarregando(false)
      setCarregandoMais(false)
    }
  }

  useEffect(() => {
    carregarPedidos()
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      carregarPedidos(false)
    }, 15000)
    return () => clearInterval(intervalo)
  }, [])

  async function aprovarPedido(pedido) {
    try {
      const resposta = await requisicaoAdmin(
        `${API_URL}/pedidos/${pedido.id}/aprovar`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao aprovar pedido.')
        return
      }
      imprimirPedido({ ...pedido, status: 'em_preparo' })
      setPedidos((atuais) => atuais.map((item) =>
        item.id === pedido.id ? { ...item, status: 'em_preparo' } : item
      ))
      setFiltro('em_preparo')
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function recusarPedido(id) {
    try {
      const resposta = await requisicaoAdmin(
        `${API_URL}/pedidos/${id}/recusar`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao recusar pedido.')
        return
      }
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function marcarEmPreparo(id) {
    try {
      const resposta = await requisicaoAdmin(
        `${API_URL}/pedidos/${id}/preparo`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao atualizar status.')
        return
      }
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  async function marcarPronto(id) {
    try {
      const resposta = await requisicaoAdmin(
        `${API_URL}/pedidos/${id}/pronto`,
        { method: 'PUT' }
      )
      const dados = await resposta.json()
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao atualizar status.')
        return
      }
      carregarPedidos(false)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  function imprimirPedido(pedido) {
    const janela = window.open('', '_blank', 'width=350,height=600')
    if (!janela) return

    const carne = textoCarne(pedido)
    const bebida = textoBebida(pedido)
    const marmitasDoPedido = listarMarmitas(pedido)
    const total = Number(pedido.valor_cobrar !== undefined && pedido.valor_cobrar !== null ? pedido.valor_cobrar : pedido.preco || 0)

    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Comanda #${pedido.id}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              html, body {
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 14px;
              font-weight: 900;
              -webkit-text-stroke: 0.35px #000;
              text-shadow: 0 0 0.5px #000;
              line-height: 1.25;
              color: #000;
              background: #fff;
              width: 80mm;
              max-width: 80mm;
              margin: 0 auto;
              padding: 2mm;
            }
            .cabecalho {
              text-align: center;
              margin-bottom: 2px;
            }
            .titulo {
              font-size: 16px;
              font-weight: 900;
            }
            .subtitulo {
              font-size: 14px;
              font-weight: 900;
            }
            .origem {
              font-size: 14px;
              font-weight: 900;
            }
            .divisor {
              width: 100%;
              height: 0;
              border-top: 1px dashed #000;
              margin: 3px 0;
              font-size: 0;
              line-height: 0;
            }
            .item-linha {
              margin: 1px 0;
              word-break: break-word;
              font-weight: 700;
              -webkit-text-stroke: 0.25px #000;
              text-shadow: 0 0 0.35px #000;
            }
            .total {
              font-weight: bold;
              font-size: 15px;
              text-align: center;
              font-weight: 900;
              margin-top: 3px;
            }
            .rodape {
              text-align: center;
              font-size: 11px;
              margin-top: 4px;
              padding-bottom: 2mm;
            }
          </style>
        </head>
        <body>
          <div class="cabecalho">
            <div class="titulo">EL SHADDAY RESTAURANTE</div>
            <div class="subtitulo">Pedido #${pedido.id} - ${formatarHora(pedido.criado_em)}</div>
            <div class="origem">${limparTexto(rotuloOrigem(pedido).toUpperCase())}</div>
          </div>

          <div class="divisor"></div>

          <div class="item-linha"><strong>Cliente:</strong> ${limparTexto(pedido.nome)}</div>
          <div class="item-linha"><strong>Telefone:</strong> ${formatarTelefone(pedido.telefone) || '-'}</div>
          ${ehClienteComum(pedido) && pedido.tipo_entrega === 'entrega' ? `<div class="item-linha"><strong>Endereco:</strong> ${limparTexto(pedido.endereco)}</div>` : ''}
          ${ehClienteComum(pedido) && pedido.tipo_entrega === 'retirada' ? `<div class="item-linha"><strong>Entrega:</strong> Retirada no local</div>` : ''}
          ${!ehClienteComum(pedido) ? `<div class="item-linha"><strong>Loja:</strong> ${limparTexto(pedido.loja)} - <strong>Codigo:</strong>${limparTexto(pedido.codigo_vivendas)}</div>` : ''}

          <div class="divisor"></div>

          <div class="item-linha"><strong>ITENS:</strong></div>
          ${ehClienteComum(pedido) ? marmitasDoPedido.map((marmita, indice) => `<div class="item-linha"><strong>Marmita ${indice + 1}</strong></div>${marmita.carne ? `<div class="item-linha">- Proteina: ${limparTexto(marmita.carne)}</div>` : ''}${marmita.guarnicao ? `<div class="item-linha">- Guarnicoes: ${limparTexto(marmita.guarnicao)}</div>` : ''}${marmita.observacao ? `<div class="item-linha">- Obs.: ${limparTexto(marmita.observacao)}</div>` : ''}${textoBebidaMarmita(marmita) ? `<div class="item-linha">- Bebida: ${limparTexto(textoBebidaMarmita(marmita))}</div>` : ''}`).join('') : `${carne ? `<div class="item-linha">- Proteina: ${limparTexto(carne)}</div>` : ''}${pedido.guarnicao ? `<div class="item-linha">- Guarnicoes: ${limparTexto(pedido.guarnicao)}</div>` : ''}${bebida ? `<div class="item-linha">- Bebida: ${limparTexto(bebida)}</div>` : ''}`}
          ${pedido.observacao ? `<div class="item-linha">- Obs: ${limparTexto(pedido.observacao)}</div>` : ''}

          <div class="divisor"></div>

          <div class="total">TOTAL A PAGAR: ${formatarReais(total)}</div>
          ${pedido.forma_pagamento ? `<div class="item-linha">Pagamento: ${limparTexto(rotuloPagamento(pedido.forma_pagamento))}</div>` : ''}

          <div class="divisor"></div>
          <div class="rodape">${new Date().toLocaleString('pt-BR')}</div>
        </body>
      </html>
    `)

    janela.document.close()
    janela.focus()
    setTimeout(() => {
      janela.print()
    }, 350)
  }

  // Pedidos que exigem ação da cozinha (aguardando ou em preparo) NUNCA ficam ocultos por data
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const status = normalizarStatus(pedido.status)
    if (dataLocalDoPedido(pedido.criado_em) !== dataSelecionada) return false
    if (filtro === 'aguardando') return status === 'aguardando'
    if (filtro === 'em_preparo') return status === 'em_preparo' || status === 'aprovado'
    return status === filtro
  })

  const contagem = {
    aguardando: pedidos.filter((p) => dataLocalDoPedido(p.criado_em) === dataSelecionada && normalizarStatus(p.status) === 'aguardando').length,
    em_preparo: pedidos.filter((p) => dataLocalDoPedido(p.criado_em) === dataSelecionada && ['em_preparo', 'aprovado'].includes(normalizarStatus(p.status))).length,
    pronto: pedidos.filter((p) => dataLocalDoPedido(p.criado_em) === dataSelecionada && normalizarStatus(p.status) === 'pronto').length,
    recusado: pedidos.filter((p) => dataLocalDoPedido(p.criado_em) === dataSelecionada && normalizarStatus(p.status) === 'recusado').length
  }

  return (
    <div className="pedidos-vivendas-page">

      {/* 1. HEADER SUPERIOR FIGMA */}
      <header className="admin-header">
        <div className="admin-header-esquerda">
          <h1>EL SHADDAY • PAINEL ADMIN</h1>
        </div>

        <div className="admin-header-direita">
          <div className={`admin-api-status admin-api-status-${apiStatus}`} role="status" aria-live="polite">
            <span className="admin-api-status-ponto" aria-hidden="true">●</span>
            <span>
              {apiStatus === 'online' && 'API conectada'}
              {apiStatus === 'offline' && 'API sem conexão — lista pode estar desatualizada'}
              {apiStatus === 'checking' && 'Verificando API...'}
            </span>
            {ultimaAtualizacao && (
              <time dateTime={ultimaAtualizacao.toISOString()}>
                Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </time>
            )}
          </div>

          <label className="admin-status-toggle">
            <span className="status-dot-verde">●</span>
            <span>Restaurante Aberto</span>
            <input type="checkbox" defaultChecked />
            <span className="toggle-switch"></span>
          </label>

          <button onClick={voltar} className="admin-sair-btn" title="Voltar ao Cardápio">
            <span>👤</span>
            <span>Admin</span>
          </button>
        </div>
      </header>

      {/* 2. ABAS CENTRAIS FIGMA (GERENCIAR CARDÁPIO | PEDIDOS RECEBIDOS) */}
      <div className="admin-abas-nav">
        <button className="admin-aba-btn" onClick={voltar}>
          Gerenciar Cardápio
        </button>

        <button className="admin-aba-btn admin-aba-ativa">
          Pedidos Recebidos ({pedidosFiltrados.length})
        </button>
      </div>

      <main className="pedidos-vivendas-conteudo">

        {/* 3. BARRA DE FILTROS FIGMA */}
        <div className="pedidos-filtro-barra">
          <div className="pedidos-dia-nav">
            <span className="pedidos-dia-label">
              <label className="pedidos-calendario-picker" title="Escolher data">
                <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false"><rect x="2.25" y="3.5" width="11.5" height="10" rx="1.25" /><path d="M5 2v3M11 2v3M2.5 6.25h11" /></svg>
                <input
                  type="date"
                  value={dataSelecionada}
                  onChange={(evento) => {
                    if (evento.target.value) setDataSelecionada(evento.target.value)
                  }}
                  aria-label="Escolher data dos pedidos"
                />
              </label>
              {formatarDataSelecionada(dataSelecionada)}
            </span>
            <button
              type="button"
              onClick={() => setDataSelecionada((d) => mudarDia(d, -1))}
              title="Dia anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setDataSelecionada((d) => mudarDia(d, 1))}
              title="Próximo dia"
            >
              →
            </button>
            {dataSelecionada !== hojeLocal() && (
              <button type="button" onClick={() => setDataSelecionada(hojeLocal())}>
                Hoje
              </button>
            )}
          </div>

          <div className="pedidos-abas">
            <button
              className={`aba-btn ${filtro === 'aguardando' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('aguardando')}
            >
              Aguardando ({contagem.aguardando})
            </button>

            <button
              className={`aba-btn ${filtro === 'em_preparo' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('em_preparo')}
            >
              Em Preparo ({contagem.em_preparo})
            </button>

            <button
              className={`aba-btn ${filtro === 'pronto' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('pronto')}
            >
              Prontos / Entrega ({contagem.pronto})
            </button>

            <button
              className={`aba-btn ${filtro === 'recusado' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltro('recusado')}
            >
              Recusados ({contagem.recusado})
            </button>
          </div>

          <button
            type="button"
            className="atualizar-btn"
            onClick={() => carregarPedidos(true)}
            title="Atualizar lista de pedidos"
          >
            <span>⟳</span>
            <span>Atualizar</span>
          </button>
        </div>

        {carregando && <p className="pedidos-vazio-card">Carregando pedidos...</p>}

        {!carregando && pedidosFiltrados.length === 0 && (
          <div className="pedido-vazio-card">
            <h3>Nenhum pedido encontrado</h3>
            <p>Não há pedidos com status &quot;{rotuloStatus(filtro)}&quot; para esta data.</p>
          </div>
        )}

        {/* 4. CARDS DE PEDIDO FIGMA */}
        <div className="pedidos-grid">
          {pedidosFiltrados.map((pedido) => {
            const carne = ehClienteComum(pedido) ? '' : textoCarne(pedido)
            const bebida = textoBebida(pedido)
            const status = normalizarStatus(pedido.status)
            const telLimpo = pedido.telefone ? pedido.telefone.replace(/\D/g, '') : ''

            return (
              <div className="pedido-card" key={pedido.id}>

                {/* TOPO: TÍTULO COM TEMPO DECORRIDO E BADGES */}
                <div className="pedido-card-cabecalho">
                  <div className="pedido-titulo-linha">
                    Pedido #{pedido.id} • {formatarHora(pedido.criado_em)} ({tempoDecorrido(pedido.criado_em)})
                  </div>

                  <div className="pedido-tags-linha">
                    <span className={`badge-status-${status}`}>
                      {rotuloStatus(status)}
                    </span>

                    <span className={`badge-origem-${ehClienteComum(pedido) ? 'comum' : 'vivendas'}`}>
                      {rotuloOrigem(pedido)}
                    </span>
                  </div>
                </div>

                {/* CAIXA CREME DO CLIENTE */}
                <div className="pedido-cliente-caixa">
                  <div className="cliente-topo-linha">
                    <span className="cliente-dados-linha">
                      Cliente: {pedido.nome} {telLimpo && `• ${formatarTelefone(pedido.telefone)}`}
                    </span>

                    {telLimpo && (
                      <a
                        href={`https://wa.me/55${telLimpo}?text=${encodeURIComponent(
                          `Olá, ${pedido.nome}! Estamos com seu pedido #${pedido.id} no Restaurante El Shadday.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp-figma"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="cliente-endereco-linha">
                    {ehClienteComum(pedido) ? (
                      <span>
                        Endereço: {pedido.tipo_entrega === 'entrega' ? pedido.endereco || 'Entrega' : 'Retirada no local'}
                      </span>
                    ) : (
                      <span>
                        Loja: {pedido.loja || '-'} • Código: {pedido.codigo_vivendas || pedido.codigo || '-'}
                      </span>
                    )}
                  </div>
                </div>

                {/* DETALHES DA MARMITA */}
                <div className="pedido-detalhes-bloco">
                  <span className="detalhes-titulo">DETALHES DA MARMITA</span>
                  {ehClienteComum(pedido) ? listarMarmitas(pedido).map((marmita, indice) => (
                    <div className="pedido-item-marmita" key={`pedido-${pedido.id}-marmita-${indice}`}>
                      <strong>Marmita {indice + 1}</strong>
                      {marmita.carne && <p>Proteína: {marmita.carne}</p>}
                      {marmita.guarnicao && <p>Guarnições: {marmita.guarnicao}</p>}
                      {marmita.observacao && <p><strong>Obs. da marmita:</strong> {marmita.observacao}</p>}
                      {textoBebidaMarmita(marmita) && <p>Bebida: {textoBebidaMarmita(marmita)}</p>}
                    </div>
                  )) : <>
                    {carne && <p>Proteína: {carne}</p>}
                    {pedido.guarnicao && <p>Guarnições: {pedido.guarnicao}</p>}
                    {bebida && <p>Bebida: {bebida}</p>}
                  </>}
                  {pedido.observacao && <p>Observação: {pedido.observacao}</p>}
                </div>

                {/* FAIXA AZUL DE COBRANÇA */}
                <div className="pedido-cobranca-faixa">
                  {textoFaixaCobranca(pedido)}
                </div>

                {/* BOTÕES DE AÇÃO NA BASE */}
                <div className="pedido-acoes-botoes">
                  {status === 'aguardando' && (
                    <>
                      <button
                        type="button"
                        className="btn-aprovar-figma"
                        onClick={() => aprovarPedido(pedido)}
                      >
                        ✓ Aprovar Pedido
                      </button>
                      <button
                        type="button"
                        className="btn-recusar-figma"
                        onClick={() => recusarPedido(pedido.id)}
                      >
                        ✕ Recusar
                      </button>
                    </>
                  )}

                  {status === 'aprovado' && (
                    <button
                      type="button"
                      className="btn-preparo-figma"
                      onClick={() => marcarEmPreparo(pedido.id)}
                    >
                      👨‍🍳 Iniciar Preparo →
                    </button>
                  )}

                  {status === 'em_preparo' && (
                    <button
                      type="button"
                      className="btn-pronto-figma"
                      onClick={() => marcarPronto(pedido.id)}
                    >
                      🚀 Pronto / Saiu para Entrega →
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-imprimir-figma"
                    onClick={() => imprimirPedido(pedido)}
                  >
                    🖨 Imprimir comanda
                  </button>
                </div>

              </div>
            )
          })}
        </div>

        {temMais && (
          <button
            type="button"
            className="btn-imprimir-figma"
            disabled={carregandoMais}
            onClick={() => {
              setCarregandoMais(true)
              carregarPedidos(false, proximoCursor, true)
            }}
          >
            {carregandoMais ? 'Carregando...' : 'Carregar mais pedidos'}
          </button>
        )}

      </main>

    </div>
  )
}

export default PedidosVivendas
