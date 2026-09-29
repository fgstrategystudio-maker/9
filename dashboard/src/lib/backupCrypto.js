// Decifra i backup prodotti dal workflow GitHub con:
//   openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -md sha256 -salt
// Formato OpenSSL: "Salted__" (8 byte) + salt (8 byte) + ciphertext.
// Chiave (32 byte) e IV (16 byte) derivati insieme con PBKDF2-SHA256.
// Tutto avviene nel browser: la password non lascia mai il dispositivo.

export const BACKUP_ITERAZIONI = 200000;

const MAGIC = "Salted__";

export function isBackupCifrato(bytes) {
  if (!bytes || bytes.length < 16) return false;
  return new TextDecoder().decode(bytes.slice(0, 8)) === MAGIC;
}

export async function decifraBackup(bytes, password, iterazioni = BACKUP_ITERAZIONI) {
  if (!isBackupCifrato(bytes)) throw new Error("Il file non è un backup cifrato valido.");
  const salt = bytes.slice(8, 16);
  const dati = bytes.slice(16);
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iterazioni },
    base,
    (32 + 16) * 8,
  ));
  const chiave = await crypto.subtle.importKey("raw", bits.slice(0, 32), { name: "AES-CBC" }, false, ["decrypt"]);
  let chiaro;
  try {
    chiaro = await crypto.subtle.decrypt({ name: "AES-CBC", iv: bits.slice(32, 48) }, chiave, dati);
  } catch {
    // con password errata il padding non torna e la decifratura fallisce
    throw new Error("Password errata oppure file danneggiato.");
  }
  return new TextDecoder().decode(chiaro);
}
