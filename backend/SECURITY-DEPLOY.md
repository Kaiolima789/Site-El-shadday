# Backend: seguranÃ§a e deploy

## VariÃ¡veis obrigatÃ³rias

Configure `DATABASE_URL` com a conexÃ£o PostgreSQL e `ADMIN_PASSWORD` com uma senha exclusiva de pelo menos 16 caracteres no serviÃ§o da API do Render. Nunca coloque essas credenciais em variÃ¡veis `VITE_` nem no repositÃ³rio.

Para Supabase, use a **Session pooler** se a conexÃ£o direta nÃ£o estiver disponÃ­vel no Render. Mantenha o requisito SSL (`sslmode=require`). O backend agora encerra a inicializaÃ§Ã£o com erro se `DATABASE_URL` estiver ausente; nÃ£o existe fallback para arquivo local.

Defina `ALLOWED_ORIGINS` como lista separada por vÃ­rgulas se a aplicaÃ§Ã£o usar outros domÃ­nios. CORS restringe navegadores; a autenticaÃ§Ã£o da API continua sendo o controle de acesso.

## Banco de dados e migraÃ§Ãµes

O backend usa PostgreSQL exclusivamente. Na inicializaÃ§Ã£o, ele cria as tabelas e acrescenta colunas ausentes de forma compatÃ­vel com o banco jÃ¡ existente. As alteraÃ§Ãµes sÃ£o aditivas e mantÃªm os pedidos existentes.

Configure `/health` como health check do Render. A rota verifica que a API consegue consultar o PostgreSQL sem expor dados.

## Backups e recuperaÃ§Ã£o

Configure e acompanhe os backups e a recuperaÃ§Ã£o do PostgreSQL no provedor do banco. FaÃ§a exportaÃ§Ãµes periÃ³dicas para outro destino e confirme que Ã© possÃ­vel restaurÃ¡-las. O disco local do Render nÃ£o Ã© usado como armazenamento de banco ou backup.

## Testes de integraÃ§Ã£o

Os testes da API usam PostgreSQL. Defina `TEST_DATABASE_URL` para um banco de teste dedicado; a suÃ­te cria e remove um schema isolado. NÃ£o use a URL do banco de produÃ§Ã£o.

## Pedidos e preÃ§os

A API calcula o preÃ§o da marmita pelo cardÃ¡pio ativo, o preÃ§o da bebida pela lista do servidor e a taxa pela regiÃ£o. Os valores enviados pelo navegador nÃ£o determinam o total cobrado.

## SessÃµes administrativas e limites

As sessÃµes administrativas ficam no PostgreSQL, sobrevivem a reinÃ­cios e podem ser compartilhadas entre instÃ¢ncias. Os limites por IP de login, consultas e criaÃ§Ã£o de pedidos continuam na memÃ³ria de cada processo; mantenha uma instÃ¢ncia ou configure rate limiting compartilhado antes de escalar.
