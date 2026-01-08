import nodemailer from "nodemailer";

interface OtpEmailResponse {
  success: boolean;
  message: string;
}

/**
 * Sends a registration OTP email
 */
export async function sendRegistrationOtp(
  toEmail: string,
  role: "admin" | "manager" | "scales_man",
  otp: string,
  verificationLink: string
): Promise<OtpEmailResponse> {
  try {
    const expiryMessage =
      role === "admin"
        ? "This OTP will expire in 10 minutes."
        : "This OTP will expire in 24 hours.";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello,</h2>
        <p>Thank you for registering. Please use the OTP below to verify your email:</p>
        <h1 style="letter-spacing: 4px; color: #4CAF50;">${otp}</h1>
        <p>${expiryMessage}</p>
        <p>
          Or click the link below to verify directly:
          <br />
          <a href="${verificationLink}" style="color: #1a73e8;">
            Verify Email
          </a>
        </p>
        <p>If you did not request this, please ignore this email.</p>
        <br />
        <p>— Your Company Team</p>
      </div>
    `;

    const mailOptions = {
      from: `"Your Company" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "Email Verification OTP",
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "OTP email sent successfully.",
    };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return {
      success: false,
      message: "Failed to send OTP email.",
    };
  }
}
