# Cadastro com verificação de celular (SMS)

## Escopo da implementação

O formulário continua solicitando nome completo, WhatsApp com DDD, e-mail e senha. A verificação da conta acontece por um código enviado por **SMS**, e não por link de confirmação no e-mail.

O fluxo atual usa Supabase Auth:
1. signUp(email, password) cria a conta;
2. updateUser({phone}) solicita um código para o celular cadastrado;
3. verifyOtp({phone, token, type: 'phone_change'}) valida o número;
4. O acesso premium e a criação de checkout exigem telefone confirmado em Supabase Auth.

O e-mail continua sendo o identificador para login e o mecanismo de recuperação de senha. A confirmação de e-mail deve estar **desativada** para que o cadastro gere uma sessão e a verificação de celular comece na mesma jornada.

## Configurações manuais obrigatórias (Supabase Guia_beneficios)

- Authentication > Providers > Email: desativar **Confirm email**, mantendo Email ativo.
- Authentication > Providers > Phone: habilitar autenticação por telefone e configurar provedor SMS (ex.: Twilio, MessageBird ou Vonage), com as respectivas credenciais no painel seguro do Supabase.
- Authentication > Rate Limits: ajustar limites para prevenir abusos no envio de código; habilitar proteção contra bots / CAPTCHA quando apropriado.
- Testar no Sandbox com número de teste e código fixo antes de enviar SMS reais.

**Importante:** um código por SMS chega como mensagem SMS. Para mandar pelo WhatsApp, é necessária configuração apropriada, por exemplo um provedor Twilio/Twilio Verify compatível com WhatsApp.

## Variáveis de ambiente

- VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são públicas e podem chegar ao frontend.
- ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN, SUPABASE_SERVICE_ROLE_KEY e credenciais do provedor SMS são **secretas**.
- Nunca adicione credenciais secretas em VITE_* ou em arquivos commitados.
- O repositório contém .env no histórico e na main: não insira segredos ali. O .env foi removido da branch feature/acesso-asaas. Arquivos .env locais continuam ignorados pelo .gitignore.
- Para Edge Functions, configure segredos no Supabase Dashboard > Edge Functions > Secrets; não no React, GitHub ou .env.example.
- Se alguma credencial real já tiver sido commitada, revogue e substitua-a — adicionar .gitignore depois não retira a chave do histórico.

## Pendências antes de produção

- As alterações estão somente na branch feature/acesso-asaas.
- Não foi possível habilitar o provedor SMS automaticamente pelo GitHub; essa configuração é externa ao repositório.
- Não foram enviados SMS reais nem testados número/código de produção.
- O fluxo de recuperação de senha permanece por e-mail nesta etapa.
- A integração do Asaas ainda está em fase de desenvolvimento; testes de webhook e checkout Sandbox são obrigatórios.

