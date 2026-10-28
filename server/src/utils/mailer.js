import nodemailer from 'nodemailer';

let transporter = null;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes }) {
  const subject = 'Reset your HumanLine password';
  const text = [
    `Hi ${name},`,
    '',
    'Someone requested a password reset for your HumanLine account.',
    `Open the link below within ${expiresInMinutes} minutes to choose a new password:`,
    resetUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  return getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'HumanLine <no-reply@hrms.local>',
    to,
    subject,
    text,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2563eb">HumanLine</h2>
        <p>Hi ${String(name).replace(/[<>&"]/g, '')},</p>
        <p>Someone requested a password reset for your HumanLine account.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
        <p style="color:#64748b;font-size:13px">This link expires in ${expiresInMinutes} minutes. If you did not request this, ignore this email.</p>
      </div>`,
  });
}
