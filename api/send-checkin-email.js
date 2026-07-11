import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, guestName, checkInUrl } = req.body || {};

  if (!to || !checkInUrl) {
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

  const text = `Olá ${firstName},

Estamos a preparar tudo para a tua estadia na Ericeira Wave House e falta só um passo: o check-in online.

Preenche os teus dados através deste link, para agilizarmos a tua chegada:
${checkInUrl}

Demora menos de 2 minutos. Qualquer dúvida, basta responderes a este email ou contactar-nos pelo telefone +351 960 461 100.

Até breve,
Equipa Ericeira Wave House
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>Olá ${firstName},</p>
      <p>Estamos a preparar tudo para a tua estadia na <strong>Ericeira Wave House</strong> e falta só um passo: o check-in online.</p>
      <p>Preenche os teus dados através deste link, para agilizarmos a tua chegada:</p>
      <p><a href="${checkInUrl}" style="color: #1c4a63;">${checkInUrl}</a></p>
      <p>Demora menos de 2 minutos. Qualquer dúvida, basta responderes a este email ou contactar-nos pelo telefone <a href="tel:+351960461100">+351 960 461 100</a>.</p>
      <p>Até breve,<br/>
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
      subject: 'O teu check-in para a Ericeira Wave House',
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
