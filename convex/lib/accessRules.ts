/**
 * Pure rules for account management, shared by convex/access.ts and the tests.
 */

/** Same rule the Password provider enforces at sign-up (convex/auth.ts). */
export function passwordProblem(password: string): string | null {
    if (password.length < 10) return "A palavra-passe precisa de pelo menos 10 caracteres.";
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return "A palavra-passe precisa de maiúsculas, minúsculas e um número.";
    }
    return null;
}

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

// No 0/O, 1/l/I: the password is read aloud or copied from a phone screen
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const ALL = LOWER + UPPER + DIGITS;

/**
 * A temporary password in three groups of four ("Kx7m-Pq3r-Zt9w"): easy to
 * dictate, and it always satisfies passwordProblem. `random` returns
 * uniformly distributed integers in [0, max) and is injectable for tests.
 */
export function temporaryPassword(random: (max: number) => number = cryptoRandom): string {
    const pick = (alphabet: string) => alphabet[random(alphabet.length)];
    const chars = Array.from({ length: 12 }, () => pick(ALL));
    // One of each class at fixed-but-shuffled slots guarantees the rule
    const slots = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], random).slice(0, 3);
    chars[slots[0]] = pick(LOWER);
    chars[slots[1]] = pick(UPPER);
    chars[slots[2]] = pick(DIGITS);
    return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}

function shuffle<T>(items: T[], random: (max: number) => number): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = random(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function cryptoRandom(max: number): number {
    // Rejection sampling keeps the distribution uniform for any alphabet size
    const limit = Math.floor(0x100000000 / max) * max;
    const buffer = new Uint32Array(1);
    for (;;) {
        crypto.getRandomValues(buffer);
        if (buffer[0] < limit) return buffer[0] % max;
    }
}

export type AccessRole = "admin" | "user";

/** Why a role change or removal must be refused, or null when it is allowed. */
export function roleChangeProblem(args: {
    actorId: string;
    targetId: string;
    targetRole: AccessRole | undefined;
    nextRole: AccessRole | "removed";
    adminCount: number;
}): string | null {
    if (args.actorId === args.targetId) {
        return args.nextRole === "admin" ? null : "Não pode retirar o seu próprio acesso. Peça a outro administrador.";
    }
    const losesAdmin = args.targetRole === "admin" && args.nextRole !== "admin";
    if (losesAdmin && args.adminCount <= 1) return "Tem de existir sempre pelo menos um administrador.";
    return null;
}
