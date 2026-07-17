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
    surfDate, isPrivate,
    guestsCount, childrenCount,
    priceSubtotal, discountAmount, discountLabel, priceTotal,
    packageName, packageNameEn, lessonsTotal, expiresAt,
    lang, attachment,
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

  const isEn = lang === 'en';
  const hasPrice = priceTotal != null;
  const total = hasPrice ? Number(priceTotal).toFixed(2) : null;
  const expiresDateStr = expiresAt ? formatDate(expiresAt.slice(0, 10)) : null;

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

    const displayName = (guestName || '').trim() || (isEn ? 'Guest' : 'Hóspede');
    const balancePercent = 100 - depositPercent;
    const depositAmount = hasPrice ? (Number(priceTotal) * depositPercent / 100).toFixed(2) : null;

    if (isEn) {
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
    } else {
      subject = 'O teu pedido de reserva - Dados do Sinal - Ericeira Wave House';

      text = [
        `Caro(a) ${displayName},`,
        '',
        'Obrigado pelo teu pedido de reserva e por escolheres a Ericeira Wave House.',
        '',
        'Resumo da Reserva',
        `- Check-in: ${formatDate(checkIn)}`,
        `- Check-out: ${formatDate(checkOut)}`,
        `- Hóspedes: ${guestsCount || '-'}`,
        ...(hasPrice ? [`- Valor Total: €${total}`] : []),
        '',
        hasPrice
          ? `Para garantir a tua reserva, pedimos um sinal de ${depositPercent}% (€${depositAmount}).`
          : `Para garantir a tua reserva, pedimos um sinal de ${depositPercent}%.`,
        '',
        'Se quiseres avançar com a reserva, basta responderes a este email a confirmar. De seguida enviamos a fatura do sinal. Assim que o pagamento for recebido, confirmamos a tua reserva e enviamos o respetivo recibo.',
        '',
        `Os restantes ${balancePercent}% são pagos no dia do check-in.`,
        '',
        'Dados Bancários',
        `Nome da Conta: ${bankAccountName || '-'}`,
        `IBAN: ${bankIban || '-'}`,
        `BIC/SWIFT: ${bankBic || '-'}`,
        '',
        'Se tiveres alguma dúvida antes da tua estadia, contacta-nos à vontade. Teremos todo o gosto em ajudar.',
        '',
        'Esperamos ansiosamente por te receber na Ericeira.',
        '',
        'Com os melhores cumprimentos,',
        '',
        'Carolina & Nuno',
        'Ericeira Wave House',
        'ericeirawavehouse@gmail.com',
        'Ericeira, Portugal',
      ].join('\n');

      html = `
        <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
          <p>Caro(a) ${displayName},</p>
          <p>Obrigado pelo teu pedido de reserva e por escolheres a <strong>Ericeira Wave House</strong>.</p>

          <p style="font-weight:600; margin-bottom:8px;">Resumo da Reserva</p>
          <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
            <tr><td style="padding:4px 0;color:#666;">Check-in</td><td style="padding:4px 0;text-align:right;">${formatDate(checkIn)}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Check-out</td><td style="padding:4px 0;text-align:right;">${formatDate(checkOut)}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Hóspedes</td><td style="padding:4px 0;text-align:right;">${guestsCount || '-'}</td></tr>
            ${hasPrice ? `<tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Valor Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>` : ''}
          </table>

          <div style="background:#f6f6f4; border-radius:12px; padding:16px 20px; margin-bottom:20px;">
            <p style="margin:0 0 8px;">${hasPrice
              ? `Para garantir a tua reserva, pedimos um sinal de <strong>${depositPercent}% (€${depositAmount})</strong>.`
              : `Para garantir a tua reserva, pedimos um sinal de <strong>${depositPercent}%</strong>.`}</p>
            <p style="margin:0; font-size:13px; color:#555;">Os restantes ${balancePercent}% são pagos no dia do check-in.</p>
          </div>

          <p>Se quiseres avançar com a reserva, basta responderes a este email a confirmar. De seguida enviamos a fatura do sinal. Assim que o pagamento for recebido, confirmamos a tua reserva e enviamos o respetivo recibo.</p>

          <p style="font-weight:600; margin:20px 0 8px;">Dados Bancários</p>
          <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 0 0 20px;">
            <tr><td style="padding:4px 0;color:#666;">Nome da Conta</td><td style="padding:4px 0;text-align:right;">${bankAccountName || '-'}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">IBAN</td><td style="padding:4px 0;text-align:right;">${bankIban || '-'}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">BIC/SWIFT</td><td style="padding:4px 0;text-align:right;">${bankBic || '-'}</td></tr>
          </table>

          <p>Se tiveres alguma dúvida antes da tua estadia, contacta-nos à vontade. Teremos todo o gosto em ajudar.</p>
          <p>Esperamos ansiosamente por te receber na Ericeira.</p>

          <p>Com os melhores cumprimentos,<br/><br/>
          Carolina &amp; Nuno<br/>
          Ericeira Wave House<br/>
          ericeirawavehouse@gmail.com<br/>
          Ericeira, Portugal</p>
        </div>
      `;
    }
  } else if (type === 'surf_package') {
    const firstName = (guestName || '').split(' ')[0] || (isEn ? 'there' : 'olá');

    if (isEn) {
      subject = 'Your surf lesson package has been confirmed! - Ericeira Wave House';
      const displayPackageName = packageNameEn || packageName || '-';
      const introLine = `Your request for the "${displayPackageName}" package has been confirmed!`;

      text = [
        `Hi ${firstName},`,
        '',
        introLine,
        '',
        `Lessons included: ${lessonsTotal ?? '-'}`,
        ...(hasPrice ? [`Total amount: €${total}`] : []),
        ...(expiresDateStr ? [`Valid until: ${expiresDateStr}`] : []),
        '',
        'We\'ll get in touch with you to arrange payment. Once confirmed, simply book your lessons through the booking form on the site, using the same email - the lessons will be automatically deducted from your package.',
        '',
        'If for any reason you need to cancel, please email us to arrange the next steps.',
        '',
        'See you soon,',
        'Ericeira Wave House Team',
        'ericeirawavehouse@gmail.com',
        'Ericeira, Portugal',
      ].join('\n');

      html = `
        <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
          <p>Hi ${firstName},</p>
          <p><strong>${introLine}</strong></p>
          <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
            <tr><td style="padding:4px 0;color:#666;">Lessons included</td><td style="padding:4px 0;text-align:right;">${lessonsTotal ?? '-'}</td></tr>
            ${hasPrice ? `<tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total amount</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>` : ''}
            ${expiresDateStr ? `<tr><td style="padding:4px 0;color:#666;">Valid until</td><td style="padding:4px 0;text-align:right;">${expiresDateStr}</td></tr>` : ''}
          </table>
          <p>We'll get in touch with you to arrange payment. Once confirmed, simply book your lessons through the booking form on the site, using the same email - the lessons will be automatically deducted from your package.</p>
          <p style="color:#666; font-size:13px;">If for any reason you need to cancel, please email us to arrange the next steps.</p>
          <p>See you soon,<br/>
          Ericeira Wave House Team<br/>
          ericeirawavehouse@gmail.com<br/>
          Ericeira, Portugal</p>
        </div>
      `;
    } else {
      subject = 'O teu pacote de aulas de surf foi confirmado! - Ericeira Wave House';
      const introLine = `O teu pedido do pacote "${packageName || '-'}" foi confirmado!`;

      text = [
        `Olá ${firstName},`,
        '',
        introLine,
        '',
        `Aulas incluídas: ${lessonsTotal ?? '-'}`,
        ...(hasPrice ? [`Valor total: €${total}`] : []),
        ...(expiresDateStr ? [`Válido até: ${expiresDateStr}`] : []),
        '',
        'Vamos entrar em contacto contigo para combinarmos o pagamento. Depois de confirmado, basta reservares as tuas aulas através do formulário de reserva do site, usando o mesmo email - as aulas serão automaticamente descontadas do teu pacote.',
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
            ${expiresDateStr ? `<tr><td style="padding:4px 0;color:#666;">Válido até</td><td style="padding:4px 0;text-align:right;">${expiresDateStr}</td></tr>` : ''}
          </table>
          <p>Vamos entrar em contacto contigo para combinarmos o pagamento. Depois de confirmado, basta reservares as tuas aulas através do formulário de reserva do site, usando o mesmo email - as aulas serão automaticamente descontadas do teu pacote.</p>
          <p style="color:#666; font-size:13px;">Se por algum motivo precisares de cancelar, contacta-nos por email para combinarmos os próximos passos.</p>
          <p>Até já,<br/>
          Equipa Ericeira Wave House<br/>
          ericeirawavehouse@gmail.com<br/>
          Ericeira, Portugal</p>
        </div>
      `;
    }
  } else {
    const firstName = (guestName || '').split(' ')[0] || (isEn ? 'there' : 'olá');
    const hasDiscount = hasPrice && discountAmount > 0;
    const subtotal = hasPrice ? Number(priceSubtotal ?? priceTotal).toFixed(2) : null;
    const discount = hasPrice ? Number(discountAmount ?? 0).toFixed(2) : null;

    if (isEn) {
      const peopleLine = childrenCount > 0
        ? `${guestsCount || '-'} people (${childrenCount} ${childrenCount === 1 ? 'child' : 'children'})`
        : `${guestsCount || '-'}`;

      subject = isPrivate ? 'Your private surf lesson has been confirmed! - Ericeira Wave House' : 'Your surf lesson has been confirmed! - Ericeira Wave House';
      const introLine = isPrivate ? 'Your private surf lesson at Ericeira Wave House has been confirmed!' : 'Your surf lesson at Ericeira Wave House has been confirmed!';
      const extraText = 'We\'ll get in touch with you, usually the evening before the lesson, to arrange the exact time - this allows us to assess the tides and sea conditions as accurately as possible. Don\'t worry if you don\'t hear from us before that, that\'s just how it usually works.';
      const cancelText = 'If for any reason you need to cancel, please email us to arrange the next steps.';

      const priceRowsText = !hasPrice
        ? ''
        : hasDiscount
          ? `Subtotal: €${subtotal}\n${discountLabel || 'Discount'}: -€${discount}\nTotal: €${total}`
          : `Total: €${total}`;

      const priceRowsHtml = !hasPrice
        ? ''
        : hasDiscount
          ? `
          <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="padding:4px 0;text-align:right;">€${subtotal}</td></tr>
          <tr><td style="padding:4px 0;color:#059669;">${discountLabel || 'Discount'}</td><td style="padding:4px 0;text-align:right;color:#059669;">-€${discount}</td></tr>
          <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>
        `
          : `
          <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #eee;">€${total}</td></tr>
        `;

      text = [
        `Hi ${firstName},`,
        '',
        introLine,
        '',
        ...(isPrivate ? ['Type: Private lesson'] : []),
        `Date: ${formatDate(surfDate)}`,
        `People: ${peopleLine}`,
        ...(hasPrice ? ['', priceRowsText] : []),
        '',
        extraText,
        '',
        cancelText,
        '',
        'See you soon,',
        'Ericeira Wave House Team',
        'ericeirawavehouse@gmail.com',
        'Ericeira, Portugal',
      ].join('\n');

      html = `
        <div style="font-family: -apple-system, Arial, sans-serif; color: #1c1c1c; max-width: 480px;">
          <p>Hi ${firstName},</p>
          <p><strong>${introLine}</strong></p>
          <table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
            ${isPrivate ? '<tr><td style="padding:4px 0;color:#666;">Type</td><td style="padding:4px 0;text-align:right;">Private lesson</td></tr>' : ''}
            <tr><td style="padding:4px 0;color:#666;">Date</td><td style="padding:4px 0;text-align:right;">${formatDate(surfDate)}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">People</td><td style="padding:4px 0;text-align:right;">${peopleLine}</td></tr>
          </table>
          ${hasPrice ? `<table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">${priceRowsHtml}</table>` : ''}
          <p>${extraText}</p>
          <p style="color:#666; font-size:13px;">${cancelText}</p>
          <p>See you soon,<br/>
          Ericeira Wave House Team<br/>
          ericeirawavehouse@gmail.com<br/>
          Ericeira, Portugal</p>
        </div>
      `;
    } else {
      const peopleLine = childrenCount > 0
        ? `${guestsCount || '-'} pessoas (${childrenCount} criança${childrenCount === 1 ? '' : 's'})`
        : `${guestsCount || '-'}`;

      subject = isPrivate ? 'A tua aula privada de surf foi confirmada! - Ericeira Wave House' : 'A tua aula de surf foi confirmada! - Ericeira Wave House';
      const introLine = isPrivate ? 'A tua aula privada de surf na Ericeira Wave House foi confirmada!' : 'A tua aula de surf na Ericeira Wave House foi confirmada!';
      const extraText = 'Vamos entrar em contacto contigo, normalmente na noite anterior à aula, para combinarmos a hora exata - isto permite-nos avaliar as marés e as condições do mar com a maior precisão possível. Não estranhes se não tiveres notícias nossas antes disso, é mesmo assim que costuma funcionar.';
      const cancelText = 'Se por algum motivo precisares de cancelar, contacta-nos por email para combinarmos os próximos passos.';

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
        ...(isPrivate ? ['Tipo: Aula privada'] : []),
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
            ${isPrivate ? '<tr><td style="padding:4px 0;color:#666;">Tipo</td><td style="padding:4px 0;text-align:right;">Aula privada</td></tr>' : ''}
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
  }

  try {
    await transporter.sendMail({
      from: `"Ericeira Wave House" <${process.env.SMTP_USER}>`,
      to,
      replyTo: 'ericeirawavehouse@gmail.com',
      subject,
      text,
      html,
      attachments: attachment
        ? [{ filename: attachment.filename, content: Buffer.from(attachment.contentBase64, 'base64'), contentType: attachment.contentType }]
        : undefined,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}
