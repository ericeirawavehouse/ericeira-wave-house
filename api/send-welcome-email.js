import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, guestName, lang } = req.body || {};

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

  const isEn = lang === 'en';
  const firstName = (guestName || '').split(' ')[0] || (isEn ? 'there' : 'olá');
  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;
  const welcomeLine = isEn ? 'Welcome to Ericeira Wave House!' : 'Bem-vindo(a) à Ericeira Wave House!';
  const introLine = isEn
    ? 'Attached you\'ll find all the information for your stay: host contacts, emergency number, safety equipment, complaints book, house rules, check-out and Wi-Fi details.'
    : 'Em anexo encontras toda a informação para a tua estadia: contactos dos anfitriões, número de emergência, equipamentos de segurança, livro de reclamações, regras da casa, check-out e dados do Wi-Fi.';
  const thanksLine = isEn
    ? 'Thank you for choosing Ericeira Wave House. We hope you have a wonderful stay!'
    : 'Obrigado por escolher a Ericeira Wave House. Desejamos-lhe uma excelente estadia!';
  const signOff = isEn ? 'Best regards,' : 'Até já,';
  const teamLine = isEn ? 'Ericeira Wave House Team' : 'Equipa Ericeira Wave House';
  const imageFile = isEn ? 'welcome-en.jpeg' : 'welcome-pt.jpeg';
  const imageAlt = isEn ? 'Guest Information' : 'Informações para Hóspedes';

  const text = `${greeting}

${welcomeLine}

${introLine}

${thanksLine}

${signOff}
${teamLine}
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>${greeting}</p>
      <p><strong>${welcomeLine}</strong></p>
      <p>${introLine}</p>

      <img src="cid:welcomeimg" alt="${imageAlt}" style="width:100%; max-width:480px; display:block; margin:24px 0;" />

      <p>${thanksLine}</p>

      <p>${signOff}<br/>
      ${teamLine}<br/>
      ericeirawavehouse@gmail.com<br/>
      Ericeira, Portugal</p>
    </div>
  `;

  try {
    const imagesDir = path.join(process.cwd(), 'src', 'images');
    const attachments = [
      {
        filename: imageFile,
        content: fs.readFileSync(path.join(imagesDir, imageFile)),
        cid: 'welcomeimg',
      },
    ];

    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to,
      replyTo: 'ericeirawavehouse@gmail.com',
      subject: isEn ? 'Welcome to Ericeira Wave House!' : 'Bem-vindo(a) à Ericeira Wave House!',
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
