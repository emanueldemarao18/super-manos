async page => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/tools/online-test.html?auto=1');
  const both = async predicate => page.waitForFunction(predicate, null, {timeout: 25000});
  await both(() => [...document.querySelectorAll('iframe')].every(f => f.contentWindow.SM?.Net.connected));
  const state = () => page.evaluate(() => [...document.querySelectorAll('iframe')].map(f => {
    const {App, Net} = f.contentWindow.SM;
    return {role: Net.role, screen: App.S.screen, code: Net.code, connected: Net.connected, error: Net.error, fighters: App.S.battle?.fighters.map(p => ({x:p.x,hp:p.hp})), result:App.S.result};
  }));
  const key = async (role, code, duration = 90) => {
    await page.evaluate(({role,code}) => { const w=[...document.querySelectorAll('iframe')].map(f=>f.contentWindow).find(w=>w.SM.Net.role===role); w.dispatchEvent(new w.KeyboardEvent('keydown',{code})); }, {role,code});
    await page.waitForTimeout(duration);
    await page.evaluate(({role,code}) => { const w=[...document.querySelectorAll('iframe')].map(f=>f.contentWindow).find(w=>w.SM.Net.role===role); w.dispatchEvent(new w.KeyboardEvent('keyup',{code})); }, {role,code});
    await page.waitForTimeout(100);
  };
  await key('host','Enter'); await key('guest','Enter');
  await both(() => [...document.querySelectorAll('iframe')].every(f=>f.contentWindow.SM.App.S.screen==='stage'));
  await key('host','Enter');
  await both(() => [...document.querySelectorAll('iframe')].every(f=>f.contentWindow.SM.App.S.battle?.phase==='fight'));
  const before = await state();
  await key('guest','KeyA',450);
  const moved = await state();
  if (!(moved[0].fighters[1].x < before[0].fighters[1].x-20)) throw Error('Remote movement did not reach host');
  if (Math.abs(moved[0].fighters[1].x-moved[1].fighters[1].x)>6) throw Error('Position snapshots disagree');
  await page.evaluate(()=> {const s=[...document.querySelectorAll('iframe')].map(f=>f.contentWindow.SM).find(s=>s.Net.role==='host'); const fs=s.App.S.battle.fighters; fs[0].x=320; fs[1].x=360; fs[0].hp=1000;});
  await key('guest','KeyG');
  await page.waitForTimeout(700);
  const hit = await state();
  if (hit[0].fighters[0].hp>=1000 || hit[0].fighters[0].hp!==hit[1].fighters[0].hp) throw Error('Remote hit/damage did not synchronize');
  await page.evaluate(()=> {const s=[...document.querySelectorAll('iframe')].map(f=>f.contentWindow.SM).find(s=>s.Net.role==='host'); const fs=s.App.S.battle.fighters; fs[0].x=320; fs[1].x=360; fs[0].hp=1; fs[1].wins=1;});
  await key('guest','KeyG');
  await both(()=> [...document.querySelectorAll('iframe')].every(f=>f.contentWindow.SM.App.S.screen==='result'));
  const result = await state();
  if (JSON.stringify(result[0].result)!==JSON.stringify(result[1].result)) throw Error('Results disagree');
  await page.screenshot({path:'/private/tmp/manos-online-result.png'});
  await page.evaluate(()=> {const s=[...document.querySelectorAll('iframe')].map(f=>f.contentWindow.SM).find(s=>s.Net.role==='guest'); s.Net.leave();});
  await both(()=>document.querySelector('#host').contentWindow.SM.App.S.screen==='netError');
  const disconnect = await state();
  for (let round=0;round<2;round++) {
    await page.evaluate(()=> {for(const f of document.querySelectorAll('iframe')) {const s=f.contentWindow.SM;s.Net.leave();Object.assign(s.App.S,{mode:null,guest:false,battle:null,screen:'search'});s.Net.random();}});
    await both(()=> [...document.querySelectorAll('iframe')].every(f=>f.contentWindow.SM.Net.connected));
    const pair=await state();
    if (pair[0].code!==pair[1].code || pair[0].role===pair[1].role) throw Error('Random pairing failed');
  }
  await page.evaluate(()=> {for(const f of document.querySelectorAll('iframe')) {const s=f.contentWindow.SM;s.Net.leave();Object.assign(s.App.S,{mode:null,guest:false,screen:'online'});} const s=document.querySelector('#host').contentWindow.SM;s.Net.random();s.Net.leave();s.Net.host();s.App.S.screen='host';});
  await both(()=>document.querySelector('#host').contentWindow.SM.Net.ready);
  const cancel = await state();
  if (cancel[0].error || cancel[0].role!=='host') throw Error('Stale search callback damaged replacement room');
  await page.evaluate(()=>{const s=document.querySelector('#guest').contentWindow.SM;s.Net.join('ZZZZZ');s.App.S.screen='join';});
  await both(()=>!!document.querySelector('#guest').contentWindow.SM.Net.error);
  const missing = await state();
  if (!missing[1].error.includes('NÃO ENCONTRADA')) throw Error('Missing-room error not actionable');
  if (errors.length) throw Error(errors.join('\n'));
  return {friendFight:true, remoteMovement:before[0].fighters[1].x-moved[0].fighters[1].x, damage:1000-hit[0].fighters[0].hp, sharedResult:result[0].result, disconnect:disconnect[0].error, randomPairs:2, cancelRetry:true, missingRoom:missing[1].error, pageErrors:errors};
}
