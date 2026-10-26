import type { Category } from "@/lib/types";
export const categories: Category[] = [
  {
    "id": "transferencia-renda",
    "name": "Transferência de Renda",
    "description": "Benefícios diretos para famílias e pessoas com baixa renda",
    "icon": "Wallet",
    "gradient": "from-blue-500 to-indigo-600"
  },
  {
    "id": "educacao",
    "name": "Educação",
    "description": "Apoio ao estudo, isenções e permanência escolar",
    "icon": "GraduationCap",
    "gradient": "from-violet-500 to-purple-600"
  },
  {
    "id": "energia-agua-comunicacao",
    "name": "Energia, Água e Comunicação",
    "description": "Tarifas sociais de luz, água, TV e internet",
    "icon": "Zap",
    "gradient": "from-amber-500 to-orange-600"
  },
  {
    "id": "habitacao",
    "name": "Habitação e Reforma Agrária",
    "description": "Casa própria, terra e urbanização",
    "icon": "Home",
    "gradient": "from-emerald-500 to-teal-600"
  },
  {
    "id": "agricultura",
    "name": "Agricultura e Segurança Alimentar",
    "description": "Apoio à produção rural e combate à fome",
    "icon": "Sprout",
    "gradient": "from-lime-500 to-green-600"
  },
  {
    "id": "saude-inclusao",
    "name": "Saúde e Inclusão Social",
    "description": "Remédios, mobilidade e direitos sociais",
    "icon": "HeartPulse",
    "gradient": "from-red-500 to-pink-600"
  },
  {
    "id": "isencoes",
    "name": "Direitos Financeiros e Isenções",
    "description": "Isenções de taxas e descontos em serviços públicos",
    "icon": "BadgePercent",
    "gradient": "from-cyan-500 to-blue-600"
  },
  {
    "id": "complementares",
    "name": "Complementares",
    "description": "Direitos explicados no guia e acúmulo de benefícios",
    "icon": "BookOpen",
    "gradient": "from-slate-600 to-slate-800"
  }
];
export const getCategory = (id: string) => categories.find((c) => c.id === id);
