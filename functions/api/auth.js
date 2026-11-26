import {json,hashPassword,verifyPassword,createSession,getSession,sha256,now} from './_shared.js';
export async function onRequestPost({request,env}){
  let p;try{p=await request.json()}catch{return json({error:'Invalid request'},400)}
  if(!env.DB)return json({error:'D1 binding DB is not configured'},503);
  if(p.action==='logout'){
    const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/,'');
    if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return json({ok:true});
  }
  if(typeof p.username!=='string'||typeof p.password!=='string')return json({error:'Username and password are required'},400);
  const username=p.username.trim();
  try{
    let account,role;
    if(username.toLowerCase()==='admin'){
      if(!env.ADMIN_PASSWORD)return json({error:'ADMIN_PASSWORD secret is not configured'},503);
      if(p.password!==env.ADMIN_PASSWORD)return json({error:'Invalid username or password'},401);
      const id='primary-admin';
      const exists=await env.DB.prepare('SELECT id FROM admins WHERE id=?').bind(id).first();
      if(!exists)await env.DB.prepare('INSERT INTO admins(id,username,password_hash,created_at) VALUES(?,?,?,?)').bind(id,'admin',await hashPassword(env.ADMIN_PASSWORD),now()).run();
      account={id};role='admin';
    }else{
      account=await env.DB.prepare('SELECT id,password_hash,active FROM counters WHERE username=? COLLATE NOCASE').bind(username).first();
      if(!account||!account.active||!(await verifyPassword(p.password,account.password_hash)))return json({error:'Invalid username or password'},401);
      role='counter';
    }
    const session=await createSession(env.DB,role,account.id);
    const displayName=role==='admin'?'Administrator':(await env.DB.prepare('SELECT company_name FROM counters WHERE id=?').bind(account.id).first()).company_name;
    return json({ok:true,...session,role,username,displayName});
  }catch(e){return json({error:'Authentication service unavailable'},503)}
}
export async function onRequestGet({request,env}){
  const s=await getSession(request,env.DB);
  return s?json({ok:true,role:s.role,username:s.username,displayName:s.display_name}):json({error:'Login required'},401);
}
