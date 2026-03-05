import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, body, from }) {
  const transport = getTransporter();

  const result = await transport.sendMail({
    from: from || process.env.SMTP_USER,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  });

  return {
    messageId: result.messageId,
    accepted: result.accepted,
  };
}
