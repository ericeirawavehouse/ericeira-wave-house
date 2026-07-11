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
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Check-in Ericeira Wave House',
      text: `Olá ${guestName || ''},\n\nPor favor preenche o teu check-in através deste link:\n${checkInUrl}\n\nAté breve!`,
      html: `<p>Olá ${guestName || ''},</p><p>Por favor preenche o teu check-in através deste link:</p><p><a href="${checkInUrl}">${checkInUrl}</a></p><p>Até breve!</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
