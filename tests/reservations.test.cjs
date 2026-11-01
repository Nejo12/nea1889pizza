const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
function load(path,overrides={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>name in overrides?overrides[name]:require(name),m,m.exports);return m.exports;}
const rules=load('lib/reservation-rules.ts');
const base={requestId:crypto.randomUUID(),name:'Test Gast',email:'test@example.com',phone:'+49 12345678',date:'2026-10-27',time:'19:00',guests:2,notes:''};
for(const [label,now,expected] of [['winter','2026-10-27T17:59:00Z',true],['same minute','2026-10-27T18:00:00Z',false],['past time','2026-10-27T18:01:00Z',false],['summer','2026-07-27T17:01:00Z',false]]){
 test('Berlin time: '+label,()=>assert.equal(rules.isFutureSlot(label==='summer'?'2026-07-27':base.date,base.time,new Date(now)),expected));
}
test('Berlin day crosses UTC midnight',()=>assert.equal(rules.berlinClock(new Date('2026-10-27T23:30:00Z')).date,'2026-10-28'));
test('Reject impossible dates and accept leap day',()=>{assert.equal(rules.isRealDate('2026-02-30'),false);assert.equal(rules.isRealDate('2028-02-29'),true);assert.equal(rules.blockSchema.safeParse({action:'block',date:'2026-02-30'}).success,false)});
test('Validate contact and group limits',()=>{const s=rules.reservationSchema(new Date('2026-10-27T10:00:00Z'));assert.equal(s.safeParse(base).success,true);for(const patch of [{guests:0},{guests:13},{guests:2.5},{phone:'abcde'},{email:'bad'},{date:'2026-10-26'},{time:'22:00'}])assert.equal(s.safeParse({...base,...patch}).success,false)});
test('Confirmed totals exclude pending and cancelled',()=>assert.deepEqual(rules.confirmedParty(['pending','confirmed','arrived','cancelled','noshow'].map(status=>({status}))).map(r=>r.status),['confirmed','arrived']));
test('Weekday schedule includes lunch, excludes closing time',()=>{const times=rules.slotsForDate('2026-10-27');assert.equal(times[0],'11:30');assert.equal(times.at(-1),'21:00');assert.equal(times.length,20);assert.equal(times.includes('21:30'),false)});
test('Saturday opens at 15:30, closes at 22:00',()=>{const times=rules.slotsForDate('2026-10-31');assert.equal(times[0],'15:30');assert.equal(times.at(-1),'21:30');assert.equal(times.length,13);assert.equal(times.includes('11:30'),false);assert.equal(times.includes('22:00'),false)});
test('Sunday follows ordinary opening times',()=>assert.equal(rules.slotsForDate('2026-11-01')[0],'11:30'));
test('Server rejects Saturday lunch and accepts weekday lunch',()=>{const schema=rules.reservationSchema(new Date('2026-10-26T07:00:00Z'));assert.equal(schema.safeParse({...base,date:'2026-10-31',time:'12:00'}).success,false);assert.equal(schema.safeParse({...base,date:'2026-10-27',time:'12:00'}).success,true)});
test('Screenshot table inventory totals',()=>{const inside=rules.restaurantTables.filter(t=>t.area==='Innenbereich');const outside=rules.restaurantTables.filter(t=>t.area==='Terrasse');assert.equal(inside.length,13);assert.equal(outside.length,7);assert.equal(inside.reduce((s,t)=>s+t.seats,0),30);assert.equal(outside.reduce((s,t)=>s+t.seats,0),24)});

test('Last arrivals and maximum table duration stay independent of closing',()=>{assert.equal(rules.openingHours('2026-10-27').lastArrival,'21:00');assert.equal(rules.openingHours('2026-10-31').lastArrival,'21:30');assert.equal(rules.maxTableMinutes,75);assert.equal(rules.tableEndTime('21:00'),'22:15');assert.equal(rules.tableEndTime('21:30'),'22:45')});
