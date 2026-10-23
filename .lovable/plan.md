## Plano: Reestruturar página de detalhe do benefício no padrão do eBook

A página atual mostra seções genéricas (Erros comuns, Dicas, FAQ) que não batem com a estrutura do seu eBook. Vou alinhar 100% ao formato que você enviou.

### Nova estrutura da página de detalhe

Cada benefício passa a ter exatamente estas seções, na ordem e com os ícones/emojis pedidos:

1. 📌 **O que é** — parágrafo descritivo
2. 👨‍👩‍👧 **Quem pode receber** — lista
3. 💵 **Qual o valor em 2026** — lista (nova seção dedicada)
4. 📝 **Como pedir** — lista de passos
5. 📑 **Documentos necessários** — lista
6. ⚠️ **Importante** — lista de avisos/alertas

Removidas: "Erros comuns", "Dicas importantes" e "FAQ" (não fazem parte do padrão do eBook).

### Mudanças técnicas

**`src/lib/types.ts`** — atualizar `Benefit`:
- Adicionar `value2026: string[]`
- Adicionar `important: string[]`
- Trocar `howToApply: BenefitSectionItem[]` por `howToApply: string[]` (lista simples, como no eBook)
- Remover `commonErrors`, `tips`, `faq`

**`src/data/benefits.ts`**:
- Reescrever os 3 benefícios já preenchidos (Bolsa Família, Auxílio Gás, BPC) no novo formato com o texto exato do eBook
- Atualizar os 4 ainda em placeholder (Salário-Maternidade, Minha Casa Minha Vida, Seguro-Desemprego, Tarifa Social, Pé-de-Meia) com placeholders no novo formato pra não quebrar build — você reenvia o conteúdo real depois conforme manda os próximos capítulos

**`src/routes/beneficios.$slug.tsx`** — reescrever as seções:
- Cada seção com o emoji no título
- Listas com bullets simples (não checkboxes nem cards)
- Aviso "Importante" com destaque visual (borda/cor warning)

### O que NÃO muda

- Card do catálogo (`BenefitCard`), busca, favoritos, categorias, hero do detalhe — tudo intacto
- `src/data/categories.ts` — sem mexer
- Visual/cores/layout geral — mantido

Pronto pra implementar.
