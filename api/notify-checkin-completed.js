import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { guestName } = req.body || {};

  const transporter = nodemailer.createTransport({
    host: 'smtp-pt.securemail.pro',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const bookingsUrl = `${req.headers.origin || 'https://ericeirawavehouse.pt'}/admin/bookings`;

  const text = `Check-in concluído!

${guestName || 'Um hóspede'} acabou de preencher o check-in online.

Vê os dados completos aqui:
${bookingsUrl}`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p><strong>Check-in concluído!</strong></p>
      <p>${guestName || 'Um hóspede'} acabou de preencher o check-in online.</p>
      <p><a href="${bookingsUrl}" style="display:inline-block; background:#1c4a63; color:#fff; padding:10px 20px; border-radius:9999px; text-decoration:none;">Ver dados no site</a></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to: 'ericeirawavehouse@gmail.com',
      replyTo: 'ericeirawavehouse@gmail.com',
      subject: `Check-in concluído: ${guestName || 'hóspede'}`,
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao notificar check-in concluído:', error);
    return res.status(500).json({ error: 'Falha ao enviar notificação' });
  }
}
