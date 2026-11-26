import {json,getSession,isDate,getPrices} from './_shared.js';
export async function onRequestGet({request,env}){
  const s=await getSession(request,env.DB);if(!s)return json({error:'Login required'},401);
  const date=new URL(request.url).searchParams.get('date');
  if(!isDate(date))return json({error:'Valid event date is required'},400);
  const [rows,prices]=await Promise.all([
    env.DB.prepare('SELECT seat_id FROM tickets WHERE event_date=?').bind(date).all(),
    getPrices(env.DB)
  ]);
  const sold=(rows.results||[]).map(x=>x.seat_id);
  return json({eventDate:date,sold,prices});
}
