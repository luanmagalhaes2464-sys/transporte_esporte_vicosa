# Deploy — GitHub → Render → Neon

## Produção

- `main`: produção.
- `develop`: integração/homologação.
- Render: web service Node vinculado ao repositório.
- Neon: PostgreSQL separado por ambiente/branch.

## Variáveis

Configure no Render os valores reais de `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL` e os providers escolhidos. Nunca grave segredos no GitHub.

## Build e migrations

O `render.yaml` usa plano `free` e executa `prisma migrate deploy` imediatamente antes de iniciar o Next.js. A aplicação tem uma única instância nessa configuração inicial. Em plano Render que ofereça **Pre-Deploy Command**, mova `npm run db:deploy` para `preDeployCommand` e deixe `startCommand: npm run start`; migrations não devem fazer parte do `next build`.

## Primeiro deploy

1. Crie/conecte o projeto Neon e obtenha as URLs de conexão adequadas.
2. Configure as variáveis no Render.
3. Vincule o serviço ao repositório GitHub e branch `main`.
4. O build executa `npm install && npm run build`.
5. O start executa migrations pendentes e inicia a aplicação.
6. O Render verifica `/api/health`.
7. Rode o seed somente no ambiente correto e somente com dados fictícios.

## Homologação

Recomenda-se serviço Render separado ligado à `develop` e branch/banco Neon separado. Nunca use dados reais de cidadãos em homologação.
