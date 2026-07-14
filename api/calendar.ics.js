import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function formatDate(dateStr) {
  return dateStr.replace(/-/g, '');
}

function foldLine(line) {
  // Regra do formato iCal: linhas com mais de 75 bytes devem ser dobradas com um espaço no início da linha seguinte
  if (line.length <= 75) return line;
  let result = '';
  let rest = line;
  while (rest.length > 75) {
    result += rest.slice(0, 75) + '\r\n ';
    rest = rest.slice(75);
  }
  return result + rest;
}

export default async function handler(req, res) {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, guest_name')
      .eq('type', 'accommodation')
      .eq('status', 'confirmed')
      .is('deleted_at', null)
      .not('check_in', 'is', null)
      .not('check_out', 'is', null);

    if (error) throw error;

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const events = (bookings || []).map((b) => [
      'BEGIN:VEVENT',
      `UID:ericeira-wave-house-${b.id}@ericeirawavehouse.pt`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatDate(b.check_in)}`,
      `DTEND;VALUE=DATE:${formatDate(b.check_out)}`,
      foldLine('SUMMARY:Reservado - Ericeira Wave House'),
      'END:VEVENT',
    ].join('\r\n'));

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ericeira Wave House//Bookings//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      foldLine('X-WR-CALNAME:Ericeira Wave House'),
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(ics);
  } catch (error) {
    console.error('Erro ao gerar calendário iCal:', error);
    return res.status(500).json({ error: 'Falha ao gerar calendário' });
  }
}
