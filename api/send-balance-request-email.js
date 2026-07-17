import nodemailer from 'nodemailer';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const {
    to, guestName, lang,
    checkIn, checkOut,
    balanceAmount, balancePercent,
    attachment,
  } = req.body || {};

  if (!to) {
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
  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;
  const signOff = isEn ? 'Best regards,' : 'Até já,';
  const teamLine = isEn ? 'Ericeira Wave House Team' : 'Equipa Ericeira Wave House';
  const hasAmount = balanceAmount != null;
  const amount = hasAmount ? Number(balanceAmount).toFixed(2) : null;

  const subject = isEn
    ? 'Time to settle the remaining balance - Ericeira Wave House'
    : 'Chegou a altura de pagares o saldo restante - Ericeira Wave House';

  const introLine = isEn
    ? 'Your stay is coming up! It\'s time to settle the remaining balance for your reservation.'
    : 'A tua estadia está a chegar! Chegou a altura de pagares o saldo restante da tua reserva.';

  const amountLine = hasAmount
    ? (isEn
      ? `Remaining balance${balancePercent ? ` (${balancePercent}%)` : ''}: €${amount}`
      : `Saldo restante${balancePercent ? ` (${balancePercent}%)` : ''}: €${amount}`)
    : '';

  const detailLine = isEn
    ? `Check-in: ${formatDate(checkIn)} · Check-out: ${formatDate(checkOut)}`
    : `Check-in: ${formatDate(checkIn)} · Check-out: ${formatDate(checkOut)}`;

  const attachmentLine = attachment
    ? (isEn ? 'You\'ll find the invoice attached to this email.' : 'Encontras a fatura em anexo a este email.')
    : (isEn ? 'Please contact us to arrange payment.' : 'Contacta-nos para combinarmos o pagamento.');

  const closingLine = isEn
    ? 'This can be paid in cash on arrival, or beforehand if you prefer - just let us know. Any questions, feel free to reach out.'
    : 'Podes pagar em dinheiro na chegada, ou antes se preferires - é só avisares. Qualquer dúvida, contacta-nos à vontade.';

  const text = `${greeting}

${introLine}

${detailLine}
${amountLine}

${attachmentLine}

${closingLine}

${signOff}
${teamLine}
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>${greeting}</p>
      <p><strong>${introLine}</strong></p>
      <p style="color:#666; font-size:14px;">${detailLine}</p>
      ${amountLine ? `<p style="font-size:16px; font-weight:600; margin:12px 0;">${amountLine}</p>` : ''}
      <p>${attachmentLine}</p>
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
      attachments: attachment
        ? [{ filename: attachment.filename, content: Buffer.from(attachment.contentBase64, 'base64'), contentType: attachment.contentType }]
        : undefined,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de pedido de saldo:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
