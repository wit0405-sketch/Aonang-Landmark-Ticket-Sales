const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
export const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers});
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
const hex = bytes => [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
export const sha256 = async value => hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
export async function hashPassword(password,salt=uid()){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:180000,hash:'SHA-256'},key,256);
  return salt+':'+hex(bits);
}
export async function verifyPassword(password,stored){
  const [salt,expected]=String(stored||'').split(':');
  if(!salt||!expected)return false;
  return (await hashPassword(password,salt)).split(':')[1]===expected;
}
export async function createSession(db,role,accountId){
  const token=hex(crypto.getRandomValues(new Uint8Array(32)));
  const expires=Date.now()+12*60*60*1000;
  await db.prepare('INSERT INTO sessions(token_hash,role,account_id,expires_at,created_at) VALUES(?,?,?,?,?)')
    .bind(await sha256(token),role,accountId,expires,now()).run();
  return {token,expiresAt:expires};
}
export async function getSession(request,db){
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/,'');
  if(!token)return null;
  const sql="SELECT s.role,s.account_id,s.expires_at, CASE WHEN s.role='admin' THEN a.username ELSE c.username END username, CASE WHEN s.role='admin' THEN 'Administrator' ELSE c.company_name END display_name, CASE WHEN s.role='counter' THEN c.active ELSE 1 END active FROM sessions s LEFT JOIN admins a ON s.role='admin' AND a.id=s.account_id LEFT JOIN counters c ON s.role='counter' AND c.id=s.account_id WHERE s.token_hash=?";
  const row=await db.prepare(sql).bind(await sha256(token)).first();
  if(!row||row.expires_at<Date.now()||!row.active)return null;
  return row;
}
export const isDate = s => {
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d=new Date(s+'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s;
};
export function seatDetails(id,prices){
  if(/^S(?:[1-9]|[1-5]\d|6[1-6])$/.test(id))return {category:'Ringside',price:prices.ringside};
  if(/^[A-H](?:[1-9]|1[0-8])$/.test(id))return {category:'VIP Seat',price:prices.vip};
  if(/^GT(?:[1-9]|[1-7]\d|80)$/.test(id))return {category:'Grandstand',price:prices.grandstand};
  return null;
}
export async function getPrices(db){
  const rows=await db.prepare("SELECT key,value FROM settings WHERE key LIKE 'price_%'").all();
  const map=Object.fromEntries((rows.results||[]).map(x=>[x.key,Number(x.value)]));
  return {ringside:map.price_ringside??1800,vip:map.price_vip??1200,grandstand:map.price_grandstand??1000};
}
