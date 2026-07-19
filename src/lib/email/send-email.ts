// ⚠️ DEPRECATED — this file used to hardcode its own Resend client, bypassing
// your DB/env-configured settings entirely. Anything importing from here was
// silently ignoring admin configuration (provider choice, from-address,
// enabled/disabled state) and had zero retry logic.
//
// Everything now lives in `email-provider.ts`. This file just re-exports the
// non-critical sender so existing imports don't break immediately — please
// update call sites to import from "./email-provider" directly and then
// delete this file.

export { sendEmail } from "./email-provider";
