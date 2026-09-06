import { ConvexError } from "convex/values";
import type { ActionResult } from '../../types';

export function toActionResult(error: unknown): ActionResult {
  // ConvexError data survives production redaction; plain Error messages
  // become a generic "Server Error" on prod deployments
  if (error instanceof ConvexError) {
    return { success: false, error: typeof error.data === 'string' ? error.data : 'Erro no servidor.' };
  }
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  return { success: false, error: message };
}


// Plain-text excerpt derived from HTML content for posts saved without one.
export function excerptFromContent(content: string, max = 160): string {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
