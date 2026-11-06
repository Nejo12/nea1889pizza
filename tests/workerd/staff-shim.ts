// Test-only stand-in for lib/staff.ts. The real module pulls in Clerk (being retired, #12), which is
// unrelated to the database/runtime question. Only `database` is needed by booking-store and the guest route.
export {database} from '../../lib/database';
