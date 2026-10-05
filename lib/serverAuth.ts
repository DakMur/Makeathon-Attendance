import crypto from 'crypto';

// Server-side fallback passwords (NEVER exported to client bundle)
export const SERVER_DEFAULT_PASSWORDS: Record<string, string> = {
  admin: 'mibomba',
  checkin: 'jit@123',
  '401': 'jit@123',
  '402': 'jit@123',
  '403': 'jit@123',
  '404': 'jit@123',
  '405': 'jit@123',
  '406': 'jit@123',
  '407': 'jit@123',
  '408': 'jit@123',
};

// Cryptographic hash helper
export function hashPasscode(passcode: string): string {
  return crypto.createHash('sha256').update(passcode.trim()).digest('hex');
}

// Compare plain passcode against stored hash or plain password (for backward compatibility)
export function verifyPasscodeMatch(inputPasscode: string, storedValue: string): boolean {
  const trimmed = inputPasscode.trim();
  const inputHash = hashPasscode(trimmed);
  return storedValue === trimmed || storedValue === inputHash;
}
