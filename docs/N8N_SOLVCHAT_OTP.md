# SolvChat via n8n — implantação segura
A função `solvchat-otp` mantém a geração, a guarda protegida e a validação dos seis dígitos no Supabase. O n8n só transporta a mensagem para a SolvChat. **Nunca use os seis últimos dígitos do telefone como OTP**, pois são previsíveis e não comprovam posse do chip/WhatsApp.

## Configurar no n8n
1. **Webhook**: Method POST, Path `beneficio-certo-solv`, Authentication **Header auth** usando o header `x-bc-secret`, Respond **Using Respond to Webhook Node**. Ative o workflow e copie a *Production URL*.
2. **Edit Fields** (manual mapping, Include Other Input Fields desativado):
   - `telefone` (string): `{{ $json.body.telefone }}`
   - `mensagem` (string): `{{ $json.body.mensagem }}`
3. **Nó já existente de envio SolvChat**: destinatário `{{ $json.telefone }}`, texto/template `{{ $json.mensagem }}`. Mantenha a credencial de envio funcional. Se o provedor exigir template de autenticação aprovado, use o template.
4. **Respond to Webhook** após o nó de envio, apenas no caminho de sucesso: Respond With JSON, Response Body `{"sent":true}`, Response Code 200. Caso o nó de mensagem retorne erro, o workflow não deve chegar nessa resposta; o erro precisa gerar HTTP 5xx, não um sucesso fictício. Validar no n8n que o nó considera sucesso somente quando o provedor aceita a mensagem.

## Supabase → Edge Functions → Secrets
- `N8N_SOLV_WEBHOOK_URL`: URL de produção HTTPS, sem parâmetros de query ou segredo na URL.
- `N8N_SOLV_WEBHOOK_TOKEN`: segredo aleatório de alta entropia (mínimo 32 caracteres), exatamente igual ao valor do header auth do workflow.
- `SOLVCHAT_OTP_PEPPER`: manter existente; não mudar (hash do OTP).
Ao configurar **URL + token juntos**, a função muda automaticamente para o n8n. Enquanto não houver essa dupla, permanece o envio direto legado para evitar interrupção.

O servidor envia JSON: `{"user_id":"uuid","telefone":"55DDDNUMERO","mensagem":"Benefício Certo: seu código ...","tipo":"verificacao","expira_em_minutos":5}`. O código não precisa de mapeamento separado: já está no campo `mensagem`.

## Condições de segurança e operação
- O endpoint n8n nunca deve ser invocado diretamente pelo navegador.
- O servidor só permite solicitação de envio para o telefone do perfil do usuário autenticado, após reserva do código com limites de envio e tentativas.
- O retorno esperado do n8n é **exatamente** HTTP 2xx com corpo JSON `{"sent":true}`. Sem isso a função informa falha e não afirma que o código foi enviado.
- Evite salvar execuções completas do workflow com o OTP em texto e restrinja acesso aos logs; o código expira em cinco minutos.
- Teste com um telefone controlado antes de ativar para todos. Mensagem aceita pela SolvChat não garante entrega ao aparelho.
- Um token no header x-bc-secret NÃO substitui o `SOLVCHAT_OTP_PEPPER`.
- As funções de criação de checkout e recebimento de pagamento Asaas **não foram migradas neste commit**.
