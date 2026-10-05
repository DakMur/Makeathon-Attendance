import crypto from 'crypto';

// Server-side fallback passwords (NEVER exported to client bundle)
export const SERVER_DEFAULT_PASSWORDS: Record<string, string> = {
  admin: 'mibomba',
  checkin: 'checkin123',
  '401': 'room401',
  '402': 'room402',
  '403': 'room403',
  '404': 'room404',
  '405': 'room405',
  '406': 'room406',
  '407': 'room407',
  '408': 'room408',
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
