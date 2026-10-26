# AdminMaster — gestão de administradores

O AdminMaster inicial é a conta existente cortexcon.ia@gmail.com, identificada e promovida no Supabase em 2026-10-26. Ela possui os papéis `admin` e `admin_master`. Não existe concessão automática por nome ou e-mail nas regras de autorização.

## Regras
- Admin: painel de relatórios, usuários, pedidos, aquisição, benefícios, preço e auditoria.
- AdminMaster: todos os recursos de Admin e acesso a Equipe administrativa para convidar, promover, rebaixar e remover acesso administrativo.
- Somente AdminMaster pode alterar cargos; o servidor verifica usuário autenticado e e-mail confirmado no Supabase.
- Não é permitido alterar o próprio cargo ou remover o último AdminMaster.
- Alterações de cargos e envios de convites são auditados. Revogar o cargo não exclui a conta comum, os dados ou os pedidos.
- Convite por email via Supabase Auth Admin API; o convidado usa /ativar-conta para criar a própria senha.
- Se a conta já existe, use a busca por usuários e promova-a; não use convite de conta duplicada.
- Nunca defina senha de terceiros, compartilhe credenciais, nem exponha a chave service_role no navegador.

## Configuração para convites
1. Configure `APP_URL` nos secrets das Edge Functions apontando para o endereço público HTTPS do sistema.
2. Adicione `https://SEU-DOMINIO/ativar-conta` na lista de Redirect URLs do Supabase Auth.
3. Configure entrega de email no Supabase Auth (SMTP se necessário).
4. Teste convite, aceite, definição de senha, acesso Admin e AdminMaster, revogação e auditoria.
5. A interface e o código de API estão na branch `feature/admin-dashboard`; publicá-los no site requer mesclagem na `main`.

A Edge Function `admin-dashboard` valida as permissões exclusivamente no backend. Os dados administrativos não são abertos pelas políticas de leitura dos usuários comuns.
