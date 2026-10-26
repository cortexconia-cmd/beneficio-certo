# Verificação por WhatsApp — SolvChat

## Implementação técnica

- Cadastro com nome completo, WhatsApp com DDD, e-mail e senha.
- O Supabase Auth cria a conta; o trigger existente cria o perfil.
- A função `solvchat-otp` gera um código de 6 dígitos, armazena somente seu hash e solicita o envio ao SolvChat.
- A validade é de 5 minutos; há no máximo 5 tentativas, 60 segundos entre reenvios e 5 envios por 24 horas.
- A verificação e a leitura do status só são permitidas ao usuário autenticado.
- Alterações no WhatsApp do perfil invalidam a confirmação anterior.
- O checkout Asaas verifica o status do WhatsApp no banco antes de criar cobranças.

## Integração SolvChat (pendente do contrato real da API)

Os parâmetros do provedor devem ser configurados como secrets da Edge Function:
`SOLVCHAT_SEND_URL` — URL HTTPS completa e EXATA do endpoint de envio.
`SOLVCHAT_TOKEN` — credencial de autorização.
`SOLVCHAT_OTP_PEPPER` — segredo randômico com pelo menos 32 caracteres para o hash de OTP.

O adaptador usa POST com `Authorization: Bearer` e corpo JSON `{number,body}`. **Esse formato ainda não foi validado contra a instalação real do SolvChat** e deve ser ajustado quando tivermos a documentação ou exemplo de requisição.

Se o SolvChat utilizar a API oficial do WhatsApp, a primeira mensagem de autenticação geralmente exige um **template de autenticação aprovado pela Meta**, com variável do código. Nesse caso o adaptador deve usar a rota de templates, e não a rota de texto livre. NÃO ativar disparos reais antes dessa validação.

A função usa Supabase Auth JWT para identificação do usuário. Não deve aceitar telefone livre enviado pelo navegador — o destinatário vem da tabela de perfil.

## Configuração do Supabase

1. Em Authentication > Providers > Email, manter e-mail/senha ativo e desabilitar confirmação de e-mail, se a autenticação primária for exclusivamente por código de WhatsApp; avaliar os riscos de o e-mail não ser verificado.
2. Não é necessário ativar provedor SMS do Supabase. A verificação de telefone é customizada por backend e não popula `auth.users.phone_confirmed_at`.
3. Aplicar migration `20261026_solvchat_phone_verification.sql` (já aplicada).
4. Configurar os secrets no cofre de Edge Functions (não no `.env` versionado).
5. Implantar `solvchat-otp` com `verify_jwt=true`.
6. Realizar testes ponta a ponta com número autorizado e usar bloqueio antifraude/CAPTCHA na etapa de cadastro.

## Segurança e release

- Não colocar tokens SolvChat, Asaas ou a service_role no frontend, `VITE_*` ou em commits.
- O `.env` versionado anteriormente foi retirado da branch de desenvolvimento; qualquer segredo real exposto no histórico precisa ser rotacionado.
- Bloquear compras caso WhatsApp não esteja confirmado.
- Não permitir liberação do acesso pago apenas pela confirmação do WhatsApp: o Asaas ainda precisa confirmar o pagamento.
- Este módulo não foi testado com a API SolvChat real, nem está em produção.
