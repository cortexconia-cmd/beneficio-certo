# Integração Asaas

Código de checkout e webhook implementado na branch feature/acesso-asaas.

Configure os secrets ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN (32+ caracteres), ASAAS_ENV=sandbox e APP_URL=https://SEU-DOMINIO no Supabase.

Deploy das Edge Functions asaas-create-checkout (verificação JWT habilitada) e asaas-webhook (JWT desabilitado; valida header asaas-access-token).

Configure no painel do Asaas o webhook de checkout para https://kyphgokrlvojxsngoysf.supabase.co/functions/v1/asaas-webhook, com os eventos CHECKOUT_PAID, CHECKOUT_CANCELED e CHECKOUT_EXPIRED.

Teste o fluxo ponta a ponta no Sandbox antes de produção. Os cinco benefícios premium ainda têm texto placeholder no catálogo; não iniciar vendas antes de completar e revisar o conteúdo.
