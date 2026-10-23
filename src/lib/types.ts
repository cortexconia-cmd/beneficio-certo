export type CategoryId =
  | "familia"
  | "maternidade"
  | "moradia"
  | "educacao"
  | "trabalhador"
  | "idosos"
  | "saude"
  | "cadastro-social";

export interface Category {
  id: CategoryId;
  name: string;
  icon: string; // lucide icon name
  description: string;
}

export interface Benefit {
  slug: string;
  name: string;
  shortDescription: string;
  category: CategoryId;
  gradient: string; // tailwind gradient classes for cover
  icon: string; // lucide icon name
  whatIs: string;
  whoQualifies: string[];
  value2026: string[];
  howToApply: string[];
  documents: string[];
  important: string[];
}

export interface Update {
  id: string;
  date: string; // ISO
  type: "nova-regra" | "calendario" | "aviso" | "novo-beneficio";
  title: string;
  summary: string;
  benefitSlug?: string;
}

export interface User {
  name: string;
  email: string;
}
