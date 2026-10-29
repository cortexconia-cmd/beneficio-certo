export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export function isValidCpf(value: string) {
  const d = onlyDigits(value);
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(d[i]) * (size + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(d[size])) return false;
  }
  return true;
}

export function isValidCnpj(value: string) {
  const d = onlyDigits(value);
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  for (const size of [12, 13]) {
    const weights = size === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, i) => total + Number(d[i]) * weight, 0);
    const check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (check !== Number(d[size])) return false;
  }
  return true;
}

export const isValidCpfCnpj = (value: string) => isValidCpf(value) || isValidCnpj(value);

export function isValidCardNumber(value: string) {
  const d = onlyDigits(value);
  if (!/^\d{13,19}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let digit = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
  }
  return sum % 10 === 0;
}

// "MM/AA" -> { month, year } with a four-digit year, or null when malformed.
export function parseExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return { month: match[1], year: 2000 + Number(match[2]) };
}

export function isFutureExpiry(value: string, now = new Date()) {
  const expiry = parseExpiry(value);
  if (!expiry) return false;
  return expiry.year > now.getFullYear() || (expiry.year === now.getFullYear() && Number(expiry.month) >= now.getMonth() + 1);
}

export function formatCpfCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

export const formatCardNumber = (value: string) => onlyDigits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

export function formatExpiry(value: string) {
  const d = onlyDigits(value).slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}

export const formatCep = (value: string) => onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
