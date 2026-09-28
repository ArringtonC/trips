/* Store: where the app keeps its data.
   Local mode (config.js empty): this device only. Trip details come from private/seed.js.
   Online mode (config.js filled): Supabase. Both of you log in and see the same data, live.
   Keys look like app:<trip>:<name>. Two-part keys (app:profile, app:simple) stay on this device. */
(function(){
  const C=window.TRIP_CONFIG||{}, TRIP=C.trip||'trip', ONLINE=!!(C.supabaseUrl&&C.supabaseAnonKey);
  const SUPA='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
  const TAB=Math.random().toString(36).slice(2,8); // tells our own saves apart when they come back
  const key=(name,trip)=>`app:${trip||TRIP}:${name}`;
  const split=k=>{const m=/^app:([^:]+):(.+)$/.exec(k);return m?{trip:m[1],key:m[2]}:null;};
  const get=(name,fb,trip)=>{try{const v=localStorage.getItem(key(name,trip));return v==null?fb:JSON.parse(v);}catch(e){return fb;}};
  const set=(name,val,trip)=>{try{localStorage.setItem(key(name,trip),JSON.stringify(val));}catch(e){}};
  const rawSet=Storage.prototype.setItem, rawRemove=Storage.prototype.removeItem;
  const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});

  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});

  let sb=null;
  async function client(){if(!sb){await load(SUPA);sb=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey);}return sb;}

  async function local(){
    if(!window.SEED){try{await load('private/seed.js');}catch(e){}}
    if(!window.SEED){try{window.SEED=await (await fetch('private/seed.json')).json();}catch(e){}}
    const seed=window.SEED||{};
    for(const trip in seed)for(const k in seed[trip])
      if(k.startsWith('cfg:')||localStorage.getItem(key(k,trip))==null)rawSet.call(localStorage,key(k,trip),JSON.stringify(seed[trip][k])); // cfg = trip details: always refresh
  }

  async function online(){
    const db=await client();
    const {data:{session}}=await db.auth.getSession();
    const page=location.pathname.split('/').pop()||'index.html';
    if(!session){location.replace('login.html?next='+encodeURIComponent(page+location.search));return new Promise(()=>{});}
    const me=`${session.user.email}#${TAB}`, trips=[TRIP,'home'];
    const {data:mem}=await db.from('members').select('email').limit(1);
    if(!mem||!mem.length){await db.auth.signOut();location.replace('login.html?why=member');return new Promise(()=>{});} // logged in, but not on the trip list
    const {data,error}=await db.from('kv').select('trip,key,value').in('trip',trips);
    if(!error)for(const r of data)rawSet.call(localStorage,key(r.key,r.trip),JSON.stringify(r.value));
    // ponytail: offline = keep this device's copy; a save made offline is lost if the other person saves the same key first

    const timers={}, mine=k=>{const p=split(k);return p&&!p.key.startsWith('cfg:')&&trips.includes(p.trip)?p:null;};
    Storage.prototype.setItem=function(k,v){
      rawSet.call(this,k,v); const p=this===localStorage&&mine(k); if(!p)return;
      clearTimeout(timers[k]); timers[k]=setTimeout(()=>{ // ponytail: last-writer-wins per key, fine for 2 people
        let value; try{value=JSON.parse(v);}catch(e){value=v;}
        db.from('kv').upsert({trip:p.trip,key:p.key,value,updated_by:me}).then(({error})=>{if(error)console.warn('Save failed:',error.message);});
      },400);
    };
    Storage.prototype.removeItem=function(k){
      rawRemove.call(this,k); const p=this===localStorage&&mine(k);
      if(p)db.from('kv').delete().match({trip:p.trip,key:p.key}).then(()=>{});
    };

    // the other person saved something: update this device, reload when you are not typing
    let pending=false;
    const typing=()=>!!document.activeElement&&document.activeElement.matches('input,textarea,select,[contenteditable]');
    document.addEventListener('focusout',()=>{if(pending)setTimeout(()=>{if(!typing())location.reload();},300);});
    db.channel('kv').on('postgres_changes',{event:'*',schema:'public',table:'kv'},({eventType,new:n,old:o})=>{
      const r=eventType==='DELETE'?o:n; if(!r||!trips.includes(r.trip))return;
      if(eventType!=='DELETE'&&n.updated_by===me)return; // our own save coming back
      const k=key(r.key,r.trip);
      eventType==='DELETE'?rawRemove.call(localStorage,k):rawSet.call(localStorage,k,JSON.stringify(n.value));
      if(typing())pending=true; else location.reload();
    }).subscribe();
  }

  let readyP=null;
  const ready=()=>readyP||(readyP=(ONLINE?online():local()).catch(e=>console.error('Store:',e)));
  async function signOut(){if(ONLINE){const db=await client();await db.auth.signOut();}location.replace('login.html');}
  window.Store={ready,get,set,key,client,signOut,online:ONLINE,trip:TRIP};
})();
