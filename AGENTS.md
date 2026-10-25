# El Shadday - AI Agent Customization

## Project Overview

**El Shadday** é um sistema de pedidos de refeições em marmitas com suporte a entrega em diferentes vivendas (condomínios/áreas residenciais).

- **Frontend:** React 19 + Vite
- **Backend:** Express + PostgreSQL (`pg`)
- **Linguagem Principal:** JavaScript/JSX
- **Linter:** Oxlint com regras React

## Architecture

### Frontend Structure (`/src`)
- **App.jsx**: Roteador central de páginas
- **Marmitas.jsx**: Página de listagem e seleção de pratos do cardápio
- **AdminCardapio.jsx**: Painel administrativo para criar/editar cardápios
- **DestinoPedido.jsx**: Seleção de destino (cliente comum ou vivenda)
- **Vivendas.jsx**: Gerenciamento e seleção de vivendas
- **PedidosVivendas.jsx** (em `/assets`): Aprovação de pedidos pelas vivendas

### Backend Structure (`/backend`)
- **server.js**: Servidor Express (porta 3000)
- **database.js**: Pool PostgreSQL, inicialização de tabelas e migrações aditivas

### Database Schema
```
cardapios
  ├── id (PK)
  ├── data (UNIQUE)
  ├── preco
  ├── ativo (default: 1)
  └── criado_em

opcoes_cardapio
  ├── id (PK)
  ├── cardapio_id (FK → cardapios)
  ├── categoria
  ├── nome
  └── disponivel (default: 1)
```

## Development Setup

### Frontend
```bash
npm install
npm run dev      # Vite dev server com HMR
npm run build    # Build para produção
npm run lint     # Oxlint
npm run preview  # Preview build
```

### Backend
```bash
cd backend
npm install
node server.js   # Inicia servidor Express
```

## Key Conventions

### Component Patterns
- Componentes React como funções (JSX)
- Props: `voltar`, `setPagina`, `pedido`, `enviarPedido` para controle de fluxo
- State local com `useState`; dados remotos com `useEffect` + fetch
- Cada componente tem arquivo CSS correspondente

### API Endpoints
- `POST /cardapios`: Criar novo cardápio com opções
- Banco: PostgreSQL obrigatório via `DATABASE_URL`
- Consultas parametrizadas obrigatórias para segurança

### Linting Rules
- `react/rules-of-hooks`: error
- `react/only-export-components`: warn (allow const export)

## Common Tasks

### Adicionar novo cardápio
1. Frontend: `AdminCardapio.jsx` - formulário
2. Backend: `server.js` - endpoint `/cardapios`
3. Database: validação em `database.js`

### Adicionar nova página
1. Criar componente em `src/Pagina.jsx` + `src/Pagina.css`
2. Importar em `App.jsx`
3. Adicionar rota (setPagina)

### Modificar banco de dados
1. Editar schema/migrações PostgreSQL em `backend/database.js`
2. Usar consultas parametrizadas
3. Sempre usar FK constraints

## Development Pitfalls

- **CORS**: Backend já tem `cors()` configurado
- **Porta Backend**: Express roda em `3000` (verificar em `DestinoPedido.jsx`)
- **Estado Compartilhado**: Props de página são passadas via `App.jsx` - sem global state
- **Banco**: PostgreSQL; `DATABASE_URL` é obrigatória em desenvolvimento e produção

## Tools & Dependencies

| Package | Versão | Uso |
|---------|--------|-----|
| react | ^19.2.8 | UI components |
| react-dom | ^19.2.8 | DOM rendering |
| vite | ^8.2.0 | Build/dev server |
| express | ^5.2.1 | API backend |
| pg | ^8.23.1 | Driver PostgreSQL |
| oxlint | ^1.75.0 | Code linting |
| cors | ^2.8.6 | CORS middleware |

## Links Úteis

- [README.md](README.md) - Documentação base do template Vite+React
- [vite.config.js](vite.config.js) - Configuração Vite
- [.oxlintrc.json](.oxlintrc.json) - Regras de linting
