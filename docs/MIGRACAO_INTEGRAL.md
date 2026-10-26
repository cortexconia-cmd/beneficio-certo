# Migração integral do projeto Seu Guia de Benefícios

Fonte: Lovable / Seu Guia de Benefícios (`4d5cd625-824a-4908-b54a-76c6cb0048c0`), commit `ef0da86d8af605ec89344bcdf79e9fcdd03509ea`.

## Preservação e integração

O GitHub utiliza agora as telas originais para início, catálogo, categorias, detalhe dos benefícios, favoritos, atualizações e ajuda; incluindo cabeçalho, rodapé, navegação móvel, cartões, CSS, fontes Figtree/Outfit e oito categorias. Os metadados públicos e os 38 benefícios foram replicados. Os textos completos foram importados para Supabase, **sem embutir instruções pagas no bundle público**.

Novas funcionalidades integradas:
- Supabase Auth (cadastro, login, perfil e recuperação);
- confirmação de WhatsApp via código customizado SolvChat, limite por período e verificação server-side;
- cards premium com blur/cadeado, popup de compra;
- 3 guias gratuitos (Bolsa Família, Auxílio Gás e BPC), 35 premium;
- conteúdos lidos da tabela `benefit_contents`, RLS por benefício ou catálogo;
- checkout hospedado Asaas, reconciliador de webhooks e registro de permissão após confirmação (ainda sem credenciais reais);
- rotas originais continuam públicas apenas com informações de listagem, sem expor o conteúdo protegido.

## Pendente para fidelidade visual de 100%

**As 38 imagens PNG originais não foram copiadas.** O conector do Lovable só devolve os dados binários por texto UTF-8 com perda de bytes, portanto não permite a transferência fiel dos arquivos. Para concluir, exporte um ZIP do projeto de origem contendo `src/assets/benefits/` ou disponibilize as imagens originais neste projeto. O código atual apresenta gradientes e ícones nos cartões como fallback, sem fingir que são as imagens da origem.

## Ativação e testes

- A branch contém o código; a `main` não foi mesclada.
- GitHub Actions faz build, TypeScript e testes.
- O checkout exige `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_ENV` e `APP_URL`, e implantação/testes de funções.
- O SolvChat exige `SOLVCHAT_SEND_URL`, `SOLVCHAT_TOKEN`, `SOLVCHAT_OTP_PEPPER` e confirmação do método HTTP, esquema de autorização, corpo JSON e modalidade de envio WhatsApp. SMS do Supabase não é utilizado.
- Não publicar até testar cadastro → WhatsApp → pagamento Sandbox → webhook → acesso premium → estorno.
- Revisar critérios e valores de programas com os canais oficiais: o conteúdo da fonte é de maio de 2026, não foi auditado juridicamente para outubro.
