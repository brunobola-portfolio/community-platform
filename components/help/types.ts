/**
 * "Não encontrou?" action. On /ajuda it opens the contact form; in the backoffice
 * it is a mailto when the association has a contact email, or plain text otherwise.
 */
export interface HelpContact {
    title: string;
    /** May carry {siteName}; shown alone when there is no action. */
    text: string;
    actionLabel: string;
    href?: string;
    onClick?: () => void;
}

export interface HelpHero {
    eyebrow: string;
    title: string;
    text: string;
    placeholder: string;
    /** Words offered when a search finds nothing. */
    suggestions: string[];
}
