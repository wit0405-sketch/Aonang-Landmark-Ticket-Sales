import {json,getSession,getPrices} from './_shared.js';
export async function onRequestGet({request,env}){
  const s=await getSession(request,env.DB);if(!s)return json({error:'Login required'},401);
  return json({prices:await getPrices(env.DB)});
}
export async function onRequestPut({request,env}){
  const s=await getSession(request,env.DB);if(!s||s.role!=='admin')return json({error:'Admin access required'},401);
  let p;try{p=await request.json()}catch{return json({error:'Invalid settings'},400)}
  for(const k of ['ringside','vip','grandstand'])if(!Number.isSafeInteger(p[k])||p[k]<0||p[k]>100000)return json({error:'Prices must be whole numbers from 0 to 100000'},400);
  await env.DB.batch([
    env.DB.prepare("UPDATE settings SET value=? WHERE key='price_ringside'").bind(String(p.ringside)),
    env.DB.prepare("UPDATE settings SET value=? WHERE key='price_vip'").bind(String(p.vip)),
    env.DB.prepare("UPDATE settings SET value=? WHERE key='price_grandstand'").bind(String(p.grandstand))
  ]);
  return json({ok:true,prices:p});
}
