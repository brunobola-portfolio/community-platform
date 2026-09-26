/**
 * The list printed for the door: who is coming, a phone number to call a
 * no-show, a box to tick on arrival. Opened in its own window and handed to
 * the browser's print dialog, so it works from any phone or computer with a
 * printer or "Save as PDF", without a spreadsheet.
 */

export interface DoorListRow {
    name?: string;
    phone?: string;
    status: string;
    answers: string[];
}

const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function doorListHtml(title: string, when: string, questions: string[], rows: DoorListRow[]): string {
    const head = ['', 'Nome', 'Telemóvel', ...questions, 'Estado'].map((h) => `<th>${escape(h)}</th>`).join('');
    const body = rows.map((r, i) => `<tr><td class="box">☐</td><td><b>${i + 1}.</b> ${escape(r.name ?? '')}</td><td>${escape(r.phone ?? '')}</td>${r.answers.map((a) => `<td>${escape(a)}</td>`).join('')}<td>${r.status === 'confirmed' ? 'Confirmada' : 'Por confirmar'}</td></tr>`).join('');
    return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>${escape(title)} — lista</title>
<style>
body{font:13px/1.4 system-ui,sans-serif;margin:24px;color:#111}
h1{font-size:20px;margin:0}p{margin:4px 0 16px;color:#444}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f2f2f2;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
td.box{width:22px;font-size:16px;text-align:center}
@media print{body{margin:10mm}}
</style></head><body>
<h1>${escape(title)}</h1><p>${escape(when)} · ${rows.length} ${rows.length === 1 ? 'pessoa' : 'pessoas'}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}

/** Opens the list and the print dialog; false when the browser blocked the window. */
export function printDoorList(html: string): boolean {
    const win = window.open('', '_blank');
    if (!win) return false;
    win.document.open();
    // Every value in the page went through escape(); the new window also inherits
    // the site's CSP, so the print call comes from here rather than an inline script
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    return true;
}
