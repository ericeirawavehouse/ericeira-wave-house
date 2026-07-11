import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, guestName, reason } = req.body || {};

  if (!to || !reason) {
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

Obrigado pelo teu interesse na Ericeira Wave House. Infelizmente, não vamos conseguir confirmar o teu pedido de reserva desta vez.

Motivo: ${reason}

Se quiseres, podes tentar outras datas ou contactar-nos diretamente para vermos alternativas.

Até breve,
Equipa Ericeira Wave House
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>Olá ${firstName},</p>
      <p>Obrigado pelo teu interesse na <strong>Ericeira Wave House</strong>. Infelizmente, não vamos conseguir confirmar o teu pedido de reserva desta vez.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>Se quiseres, podes tentar outras datas ou contactar-nos diretamente para vermos alternativas.</p>
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
      subject: 'Sobre o teu pedido de reserva - Ericeira Wave House',
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de rejeição:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
