import nodemailer from 'nodemailer';

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

--- INFORMAÇÕES PARA HÓSPEDES ---

Contactos dos Anfitriões:
Carolina Luzia - +351 960 461 100
Nuno Jordão - +351 965 400 489

Emergência
Número Europeu de Emergência: 112

Equipamentos de Segurança
Este alojamento dispõe de:
- Extintor de incêndio
- Manta de incêndio
- Kit de primeiros socorros

Livro de Reclamações
Este alojamento dispõe de Livro de Reclamações Eletrónico, disponível mediante solicitação, conforme exigido pela legislação portuguesa.

Informações da Casa
- Por favor respeite os vizinhos, especialmente durante o período noturno (23:00 - 07:00)
- Pedimos que cuide da casa e do mobiliário
- Por favor desligue luzes e aparelhos ao sair da casa
- Caso algo deixe de funcionar, informe-nos

Check-out
O check-out deve ser realizado até às 12:00.

Wi-Fi
Rede: Vodafone-AAA366
Password: C45k7vzs48

Obrigado por escolher a Ericeira Wave House. Desejamos-lhe uma excelente estadia!

--- GUEST INFORMATION ---

Host Contacts:
Carolina Luzia - +351 960 461 100
Nuno Jordão - +351 965 400 489

Emergency
European Emergency Number: 112

Safety Equipment
This property is equipped with:
- Fire extinguisher
- Fire blanket
- First aid kit

Complaints Book
A Complaints Book (Livro de Reclamações) is available upon request, as required by Portuguese law.

House Information
- Please respect neighbours, especially during quiet hours (11:00 PM - 7:00 AM)
- Please take care of the house and furniture
- Turn off lights and appliances when leaving the property
- If anything stops working, please let us know

Check-out
Please note that check-out is until 12:00 PM.

Wi-Fi
Network: Vodafone-AAA366
Password: C45k7vzs48

Thank you for choosing Ericeira Wave House. We hope you have a wonderful stay!

Até já,
Equipa Ericeira Wave House
ericeirawavehouse@gmail.com
Ericeira, Portugal`;

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
      <p>Olá ${firstName},</p>
      <p><strong>Bem-vindo(a) à Ericeira Wave House!</strong></p>

      <h3 style="margin:24px 0 8px;">Informações para Hóspedes</h3>

      <p style="font-weight:600; margin-bottom:4px;">Contactos dos Anfitriões</p>
      <p style="margin:0 0 16px;">Carolina Luzia - +351 960 461 100<br/>Nuno Jordão - +351 965 400 489</p>

      <p style="font-weight:600; margin-bottom:4px;">Emergência</p>
      <p style="margin:0 0 16px;">Número Europeu de Emergência: <strong>112</strong></p>

      <p style="font-weight:600; margin-bottom:4px;">Equipamentos de Segurança</p>
      <p style="margin:0 0 16px;">Este alojamento dispõe de:<br/>
      • Extintor de incêndio<br/>
      • Manta de incêndio<br/>
      • Kit de primeiros socorros</p>

      <p style="font-weight:600; margin-bottom:4px;">Livro de Reclamações</p>
      <p style="margin:0 0 16px;">Este alojamento dispõe de Livro de Reclamações Eletrónico, disponível mediante solicitação, conforme exigido pela legislação portuguesa.</p>

      <p style="font-weight:600; margin-bottom:4px;">Informações da Casa</p>
      <p style="margin:0 0 16px;">
      • Por favor respeite os vizinhos, especialmente durante o período noturno <strong>(23:00 - 07:00)</strong><br/>
      • Pedimos que cuide da casa e do mobiliário<br/>
      • Por favor desligue luzes e aparelhos ao sair da casa<br/>
      • Caso algo deixe de funcionar, informe-nos</p>

      <p style="font-weight:600; margin-bottom:4px;">Check-out</p>
      <p style="margin:0 0 16px;">O check-out deve ser realizado até às <strong>12:00</strong>.</p>

      <p style="font-weight:600; margin-bottom:4px;">Wi-Fi</p>
      <p style="margin:0 0 24px;">Rede: Vodafone-AAA366<br/>Password: C45k7vzs48</p>

      <p style="margin:0 0 24px;">Obrigado por escolher a Ericeira Wave House. Desejamos-lhe uma excelente estadia!</p>

      <hr style="border:none; border-top:1px solid #eee; margin:0 0 24px;" />

      <h3 style="margin:0 0 8px;">Guest Information</h3>

      <p style="font-weight:600; margin-bottom:4px;">Host Contacts</p>
      <p style="margin:0 0 16px;">Carolina Luzia - +351 960 461 100<br/>Nuno Jordão - +351 965 400 489</p>

      <p style="font-weight:600; margin-bottom:4px;">Emergency</p>
      <p style="margin:0 0 16px;">European Emergency Number: <strong>112</strong></p>

      <p style="font-weight:600; margin-bottom:4px;">Safety Equipment</p>
      <p style="margin:0 0 16px;">This property is equipped with:<br/>
      • Fire extinguisher<br/>
      • Fire blanket<br/>
      • First aid kit</p>

      <p style="font-weight:600; margin-bottom:4px;">Complaints Book</p>
      <p style="margin:0 0 16px;">A Complaints Book (Livro de Reclamações) is available upon request, as required by Portuguese law.</p>

      <p style="font-weight:600; margin-bottom:4px;">House Information</p>
      <p style="margin:0 0 16px;">
      • Please respect neighbours, especially during quiet hours <strong>(11:00 PM - 7:00 AM)</strong><br/>
      • Please take care of the house and furniture<br/>
      • Turn off lights and appliances when leaving the property<br/>
      • If anything stops working, please let us know</p>

      <p style="font-weight:600; margin-bottom:4px;">Check-out</p>
      <p style="margin:0 0 16px;">Please note that check-out is until <strong>12:00 PM</strong>.</p>

      <p style="font-weight:600; margin-bottom:4px;">Wi-Fi</p>
      <p style="margin:0 0 24px;">Network: Vodafone-AAA366<br/>Password: C45k7vzs48</p>

      <p style="margin:0 0 24px;">Thank you for choosing Ericeira Wave House. We hope you have a wonderful stay!</p>

      <p>Até já,<br/>
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
      subject: 'Bem-vindo(a) à Ericeira Wave House! / Welcome to Ericeira Wave House!',
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
