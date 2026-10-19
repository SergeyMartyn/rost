export interface NormalizedContact {
  method: string;
  value: string;
}

export function normalizeContact(
  channel: string,
  raw: string,
): NormalizedContact | null {
  const value = raw.trim();
  const user = value.replace(/^@/, '');
  if (channel === 'Telegram' && /^[A-Za-z][A-Za-z0-9_]{4,26}$/.test(user))
    return { method: 'telegram', value: '@' + user };
  if (
    channel === 'Instagram' &&
    /^[A-Za-z0-9_][A-Za-z0-9._]{0,29}$/.test(user) &&
    !user.endsWith('.') &&
    !user.includes('..')
  )
    return { method: 'instagram', value: '@' + user };
  if (
    channel === 'WhatsApp-username' &&
    /^[A-Za-z0-9_][A-Za-z0-9._]{2,29}$/.test(user)
  )
    return { method: 'whatsapp-username', value: '@' + user };
  if (channel === 'WhatsApp-phone') {
    let n = value.replace(/[\s()-]/g, '');
    if (/^0\d{8,13}$/.test(n)) n = '+49' + n.slice(1);
    if (/^\+[1-9]\d{9,14}$/.test(n))
      return { method: 'whatsapp-phone', value: n };
  }
  return null;
}

export function contactMode(channel: string, whatsappType: string): string {
  return channel === 'WhatsApp'
    ? `WhatsApp-${whatsappType === 'username' ? 'username' : 'phone'}`
    : channel;
}
