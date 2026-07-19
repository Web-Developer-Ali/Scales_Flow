import { query } from "@/lib/db";

// If we generate + store an OTP but the email ultimately fails to send
// (after all retries/failover), the OTP row is still sitting there with a
// live expiry — which trips the "existing OTP still valid" rate-limit guard
// and locks the user out of requesting a new one for up to 24h, even though
// they never received the original code. Call these on final send failure
// to clear the OTP so the user can immediately try again.

export async function clearRegistrationOtp(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE users
       SET email_otp = NULL,
           email_otp_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );
  } catch (err) {
    console.error(
      "[OTP] Failed to roll back email_otp after send failure:",
      err,
    );
  }
}

export async function clearPasswordResetOtp(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE users
       SET reset_password_otp = NULL,
           reset_password_otp_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );
  } catch (err) {
    console.error(
      "[OTP] Failed to roll back reset_password_otp after send failure:",
      err,
    );
  }
}
