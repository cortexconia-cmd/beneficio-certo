import type { Category } from "@/types/benefit";

export const categories: Category[] = [
  {
    slug: "transferencia-renda",
    nome: "Transferência de Renda",
    descricao: "Benefícios diretos para famílias e pessoas com baixa renda",
    icon: "Wallet",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    slug: "educacao",
    nome: "Educação",
    descricao: "Apoio ao estudo, isenções e permanência escolar",
    icon: "GraduationCap",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    slug: "energia-agua-comunicacao",
    nome: "Energia, Água e Comunicação",
    descricao: "Tarifas sociais de luz, água, TV e internet",
    icon: "Zap",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    slug: "habitacao",
    nome: "Habitação e Reforma Agrária",
    descricao: "Casa própria, terra e urbanização",
    icon: "Home",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    slug: "agricultura",
    nome: "Agricultura e Segurança Alimentar",
    descricao: "Apoio à produção rural e combate à fome",
    icon: "Sprout",
    gradient: "from-lime-500 to-green-600",
  },
  {
    slug: "saude-inclusao",
    nome: "Saúde e Inclusão Social",
    descricao: "Remédios, mobilidade e direitos sociais",
    icon: "HeartPulse",
    gradient: "from-red-500 to-pink-600",
  },
  {
    slug: "isencoes",
    nome: "Direitos Financeiros e Isenções",
    descricao: "Isenções de taxas e descontos em serviços públicos",
    icon: "BadgePercent",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    slug: "complementares",
    nome: "Complementares",
    descricao: "Direitos explicados no guia e acúmulo de benefícios",
    icon: "BookOpen",
    gradient: "from-slate-600 to-slate-800",
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}