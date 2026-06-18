import { Resend } from 'resend'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo non consentito' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(200).json({ ok: false, error: 'Email non configurata' })
  }

  const { to, title, due_date, category, notes } = req.body

  if (!to || !title || !due_date) {
    return res.status(400).json({ ok: false, error: 'Parametri mancanti' })
  }

  const formattedDate = due_date.split('-').reverse().join('/')
  const categoryLabel = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Altro'

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Promemoria sanitario</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0d9488;padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:0.85;">Cartella Clinica</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Promemoria sanitario</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Questo è un promemoria dalla tua <strong>Cartella Clinica</strong>. Ti ricordiamo il seguente appuntamento o scadenza:
              </p>

              <!-- Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdfa;border-left:4px solid #0d9488;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h2 style="margin:0 0 16px;color:#134e4a;font-size:18px;font-weight:700;">${title}</h2>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="display:inline-block;background-color:#ccfbf1;color:#0f766e;font-size:12px;font-weight:600;padding:3px 10px;border-radius:99px;letter-spacing:0.5px;">${categoryLabel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 4px;">
                          <p style="margin:0;color:#374151;font-size:14px;">
                            <strong style="color:#0f766e;">Data scadenza:</strong>&nbsp; ${formattedDate}
                          </p>
                        </td>
                      </tr>
                      ${notes ? `
                      <tr>
                        <td style="padding:4px 0;">
                          <p style="margin:0;color:#374151;font-size:14px;">
                            <strong style="color:#0f766e;">Note:</strong>&nbsp; ${notes}
                          </p>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
                Ricordati di contattare il tuo medico o la struttura sanitaria per confermare l'appuntamento.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Questo messaggio è stato inviato automaticamente dalla tua Cartella Clinica personale.<br/>
                Non rispondere a questa email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: 'noreply@resend.dev',
      to,
      subject: `Promemoria: ${title} — ${formattedDate}`,
      html,
    })

    if (error) {
      return res.status(200).json({ ok: false, error: error.message || 'Errore durante l\'invio' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Errore del server' })
  }
}
