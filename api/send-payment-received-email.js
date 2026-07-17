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
    to, guestName, type, lang, stage,
    checkIn, checkOut, surfDate,
    packageName, packageNameEn,
    priceTotal, depositAmount, depositPercent,
    attachment,
  } = req.body || {};

  if (!to || !type) {
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
  const isDeposit = stage === 'deposit';
  const hasPrice = priceTotal != null;
  const total = hasPrice ? Number(priceTotal).toFixed(2) : null;
  const hasDeposit = depositAmount != null;
  const deposit = hasDeposit ? Number(depositAmount).toFixed(2) : null;
  const firstName = (guestName || '').split(' ')[0] || (isEn ? 'there' : 'olá');
  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;
  const signOff = isEn ? 'Best regards,' : 'Até já,';
  const teamLine = isEn ? 'Ericeira Wave House Team' : 'Equipa Ericeira Wave House';

  let subject, introLine, detailLine, amountLine, closingLine;

  if (type === 'accommodation' && isDeposit) {
    subject = isEn ? 'Deposit received - Ericeira Wave House' : 'Sinal recebido - Ericeira Wave House';
    introLine = isEn
      ? 'We confirm that we\'ve received your deposit. Thank you!'
      : 'Confirmamos que recebemos o teu sinal. Obrigado!';
    detailLine = `Check-in: ${formatDate(checkIn)} · Check-out: ${formatDate(checkOut)}`;
    amountLine = hasDeposit
      ? (isEn ? `Deposit received${depositPercent ? ` (${depositPercent}%)` : ''}: €${deposit}` : `Sinal recebido${depositPercent ? ` (${depositPercent}%)` : ''}: €${deposit}`)
      : '';
    closingLine = isEn
      ? 'The remaining balance is payable closer to your stay - we\'ll be in touch.'
      : 'O saldo restante é pago mais perto da tua estadia - entraremos em contacto.';
  } else if (type === 'accommodation') {
    subject = isEn ? 'Payment received - your reservation is fully paid! - Ericeira Wave House' : 'Pagamento recebido - a tua reserva está paga na totalidade! - Ericeira Wave House';
    introLine = isEn
      ? 'We confirm that we\'ve received the remaining balance - your reservation is now fully paid. Thank you!'
      : 'Confirmamos que recebemos o restante do pagamento - a tua reserva está agora paga na totalidade. Obrigado!';
    detailLine = `Check-in: ${formatDate(checkIn)} · Check-out: ${formatDate(checkOut)}`;
    amountLine = hasPrice ? (isEn ? `Total amount: €${total}` : `Valor total: €${total}`) : '';
    closingLine = isEn
      ? 'We look forward to welcoming you to Ericeira. If you have any questions before your stay, feel free to reach out.'
      : 'Estamos ansiosos por te receber na Ericeira. Se tiveres alguma dúvida antes da tua estadia, contacta-nos à vontade.';
  } else if (type === 'surf_package') {
    const displayPackageName = (isEn && packageNameEn) ? packageNameEn : (packageName || '-');
    subject = isEn ? 'Payment received for your package! - Ericeira Wave House' : 'Pagamento do pacote recebido! - Ericeira Wave House';
    introLine = isEn
      ? `We confirm that we've received the payment for your "${displayPackageName}" package. Thank you!`
      : `Confirmamos que recebemos o pagamento do teu pacote "${displayPackageName}". Obrigado!`;
    detailLine = '';
    amountLine = hasPrice ? (isEn ? `Amount received: €${total}` : `Valor recebido: €${total}`) : '';
    closingLine = isEn
      ? 'You can now book your lessons through the booking form on the site, using the same email - the lessons will be automatically deducted from your package.'
      : 'Já podes reservar as tuas aulas através do formulário de reserva do site, usando o mesmo email - as aulas serão automaticamente descontadas do teu pacote.';
  } else {
    subject = isEn ? 'Payment received for your surf lesson! - Ericeira Wave House' : 'Pagamento da aula recebido! - Ericeira Wave House';
    introLine = isEn
      ? 'We confirm that we\'ve received the payment for your surf lesson. Thank you!'
      : 'Confirmamos que recebemos o pagamento da tua aula de surf. Obrigado!';
    detailLine = isEn ? `Date: ${formatDate(surfDate)}` : `Data: ${formatDate(surfDate)}`;
    amountLine = hasPrice ? (isEn ? `Amount received: €${total}` : `Valor recebido: €${total}`) : '';
    closingLine = isEn
      ? 'See you in the water!'
      : 'Vemo-nos na água!';
  }

  const attachmentLine = attachment
    ? (isEn ? 'You\'ll find the receipt attached to this email.' : 'Encontras o recibo em anexo a este email.')
    : '';

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
      ${detailLine ? `<p style="color:#666; font-size:14px;">${detailLine}</p>` : ''}
      ${amountLine ? `<p style="color:#666; font-size:14px;">${amountLine}</p>` : ''}
      ${attachmentLine ? `<p>${attachmentLine}</p>` : ''}
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
    console.error('Erro ao enviar email de pagamento recebido:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
