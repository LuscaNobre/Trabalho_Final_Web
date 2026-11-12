# Estúdio Street 095

Sistema Full Stack de agendamento para uma barbearia em Boa Vista, Roraima. O projeto aplica arquitetura MVC na API e React como SPA, com persistência MongoDB, autenticação e autorização por perfil.

## Funcionalidades

- Catálogo público com 11 serviços, categorias, duração e preço.
- Perfil público de três barbeiros de demonstração.
- Consulta de horários sem login; o cliente cria uma conta ou entra para confirmar a reserva.
- Cadastro e login com senha armazenada em hash bcrypt.
- Cliente consulta e cancela apenas os próprios agendamentos.
- Administrador faz o CRUD completo do catálogo e da equipe, consulta a agenda, conclui ou cancela atendimentos e vê indicadores.
- API valida os dados recebidos e confere disponibilidade e conflitos de horário no servidor.
- Painel administrativo recebe novos agendamentos e atualizações de status em tempo real por WebSocket autenticado.
- Interface responsiva para desktop e celular, com mensagens de erro, sucesso e carregamento.

## Tecnologias

- **Frontend:** React 18, Vite, React Router, CSS responsivo.
- **Backend:** Node.js, Express, arquitetura MVC, express-validator, Helmet, rate limiting, JWT e Socket.IO.
- **Testes:** Jest e Supertest.
- **Banco de dados:** MongoDB com Mongoose.

## Requisitos locais

- Node.js 20 ou mais recente e npm.
- MongoDB local ou uma URI de cluster MongoDB.

## Como iniciar

1. Na pasta raiz, instale as dependências:

   ```bash
   npm install
   ```

2. Copie `server/.env.example` para `server/.env` e ajuste `MONGODB_URI` e `JWT_SECRET`. O segredo JWT deve ser uma sequência aleatória longa. Não envie arquivos `.env` ao GitHub.

3. Se necessário, configure `CLIENT_URL` para a origem do frontend. No modo local, mantenha `http://localhost:5173`.

4. Cadastre os dados de demonstração (11 serviços, três barbeiros e a conta administradora):

   ```bash
   npm run seed:demo
   ```

   Os preços e durações iniciais são provisórios e podem ser editados no painel administrativo.

5. Inicie a API e o React em terminais separados ou juntos:

   ```bash
   npm run dev
   ```

   Frontend: `http://localhost:5173`  
   API: `http://localhost:4000/api`  
   Verificação da API: `http://localhost:4000/api/health`

   Em desenvolvimento, o Vite repassa `/api` e `/socket.io` para a porta 4000 (proxy em `client/vite.config.js`), então o navegador acessa tudo por `localhost:5173`, sem problema de CORS.

## Testes automatizados (bônus)

```bash
npm test
```

São 3 arquivos em `server/tests` e não precisam de MongoDB, porque o acesso ao banco é simulado com `jest.spyOn`:

- `schedule.test.js`: regras da agenda (expediente, intervalo, dias de funcionamento e fuso).
- `api.test.js`: rotas críticas com Supertest. Cobre validação (400), login incorreto (401), rota sem token (401), cliente tentando acessar área de admin (403), cadastro que ignora o campo `role`, agendamento em horário ocupado (409) e agendamento criado (201).
- `user.test.js`: hash bcrypt e garantia de que a senha nunca sai no JSON.

## Acesso de demonstração

Por padrão, `server/.env.example` cria:

- **E-mail:** `admin@street095.com`
- **Senha:** `Street095@2026`

Altere `ADMIN_EMAIL` e `ADMIN_PASSWORD` em `server/.env` antes de executar `npm run seed:demo` se quiser outras credenciais. A senha é gravada com bcrypt. Para apresentar em sala, crie também uma conta de cliente pela tela de cadastro e mostre a diferença entre os dois perfis.

## Agenda

O horário inicial da barbearia é de terça a sábado, das 9h às 19h, com intervalo das 12h às 13h, no fuso `America/Boa_Vista` (UTC−4). O cliente escolhe serviço, barbeiro, data e horário. A API calcula a duração final e impede sobreposição com outro agendamento ativo do mesmo barbeiro. Os horários são blocos de 30 minutos; o serviço pode ocupar mais de um bloco.

## Estrutura

