# Código de teste temporário (verificação por WhatsApp)

Existe só para testar enquanto o envio pelo SolvChat estiver fora do ar. **Não deve ficar ligado em produção.**

## Como funciona
A função `solvchat-otp` aceita um código fixo no lugar do código enviado por WhatsApp, **somente se o secret `OTP_TEST_CODE` existir** no Supabase. Sem o secret, o comportamento é o normal. O mesmo código vale no login e na confirmação antes da compra.

## Ligar
No Supabase, em Edge Functions → Secrets, crie:

| Secret | Valor | Obrigatório |
|---|---|---|
| `OTP_TEST_CODE` | `555555` (6 dígitos) | sim |
| `OTP_TEST_EMAILS` | e-mails das contas de teste, separados por vírgula | recomendado |

Com `OTP_TEST_EMAILS` preenchido, o código só funciona para essas contas. Sem ele, funciona para qualquer conta.

## Desligar (volta ao normal na hora)
Apague o secret `OTP_TEST_CODE` no Supabase. Não precisa publicar a função de novo.
Cada uso fica registrado no log da função como `OTP test code accepted for user`.

## Remover o código de vez
Depois dos testes, reverta o PR que adicionou este arquivo (botão "Revert" no GitHub). A versão anterior também está guardada na tag `backup/antes-codigo-teste`.
