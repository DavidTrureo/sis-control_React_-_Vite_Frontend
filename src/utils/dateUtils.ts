/**
 * Utilidades centralizadas para formateo de Fecha y Hora en Formato Operacional Chileno de 24 Horas.
 * Norma: DD-MM-AAAA y HH:mm:ss (o HH:mm) en 24 horas estrictas, eliminando cualquier rastro de AM/PM.
 */

export function parseSafeDate(value?: string | number | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    // Si viene como DD-MM-YYYY HH:mm:ss o DD-MM-YYYYTHH:mm:ss
    if (value.includes('-') && value.indexOf('-') === 2) {
      const parts = value.split(/[ T]/);
      const dateParts = parts[0].split('-');
      const timeParts = parts[1] ? parts[1].split(':') : ['00', '00', '00'];
      const d = new Date(
        Number(dateParts[2]),
        Number(dateParts[1]) - 1,
        Number(dateParts[0]),
        Number(timeParts[0] || 0),
        Number(timeParts[1] || 0),
        Number(timeParts[2] ? timeParts[2].split('.')[0] : 0)
      );
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export interface FormatOptions {
  includeSeconds?: boolean;
  useRelativeToday?: boolean; // si es true y es hoy, muestra "Hoy" en vez de DD-MM-AAAA
  includeHrsSuffix?: boolean; // añade "hrs" al final
  separator?: string; // ej: ", " o " a las " o " "
}

/**
 * Formatea una fecha a formato 24 horas chileno: DD-MM-AAAA, HH:mm:ss hrs
 */
export function formatDateTime24h(
  value?: string | number | Date | null,
  options?: FormatOptions | boolean
): string {
  if (!value) return '--:-- hrs';

  const opts: FormatOptions = typeof options === 'boolean'
    ? { includeSeconds: options }
    : (options || {});

  const includeSeconds = opts.includeSeconds ?? true;
  const useRelativeToday = opts.useRelativeToday ?? false;
  const includeHrsSuffix = opts.includeHrsSuffix ?? true;
  const separator = opts.separator ?? ', ';

  const d = parseSafeDate(value);
  if (!d) return String(value);

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  const timePart = includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  const datePart = (useRelativeToday && isToday) ? 'Hoy' : `${day}-${month}-${year}`;
  const hrsSuffix = includeHrsSuffix ? ' hrs' : '';

  return `${datePart}${separator}${timePart}${hrsSuffix}`;
}

/**
 * Formatea solo la hora en 24h: HH:mm o HH:mm:ss
 */
export function formatTime24h(value?: string | number | Date | null, includeSeconds = false): string {
  const d = parseSafeDate(value);
  if (!d) return '--:--';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  if (includeSeconds) {
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${hours}:${minutes}`;
}

/**
 * Formatea solo la fecha: DD-MM-AAAA
 */
export function formatDateDMY(value?: string | number | Date | null): string {
  const d = parseSafeDate(value);
  if (!d) return '--/--/----';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
