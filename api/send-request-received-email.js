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
    to, guestName, type, lang,
    checkIn, checkOut, guestsCount, childrenCount,
    surfDate, isPackageCredit, isPrivate,
    packageName, packageNameEn, lessonsTotal,
    priceTotal,
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
  const hasPrice = priceTotal != null;
  const total = hasPrice ? Number(priceTotal).toFixed(2) : null;
  const firstName = (guestName || '').split(' ')[0] || (isEn ? 'there' : 'olá');
  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;
  const signOff = isEn ? 'Best regards,' : 'Até já,';
  const teamLine = isEn ? 'Ericeira Wave House Team' : 'Equipa Ericeira Wave House';

  let subject, introLine, detailRows, closingLine;

  if (type === 'accommodation') {
    subject = isEn ? 'We received your booking request! - Ericeira Wave House' : 'Recebemos o teu pedido de reserva! - Ericeira Wave House';
    introLine = isEn
      ? 'We received your booking request for Ericeira Wave House. This is just a confirmation that it went through - here\'s a summary:'
      : 'Recebemos o teu pedido de reserva para a Ericeira Wave House. Isto é só para confirmar que o pedido chegou bem - aqui está um resumo:';
    detailRows = [
      [isEn ? 'Check-in' : 'Check-in', formatDate(checkIn)],
      [isEn ? 'Check-out' : 'Check-out', formatDate(checkOut)],
      [isEn ? 'Guests' : 'Hóspedes', guestsCount || '-'],
      ...(hasPrice ? [[isEn ? 'Total Amount' : 'Valor Total', `€${total}`]] : []),
    ];
    closingLine = isEn
      ? 'We\'ll review your request and get back to you shortly to confirm availability and send the deposit payment details.'
      : 'Vamos rever o teu pedido e entrar em contacto em breve para confirmar a disponibilidade e enviar os dados para pagamento do sinal.';
  } else if (type === 'surf_package') {
    const displayPackageName = (isEn && packageNameEn) ? packageNameEn : (packageName || '-');
    subject = isEn ? 'We received your package request! - Ericeira Wave House' : 'Recebemos o teu pedido de pacote! - Ericeira Wave House';
    introLine = isEn
      ? `We received your request for the "${displayPackageName}" package. This is just a confirmation that it went through - here's a summary:`
      : `Recebemos o teu pedido do pacote "${displayPackageName}". Isto é só para confirmar que o pedido chegou bem - aqui está um resumo:`;
    detailRows = [
      [isEn ? 'Lessons included' : 'Aulas incluídas', lessonsTotal ?? '-'],
      ...(hasPrice ? [[isEn ? 'Total Amount' : 'Valor Total', `€${total}`]] : []),
    ];
    closingLine = isEn
      ? 'We\'ll review your request and get back to you shortly to arrange payment.'
      : 'Vamos rever o teu pedido e entrar em contacto em breve para combinar o pagamento.';
  } else {
    const peopleLine = childrenCount > 0
      ? isEn
        ? `${guestsCount || '-'} people (${childrenCount} ${childrenCount === 1 ? 'child' : 'children'})`
        : `${guestsCount || '-'} pessoas (${childrenCount} criança${childrenCount === 1 ? '' : 's'})`
      : `${guestsCount || '-'}`;

    subject = isPrivate
      ? (isEn ? 'We received your private lesson request! - Ericeira Wave House' : 'Recebemos o teu pedido de aula privada! - Ericeira Wave House')
      : (isEn ? 'We received your surf lesson request! - Ericeira Wave House' : 'Recebemos o teu pedido de aula! - Ericeira Wave House');
    introLine = isPrivate
      ? (isEn
        ? 'We received your private surf lesson request. This is just a confirmation that it went through - here\'s a summary:'
        : 'Recebemos o teu pedido de aula privada de surf. Isto é só para confirmar que o pedido chegou bem - aqui está um resumo:')
      : (isEn
        ? 'We received your surf lesson request. This is just a confirmation that it went through - here\'s a summary:'
        : 'Recebemos o teu pedido de aula de surf. Isto é só para confirmar que o pedido chegou bem - aqui está um resumo:');
    detailRows = [
      [isEn ? 'Type' : 'Tipo', isPrivate ? (isEn ? 'Private lesson' : 'Aula privada') : (isEn ? 'Group lesson' : 'Aula de grupo')],
      [isEn ? 'Date' : 'Data', formatDate(surfDate)],
      [isEn ? 'People' : 'Pessoas', peopleLine],
      ...(isPackageCredit
        ? [[isEn ? 'Payment' : 'Pagamento', isEn ? 'Uses your package (no extra cost)' : 'Usa o teu pacote (sem custo adicional)']]
        : hasPrice ? [[isEn ? 'Total Amount' : 'Valor Total', `€${total}`]] : []),
    ];
    closingLine = isEn
      ? 'We\'ll review your request and get back to you shortly to confirm availability.'
      : 'Vamos rever o teu pedido e entrar em contacto em breve para confirmar a disponibilidade.';
  }

  const detailRowsText = detailRows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const detailRowsHtml = detailRows.map(([label, value]) => `
      <tr><td style="padding:4px 0;color:#666;">${label}</td><td style="padding:4px 0;text-align:right;">${value}</td></tr>
    `).join('');

  const text = `${greeting}

${introLine}

${detailRowsText}

${closingLine}

${signOff}
${teamLine}
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>${greeting}</p>
      <p>${introLine}</p>
      <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        ${detailRowsHtml}
      </table>
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
    console.error('Erro ao enviar email de pedido recebido:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
