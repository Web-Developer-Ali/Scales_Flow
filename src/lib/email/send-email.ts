import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "SalesFlow <notifications@yourdomain.com>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    // Email is non-critical — log but never throw
    console.error("Failed to send email:", err);
    return false;
  }
}
