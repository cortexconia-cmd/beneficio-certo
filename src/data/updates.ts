import type { Update } from "@/lib/types";

export const updates: Update[] = [
  {
    id: "u1",
    date: "2026-05-12",
    type: "calendario",
    title: "Novo calendário de pagamentos do Bolsa Família",
    summary: "Calendário de junho a dezembro de 2026 foi publicado pelo governo.",
    benefitSlug: "bolsa-familia",
  },
  {
    id: "u2",
    date: "2026-05-08",
    type: "nova-regra",
    title: "Mudanças nas regras do Auxílio Gás",
    summary: "Novas regras de elegibilidade entram em vigor a partir do próximo bimestre.",
    benefitSlug: "auxilio-gas",
  },
  {
    id: "u3",
    date: "2026-04-30",
    type: "aviso",
    title: "Atenção a golpes envolvendo benefícios sociais",
    summary: "Governo alerta sobre tentativas de fraude por mensagens falsas. Use apenas canais oficiais.",
  },
  {
    id: "u4",
    date: "2026-04-22",
    type: "novo-beneficio",
    title: "Programa Pé-de-Meia amplia número de beneficiários",
    summary: "Mais estudantes do ensino médio público passam a ter direito ao programa em 2026.",
    benefitSlug: "pe-de-meia",
  },
  {
    id: "u5",
    date: "2026-04-10",
    type: "calendario",
    title: "Cronograma do Salário-Maternidade atualizado",
    summary: "INSS publica novo cronograma de análise de pedidos.",
    benefitSlug: "salario-maternidade",
  },
];
