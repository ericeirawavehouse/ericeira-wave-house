import nodemailer from 'nodemailer';

// Traduções das razões pré-definidas escolhidas no admin (em português).
// Motivos escritos à mão ("Outro motivo") não têm tradução automática - são enviados tal como escritos.
const reasonTranslations = {
  'As datas pedidas já não estão disponíveis': 'The requested dates are no longer available',
  'A casa está em manutenção nesse período': 'The house is under maintenance during that period',
  'Não cumpre os requisitos mínimos (nº de hóspedes/estadia mínima)': 'Does not meet the minimum requirements (number of guests/minimum stay)',
  'As condições do mar não são favoráveis nesta data': 'Sea conditions are not favourable on this date',
  'O instrutor não está disponível nesta data': 'The instructor is not available on this date',
  'Não cumpre os requisitos mínimos (nº de pessoas)': 'Does not meet the minimum requirements (number of people)',
  'Pacote já esgotado': 'This package is already sold out',
  'Fora de época para aulas de surf': 'Out of season for surf lessons',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, guestName, reason, type, lang } = req.body || {};

  if (!to || !reason) {
    return res.status(400).json({ error: 'Faltam campos obrigatórios' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-pt.securemail.pro',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const isEn = lang === 'en';
  const firstName = (guestName || '').split(' ')[0] || (isEn ? 'there' : 'olá');
  const displayReason = isEn ? (reasonTranslations[reason] || reason) : reason;

  let subject, introLine, closingLine;

  if (isEn) {
    subject = type === 'surf'
      ? 'About your surf lesson request - Ericeira Wave House'
      : type === 'surf_package'
        ? 'About your surf package request - Ericeira Wave House'
        : 'About your booking request - Ericeira Wave House';

    introLine = type === 'surf'
      ? 'Thank you for your interest in Ericeira Wave House surf lessons. Unfortunately, we won\'t be able to confirm your request this time.'
      : type === 'surf_package'
        ? 'Thank you for your interest in Ericeira Wave House surf lesson packages. Unfortunately, we won\'t be able to confirm your request this time.'
        : 'Thank you for your interest in Ericeira Wave House. Unfortunately, we won\'t be able to confirm your booking request this time.';

    closingLine = type === 'surf'
      ? 'If you\'d like, you can try another date or contact us directly to look at alternatives.'
      : type === 'surf_package'
        ? 'If you\'d like, contact us directly to look at alternatives.'
        : 'If you\'d like, you can try other dates or contact us directly to look at alternatives.';
  } else {
    subject = type === 'surf'
      ? 'Sobre o teu pedido de aula de surf - Ericeira Wave House'
      : type === 'surf_package'
        ? 'Sobre o teu pedido de pacote de surf - Ericeira Wave House'
        : 'Sobre o teu pedido de reserva - Ericeira Wave House';

    introLine = type === 'surf'
      ? 'Obrigado pelo teu interesse nas aulas de surf da Ericeira Wave House. Infelizmente, não vamos conseguir confirmar o teu pedido desta vez.'
      : type === 'surf_package'
        ? 'Obrigado pelo teu interesse nos pacotes de aulas de surf da Ericeira Wave House. Infelizmente, não vamos conseguir confirmar o teu pedido desta vez.'
        : 'Obrigado pelo teu interesse na Ericeira Wave House. Infelizmente, não vamos conseguir confirmar o teu pedido de reserva desta vez.';

    closingLine = type === 'surf'
      ? 'Se quiseres, podes tentar outra data ou contactar-nos diretamente para vermos alternativas.'
      : type === 'surf_package'
        ? 'Se quiseres, contacta-nos diretamente para vermos alternativas.'
        : 'Se quiseres, podes tentar outras datas ou contactar-nos diretamente para vermos alternativas.';
  }

  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;
  const reasonLabel = isEn ? 'Reason' : 'Motivo';
  const signOff = isEn ? 'Best regards,' : 'Até breve,';
  const teamLine = isEn ? 'Ericeira Wave House Team' : 'Equipa Ericeira Wave House';

  const text = `${greeting}

${introLine}

${reasonLabel}: ${displayReason}

${closingLine}

${signOff}
${teamLine}
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>${greeting}</p>
      <p>${introLine}</p>
      <p><strong>${reasonLabel}:</strong> ${displayReason}</p>
      <p>${closingLine}</p>
      <p>${signOff}<br/>
      ${teamLine}<br/>
      ericeirawavehouse@gmail.com<br/>
      Ericeira, Portugal</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to,
      replyTo: 'ericeirawavehouse@gmail.com',
      subject,
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de rejeição:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
