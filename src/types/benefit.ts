export type CategorySlug =
  | "transferencia-renda"
  | "educacao"
  | "energia-agua-comunicacao"
  | "habitacao"
  | "agricultura"
  | "saude-inclusao"
  | "isencoes"
  | "complementares";

export interface Category {
  slug: CategorySlug;
  nome: string;
  descricao: string;
  icon: string;
  gradient: string;
}

export interface FAQItem {
  pergunta: string;
  resposta: string;
}

export interface PassoSolicitar {
  titulo: string;
  descricao: string;
}

export interface Benefit {
  id: string;
  slug: string;
  nome: string;
  categoria: CategorySlug;
  descricaoCurta: string;
  valor?: string;
  imagem?: string;
  oQueE: string;
  quemTemDireito: string[];
  documentos: string[];
  comoSolicitar: PassoSolicitar[];
  errosComuns: { titulo: string; descricao: string }[];
  dicas: string[];
  faq: FAQItem[];
  destaque?: boolean;
}

export interface Update {
  id: string;
  data: string;
  tipo: "novidade" | "mudanca" | "alerta" | "calendario";
  titulo: string;
  resumo: string;
  beneficioSlug?: string;
}