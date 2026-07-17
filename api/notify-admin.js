import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { event, guestName, type, dates, name, subject, message } = req.body || {};

  const transporter = nodemailer.createTransport({
    host: 'smtp-pt.securemail.pro',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const origin = req.headers.origin || 'https://ericeirawavehouse.pt';
  let emailSubject, text, html;

  if (event === 'new_booking') {
    const isPackage = type === 'surf_package';
    const adminUrl = `${origin}/admin/bookings`;
    const typeLabel = type === 'surf' ? 'Surf' : isPackage ? 'Pacote de Surf' : 'Alojamento';
    const headline = isPackage ? 'Novo pedido de pacote recebido!' : 'Nova reserva recebida!';
    const datesLabel = isPackage ? 'Pacote' : 'Datas';
    const buttonLabel = isPackage ? 'Ver pedido no site' : 'Ver reserva no site';

    emailSubject = isPackage ? `Novo pedido de pacote: ${guestName || 'novo pedido'}` : `Nova reserva: ${guestName || 'novo pedido'}`;

    text = `${headline}

Nome: ${guestName || '-'}
Tipo: ${typeLabel}
${datesLabel}: ${dates || '-'}

Vê os detalhes e aprova/rejeita aqui:
${adminUrl}`;

    html = `
      <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
        <p><strong>${headline}</strong></p>
        <p>
          Nome: ${guestName || '-'}<br/>
          Tipo: ${typeLabel}<br/>
          ${datesLabel}: ${dates || '-'}
        </p>
        <p><a href="${adminUrl}" style="display:inline-block; background:#1c4a63; color:#fff; padding:10px 20px; border-radius:9999px; text-decoration:none;">${buttonLabel}</a></p>
      </div>
    `;
  } else if (event === 'checkin_completed') {
    const bookingsUrl = `${origin}/admin/bookings`;
    emailSubject = `Check-in concluído: ${guestName || 'hóspede'}`;

    text = `Check-in concluído!

${guestName || 'Um hóspede'} acabou de preencher o check-in online.

Vê os dados completos aqui:
${bookingsUrl}`;

    html = `
      <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
        <p><strong>Check-in concluído!</strong></p>
        <p>${guestName || 'Um hóspede'} acabou de preencher o check-in online.</p>
        <p><a href="${bookingsUrl}" style="display:inline-block; background:#1c4a63; color:#fff; padding:10px 20px; border-radius:9999px; text-decoration:none;">Ver dados no site</a></p>
      </div>
    `;
  } else if (event === 'new_message') {
    const messagesUrl = `${origin}/admin/messages`;
    const preview = (message || '').slice(0, 200);
    emailSubject = `Nova mensagem: ${name || 'novo contacto'}`;

    text = `Nova mensagem de contacto!

Nome: ${name || '-'}
Assunto: ${subject || '-'}

Mensagem:
${preview}${message && message.length > 200 ? '...' : ''}

Vê a mensagem completa aqui:
${messagesUrl}`;

    html = `
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
  } else {
    return res.status(400).json({ error: 'Evento desconhecido' });
  }

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to: 'ericeirawavehouse@gmail.com',
      replyTo: 'ericeirawavehouse@gmail.com',
      subject: emailSubject,
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao notificar admin:', error);
    return res.status(500).json({ error: 'Falha ao enviar notificação' });
  }
}
