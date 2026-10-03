export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(input: string): boolean {
  const cpf = digitsOnly(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (baseLength: number) => {
    let sum = 0;
    for (let i = 0; i < baseLength; i++) sum += Number(cpf[i]) * (baseLength + 1 - i);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function maskCpf(cpf: string): string {
  const d = digitsOnly(cpf);
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "***";
}

export function ageOnDate(birthDate: Date, at = new Date()): number {
  let age = at.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    at.getUTCMonth() < birthDate.getUTCMonth() ||
    (at.getUTCMonth() === birthDate.getUTCMonth() && at.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}
