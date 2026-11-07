const {test}=require('node:test');const assert=require('node:assert/strict');const ts=require('typescript');const fs=require('node:fs');
// Issue #13: browser-side availability loader. Advisory only; stale responses must never win.
function load(path){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(require,m,m.exports);return m.exports;}
const {createAvailabilityLoader,summarize}=load('lib/site/availability-client.ts');
const body=(date,guests,statuses)=>({date,guests,advisory:true,slots:statuses.map((status,i)=>({time:'1'+i+':00',status}))});
const ok=b=>({ok:true,status:200,json:async()=>b});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const tick=()=>new Promise(r=>setImmediate(r));
function harness(fetchImpl){const states=[];const loader=createAvailabilityLoader(s=>states.push(s),fetchImpl);return{loader,states,last:()=>states.at(-1)}}

test('requests the existing endpoint with date and guests, reports loading then ready',async()=>{
  const urls=[];const h=harness(async url=>{urls.push(String(url));return ok(body('2099-11-02',4,['available','full']))});
  h.loader.load('2099-11-02',4);assert.equal(h.last().phase,'loading');await tick();
  assert.deepEqual(urls,['/api/availability?date=2099-11-02&guests=4']);
  assert.equal(h.last().phase,'ready');assert.deepEqual(h.last().slots.map(s=>s.status),['available','full'])});

test('a slow outdated response cannot overwrite a newer selection',async()=>{
  const first=deferred(),second=deferred();const queue=[first,second];
  const h=harness(()=>queue.shift().promise);
  h.loader.load('2099-11-02',2);h.loader.load('2099-11-03',5);
  second.resolve(ok(body('2099-11-03',5,['available'])));await tick();
  first.resolve(ok(body('2099-11-02',2,['full'])));await tick();
  assert.equal(h.last().phase,'ready');assert.equal(h.last().slots[0].status,'available');
  assert.ok(!h.states.some(s=>s.phase==='ready'&&s.slots[0].status==='full'))});

test('a stale failure cannot replace newer results with an error',async()=>{
  const first=deferred(),second=deferred();const queue=[first,second];const h=harness(()=>queue.shift().promise);
  h.loader.load('2099-11-02',2);h.loader.load('2099-11-03',2);
  second.resolve(ok(body('2099-11-03',2,['available'])));await tick();first.reject(new TypeError('offline'));await tick();
  assert.equal(h.last().phase,'ready')});

test('starting a new request aborts the previous one',async()=>{
  const signals=[];const h=harness((url,init)=>{signals.push(init.signal);return new Promise(()=>{})});
  h.loader.load('2099-11-02',2);h.loader.load('2099-11-03',2);
  assert.equal(signals[0].aborted,true);assert.equal(signals[1].aborted,false)});

test('network failure, server error and malformed bodies become error states; retry recovers',async()=>{
  let mode='network';const h=harness(async()=>{
    if(mode==='network')throw new TypeError('offline');
    if(mode==='server')return{ok:false,status:503,json:async()=>({code:'unavailable'})};
    if(mode==='bad')return ok({slots:'nope'});
    if(mode==='mismatch')return ok(body('2099-12-24',2,['available']));
    return ok(body('2099-11-02',2,['available']))});
  for(const m of ['network','server','bad','mismatch']){mode=m;h.loader.load('2099-11-02',2);await tick();assert.equal(h.last().phase,'error',m)}
  mode='good';h.loader.load('2099-11-02',2);await tick();assert.equal(h.last().phase,'ready')});

test('cancel (unmount) aborts and silences late responses',async()=>{
  const d=deferred();let signal;const h=harness((u,init)=>{signal=init.signal;return d.promise});
  h.loader.load('2099-11-02',2);const n=h.states.length;h.loader.cancel();d.resolve(ok(body('2099-11-02',2,['available'])));await tick();
  assert.equal(signal.aborted,true);assert.equal(h.states.length,n)});

test('summarize distinguishes bookable, full, closed, past and empty days',()=>{
  const s=a=>a.map(status=>({time:'12:00',status}));
  assert.equal(summarize(s(['past','available','full'])),'open');
  assert.equal(summarize(s(['full','full','past'])),'full');
  assert.equal(summarize(s(['closed','closed'])),'closed');
  assert.equal(summarize(s(['past','past'])),'past');
  assert.equal(summarize([]),'empty')});
