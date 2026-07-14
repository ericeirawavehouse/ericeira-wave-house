import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function unfoldLines(text) {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function parseIcsDate(value) {
  // Formato esperado: YYYYMMDD (evento de dia inteiro)
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseIcsEvents(icsText) {
  const unfolded = unfoldLines(icsText);
  const eventBlocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  return eventBlocks.map((block) => {
    const uidMatch = block.match(/UID:(.+)/);
    const startMatch = block.match(/DTSTART[^:]*:(\d{8})/);
    const endMatch = block.match(/DTEND[^:]*:(\d{8})/);

    if (!startMatch || !endMatch) return null;

    return {
      uid: uidMatch ? uidMatch[1].trim() : `${startMatch[1]}-${endMatch[1]}`,
      start_date: parseIcsDate(startMatch[1]),
      end_date: parseIcsDate(endMatch[1]),
    };
  }).filter((e) => e && e.start_date && e.end_date);
}

export default async function handler(req, res) {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('airbnb_ical_url')
      .eq('id', 1)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const icalUrl = settings?.airbnb_ical_url;
    if (!icalUrl) {
      return res.status(400).json({ error: 'Nenhum link de calendário Airbnb configurado.' });
    }

    const icsResponse = await fetch(icalUrl);
    if (!icsResponse.ok) {
      throw new Error(`Falha ao obter o calendário do Airbnb (${icsResponse.status})`);
    }
    const icsText = await icsResponse.text();
    const events = parseIcsEvents(icsText);

    // Substitui todos os bloqueios anteriores do Airbnb pelos novos (sincronização completa)
    const { error: deleteError } = await supabase
      .from('external_calendar_blocks')
      .delete()
      .eq('source', 'airbnb');
    if (deleteError) throw deleteError;

    if (events.length > 0) {
      const rows = events.map((e) => ({
        source: 'airbnb',
        uid: e.uid,
        start_date: e.start_date,
        end_date: e.end_date,
      }));
      const { error: insertError } = await supabase.from('external_calendar_blocks').insert(rows);
      if (insertError) throw insertError;
    }

    return res.status(200).json({ success: true, synced: events.length });
  } catch (error) {
    console.error('Erro ao sincronizar calendário Airbnb:', error);
    return res.status(500).json({ error: error.message || 'Falha ao sincronizar calendário' });
  }
}
