# Segurança e LGPD

O portal manipula dados de crianças e adolescentes, endereços e documentos. Os controles iniciais incluem:

- Argon2id para senha;
- sessão assinada em cookie HttpOnly/Secure/SameSite=Lax;
- RBAC no backend;
- validação Zod no servidor;
- rate limiting básico para autenticação;
- URLs temporárias para documentos privados;
- mascaramento de CPF em listagens administrativas comuns;
- auditoria com filtragem de senha, CPF, token e coordenadas;
- APIs públicas sem endereço, telefone, CPF, documento ou coordenadas residenciais;
- TLS em produção;
- ambientes e bancos separados;
- princípio do menor privilégio.

Antes da entrada em produção, recomenda-se MFA para perfis administrativos, rate limiting distribuído, política formal de retenção, testes de segurança e revisão do encarregado/LGPD do Município.
