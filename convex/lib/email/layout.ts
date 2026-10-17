/**
 * The shell every email shares. Mail clients ignore stylesheets and flexbox, so
 * this is the one place in the codebase where layout is tables and inline
 * styles: Gmail, Outlook and Apple Mail render it the same way.
 */

export interface EmailSite {
    siteName: string;
    /** Absolute origin of the public site, e.g. https://arcva.pt; links are dropped without it. */
    siteUrl?: string;
    brandColor: string;
    logoUrl?: string;
    address?: string;
    contactEmail?: string;
    phone?: string;
}

export interface EmailDetail {
    label: string;
    value: string;
}

export interface EmailBody {
    /** Hidden line most inboxes show next to the subject. */
    preheader: string;
    eyebrow?: string;
    title: string;
    /** Paragraphs of plain text; escaped here. */
    paragraphs: string[];
    details?: EmailDetail[];
    /** A quoted block, e.g. the message being answered. */
    quote?: { label: string; text: string };
    cta?: { label: string; url: string };
    secondaryLink?: { label: string; url: string };
    /** Why this person got this email, in the footer. */
    reason: string;
}

const FALLBACK_BRAND = "#4f46e5";

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Only http(s) links reach an email; anything else (javascript:, data:) is dropped. */
export function safeUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
    } catch {
        return undefined;
    }
}

function brand(color: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : FALLBACK_BRAND;
}

/** White or near-black text, whichever reads better on the brand colour (WCAG relative luminance). */
export function textOn(hex: string): string {
    const channel = (i: number) => {
        const c = parseInt(brand(hex).slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
    return luminance > 0.4 ? "#111111" : "#ffffff";
}

const paragraph = (text: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;

function detailsTable(details: EmailDetail[]): string {
    const rows = details.map((d) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #ececec;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;width:34%;vertical-align:top;">${escapeHtml(d.label)}</td>
<td style="padding:10px 0;border-bottom:1px solid #ececec;font-size:15px;color:#18181b;vertical-align:top;">${escapeHtml(d.value).replace(/\n/g, "<br>")}</td>
</tr>`).join("");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-top:1px solid #ececec;">${rows}</table>`;
}

function button(label: string, url: string, color: string): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr>
<td style="border-radius:12px;background:${color};">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:600;color:${textOn(color)};text-decoration:none;border-radius:12px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function header(site: EmailSite, color: string): string {
    const logo = safeUrl(site.logoUrl);
    const name = `<span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#18181b;">${escapeHtml(site.siteName)}</span>`;
    const mark = logo
        ? `<img src="${escapeHtml(logo)}" width="40" height="40" alt="" style="display:block;border:0;border-radius:10px;">`
        : `<div style="width:40px;height:40px;border-radius:10px;background:${color};"></div>`;
    return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px;vertical-align:middle;">${mark}</td>
<td style="vertical-align:middle;">${name}</td>
</tr></table>`;
}

function footer(site: EmailSite, reason: string): string {
    const contact = [site.address, site.phone, site.contactEmail].filter(Boolean).map((s) => escapeHtml(s as string)).join(" · ");
    const home = safeUrl(site.siteUrl);
    return `<p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a;">${escapeHtml(reason)}</p>
${contact ? `<p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a;">${contact}</p>` : ""}
${home ? `<p style="margin:0;font-size:12px;"><a href="${escapeHtml(home)}" style="color:#71717a;">${escapeHtml(new URL(home).host)}</a></p>` : ""}`;
}

export function renderLayout(site: EmailSite, body: EmailBody): string {
    const color = brand(site.brandColor);
    const cta = body.cta && safeUrl(body.cta.url) ? button(body.cta.label, safeUrl(body.cta.url) as string, color) : "";
    const secondary = body.secondaryLink && safeUrl(body.secondaryLink.url)
        ? `<p style="margin:0 0 16px;font-size:14px;"><a href="${escapeHtml(safeUrl(body.secondaryLink.url) as string)}" style="color:${color};font-weight:600;">${escapeHtml(body.secondaryLink.label)}</a></p>`
        : "";
    const quote = body.quote
        ? `<p style="margin:8px 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;">${escapeHtml(body.quote.label)}</p>
<div style="margin:0 0 24px;padding:14px 16px;border-left:3px solid ${color};background:#fafafa;font-size:14px;line-height:1.6;color:#52525b;">${escapeHtml(body.quote.text).replace(/\n/g, "<br>")}</div>`
        : "";
    return `<!doctype html>
<html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${escapeHtml(body.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(body.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="padding:0 8px 20px;">${header(site, color)}</td></tr>
<tr><td style="background:#ffffff;border-radius:20px;border-top:4px solid ${color};padding:32px 24px 8px;">
${body.eyebrow ? `<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${color};">${escapeHtml(body.eyebrow)}</p>` : ""}
<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:normal;color:#18181b;">${escapeHtml(body.title)}</h1>
${body.paragraphs.map(paragraph).join("")}
${body.details?.length ? detailsTable(body.details) : ""}
${quote}${cta}${secondary}
</td></tr>
<tr><td style="padding:24px 16px 0;">${footer(site, body.reason)}</td></tr>
</table></td></tr></table></body></html>`;
}

/** The plain-text part: some clients and every spam filter read it. */
export function renderText(site: EmailSite, body: EmailBody): string {
    const lines = [site.siteName, "", body.title, "", ...body.paragraphs.flatMap((p) => [p, ""])];
    if (body.details?.length) lines.push(...body.details.map((d) => `${d.label}: ${d.value}`), "");
    if (body.quote) lines.push(`${body.quote.label}:`, ...body.quote.text.split("\n").map((l) => `> ${l}`), "");
    if (body.cta && safeUrl(body.cta.url)) lines.push(`${body.cta.label}: ${safeUrl(body.cta.url)}`, "");
    if (body.secondaryLink && safeUrl(body.secondaryLink.url)) lines.push(`${body.secondaryLink.label}: ${safeUrl(body.secondaryLink.url)}`, "");
    lines.push("--", body.reason);
    const contact = [site.address, site.phone, site.contactEmail].filter(Boolean).join(" · ");
    if (contact) lines.push(contact);
    return lines.join("\n");
}
