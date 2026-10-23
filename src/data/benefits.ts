import type { Benefit } from "@/lib/types";

const placeholderText =
  "Conteúdo oficial em breve. As informações desta página são uma estrutura demonstrativa baseada no padrão do eBook e serão atualizadas com os dados oficiais.";

const placeholderList = ["Conteúdo em breve — será atualizado conforme o eBook oficial."];

export const benefits: Benefit[] = [
  {
    slug: "bolsa-familia",
    name: "Bolsa Família",
    shortDescription: "Programa de transferência de renda para famílias em situação de pobreza e extrema pobreza.",
    category: "familia",
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    icon: "Users",
    whatIs:
      "Programa de transferência de renda destinado a famílias em situação de pobreza e extrema pobreza.",
    whoQualifies: [
      "Famílias com renda mensal de até R$ 218 por pessoa",
      "Inscritas e com cadastro atualizado no CadÚnico",
    ],
    value2026: [
      "Valor mínimo de R$ 600 por família",
      "R$ 150 por criança de 0 a 6 anos",
      "R$ 50 por criança ou adolescente de 7 a 18 anos",
      "R$ 50 para gestantes",
    ],
    howToApply: [
      "Estar inscrito no CadÚnico",
      "Aguardar análise automática do governo",
      "Acompanhar pelo aplicativo Bolsa Família ou Caixa Tem",
    ],
    documents: ["Documentos exigidos no CadÚnico", "CPF de todos da família"],
    important: [
      "É obrigatório manter crianças na escola",
      "Vacinação deve estar em dia",
      "O benefício pode ser bloqueado se o cadastro não estiver atualizado",
    ],
  },
  {
    slug: "auxilio-gas",
    name: "Auxílio Gás",
    shortDescription: "Ajuda financeira para a compra do botijão de gás de cozinha, paga a cada 2 meses.",
    category: "familia",
    gradient: "from-orange-500 via-red-500 to-pink-600",
    icon: "Flame",
    whatIs: "Ajuda financeira para compra do botijão de gás de cozinha.",
    whoQualifies: [
      "Famílias inscritas no CadÚnico",
      "Renda de até meio salário mínimo por pessoa",
      "Beneficiários do BPC",
    ],
    value2026: [
      "Valor equivalente a 50% do preço médio do botijão de 13kg",
      "Pago a cada 2 meses",
    ],
    howToApply: ["Seleção automática pelo governo", "Pagamento via Caixa Tem"],
    documents: ["Cadastro atualizado no CadÚnico"],
    important: [
      "Não é necessário fazer pedido separado",
      "Depende da disponibilidade orçamentária",
    ],
  },
  {
    slug: "bpc-loas",
    name: "BPC — Benefício de Prestação Continuada",
    shortDescription: "Um salário mínimo mensal para idosos a partir de 65 anos e pessoas com deficiência de baixa renda.",
    category: "idosos",
    gradient: "from-teal-500 via-emerald-600 to-green-700",
    icon: "HeartHandshake",
    whatIs: "Benefício mensal pago a idosos e pessoas com deficiência de baixa renda.",
    whoQualifies: [
      "Idosos com 65 anos ou mais",
      "Pessoas com deficiência",
      "Renda familiar de até 1/4 do salário mínimo por pessoa",
    ],
    value2026: ["1 salário mínimo por mês"],
    howToApply: [
      "Estar inscrito no CadÚnico",
      "Solicitar pelo aplicativo Meu INSS, site ou telefone 135",
    ],
    documents: ["Documento com foto", "CPF", "Laudo médico (para deficiência)"],
    important: [
      "Não é aposentadoria",
      "Não paga 13º salário",
      "Não pode ser acumulado com aposentadoria",
    ],
  },
  {
    slug: "salario-maternidade",
    name: "Salário-Maternidade",
    shortDescription: "Benefício pago à segurada do INSS por ocasião do parto, adoção ou aborto não criminoso.",
    category: "maternidade",
    gradient: "from-pink-400 via-rose-400 to-fuchsia-500",
    icon: "Baby",
    whatIs: placeholderText,
    whoQualifies: placeholderList,
    value2026: placeholderList,
    howToApply: placeholderList,
    documents: placeholderList,
    important: placeholderList,
  },
  {
    slug: "minha-casa-minha-vida",
    name: "Minha Casa Minha Vida",
    shortDescription: "Programa habitacional para aquisição da casa própria com subsídio do governo.",
    category: "moradia",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    icon: "Home",
    whatIs: placeholderText,
    whoQualifies: placeholderList,
    value2026: placeholderList,
    howToApply: placeholderList,
    documents: placeholderList,
    important: placeholderList,
  },
  {
    slug: "seguro-desemprego",
    name: "Seguro-Desemprego",
    shortDescription: "Assistência financeira temporária ao trabalhador dispensado sem justa causa.",
    category: "trabalhador",
    gradient: "from-sky-500 via-blue-600 to-indigo-700",
    icon: "Briefcase",
    whatIs: placeholderText,
    whoQualifies: placeholderList,
    value2026: placeholderList,
    howToApply: placeholderList,
    documents: placeholderList,
    important: placeholderList,
  },
  {
    slug: "tarifa-social-energia",
    name: "Tarifa Social de Energia",
    shortDescription: "Desconto na conta de luz para famílias de baixa renda.",
    category: "familia",
    gradient: "from-yellow-400 via-amber-500 to-orange-600",
    icon: "Zap",
    whatIs: placeholderText,
    whoQualifies: placeholderList,
    value2026: placeholderList,
    howToApply: placeholderList,
    documents: placeholderList,
    important: placeholderList,
  },
  {
    slug: "pe-de-meia",
    name: "Pé-de-Meia",
    shortDescription: "Poupança para estudantes de ensino médio da rede pública.",
    category: "educacao",
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    icon: "GraduationCap",
    whatIs: placeholderText,
    whoQualifies: placeholderList,
    value2026: placeholderList,
    howToApply: placeholderList,
    documents: placeholderList,
    important: placeholderList,
  },
];

export function getBenefit(slug: string) {
  return benefits.find((b) => b.slug === slug);
}
