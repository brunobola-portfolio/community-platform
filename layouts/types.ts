/**
 * Shared types for layout outlet context.
 *
 * The MainLayout passes these callbacks through React Router's Outlet context
 * so page components can trigger global UI actions (open AI chat, open contact modal, logout).
 */

export interface LayoutOutletContext {
  /** Opens the AI chat modal; a non-empty query is auto-sent on open. */
  onAskAI: (query?: string) => void;
  openContact: (subject: string) => void;
  /** Opens the member login dialog without leaving the page. */
  openMemberLogin: () => void;
  handleLogout: () => void;
}
