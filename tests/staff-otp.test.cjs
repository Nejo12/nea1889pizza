const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');

function loadOtpHelpers(){
 const source=fs.readFileSync('lib/staff-otp.ts','utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 new Function('module','exports',code)(mod,mod.exports);
 return mod.exports;
}

test('staff OTP accepts exactly six ASCII digits and rejects malformed codes',()=>{
 const {isValidStaffOtp,STAFF_OTP_LENGTH}=loadOtpHelpers();
 assert.equal(STAFF_OTP_LENGTH,6);
 for(const value of ['012345','123456','999999'])assert.equal(isValidStaffOtp(value),true,value);
 for(const value of ['','1234','12345','1234567','00000a','12 3456','１２３４５６','123456\\n',' 123456'])assert.equal(isValidStaffOtp(value),false,JSON.stringify(value));
});

test('staff email is normalized before requesting an OTP',()=>{
 const {normalizeStaffEmail}=loadOtpHelpers();
 assert.equal(normalizeStaffEmail('  Staff@Example.COM  '),'staff@example.com');
});

test('staff OTP form uses existing-user Supabase Auth and no password sign-in',()=>{
 const src=fs.readFileSync('app/(legacy)/login/login.tsx','utf8');
 assert.match(src,/auth\\.signInWithOtp\\(/);
 assert.match(src,/shouldCreateUser:\\s*false/,'public signup must remain disabled');
 assert.match(src,/auth\\.verifyOtp\\(/);
 assert.match(src,/type:\\s*['"]email['"]/);
 assert.match(src,/autoComplete=['"]one-time-code['"]/);
 assert.match(src,/STAFF_OTP_RESEND_SECONDS/);
 assert.doesNotMatch(src,/signInWithPassword|signUp\\(|type="password"/);
});

test('verified staff access stays server-side and membership-gated',()=>{
 const src=fs.readFileSync('lib/staff.ts','utf8');
 assert.match(src,/supabase\\.auth\\.getUser\\(/);
 assert.match(src,/staff_members WHERE user_id=\\? AND active=true/);
 const route=fs.readFileSync('app/api/staff/session/route.ts','utf8');
 assert.match(route,/staffFromRequest/);
 assert.match(route,/no-store/);
});
