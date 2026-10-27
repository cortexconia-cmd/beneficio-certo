# Benefício Certo — homologação final (27/10/2026)

## Componentes implementados
- 38 benefícios e fotos originais, 8 categorias, acesso gratuito e premium com RLS.
- AdminMaster e Admin, painel com usuários, pedidos, conteúdo, preço, auditoria e Integrações.
- Admin/AdminMaster Premium por papel, sem pedido fictício. Clientes podem ser Gratuito ou Premium por concessão manual, sem afetar compra Asaas.
- LP pública: https://beneficio-compass-guide.lovable.app/acesso
- Domínio principal: https://beneficio-compass-guide.lovable.app
- Checkout e webhook Asaas, verificação SolvChat, coleta consentida de visitantes/UTM, Meta Pixel/CAPI condicionais ao consentimento.
- Preço da LP consulta o banco; última resposta da configuração: 2990 centavos (R$ 29,90).
- Teste não persistente no banco validou CHECKOUT_PAID, duplicata e PAYMENT_REFUNDED com revogação.
- Teste real da API de analytics confirmou gravação de visita e PageView; dados descartáveis removidos do banco após o teste.
- CI da main passou (build, TypeScript e testes), SSR publicado e páginas públicas acessíveis.

## Configurações de produção obrigatórias
Na área Supabase > Edge Functions > Secrets (nunca no GitHub):
- APP_URL=https://beneficio-compass-guide.lovable.app (fallback de código existe, mas configure no painel)
- SOLVCHAT_TOKEN: credencial oficial da API SolvChat.
- SOLVCHAT_SEND_URL: endpoint HTTPS específico do seu provedor SolvChat.
- SOLVCHAT_OTP_PEPPER: valor aleatório de 64 caracteres hexadecimais, mantido seguro.
- ASAAS_API_KEY: credencial do ambiente que será testado (recomenda-se Sandbox).
- ASAAS_WEBHOOK_TOKEN: mesmo valor informado no webhook Asaas.
- ASAAS_ENV=sandbox para testes; production somente após homologação.
- META_PIXEL_ID: Pixel dedicado ao Benefício Certo; não reutilizar Pixel de outro cliente.
- META_CAPI_TOKEN: token de Conversions API associado ao Pixel selecionado.

## Configurações externas
### Supabase Authentication
- Validar a confirmação de e-mail. O código atual permite confirmar por e-mail primeiro e validar WhatsApp depois.
- URL do site: https://beneficio-compass-guide.lovable.app
- Redirect URLs: /ativar-conta e /redefinir-senha do domínio publicado.
- Habilitar proteção contra senhas vazadas (aviso de segurança detectado pelo Supabase).
- Configurar SMTP para convites e redefinição; testar entrega real.

### SolvChat
- Confirmar formato oficial de requisição: endpoint, headers, corpo da mensagem e identificação do remetente.
- Em WhatsApp Cloud API, o OTP iniciado pela empresa normalmente exige template de autenticação aprovado pela Meta. O payload JSON genérico atual não está homologado.
- Testar código correto, incorreto, expirado, limite e reenvio.
- Nunca enviar tokens nem códigos OTP para chats de suporte.

### Asaas
- Webhook: https://kyphgokrlvojxsngoysf.supabase.co/functions/v1/asaas-webhook
- Token de autenticação do webhook = ASAAS_WEBHOOK_TOKEN.
- Marcar CHECKOUT_PAID, CHECKOUT_CANCELED, CHECKOUT_EXPIRED, PAYMENT_REFUNDED, PAYMENT_CHARGEBACK_REQUESTED e PAYMENT_CHARGEBACK_DISPUTE.
- Envio sequencial, monitorando a entrega e erros.
- Simular checkout Sandbox em Pix e cartão, receber webhook, liberar Premium, revogar acesso após estorno. Não ativar produção antes disso.
- Após compra, conferir perfil, orders, payments, access_grants, webhook_events.

### Meta Pixel e CAPI
- O código só inicializa Pixel após consentimento explícito de marketing.
- PageView, Lead e InitiateCheckout compartilham event_id para deduplicação Pixel/CAPI.
- Purchase é enviado somente pelo webhook financeiro e se o usuário mantém consentimento de marketing.
- A configuração é dinâmica pelas variáveis META_PIXEL_ID e META_CAPI_TOKEN (servidor). Não colocar token em VITE_.
- Validar os eventos em Meta Events Manager, com autorização de cookies/marketing.

## Checklist de aceitação antes de anúncios
1. Abrir /acesso no celular e desktop, conferir valores, CTA e conteúdo.
2. Abrir área gratuita e verificar que conteúdos premium ficam bloqueados.
3. Cadastrar uma conta nova com e-mail e WhatsApp válido; confirmar e-mail quando requerido.
4. Receber e validar OTP pela SolvChat; confirmar status em phone_verifications.
5. Abrir checkout Asaas Sandbox e concluir compra; confirmar pedido, pagamento e acesso premium.
6. Repetir webhook duplicado; confirmar que não gera novo acesso nem pagamento.
7. Testar cancelamento, expiração e estorno com perda adequada do acesso adquirido.
8. Entrar como AdminMaster; testar gestão de usuários e nível Gratuito/Premium; convidar Admin, ativar conta e revogar permissão.
9. Confirmar dashboards e atribuição UTM por campanha após consentimento.
10. Validar eventos Pixel/CAPI e bloqueio após recusa/retirada do consentimento.
11. Aprovar política de privacidade, termos comerciais, identificação legal do vendedor, informações de suporte, política de arrependimento/reembolso e revisão editorial dos benefícios de 2026.

## Não confundir
- Edge Function publicada != integração externa homologada.
- CI passando != compra real aprovada.
- Redirecionamento ao finalizar checkout != pagamento confirmado.
- Os dados de teste foram removidos; pedido/pagamento reais ainda não constam.
- Não registrar cobranças reais nem criar pessoas fictícias sem autorização.