```text
server/
  src/
    config/          conexão MongoDB e Socket.IO autenticado
    controllers/     regras e respostas da API
    middleware/      autenticação, autorização, validação e erros
    models/          User, Service, Barber e Appointment
    routes/          rotas REST
    scripts/         dados e acesso de demonstração
    utils/           agenda, erros e handlers
client/
  src/
    components/      navegação, cartões e componentes compartilhados
    context/         sessão do usuário
    lib/             acesso à API e formatação
    pages/           início, login, agenda, cliente e administração
    styles.css       identidade visual e responsividade
  public/images/     fotos do estúdio e dos barbeiros
server/tests/        testes Jest + Supertest
docs/
  architecture.md    MVC, relações de dados, permissões e fluxo de reserva
  deploy.md          passo a passo do deploy (Atlas + Render + Vercel)
render.yaml          blueprint do deploy da API no Render
iniciar-site.bat     atalho para Windows: instala, cadastra a demo e inicia
```

## Rotas principais da API

| Método | Rota | Acesso | Uso |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Criar conta de cliente |
| `POST` | `/api/auth/login` | Público | Entrar e receber token |
| `GET` | `/api/auth/me` | Autenticado | Consultar o próprio perfil |
| `GET` | `/api/auth/users` | Admin | Listar clientes |
| `GET` | `/api/services` | Público | Listar serviços ativos |
| `GET` | `/api/services/manage` | Admin | Listar todos os serviços |
| `POST`, `PUT`, `DELETE` | `/api/services` | Admin | Criar, editar e excluir serviço |
| `GET` | `/api/barbers` | Público | Listar barbeiros ativos |
| `POST`, `PUT`, `DELETE` | `/api/barbers` | Admin | Criar, editar e excluir barbeiro |
| `GET` | `/api/appointments/availability` | Público | Consultar horários livres |
| `GET`, `POST` | `/api/appointments` | Cliente/Admin | Consultar ou criar agendamento |
| `PATCH` | `/api/appointments/:id/status` | Dono/Admin | Cancelar ou atualizar status permitido |
| `GET` | `/api/appointments/dashboard` | Admin | Indicadores da agenda |

**Exclusão:** o `DELETE` apaga o serviço ou barbeiro do banco. Quando já existem agendamentos ligados a ele, o item é apenas desativado, para não quebrar o histórico. Ele pode ser reativado no painel.

Nas rotas protegidas, envie `Authorization: Bearer <token>`. Cadastros públicos sempre criam perfil `customer`; o perfil `admin` é provisionado pela configuração local, nunca pelo formulário de cadastro.

O modelo de dados, os perfis de acesso e as regras de negócio estão detalhados em [`docs/architecture.md`](docs/architecture.md).

## Demonstração em sala (3–5 min)

1. Apresente a página inicial, a identidade urbana e as categorias de serviços.
2. Abra a agenda e mostre a lista de horários livres sem entrar.
3. Crie uma conta cliente e faça um agendamento.
4. Mostre o agendamento em “Minha conta” e tente cancelar.
5. Demonstre uma senha incorreta e a mensagem de erro; explique que as senhas são armazenadas com bcrypt.
6. Entre como administrador e mostre os indicadores, a agenda e o gerenciamento de serviços/barbeiros.
7. Explique que a API recalcula disponibilidade e valida os dados antes de persistir no MongoDB.

## Decisões de segurança

- `bcryptjs` faz hash de senhas com fator de custo 12.
- Middleware JWT autentica o usuário; middleware por perfil protege operações administrativas.
- A API não aceita o campo `role` vindo do formulário de cadastro.
- Validação de entrada existe nas rotas e também nos schemas Mongoose.
- Helmet, limite de requisições no login/cadastro e limite de tamanho do JSON estão configurados.
- Erros internos não expõem stack traces ao cliente.

## Valores do catálogo

Os valores de demonstração foram mantidos provisórios para o projeto acadêmico. Para referência inicial em Boa Vista, foram consultados anúncios públicos de barbearia local no Booksy e um agregador local de preços; há variação relevante entre estabelecimentos e serviços. Ajuste os valores à realidade do estúdio antes de qualquer uso comercial: [Marval Barbearia no Booksy](https://booksy.com/pt-br/131326_marval-barbearia_barbearias_831458_boa-vista) · [referência local de preços](https://loqal.com.br/servicos/barbeiro/rr/boa-vista).

## Deploy (bônus)

O repositório já vem pronto para publicar:

- `render.yaml`: blueprint da API no Render (pasta `server`, `npm start`, health check em `/api/health`).
- `client/vercel.json`: faz as rotas do React funcionarem ao recarregar a página na Vercel.

O passo a passo completo (MongoDB Atlas → Render → Vercel → CORS) está em [`docs/deploy.md`](docs/deploy.md). Variáveis necessárias: `MONGODB_URI`, `JWT_SECRET` e `CLIENT_URL` na API, e `VITE_API_URL` no frontend. Troque as credenciais de demonstração antes de publicar.
