# Arquitetura do Estúdio Street 095

## Visão geral

```mermaid
flowchart LR
  Cliente[Navegador] --> SPA[React SPA<br/>Vite + React Router]
  SPA -->|HTTP / JSON| API[API REST Express]
  API -->|Socket.IO autenticado| SPA
  API --> Rotas[Routes + validação<br/>express-validator]
  Rotas --> Auth[Middleware JWT + perfis]
  Auth --> Controllers[Controllers<br/>regras de negócio]
  Controllers --> Models[Models Mongoose]
  Models --> Mongo[(MongoDB)]
```

O frontend é uma SPA em React que conversa com a API só por JSON. A API segue o **MVC adaptado para API**:

| Camada | Pasta | Responsabilidade |
|---|---|---|
| **Model** | `server/src/models` | Schemas Mongoose com tipos, limites e validação (`User`, `Service`, `Barber`, `Appointment`). |
| **View** | resposta JSON | Como o frontend é separado, a "view" do backend é o JSON que cada controller devolve. |
| **Controller** | `server/src/controllers` | Regras de negócio: disponibilidade, conflito de horários, exclusão com histórico e indicadores. |
| Rotas | `server/src/routes` | Verbo HTTP + caminho, validação de entrada e middlewares de acesso. |
| Middleware | `server/src/middleware` | `authenticate` (JWT), `authorize('admin')`, `validate` e tratamento central de erros. |

Em desenvolvimento, o Vite repassa `/api` e `/socket.io` para a porta 4000 (proxy em `client/vite.config.js`). Assim o navegador acessa tudo por `localhost:5173`, sem CORS.

## Entidades e relações

```mermaid
erDiagram
  USER ||--o{ APPOINTMENT : reserva
  BARBER ||--o{ APPOINTMENT : atende
  SERVICE ||--o{ APPOINTMENT : define
  USER {
    ObjectId _id PK
    string name
    string email UK
    string phone
    string password "hash bcrypt"
    string role "customer | admin"
    boolean active
  }
  SERVICE {
    ObjectId _id PK
    string name
    string category
    string description
    number durationMinutes
    number price
    boolean active
  }
  BARBER {
    ObjectId _id PK
    string name
    string specialty
    string bio
    string avatarUrl
    boolean active
  }
  APPOINTMENT {
    ObjectId _id PK
    ObjectId customer FK
    ObjectId barber FK
    ObjectId service FK
    date startsAt
    date endsAt
    string status "confirmed | completed | cancelled"
    number priceAtBooking
  }
```

`Appointment` liga um cliente, um barbeiro e um serviço. O valor cobrado fica salvo em `priceAtBooking`, para que mudar o preço no catálogo não altere reservas antigas.

**Exclusão:** ao excluir um serviço ou barbeiro, a API apaga o documento quando não há agendamentos ligados a ele. Se houver, faz exclusão lógica (`active: false`) para preservar o histórico. O item pode ser reativado no painel.

## Perfis de acesso

| Ação | Visitante | Cliente | Admin |
|---|:-:|:-:|:-:|
| Ver serviços, barbeiros e horários livres | ✅ | ✅ | ✅ |
| Criar conta e entrar | ✅ | — | — |
| Reservar horário | — | ✅ | ✅ |
| Ver e cancelar **os próprios** agendamentos | — | ✅ | — |
| Ver toda a agenda, concluir ou cancelar qualquer horário | — | — | ✅ |
| CRUD de serviços e barbeiros | — | — | ✅ |
| Dashboard com indicadores | — | — | ✅ |

O cadastro público sempre cria `role: customer`; a API ignora o campo `role` enviado pelo formulário. O admin é criado pelo script `npm run seed:demo`.

A proteção existe nas duas camadas:

- **Backend (a que vale):** `authenticate` responde **401** sem token ou com token inválido ou expirado; `authorize('admin')` responde **403** para clientes.
- **Frontend (experiência):** `ProtectedRoute` redireciona para o login, e um cliente que tenta abrir `/admin` volta para "Minha conta". Se a sessão expira, o site desloga sozinho e avisa.

## Fluxo de reserva

```mermaid
sequenceDiagram
  participant C as Cliente (React)
  participant A as API
  participant M as MongoDB
  participant P as Painel admin
  C->>A: GET /appointments/availability?serviceId&barberId&date
  A->>M: agendamentos ativos do barbeiro no dia
  A-->>C: blocos de 30 min livres (expediente, intervalo, duração)
  C->>A: POST /appointments (Bearer token)
  A->>A: valida dados, expediente e horário futuro
  A->>M: existe conflito com o mesmo barbeiro?
  alt horário ocupado
    A-->>C: 409 "Esse horário acabou de ser reservado"
  else livre
    A->>M: cria Appointment
    A-->>C: 201 agendamento criado
    A--)P: socket "appointment:created" (tempo real)
  end
```

A disponibilidade é **recalculada no servidor** a cada reserva. Mesmo que duas pessoas cliquem no mesmo horário, só a primeira consegue reservar.

## Segurança

- Senhas com **bcrypt** (custo 12) e nunca devolvidas no JSON (`select: false` + `toJSON`).
- **JWT** com validade configurável (`JWT_EXPIRES_IN`).
- Validação de entrada com **express-validator**, só os campos validados chegam ao banco (`matchedData`), e o Mongoose valida de novo.
- **Helmet**, limite de requisições no login e cadastro, e corpo JSON limitado a 20 KB.
- Erros internos não expõem stack trace ao cliente.
