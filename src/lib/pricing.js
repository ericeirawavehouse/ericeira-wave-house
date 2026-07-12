import { format, getDay } from 'date-fns';

// Prioridade: período mais específico (menor intervalo, ex: 1 dia) > período mais amplo > fim de semana > preço base
export function priceForDate(date, settings, periods = []) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const matches = periods.filter((p) => dateStr >= p.start_date && dateStr <= p.end_date);

  if (matches.length > 0) {
    const narrowest = matches.reduce((a, b) => {
      const spanA = new Date(a.end_date) - new Date(a.start_date);
      const spanB = new Date(b.end_date) - new Date(b.start_date);
      return spanB < spanA ? b : a;
    });
    return Number(narrowest.price_per_night);
  }

  const isWeekend = [5, 6].includes(getDay(date)); // sexta ou sábado
  if (isWeekend && settings?.weekend_price_per_night != null) {
    return Number(settings.weekend_price_per_night);
  }
  return Number(settings?.accommodation_price_per_night || 0);
}

export function findSingleDayOverride(date, periods = []) {
  const dateStr = format(date, 'yyyy-MM-dd');
  return periods.find((p) => p.start_date === dateStr && p.end_date === dateStr);
}
