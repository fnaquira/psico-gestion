export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
}

export const TIMEZONES: TimezoneOption[] = [
  // América del Sur
  { value: "America/Lima", label: "Lima, Bogotá, Quito (UTC-5)", region: "América" },
  { value: "America/Bogota", label: "Bogotá (UTC-5)", region: "América" },
  { value: "America/Guayaquil", label: "Quito, Guayaquil (UTC-5)", region: "América" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC-3)", region: "América" },
  { value: "America/Sao_Paulo", label: "São Paulo, Brasília (UTC-3)", region: "América" },
  { value: "America/Santiago", label: "Santiago (UTC-4/-3)", region: "América" },
  { value: "America/Caracas", label: "Caracas (UTC-4)", region: "América" },
  { value: "America/La_Paz", label: "La Paz (UTC-4)", region: "América" },
  { value: "America/Asuncion", label: "Asunción (UTC-4/-3)", region: "América" },
  { value: "America/Montevideo", label: "Montevideo (UTC-3)", region: "América" },
  // América Central y México
  { value: "America/Mexico_City", label: "Ciudad de México (UTC-6/-5)", region: "América" },
  { value: "America/Monterrey", label: "Monterrey (UTC-6/-5)", region: "América" },
  { value: "America/Guatemala", label: "Guatemala (UTC-6)", region: "América" },
  { value: "America/Costa_Rica", label: "San José (UTC-6)", region: "América" },
  // América del Norte
  { value: "America/New_York", label: "Nueva York (UTC-5/-4)", region: "América" },
  { value: "America/Chicago", label: "Chicago (UTC-6/-5)", region: "América" },
  { value: "America/Denver", label: "Denver (UTC-7/-6)", region: "América" },
  { value: "America/Los_Angeles", label: "Los Ángeles (UTC-8/-7)", region: "América" },
  { value: "America/Toronto", label: "Toronto (UTC-5/-4)", region: "América" },
  { value: "America/Vancouver", label: "Vancouver (UTC-8/-7)", region: "América" },
  // Europa
  { value: "Europe/Madrid", label: "Madrid (UTC+1/+2)", region: "Europa" },
  { value: "Europe/London", label: "Londres (UTC+0/+1)", region: "Europa" },
  { value: "Europe/Paris", label: "París (UTC+1/+2)", region: "Europa" },
  { value: "Europe/Berlin", label: "Berlín (UTC+1/+2)", region: "Europa" },
  { value: "Europe/Rome", label: "Roma (UTC+1/+2)", region: "Europa" },
  { value: "Europe/Lisbon", label: "Lisboa (UTC+0/+1)", region: "Europa" },
  // Asia
  { value: "Asia/Dubai", label: "Dubái (UTC+4)", region: "Asia" },
  { value: "Asia/Kolkata", label: "Mumbai, Nueva Delhi (UTC+5:30)", region: "Asia" },
  { value: "Asia/Shanghai", label: "Pekín, Shanghái (UTC+8)", region: "Asia" },
  { value: "Asia/Tokyo", label: "Tokio (UTC+9)", region: "Asia" },
  // Oceanía
  { value: "Australia/Sydney", label: "Sídney (UTC+10/+11)", region: "Oceanía" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12/+13)", region: "Oceanía" },
  // África
  { value: "Africa/Cairo", label: "El Cairo (UTC+2)", region: "África" },
  { value: "Africa/Johannesburg", label: "Johannesburgo (UTC+2)", region: "África" },
];

/** Returns the best matching option for a given IANA key, or undefined */
export function findTimezone(value: string): TimezoneOption | undefined {
  return TIMEZONES.find(tz => tz.value === value);
}

/** Returns value if it's in the list, otherwise "America/Lima" */
export function resolveTimezone(value: string): string {
  return findTimezone(value) ? value : "America/Lima";
}
