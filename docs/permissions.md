# RBAC

Perfis iniciais: `CITIZEN`, `SCHOOL`, `EDUCATION`, `TRANSPORT`, `DRIVER`, `SPORTS`, `ADMIN`.

Permissões são códigos granulares, por exemplo:

- `territory.manage`
- `school_transport.request.review`
- `extracurricular.trip.assign_vehicle`
- `fleet.trip.execute`
- `sports.activity.manage`
- `reports.read`

A interface pode esconder ações, mas a autorização efetiva ocorre sempre nos route handlers e serviços de backend.
