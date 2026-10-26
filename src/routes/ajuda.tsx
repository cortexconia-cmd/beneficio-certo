import { createFileRoute } from "@tanstack/react-router";
import { Phone, Globe, MapPin, ShieldAlert, CheckCircle2 } from "lucide-react";
import { helpChannels } from "@/data/help";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Onde buscar ajuda — Projeto + Benefícios" },
      { name: "description", content: "Canais oficiais para tirar dúvidas sobre benefícios: CRAS, telefones, sites e prefeitura." },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 md:py-14 space-y-8 sm:space-y-12">
      <header>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Onde buscar ajuda oficial</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
          Sempre procure canais oficiais para evitar golpes e informações falsas. Todos os benefícios são gratuitos.
        </p>
      </header>

      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Locais e atendimento
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {helpChannels.locais.map((l) => (
            <div key={l.nome} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h3 className="font-semibold">{l.nome}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{l.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" /> Telefones gratuitos
        </h2>
        <div className="grid gap-3 grid-cols-3">
          {helpChannels.telefones.map((t) => (
            <div key={t.numero} className="rounded-2xl border border-border bg-card p-3 sm:p-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{t.numero}</div>
              <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{t.nome}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> Sites oficiais
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {helpChannels.sites.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-border bg-card p-4 min-h-14 hover:border-primary hover:shadow-soft transition flex items-center justify-between"
            >
              <span className="font-medium">{s.nome}</span>
              <span className="text-xs text-muted-foreground">.gov.br</span>
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Sempre consulte sites com domínio .gov.br</p>
      </section>

      <section className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 md:p-8">
        <div className="flex items-center gap-2 text-red-700 mb-4">
          <ShieldAlert className="h-6 w-6" />
          <h2 className="text-xl font-bold">Atenção contra golpes</h2>
        </div>
        <ul className="space-y-2">
          {helpChannels.golpes.map((g) => (
            <li key={g} className="flex items-start gap-2 text-red-900/90">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl gradient-primary p-6 md:p-8 text-white">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" /> Dica final
        </h2>
        <p className="text-white/90 mb-3">Mantenha sempre:</p>
        <ul className="space-y-1.5 text-white/95">
          <li>✓ CadÚnico atualizado</li>
          <li>✓ Documentos organizados</li>
          <li>✓ Número do NIS guardado</li>
        </ul>
        <p className="mt-4 text-sm text-white/80">Informação correta evita bloqueios e garante seus direitos.</p>
      </section>
    </div>
  );
}