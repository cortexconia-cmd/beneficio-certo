# Integração — Seu Guia de Benefícios → Beneficio Certo

Origem autoritativa de produto/conteúdo: Lovable "Seu Guia de Benefícios", projeto `4d5cd625-824a-4908-b54a-76c6cb0048c0`, commit `ef0da86d8af605ec89344bcdf79e9fcdd03509ea`, última edição registrada em 18/05/2026.

Destino: `cortexconia-cmd/beneficio-certo`, branch `feature/acesso-asaas`. **Nenhuma alteração é feita no projeto Lovable de origem.**

## Importação concluída

- 38 benefícios e 8 categorias importados no Supabase `Guia_beneficios`.
- Detalhes e orientações armazenados em `benefit_contents`: descrição, elegibilidade, documentos, valor, passo a passo, FAQ, dicas e erros comuns.
- O catálogo usa uma cópia de metadados públicos dos 38 benefícios para renderização rápida; detalhes são consultados via Supabase e protegidos por RLS.
- Apenas Bolsa Família, Auxílio Gás e BPC/LOAS têm leitura gratuita dos detalhes. Os outros 35 são restritos.
- Design harmonizado com o original através das famílias tipográficas Outfit/Figtree e de cores e gradientes semelhantes.
- Mantidos Supabase Auth, fluxo SolvChat OTP no WhatsApp, pedidos e bloqueios de pagamento Asaas.
- Corrigida a política `content_read_entitled` para conferir se um acesso individual corresponde ao benefício solicitado.

## Pendências antes de considerar cópia visual fiel

A origem possui aproximadamente 38 imagens em `src/assets/benefits/*.png`. A ferramenta disponível para ler arquivos do projeto retorna os bytes binários como texto com caracteres substituídos, então **essas imagens não foram transferidas** para o GitHub. Será necessário exportar os arquivos originais em formato binário ou conectar/exportar o repositório da origem para copiar as imagens sem perda. Enquanto isso, os cards usam fundos em gradiente e ícones.

Páginas de ajuda, rodapé e navegação móvel ainda precisam de refinamento para equivalência exata de layout. Não substituir autenticação e componentes financeiros por versões antigas sem integração.

## Observações de segurança e conteúdo

O catálogo de origem foi alterado pela última vez em maio de 2026; regras, prazos e valores devem passar por revisão editorial oficial para outubro de 2026 antes da comercialização.
Não publicar orientações privadas como se fossem programas oficiais; requerimentos e concessões dos benefícios seguem canais governamentais gratuitos.

## Estado operacional

- Dados e política RLS aplicados no Supabase; conferir com consultas de contagem.
- O backend de envio SolvChat depende do contrato exato da API e dos secrets; não houve envio real validado.
- O checkout Asaas e webhook exigem secrets, deploy e testes de sandbox; nenhuma cobrança real foi validada.
- Mudanças de frontend permanecem na branch de desenvolvimento até testes automatizados concluídos.
