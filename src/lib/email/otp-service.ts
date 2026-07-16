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
  verificationLink: string,
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

export async function sendPasswordResetOtp(
  toEmail: string,
  otp: string,
  resetLink: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 480px;">
        <h2 style="color: #111;">Reset Your Password</h2>
        <p>You requested a password reset for your SalesFlow account.</p>
        <p>Use the code below to reset your password:</p>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px;
                    text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #666; font-weight: 500;">
            YOUR RESET CODE
          </p>
          <h1 style="margin: 0; font-size: 40px; letter-spacing: 10px;
                     color: #111; font-family: monospace;">
            ${otp}
          </h1>
          <p style="margin: 12px 0 0; font-size: 12px; color: #999;">
            Expires in 10 minutes
          </p>
        </div>

        <p>Or click the link below to go directly to the reset page:</p>
        <a href="${resetLink}"
           style="display: inline-block; background: #111; color: #fff;
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  font-weight: 600; font-size: 14px;">
          Reset Password →
        </a>

        <p style="margin-top: 24px; color: #999; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
          Your password will not change.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"SalesFlow" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "Reset Your SalesFlow Password",
      html: emailContent,
    });

    return { success: true, message: "Reset code sent successfully." };
  } catch (error) {
    console.error("Error sending reset OTP email:", error);
    return { success: false, message: "Failed to send reset email." };
  }
}
