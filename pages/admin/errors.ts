/**
 * Turns the raw failure text of a Convex mutation into something an
 * association secretary can act on. Everything the server may return is either
 * a stable token or an English validator dump, neither of which belongs in the
 * backoffice UI.
 */

const PATTERNS: Array<{ match: RegExp; message: string }> = [
  { match: /argumentvalidationerror|validator|invalid argument/i, message: 'Há campos por preencher ou com formato inválido. Reveja o formulário e tente novamente.' },
  { match: /not authenticated|unauthenticated|unauthorized|not authorized|admin/i, message: 'A sessão expirou ou não tem permissões. Volte a entrar no backoffice.' },
  { match: /rate limit|too many|429/i, message: 'Demasiadas operações seguidas. Aguarde alguns segundos e repita.' },
  { match: /not found|no document|inexistente/i, message: 'O registo já não existe — pode ter sido removido noutra sessão. Atualize a página.' },
  { match: /network|failed to fetch|offline|websocket/i, message: 'Sem ligação ao servidor. Verifique a internet — as alterações são guardadas assim que voltar.' },
  { match: /too long|max length|excede/i, message: 'Um dos campos é demasiado longo. Encurte o texto e volte a guardar.' },
];

const MAX_LENGTH = 160;

export function describeActionError(error?: string, fallback = 'Não foi possível concluir a operação.'): string {
  if (!error) return fallback;
  const known = PATTERNS.find(p => p.match.test(error));
  if (known) return known.message;
  const clean = error.replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  return clean.length > MAX_LENGTH ? `${clean.slice(0, MAX_LENGTH)}…` : clean;
}
