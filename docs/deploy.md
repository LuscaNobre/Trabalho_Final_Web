# Deploy na nuvem (bônus)

Arquitetura publicada: **MongoDB Atlas** (banco) → **Render** (API Express + Socket.IO) → **Vercel** (React SPA).
Todos têm plano gratuito. Faça na ordem abaixo, pois cada etapa usa a URL da anterior.

## 1. Banco: MongoDB Atlas

1. Crie um cluster gratuito (M0) em <https://cloud.mongodb.com>.
2. Em **Database Access**, crie um usuário com senha.
3. Em **Network Access**, libere `0.0.0.0/0` (o Render não tem IP fixo no plano gratuito).
4. Em **Connect > Drivers**, copie a string de conexão, troque `<password>` pela senha e inclua o nome do banco:
   `mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/street095?retryWrites=true&w=majority`

## 2. API: Render

1. Em <https://render.com>, entre com o GitHub e clique em **New > Blueprint**.
2. Selecione o repositório. O Render lê o `render.yaml` da raiz.
3. Preencha as variáveis pedidas:
   - `MONGODB_URI`: a string do Atlas.
   - `CLIENT_URL`: por enquanto `http://localhost:5173`. Ela será trocada no passo 4.
   - `JWT_SECRET` é gerado automaticamente.
4. Depois do deploy, teste `https://SEU-SERVICO.onrender.com/api/health`.
5. Cadastre os dados de demonstração **uma vez**. No seu PC, coloque a `MONGODB_URI` do Atlas no `server/.env` e rode `npm run seed:demo`.

> No plano gratuito, a API "dorme" depois de 15 min sem uso, e a primeira requisição demora cerca de 50 s. Abra o `/api/health` alguns minutos antes de apresentar.

## 3. Frontend: Vercel

1. Em <https://vercel.com>, faça **Add New > Project** e importe o repositório.
2. Configure **Root Directory = `client`**. O Vite é detectado sozinho.
3. Em **Environment Variables**, crie `VITE_API_URL = https://SEU-SERVICO.onrender.com/api`.
   Em produção não existe o proxy do Vite, então a URL precisa ser completa.
4. Faça o deploy. O `client/vercel.json` faz o React Router funcionar ao recarregar páginas como `/admin`.

## 4. Ligar os dois (CORS)

No Render, troque `CLIENT_URL` pela URL da Vercel, por exemplo `https://street095.vercel.app`, e salve. A API reinicia sozinha.
Para aceitar mais de uma origem, separe por vírgula: `https://street095.vercel.app,http://localhost:5173`.

## Checklist final

- [ ] `/api/health` responde `{"status":"ok"}`
- [ ] A página inicial lista os serviços, sem erro de CORS no console
- [ ] Login do admin funciona e o painel mostra "AGENDA EM TEMPO REAL"
- [ ] Um agendamento feito pelo celular aparece no painel aberto no PC
