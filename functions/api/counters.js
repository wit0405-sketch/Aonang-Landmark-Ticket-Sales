import {json,getSession,hashPassword,uid,now} from './_shared.js';
async function admin(request,env){const s=await getSession(request,env.DB);return s?.role==='admin'?s:null}
export async function onRequestGet({request,env}){
  if(!await admin(request,env))return json({error:'Admin access required'},401);
  const r=await env.DB.prepare('SELECT id,company_name,username,active,created_at FROM counters ORDER BY company_name').all();
  return json({counters:r.results||[]});
}
export async function onRequestPost({request,env}){
  if(!await admin(request,env))return json({error:'Admin access required'},401);
  let p;try{p=await request.json()}catch{return json({error:'Invalid request'},400)}
  if(typeof p.companyName!=='string'||!p.companyName.trim()||p.companyName.length>150||typeof p.username!=='string'||!/^[a-zA-Z0-9._-]{3,50}$/.test(p.username)||typeof p.password!=='string'||p.password.length<10||p.password.length>150)return json({error:'Company, username (3–50 chars) and password (minimum 10 chars) are required'},400);
  try{
    const id=uid(),passwordHashValue=await hashPassword(p.password);
    await env.DB.prepare('INSERT INTO counters(id,company_name,username,password_hash,active,created_at) VALUES(?,?,?,?,1,?)').bind(id,p.companyName.trim(),p.username.trim(),passwordHashValue,now()).run();
    return json({ok:true,id},201);
  }catch(e){return json({error:'Username already exists or counter could not be created'},409)}
}
export async function onRequestPatch({request,env}){
  if(!await admin(request,env))return json({error:'Admin access required'},401);
  let p;try{p=await request.json()}catch{return json({error:'Invalid request'},400)}
  if(typeof p.id!=='string'||typeof p.active!=='boolean')return json({error:'Invalid update'},400);
  await env.DB.prepare('UPDATE counters SET active=? WHERE id=?').bind(p.active?1:0,p.id).run();
  if(!p.active)await env.DB.prepare("DELETE FROM sessions WHERE role='counter' AND account_id=?").bind(p.id).run();
  return json({ok:true});
}
