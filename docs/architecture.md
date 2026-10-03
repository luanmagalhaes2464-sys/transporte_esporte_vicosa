# Arquitetura

O Portal Viçosa é um monólito modular em Next.js. A aplicação pública, as áreas autenticadas e as APIs vivem no mesmo projeto, mas as regras de negócio ficam em módulos separados.

## Camadas

- `src/app`: páginas e route handlers.
- `src/modules`: regras de domínio (território, vagas, frota, auditoria, relatórios).
- `src/providers`: integrações substituíveis de CEP, geocodificação, e-mail e storage.
- `src/security`: sessão e autorização.
- `prisma`: modelo relacional, migrations e seed.

## Princípios

1. IDs oficiais e relacionamentos são a fonte de verdade; texto digitado não cria bairro/localidade.
2. Geocodificação externa é auxiliar e não substitui a base territorial municipal.
3. Permissão é verificada no backend.
4. Regras concorrentes usam transações seriais no banco quando necessário.
5. Arquivos ficam fora do PostgreSQL; o banco guarda somente metadados e storage keys.
