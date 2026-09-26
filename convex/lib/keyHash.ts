/**
 * Rate-limit keys must not store an email in clear: the table is plain data
 * anyone with dashboard access reads. FNV-1a is not a secret-keeping hash, and
 * does not need to be: it only has to be stable and not show the address.
 * A collision merges two people's buckets, which is harmless.
 */
export function keyHash(value: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(36);
}
