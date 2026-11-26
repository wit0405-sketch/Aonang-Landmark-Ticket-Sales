import {json,getSession,isDate,getPrices,seatDetails,uid,now} from './_shared.js';
export async function onRequestGet({request,env}){
  const s=await getSession(request,env.DB);if(!s)return json({error:'Login required'},401);
  const url=new URL(request.url),date=url.searchParams.get('date');
  if(date&&!isDate(date))return json({error:'Invalid date'},400);
  const where=date?'AND s.event_date=?':'';
  if(s.role==='admin'){
    const binds=date?[date]:[];
    const totals=await env.DB.prepare(`SELECT COALESCE(SUM(ticket_count),0) ticket_count,COALESCE(SUM(total_amount),0) revenue,COUNT(*) orders FROM sales s WHERE 1=1 ${where}`).bind(...binds).first();
    const byCounter=await env.DB.prepare(`SELECT counter_id,counter_name,COUNT(*) orders,SUM(ticket_count) ticket_count,SUM(total_amount) revenue FROM sales s WHERE 1=1 ${where} GROUP BY counter_id,counter_name ORDER BY revenue DESC`).bind(...binds).all();
    const recent=await env.DB.prepare(`SELECT s.*,GROUP_CONCAT(t.seat_id, ', ') seats FROM sales s LEFT JOIN tickets t ON t.sale_id=s.id WHERE 1=1 ${where} GROUP BY s.id ORDER BY s.created_at DESC LIMIT 150`).bind(...binds).all();
    return json({totals,byCounter:byCounter.results||[],recent:recent.results||[]});
  }
  const recent=await env.DB.prepare(`SELECT s.*,GROUP_CONCAT(t.seat_id, ', ') seats FROM sales s LEFT JOIN tickets t ON t.sale_id=s.id WHERE s.counter_id=? ${date} GROUP BY s.id ORDER BY s.created_at DESC LIMIT 100`).bind(...(date?[s.account_id,date]:[s.account_id])).all();
  return json({counter:s.display_name,recent:recent.results||[]});
}
export async function onRequestPost({request,env}){
  const s=await getSession(request,env.DB);if(!s||s.role!=='counter')return json({error:'Counter login required'},401);
  let p;try{p=await request.json()}catch{return json({error:'Invalid sale'},400)}
  if(!isDate(p.eventDate)||!Array.isArray(p.seats)||p.seats.length<1||p.seats.length>10||new Set(p.seats).size!==p.seats.length||!['cash','transfer'].includes(p.paymentMethod)||typeof p.customerName!=='string'||p.customerName.length>120)return json({error:'Sale details are invalid'},400);
  const prices=await getPrices(env.DB);
  const items=p.seats.map(id=>({id,...(seatDetails(id,prices)||{})}));
  if(items.some(x=>!x.category||!Number.isSafeInteger(x.price)||x.price<0))return json({error:'Unknown seat or invalid ticket price'},400);
  const saleId=uid(),created=now(),counter=await env.DB.prepare('SELECT company_name FROM counters WHERE id=?').bind(s.account_id).first();
  const total=items.reduce((sum,x)=>sum+x.price,0);
  const stmts=[env.DB.prepare('INSERT INTO sales(id,counter_id,counter_name,event_date,customer_name,payment_method,ticket_count,total_amount,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(saleId,s.account_id,counter.company_name,p.eventDate,p.customerName.trim()||null,p.paymentMethod,items.length,total,created)];
  for(const item of items)stmts.push(env.DB.prepare('INSERT INTO tickets(id,sale_id,event_date,seat_id,category,unit_price,created_at) VALUES(?,?,?,?,?,?,?)').bind(uid(),saleId,p.eventDate,item.id,item.category,item.price,created));
  try{
    await env.DB.batch(stmts);
    return json({ok:true,sale:{id:saleId,reference:saleId.slice(0,8).toUpperCase(),counterName:counter.company_name,eventDate:p.eventDate,customerName:p.customerName,seats:items,total,paymentMethod:p.paymentMethod,createdAt:created}},201);
  }catch(e){return json({error:'At least one seat has already been sold. Refresh availability and choose another seat.',code:'SEAT_ALREADY_SOLD'},409)}
}
