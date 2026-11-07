// Email is off in tests that are not about email: no transport, no event rows.
module.exports={notifyReservation:async()=>'skipped',emailsEnabled:()=>false};
