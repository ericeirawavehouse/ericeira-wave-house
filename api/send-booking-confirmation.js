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
    to, guestName, type,
    checkIn, checkOut, nights,
    surfDate,
    guestsCount, childrenCount,
    priceSubtotal, discountAmount, discountLabel, priceTotal,
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

  const firstName = (guestName || '').split(' ')[0] || 'olá';
  const hasDiscount = discountAmount > 0;
  const total = (priceTotal ?? 0).toFixed(2);
  const subtotal = (priceSubtotal ?? 0).toFixed(2);
  const discount = (discountAmount ?? 0).toFixed(2);

  let subject, introLine, detailsText, detailsHtml, extraText, extraHtml;

  if (type === 'accommodation') {
    subject = 'A tua reserva foi confirmada! - Ericeira Wave House';
    introLine = 'A tua reserva na Ericeira Wave House foi confirmada!';
    detailsText = `Check-in: ${formatDate(checkIn)}
Check-out: ${formatDate(checkOut)}
Noites: ${nights || '-'}
Hóspedes: ${guestsCount || '-'}`;
    detailsHtml = `
      <tr><td style="padding:4px 0;color:#666;">Check-in</td><td style="padding:4px 0;text-align:right;">${formatDate(checkIn)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Check-out</td><td style="padding:4px 0;text-align:right;">${formatDate(checkOut)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Noites</td><td style="padding:4px 0;text-align:right;">${nights || '-'}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Hóspedes</td><td style="padding:4px 0;text-align:right;">${guestsCount || '-'}</td></tr>
    `;
    extraText = 'Mais perto da data de chegada vais receber um link para preencheres o check-in online, para agilizar a tua entrada.';
    extraHtml = extraText;
  } else {
    subject = 'A tua aula de surf foi confirmada! - Ericeira Wave House';
    introLine = 'A tua aula de surf na Ericeira Wave House foi confirmada!';
    const peopleLine = childrenCount > 0
      ? `${guestsCount || '-'} pessoas (${childrenCount} criança${childrenCount === 1 ? '' : 's'})`
      : `${guestsCount || '-'}`;
    detailsText = `Data: ${formatDate(surfDate)}
Pessoas: ${peopleLine}`;
    detailsHtml = `
      <tr><td style="padding:4px 0;color:#666;">Data</td><td style="padding:4px 0;text-align:right;">${formatDate(surfDate)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Pessoas</td><td style="padding:4px 0;text-align:right;">${peopleLine}</td></tr>
    `;
    extraText = 'A hora exata da aula é combinada consoante as condições do mar e meteorológicas. O nosso instrutor vai entrar em contacto contigo mais perto da data para combinar os últimos detalhes.';
    extraHtml = extraText;
  }

  const priceRowsText = hasDiscount
    ? `Subtotal: €${subtotal}\n${discountLabel || 'Desconto'}: -€${discount}\nTotal: €${total}`
    : `Total: €${total}`;

  const priceRowsHtml = hasDiscount
    ? `
      <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="padding:4px 0;text-align:right;">€${subtotal}</td></tr>
      <tr><td style="padding:4px 0;color:#059669;">${discountLabel || 'Desconto'}</td><td style="padding:4px 0;text-align:right;color:#059669;">-€${discount}</td></tr>
      <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>
    `
    : `
      <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>
    `;

  const text = `Olá ${firstName},

${introLine}

${detailsText}

${priceRowsText}

${extraText}

Até já,
Equipa Ericeira Wave House
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>Olá ${firstName},</p>
      <p><strong>${introLine}</strong></p>
      <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        ${detailsHtml}
      </table>
      <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        ${priceRowsHtml}
      </table>
      <p>${extraHtml}</p>
      <p>Até já,<br/>
      Equipa Ericeira Wave House<br/>
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
    console.error('Erro ao enviar email de confirmação:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
