import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const {
    to, guestName, type,
    checkIn, checkOut, nights,
    surfDate,
    guestsCount, childrenCount,
    priceSubtotal, discountAmount, discountLabel, priceTotal,
    packageName, lessonsTotal,
  } = req.body || {};

  if (!to || !type) {
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

  const hasPrice = priceTotal != null;
  const total = hasPrice ? Number(priceTotal).toFixed(2) : null;

  let subject, text, html;

  if (type === 'accommodation') {
    // Dados de depósito/pagamento vêm sempre do servidor (nunca do cliente),
    // para não permitir que alguém injete um IBAN diferente através do pedido.
    let depositPercent = 30;
    let bankAccountName = '';
    let bankIban = '';
    let bankBic = '';
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('deposit_percent, bank_account_name, bank_iban, bank_bic')
        .eq('id', 1)
        .maybeSingle();
      if (!settingsError && settings) {
        depositPercent = settings.deposit_percent || 30;
        bankAccountName = settings.bank_account_name || '';
        bankIban = settings.bank_iban || '';
        bankBic = settings.bank_bic || '';
      }
    } catch (err) {
      console.error('Erro ao obter dados de depósito:', err);
    }

    const displayName = (guestName || '').trim() || 'Guest';
    const balancePercent = 100 - depositPercent;
    const depositAmount = hasPrice ? (Number(priceTotal) * depositPercent / 100).toFixed(2) : null;

    subject = 'Your Booking Request - Deposit Details - Ericeira Wave House';

    text = [
      `Dear ${displayName},`,
      '',
      'Thank you for your booking request and for choosing Ericeira Wave House.',
      '',
      'Booking Summary',
      `- Check-in: ${formatDate(checkIn)}`,
      `- Check-out: ${formatDate(checkOut)}`,
      `- Guests: ${guestsCount || '-'}`,
      ...(hasPrice ? [`- Total Amount: €${total}`] : []),
      '',
      hasPrice
        ? `To secure your reservation, we kindly require a ${depositPercent}% deposit (€${depositAmount}).`
        : `To secure your reservation, we kindly require a ${depositPercent}% deposit.`,
      '',
      'If you would like to proceed with the reservation, simply reply to this email to confirm. We will then issue the invoice for the deposit. Once the payment has been received, we will confirm your reservation and send you the corresponding receipt.',
      '',
      `The remaining ${balancePercent}% balance is payable on the day of check-in.`,
      '',
      'Bank Details',
      `Account Name: ${bankAccountName || '-'}`,
      `IBAN: ${bankIban || '-'}`,
      `BIC/SWIFT: ${bankBic || '-'}`,
      '',
      'If you have any questions before your stay, please feel free to contact us. We will be happy to assist you.',
      '',
      'We look forward to welcoming you to Ericeira.',
      '',
      'Best regards,',
      '',
      'Carolina & Nuno',
      'Ericeira Wave House',
      'ericeirawavehouse@gmail.com',
      'Ericeira, Portugal',
    ].join('\n');

    html = `
      <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
        <p>Dear ${displayName},</p>
        <p>Thank you for your booking request and for choosing <strong>Ericeira Wave House</strong>.</p>

        <p style="font-weight:600; margin-bottom:8px;">Booking Summary</p>
        <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
          <tr><td style="padding:4px 0;color:#666;">Check-in</td><td style="padding:4px 0;text-align:right;">${formatDate(checkIn)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Check-out</td><td style="padding:4px 0;text-align:right;">${formatDate(checkOut)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Guests</td><td style="padding:4px 0;text-align:right;">${guestsCount || '-'}</td></tr>
          ${hasPrice ? `<tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total Amount</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>` : ''}
        </table>

        <div style="background:#f6f6f4; border-radius:12px; padding:16px 20px; margin-bottom:20px;">
          <p style="margin:0 0 8px;">${hasPrice
            ? `To secure your reservation, we kindly require a <strong>${depositPercent}% deposit (€${depositAmount})</strong>.`
            : `To secure your reservation, we kindly require a <strong>${depositPercent}% deposit</strong>.`}</p>
          <p style="margin:0; font-size:13px; color:#555;">The remaining ${balancePercent}% balance is payable on the day of check-in.</p>
        </div>

        <p>If you would like to proceed with the reservation, simply reply to this email to confirm. We will then issue the invoice for the deposit. Once the payment has been received, we will confirm your reservation and send you the corresponding receipt.</p>

        <p style="font-weight:600; margin:20px 0 8px;">Bank Details</p>
        <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
          <tr><td style="padding:4px 0;color:#666;">Account Name</td><td style="padding:4px 0;text-align:right;">${bankAccountName || '-'}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">IBAN</td><td style="padding:4px 0;text-align:right;">${bankIban || '-'}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">BIC/SWIFT</td><td style="padding:4px 0;text-align:right;">${bankBic || '-'}</td></tr>
        </table>

        <p>If you have any questions before your stay, please feel free to contact us. We will be happy to assist you.</p>
        <p>We look forward to welcoming you to Ericeira.</p>

        <p>Best regards,<br/><br/>
        Carolina &amp; Nuno<br/>
        Ericeira Wave House<br/>
        ericeirawavehouse@gmail.com<br/>
        Ericeira, Portugal</p>
      </div>
    `;
  } else if (type === 'surf_package') {
    const firstName = (guestName || '').split(' ')[0] || 'olá';
    subject = 'O teu pacote de aulas de surf foi confirmado! - Ericeira Wave House';
    const introLine = `O teu pedido do pacote "${packageName || '-'}" foi confirmado!`;

    text = [
      `Olá ${firstName},`,
      '',
      introLine,
      '',
      `Aulas incluídas: ${lessonsTotal ?? '-'}`,
      ...(hasPrice ? [`Valor total: €${total}`] : []),
      '',
      'Vamos entrar em contacto contigo para combinarmos o pagamento. Depois de confirmado, basta reservares as tuas aulas através do formulário de reserva do site, usando o mesmo email — as aulas serão automaticamente descontadas do teu pacote.',
      '',
      'Se por algum motivo precisares de cancelar, contacta-nos por email para combinarmos os próximos passos.',
      '',
      'Até já,',
      'Equipa Ericeira Wave House',
      'ericeirawavehouse@gmail.com',
      'Ericeira, Portugal',
    ].join('\n');

    html = `
      <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
        <p>Olá ${firstName},</p>
        <p><strong>${introLine}</strong></p>
        <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
          <tr><td style="padding:4px 0;color:#666;">Aulas incluídas</td><td style="padding:4px 0;text-align:right;">${lessonsTotal ?? '-'}</td></tr>
          ${hasPrice ? `<tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Valor total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>` : ''}
        </table>
        <p>Vamos entrar em contacto contigo para combinarmos o pagamento. Depois de confirmado, basta reservares as tuas aulas através do formulário de reserva do site, usando o mesmo email — as aulas serão automaticamente descontadas do teu pacote.</p>
        <p style="color:#666; font-size:13px;">Se por algum motivo precisares de cancelar, contacta-nos por email para combinarmos os próximos passos.</p>
        <p>Até já,<br/>
        Equipa Ericeira Wave House<br/>
        ericeirawavehouse@gmail.com<br/>
        Ericeira, Portugal</p>
      </div>
    `;
  } else {
    const firstName = (guestName || '').split(' ')[0] || 'olá';
    const peopleLine = childrenCount > 0
      ? `${guestsCount || '-'} pessoas (${childrenCount} criança${childrenCount === 1 ? '' : 's'})`
      : `${guestsCount || '-'}`;

    subject = 'A tua aula de surf foi confirmada! - Ericeira Wave House';
    const introLine = 'A tua aula de surf na Ericeira Wave House foi confirmada!';
    const extraText = 'Vamos entrar em contacto contigo, normalmente na noite anterior à aula, para combinarmos a hora exata — isto permite-nos avaliar as marés e as condições do mar com a maior precisão possível. Não estranhes se não tiveres notícias nossas antes disso, é mesmo assim que costuma funciona.';
    const cancelText = 'Se por algum motivo precisares de cancelar, contacta-nos por email para combinarmos os próximos passos.';
    const hasDiscount = hasPrice && discountAmount > 0;
    const subtotal = hasPrice ? Number(priceSubtotal ?? priceTotal).toFixed(2) : null;
    const discount = hasPrice ? Number(discountAmount ?? 0).toFixed(2) : null;

    const priceRowsText = !hasPrice
      ? ''
      : hasDiscount
        ? `Subtotal: €${subtotal}\n${discountLabel || 'Desconto'}: -€${discount}\nTotal: €${total}`
        : `Total: €${total}`;

    const priceRowsHtml = !hasPrice
      ? ''
      : hasDiscount
        ? `
        <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="padding:4px 0;text-align:right;">€${subtotal}</td></tr>
        <tr><td style="padding:4px 0;color:#059669;">${discountLabel || 'Desconto'}</td><td style="padding:4px 0;text-align:right;color:#059669;">-€${discount}</td></tr>
        <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>
      `
        : `
        <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>
      `;

    text = [
      `Olá ${firstName},`,
      '',
      introLine,
      '',
      `Data: ${formatDate(surfDate)}`,
      `Pessoas: ${peopleLine}`,
      ...(hasPrice ? ['', priceRowsText] : []),
      '',
      extraText,
      '',
      cancelText,
      '',
      'Até já,',
      'Equipa Ericeira Wave House',
      'ericeirawavehouse@gmail.com',
      'Ericeira, Portugal',
    ].join('\n');

    html = `
      <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
        <p>Olá ${firstName},</p>
        <p><strong>${introLine}</strong></p>
        <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
          <tr><td style="padding:4px 0;color:#666;">Data</td><td style="padding:4px 0;text-align:right;">${formatDate(surfDate)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Pessoas</td><td style="padding:4px 0;text-align:right;">${peopleLine}</td></tr>
        </table>
        ${hasPrice ? `<table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">${priceRowsHtml}</table>` : ''}
        <p>${extraText}</p>
        <p style="color:#666; font-size:13px;">${cancelText}</p>
        <p>Até já,<br/>
        Equipa Ericeira Wave House<br/>
        ericeirawavehouse@gmail.com<br/>
        Ericeira, Portugal</p>
      </div>
    `;
  }

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to,
      replyTo: 'ericeirawavehouse@gmail.com',
      subject,
      text,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
