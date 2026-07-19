import { sendCriticalEmail } from "./email-provider";

interface OtpEmailResponse {
  success: boolean;
  message: string;
}

function otpHtmlTemplate(title: string, body: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #111;">${title}</h2>
      ${body}
      <p style="margin-top: 24px; color: #999; font-size: 13px;">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `;
}

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

    const emailContent = otpHtmlTemplate(
      "Verify Your Email",
      `
        <p>Thank you for registering. Use the OTP below to verify your email address:</p>
        <h1 style="letter-spacing: 4px; color: #4CAF50;">${otp}</h1>
        <p>${expiryMessage}</p>
        <p>
          Or click the link below to verify directly:
          <br />
          <a href="${verificationLink}" style="color: #1a73e8; text-decoration: none;">
            Verify Email
          </a>
        </p>
      `,
    );

    const result = await sendCriticalEmail({
      to: toEmail,
      subject: "Email Verification OTP",
      html: emailContent,
    });

    if (!result.success) {
      console.error(
        `[OTP] Registration OTP to ${toEmail} failed after ${result.attempts} attempt(s):`,
        result.error,
      );
    }

    return {
      success: result.success,
      message: result.success
        ? "OTP email sent successfully."
        : "We couldn't send your verification email right now. Please try again in a moment.",
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
): Promise<OtpEmailResponse> {
  try {
    const emailContent = otpHtmlTemplate(
      "Reset Your Password",
      `
        <p>You requested a password reset for your SalesFlow account.</p>
        <p>Use the code below to reset your password:</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #666; font-weight: 500;">
            YOUR RESET CODE
          </p>
          <h1 style="margin: 0; font-size: 40px; letter-spacing: 10px; color: #111; font-family: monospace;">
            ${otp}
          </h1>
          <p style="margin: 12px 0 0; font-size: 12px; color: #999;">
            Expires in 10 minutes
          </p>
        </div>
        <p>Or click the link below to go directly to the reset page:</p>
        <a href="${resetLink}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Reset Password →
        </a>
      `,
    );

    const result = await sendCriticalEmail({
      to: toEmail,
      subject: "Reset Your SalesFlow Password",
      html: emailContent,
    });

    if (!result.success) {
      console.error(
        `[OTP] Password reset OTP to ${toEmail} failed after ${result.attempts} attempt(s):`,
        result.error,
      );
    }

    return {
      success: result.success,
      message: result.success
        ? "Reset code sent successfully."
        : "We couldn't send your reset email right now. Please try again in a moment.",
    };
  } catch (error) {
    console.error("Error sending reset OTP email:", error);
    return { success: false, message: "Failed to send reset email." };
  }
}
