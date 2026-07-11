import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { guestName, type, dates } = req.body || {};

  const transporter = nodemailer.createTransport({
    host: 'smtp-pt.securemail.pro',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const adminUrl = `${req.headers.origin || 'https://ericeirawavehouse.pt'}/admin`;
  const typeLabel = type === 'surf' ? 'Surf' : 'Alojamento';

  const text = `Nova reserva recebida!

Nome: ${guestName || '-'}
Tipo: ${typeLabel}
Datas: ${dates || '-'}

Vê os detalhes e aprova/rejeita aqui:
${adminUrl}`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p><strong>Nova reserva recebida!</strong></p>
      <p>
        Nome: ${guestName || '-'}<br/>
        Tipo: ${typeLabel}<br/>
        Datas: ${dates || '-'}
      </p>
      <p><a href="${adminUrl}" style="display:inline-block; background:#1c4a63; color:#fff; padding:10px 20px; border-radius:9999px; text-decoration:none;">Ver reserva no site</a></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to: 'ericeirawavehouse@gmail.com',
      replyTo: 'ericeirawavehouse@gmail.com',
      subject: `Nova reserva: ${guestName || 'novo pedido'}`,
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao notificar nova reserva:', error);
    return res.status(500).json({ error: 'Falha ao enviar notificação' });
  }
}
