// Pure staff-login helpers. The Supabase Auth service owns OTP generation, expiry and attempt limits.
export const STAFF_OTP_LENGTH=6;
export const STAFF_OTP_RESEND_SECONDS=60;
export function normalizeStaffEmail(value:string){return value.trim().toLowerCase();}
export function isValidStaffOtp(value:string){return /^[0-9]{6}$/.test(value);}
