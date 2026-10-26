import type { Update } from "@/types/benefit";

export const updates: Update[] = [
  {
    id: "u1",
    data: "2026-01-15",
    tipo: "novidade",
    titulo: "Pé-de-Meia tem novo valor anual em 2026",
    resumo:
      "Estudantes do ensino médio público passam a receber depósito anual reajustado, totalizando até R$ 9.200 ao longo dos três anos.",
    beneficioSlug: "pe-de-meia",
  },
  {
    id: "u2",
    data: "2026-01-05",
    tipo: "calendario",
    titulo: "Calendário Bolsa Família 2026 divulgado",
    resumo:
      "Pagamentos seguem o último dígito do NIS. Confira o calendário completo no Caixa Tem.",
    beneficioSlug: "bolsa-familia",
  },
  {
    id: "u3",
    data: "2025-12-20",
    tipo: "mudanca",
    titulo: "Auxílio Gás continua bimestral em 2026",
    resumo:
      "Governo confirma manutenção do pagamento integral do botijão de 13kg a cada dois meses.",
    beneficioSlug: "auxilio-gas",
  },
  {
    id: "u4",
    data: "2025-12-10",
    tipo: "alerta",
    titulo: "Cuidado com golpes envolvendo benefícios",
    resumo:
      "Nunca pague taxa para liberar benefício. Todos os programas sociais são 100% gratuitos.",
  },
  {
    id: "u5",
    data: "2025-11-28",
    tipo: "mudanca",
    titulo: "Minha Casa Minha Vida amplia subsídio",
    resumo:
      "Famílias da Faixa 1 podem receber subsídio direto de até R$ 55 mil para a compra da casa própria.",
    beneficioSlug: "minha-casa-minha-vida",
  },
  {
    id: "u6",
    data: "2025-11-15",
    tipo: "novidade",
    titulo: "CadÚnico pode ser atualizado pelo app",
    resumo:
      "O aplicativo Meu CadÚnico permite consultar dados e iniciar atualizações sem ir presencialmente ao CRAS.",
  },
];