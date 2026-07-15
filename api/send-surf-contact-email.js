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

  const { to, guestName, instructorName, mode, proposedDate, proposedTime, message } = req.body || {};

  if (!to || !instructorName) {
    return res.status(400).json({ error: 'Faltam campos obrigatórios' });
  }
  if (mode === 'proposal' && (!proposedDate || !proposedTime)) {
    return res.status(400).json({ error: 'Faltam a data e a hora propostas' });
  }
  if (mode === 'custom' && !message) {
    return res.status(400).json({ error: 'Falta a mensagem' });
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

  const bodyText = mode === 'proposal'
    ? `Para a tua aula de surf, proponho o seguinte horário:

Data: ${formatDate(proposedDate)}
Hora: ${proposedTime}

Este horário funciona para ti? Responde a este email a confirmar ou para combinarmos uma alternativa.`
    : message;

  const bodyHtml = mode === 'proposal'
    ? `
      <p>Para a tua aula de surf, proponho o seguinte horário:</p>
      <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        <tr><td style="padding:4px 0;color:#666;">Data</td><td style="padding:4px 0;text-align:right;">${formatDate(proposedDate)}</td></tr>
        <tr><td style="padding:4px 0;color:#666;">Hora</td><td style="padding:4px 0;text-align:right;">${proposedTime}</td></tr>
      </table>
      <p>Este horário funciona para ti? Responde a este email a confirmar ou para combinarmos uma alternativa.</p>
    `
    : `<p>${String(message).split('\n').map((line) => line || '&nbsp;').join('<br/>')}</p>`;

  const text = `Olá ${firstName},

${bodyText}

Abraço,
${instructorName}
Ericeira Wave House`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>Olá ${firstName},</p>
      ${bodyHtml}
      <p>Abraço,<br/>
      ${instructorName}<br/>
      Ericeira Wave House</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to,
      replyTo: 'ericeirawavehouse@gmail.com',
      subject: 'A tua aula de surf - Ericeira Wave House',
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de contacto:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
