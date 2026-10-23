import type { Category } from "@/lib/types";

export const categories: Category[] = [
  { id: "familia", name: "Família", icon: "Users", description: "Apoio para famílias em situação de vulnerabilidade" },
  { id: "maternidade", name: "Maternidade", icon: "Baby", description: "Benefícios para gestantes e mães" },
  { id: "moradia", name: "Moradia", icon: "Home", description: "Programas habitacionais e auxílio moradia" },
  { id: "educacao", name: "Educação", icon: "GraduationCap", description: "Bolsas e incentivos educacionais" },
  { id: "trabalhador", name: "Trabalhador", icon: "Briefcase", description: "Direitos e auxílios trabalhistas" },
  { id: "idosos", name: "Idosos", icon: "HeartHandshake", description: "Benefícios para pessoas idosas" },
  { id: "saude", name: "Saúde", icon: "Stethoscope", description: "Programas e auxílios de saúde" },
  { id: "cadastro-social", name: "Cadastro Social", icon: "FileText", description: "Cadastros e documentos sociais" },
];

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}
