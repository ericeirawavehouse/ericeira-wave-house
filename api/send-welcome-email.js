import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, guestName } = req.body || {};

  if (!to) {
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

Bem-vindo(a) à Ericeira Wave House!

Em anexo encontras toda a informação para a tua estadia: contactos dos anfitriões, número de emergência, equipamentos de segurança, livro de reclamações, regras da casa, check-out e dados do Wi-Fi (em português e em inglês).

Obrigado por escolher a Ericeira Wave House. Desejamos-lhe uma excelente estadia!

Até já,
Equipa Ericeira Wave House
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>Olá ${firstName},</p>
      <p><strong>Bem-vindo(a) à Ericeira Wave House!</strong></p>
      <p>Em anexo encontras toda a informação para a tua estadia (contactos, Wi-Fi, equipamentos de segurança, regras da casa e check-out), em português e em inglês.</p>

      <img src="cid:welcomept" alt="Informações para Hóspedes" style="width:100%; max-width:480px; display:block; margin:24px 0;" />
      <img src="cid:welcomeen" alt="Guest Information" style="width:100%; max-width:480px; display:block; margin:0 0 24px;" />

      <p>Obrigado por escolher a Ericeira Wave House. Desejamos-lhe uma excelente estadia!</p>

      <p>Até já,<br/>
      Equipa Ericeira Wave House<br/>
      ericeirawavehouse@gmail.com<br/>
      Ericeira, Portugal</p>
    </div>
  `;

  try {
    const imagesDir = path.join(process.cwd(), 'src', 'images');
    const attachments = [
      {
        filename: 'informacoes-hospedes.jpeg',
        content: fs.readFileSync(path.join(imagesDir, 'welcome-pt.jpeg')),
        cid: 'welcomept',
      },
      {
        filename: 'guest-information.jpeg',
        content: fs.readFileSync(path.join(imagesDir, 'welcome-en.jpeg')),
        cid: 'welcomeen',
      },
    ];

    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to,
      replyTo: 'ericeirawavehouse@gmail.com',
      subject: 'Bem-vindo(a) à Ericeira Wave House! / Welcome to Ericeira Wave House!',
      text,
      html,
      attachments,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
