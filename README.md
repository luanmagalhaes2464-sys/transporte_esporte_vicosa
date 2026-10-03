# Portal Viçosa — Educação, Transporte e Esporte

Portal municipal unificado para transporte escolar, transporte extraclasse, esporte e lazer da Prefeitura Municipal de Viçosa/MG.

## Stack

Next.js + React + TypeScript, Tailwind CSS, PostgreSQL/Neon, Prisma, Zod, React Hook Form, Leaflet/OpenStreetMap e providers desacoplados para CEP, geocodificação, e-mail e armazenamento privado.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Qualidade

```bash
npm run typecheck
npm test
npm run build
```

O GitHub Actions executa essas verificações em `main`, `develop` e pull requests.

## Produção

O `render.yaml` prepara um Web Service Node com health check em `GET /api/health`. No plano inicial gratuito, `prisma migrate deploy` é executado imediatamente antes do start. Em plano Render com Pre-Deploy Command, mova a migration para essa etapa, conforme `docs/deployment.md`.

## Segurança

Nunca commitar `.env`, connection strings, tokens, chaves, documentos ou dados reais de cidadãos. Permissões críticas são verificadas no backend; documentos usam storage privado e URLs temporárias.

## Identidade visual

O brasão derivado do arquivo institucional fornecido está em `public/brand/brasao-vicosa.png`, sem redesenho. A home espera a fotografia panorâmica oficial em `public/brand/vicosa-panorama.jpg`. Enquanto esse arquivo não estiver disponível, existe somente fallback neutro — não é substituído por uma imagem fictícia.

Consulte `docs/` e `IMPLEMENTATION_STATUS.md` para arquitetura, permissões, deploy, segurança, território e pendências externas.
