export interface GuideSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  checks?: string[];
  callout?: { title?: string; text: string; variant?: "info" | "warning" | "success" };
}

export interface GuideChapter {
  slug: string;
  number: number;
  title: string;
  summary: string;
  readTime: string;
  icon: string; // lucide
  sections: GuideSection[];
}

export const guideChapters: GuideChapter[] = [
  {
    slug: "introducao",
    number: 1,
    title: "Introdução",
    summary: "Por que tantos brasileiros deixam de receber benefícios — e como este guia pode ajudar.",
    readTime: "3 min",
    icon: "BookOpen",
    sections: [
      {
        paragraphs: [
          "Você sabia que milhões de brasileiros deixam de receber benefícios do governo simplesmente por falta de informação?",
          "Todos os anos, programas são criados, atualizados ou reformulados. Em 2026, diversos benefícios continuam ativos, mas muitas pessoas ainda não sabem se têm direito, como solicitar corretamente, se podem acumular mais de um benefício ou como evitar bloqueios e cancelamentos.",
          "A verdade é que o maior obstáculo não é a burocracia — é a falta de orientação clara.",
          "Este guia foi criado com um único objetivo: ajudar você e sua família a conhecerem seus direitos e acessarem os benefícios de forma segura, simples e prática.",
        ],
      },
      {
        heading: "O que você vai encontrar aqui",
        checks: [
          "Explicação clara sobre o Cadastro Único",
          "Passo a passo para se cadastrar",
          "Lista organizada dos principais benefícios ativos em 2026",
          "Orientações para acumular programas quando permitido",
          "Alertas importantes para não perder o que já conquistou",
        ],
      },
      {
        callout: {
          title: "Informação é poder",
          text: "Este material não substitui o atendimento oficial, mas serve como um mapa prático para que você saiba exatamente por onde começar. Quando você conhece seus direitos, aumenta suas chances de garantir mais segurança, dignidade e oportunidades para sua família.",
          variant: "info",
        },
      },
    ],
  },
  {
    slug: "cadastro-unico",
    number: 2,
    title: "Cadastro Único (CadÚnico)",
    summary: "A porta de entrada para mais de 40 programas sociais do governo federal.",
    readTime: "6 min",
    icon: "FileText",
    sections: [
      {
        heading: "2.1 O que é o Cadastro Único",
        paragraphs: [
          "O Cadastro Único para Programas Sociais do Governo Federal, conhecido como CadÚnico, é o principal sistema utilizado pelo governo para identificar famílias de baixa renda no Brasil.",
          "Ele funciona como uma base de dados nacional que reúne informações sobre composição da família, renda mensal, escolaridade, condições de moradia e situação de trabalho.",
          "É por meio do CadÚnico que o governo analisa quem pode participar de programas sociais como Bolsa Família, Auxílio Gás, Tarifa Social de Energia e muitos outros.",
        ],
        callout: {
          text: "Sem o CadÚnico, a maioria dos benefícios não pode ser solicitada.",
          variant: "warning",
        },
      },
      {
        heading: "2.2 Quem pode se cadastrar",
        paragraphs: ["Em 2026, podem se cadastrar no CadÚnico:"],
        bullets: [
          "Famílias com renda mensal de até meio salário mínimo por pessoa",
          "Famílias com renda total de até três salários mínimos",
          "Pessoas que vivem sozinhas e se enquadram nesses critérios",
          "Famílias em situação de rua",
        ],
        callout: {
          text: "Mesmo que a renda varie, é importante procurar o CRAS para verificar a possibilidade de inscrição.",
          variant: "info",
        },
      },
      {
        heading: "2.3 Por que o CadÚnico é tão importante",
        paragraphs: ["O Cadastro Único é a porta de entrada para mais de 40 programas sociais. Ele permite que o governo:"],
        bullets: [
          "Identifique quem realmente precisa de apoio",
          "Evite fraudes",
          "Direcione recursos para famílias em situação de vulnerabilidade",
        ],
        callout: {
          text: "Estar cadastrado facilita o acesso automático a alguns benefícios, sem precisar fazer novo pedido.",
          variant: "success",
        },
      },
      {
        heading: "2.4 Atualização obrigatória",
        paragraphs: ["O CadÚnico deve ser atualizado a cada 2 anos, mesmo que nada tenha mudado, e sempre que houver mudança na família, como:"],
        bullets: [
          "Alteração de renda",
          "Mudança de endereço",
          "Nascimento ou falecimento",
          "Mudança de escola das crianças",
        ],
        callout: {
          title: "Atenção",
          text: "Se o cadastro estiver desatualizado, os benefícios podem ser bloqueados, suspensos ou cancelados.",
          variant: "warning",
        },
      },
      {
        heading: "2.5 Atenção importante",
        checks: [
          "A inscrição no CadÚnico é gratuita",
          "Ninguém pode cobrar para fazer o cadastro",
          "Sempre procure o CRAS ou a prefeitura da sua cidade",
        ],
      },
    ],
  },
  {
    slug: "onde-buscar-ajuda",
    number: 13,
    title: "Onde Buscar Ajuda Oficial",
    summary: "Canais seguros e confiáveis para tirar dúvidas e solicitar seus benefícios.",
    readTime: "5 min",
    icon: "LifeBuoy",
    sections: [
      {
        paragraphs: [
          "Mesmo com todas as informações deste guia, é fundamental saber onde buscar ajuda segura e confiável. Sempre procure canais oficiais para evitar golpes e informações falsas.",
        ],
      },
      {
        heading: "13.1 CRAS — Centro de Referência de Assistência Social",
        paragraphs: ["O CRAS é a principal porta de entrada para os programas sociais. Lá você pode:"],
        bullets: ["Fazer ou atualizar o CadÚnico", "Solicitar orientação sobre benefícios", "Receber acompanhamento social"],
        callout: { text: "Procure o CRAS mais próximo da sua residência.", variant: "info" },
      },
      {
        heading: "13.2 Prefeitura Municipal",
        paragraphs: ["A Secretaria de Assistência Social da sua cidade pode:"],
        bullets: ["Informar sobre programas locais", "Orientar sobre benefícios federais", "Auxiliar na documentação"],
      },
      {
        heading: "13.3 Aplicativo Meu CadÚnico",
        paragraphs: ["Disponível para Android e iOS. Permite:"],
        bullets: ["Consultar dados da família", "Ver situação do cadastro", "Acompanhar benefícios"],
      },
      {
        heading: "13.4 Sites Oficiais",
        paragraphs: ["Sempre consulte sites com domínio .gov.br. Principais canais:"],
        bullets: ["gov.br", "caixa.gov.br", "meu.inss.gov.br", "mec.gov.br"],
      },
      {
        heading: "13.5 Telefones Oficiais",
        bullets: [
          "121 — Ministério do Desenvolvimento Social",
          "111 — Caixa Econômica Federal",
          "135 — INSS",
        ],
        callout: { text: "Esses canais são gratuitos.", variant: "success" },
      },
      {
        heading: "13.6 Atenção contra golpes",
        paragraphs: ["Nunca:"],
        bullets: [
          "Pague para liberar benefício",
          "Informe dados pessoais por redes sociais",
          "Confie em promessas de 'facilitadores'",
        ],
        callout: { text: "Todos os benefícios sociais são gratuitos.", variant: "warning" },
      },
      {
        heading: "Dica final",
        paragraphs: ["Mantenha sempre:"],
        checks: ["CadÚnico atualizado", "Documentos organizados", "Número do NIS guardado"],
        callout: { text: "Informação correta evita bloqueios e garante seus direitos.", variant: "info" },
      },
    ],
  },
  {
    slug: "conclusao",
    number: 14,
    title: "Conclusão",
    summary: "Um resumo do que aprendemos e os próximos passos para garantir seus direitos.",
    readTime: "3 min",
    icon: "Flag",
    sections: [
      {
        paragraphs: [
          "Chegamos ao final deste guia.",
          "Ao longo deste material, você conheceu os principais benefícios do governo ativos em 2026, entendeu como funciona o Cadastro Único, aprendeu como se cadastrar corretamente e descobriu que, em muitos casos, é possível acumular mais de um benefício.",
          "A informação é o primeiro passo para transformar a realidade de uma família. Muitas pessoas deixam de receber apoio simplesmente porque não sabem que têm direito.",
        ],
      },
      {
        heading: "Agora você tem um mapa claro para",
        checks: [
          "Identificar quais benefícios se encaixam na sua situação",
          "Saber onde procurar ajuda",
          "Evitar bloqueios e cancelamentos",
          "Não cair em golpes",
        ],
      },
      {
        heading: "Lembre-se sempre",
        checks: [
          "O cadastro é gratuito",
          "O CadÚnico precisa estar atualizado",
          "As informações devem ser verdadeiras",
          "Procure apenas canais oficiais",
        ],
      },
      {
        callout: {
          title: "Boa sorte na sua jornada",
          text: "Esperamos que este guia tenha sido útil para você e sua família. Compartilhe este material com quem também pode precisar.",
          variant: "success",
        },
      },
    ],
  },
];

export function getChapter(slug: string) {
  return guideChapters.find((c) => c.slug === slug);
}
