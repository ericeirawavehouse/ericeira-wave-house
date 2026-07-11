import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { name, subject, message } = req.body || {};

  const transporter = nodemailer.createTransport({
    host: 'smtp-pt.securemail.pro',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const messagesUrl = `${req.headers.origin || 'https://ericeirawavehouse.pt'}/admin/messages`;
  const preview = (message || '').slice(0, 200);

  const text = `Nova mensagem de contacto!

Nome: ${name || '-'}
Assunto: ${subject || '-'}

Mensagem:
${preview}${message && message.length > 200 ? '...' : ''}

Vê a mensagem completa aqui:
${messagesUrl}`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p><strong>Nova mensagem de contacto!</strong></p>
      <p>
        Nome: ${name || '-'}<br/>
        Assunto: ${subject || '-'}
      </p>
      <p style="background:#f5f4f2; padding:12px; border-radius:8px;">${preview}${message && message.length > 200 ? '...' : ''}</p>
      <p><a href="${messagesUrl}" style="display:inline-block; background:#1c4a63; color:#fff; padding:10px 20px; border-radius:9999px; text-decoration:none;">Ver mensagem no site</a></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to: 'ericeirawavehouse@gmail.com',
      replyTo: 'ericeirawavehouse@gmail.com',
      subject: `Nova mensagem: ${name || 'novo contacto'}`,
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao notificar nova mensagem:', error);
    return res.status(500).json({ error: 'Falha ao enviar notificação' });
  }
}
