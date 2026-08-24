import { internalQuery } from "../_generated/server";

// Sanitize interpolated values to prevent prompt injection via DB content
function sanitize(value: string, maxLen: number): string {
  return value.slice(0, maxLen).replace(/\n/g, " ");
}

/**
 * Gathers portal content for RAG injection into the AI system prompt.
 * Returns a formatted Portuguese text block with current portal data.
 */
export const gatherContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];

    // 1. Upcoming published events (top 10)
    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .take(200);
    const upcomingEvents = allEvents
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);

    // 2. Published posts (top 5, ordered by date descending)
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_date")
      .order("desc")
      .take(200);
    const publishedPosts = allPosts.filter((p) => p.published).slice(0, 5);

    // 3. Members (bounded to prevent unbounded collect)
    const members = await ctx.db.query("members").order("asc").take(50);

    // 4. Action Areas
    const actionAreas = await ctx.db
      .query("actionAreas")
      .withIndex("by_order")
      .order("asc")
      .collect();

    // 5. Stats
    const stats = await ctx.db
      .query("stats")
      .withIndex("by_order")
      .order("asc")
      .collect();

    // 6. Settings
    const settings = await ctx.db.query("settings").first();

    // 7. Categories (bounded)
    const categories = await ctx.db.query("categories").take(100);

    // --- Build formatted text block ---
    const lines: string[] = [];

    lines.push("## Informacao Atual do Portal ARCVA");
    lines.push("");

    // Settings / About
    lines.push("### Sobre a ARCVA");
    const siteName = sanitize(settings?.siteName ?? "ARCVA", 100);
    const email = sanitize(settings?.contactEmail ?? "geral@arcva.pt", 100);
    const mandate = sanitize(settings?.currentMandate ?? "2024-2026", 20);
    lines.push(`Nome: ${siteName} | Email: ${email} | Mandato: ${mandate}`);
    lines.push("");

    // Action Areas
    if (actionAreas.length > 0) {
      lines.push("### Areas de Acao");
      for (const area of actionAreas) {
        const title = sanitize(area.title, 100);
        const subtitle = sanitize(area.subtitle, 100);
        const featureList = area.features.map((f) => sanitize(f, 80)).join(", ");
        lines.push(`- ${title}: ${subtitle} - ${featureList}`);
      }
      lines.push("");
    }

    // Upcoming Events
    if (upcomingEvents.length > 0) {
      lines.push("### Proximos Eventos");
      for (const ev of upcomingEvents) {
        const title = sanitize(ev.title, 100);
        const location = sanitize(ev.location, 100);
        let line = `- [${ev.date}] ${title} (${location})`;
        if (ev.isTournament && ev.tournamentType) {
          line += ` [Torneio de ${sanitize(ev.tournamentType, 50)}]`;
        }
        if (ev.registrationOpen) {
          line += " [Inscricoes Abertas]";
        }
        lines.push(line);
      }
      lines.push("");
    } else {
      lines.push("### Proximos Eventos");
      lines.push("- Nenhum evento agendado de momento.");
      lines.push("");
    }

    // Latest Posts
    if (publishedPosts.length > 0) {
      lines.push("### Ultimas Noticias");
      for (const post of publishedPosts) {
        const title = sanitize(post.title, 100);
        const excerpt = sanitize(
          post.excerpt.length > 200
            ? post.excerpt.slice(0, 200) + "..."
            : post.excerpt,
          200
        );
        lines.push(`- [${post.date}] ${title} | ${excerpt}`);
      }
      lines.push("");
    }

    // Team Members grouped by group
    if (members.length > 0) {
      lines.push("### Equipa Diretiva");
      const groups: Record<string, string[]> = {};
      for (const m of members) {
        const group = sanitize(m.group ?? "Outros", 50);
        if (!groups[group]) groups[group] = [];
        groups[group].push(`${sanitize(m.name, 80)} (${sanitize(m.role, 50)})`);
      }
      for (const [group, memberList] of Object.entries(groups)) {
        lines.push(`${group}: ${memberList.join(", ")}`);
      }
      lines.push("");
    }

    // Stats
    if (stats.length > 0) {
      lines.push("### Estatisticas");
      for (const s of stats) {
        lines.push(`- ${sanitize(s.label, 80)}: ${sanitize(s.value, 50)}`);
      }
      lines.push("");
    }

    // Categories
    if (categories.length > 0) {
      lines.push("### Categorias");
      const eventCats = categories.filter((c) => c.type === "event").map((c) => sanitize(c.name, 50));
      const blogCats = categories.filter((c) => c.type === "blog").map((c) => sanitize(c.name, 50));
      if (eventCats.length > 0) {
        lines.push(`Eventos: ${eventCats.join(", ")}`);
      }
      if (blogCats.length > 0) {
        lines.push(`Blog: ${blogCats.join(", ")}`);
      }
      // Categories without an event/blog type (e.g. shared/general) would otherwise
      // never reach the model. List them so the chatbot knows the full taxonomy.
      if (eventCats.length === 0 && blogCats.length === 0) {
        const allCats = categories.map((c) => sanitize(c.name, 50));
        lines.push(`Categorias: ${allCats.join(", ")}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  },
});
