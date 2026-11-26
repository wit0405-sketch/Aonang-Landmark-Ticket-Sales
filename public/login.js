async function login(form){
  const button=form.querySelector('button');button.disabled=true;
  try{
    const body=Object.fromEntries(new FormData(form));
    const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'Login failed');
    sessionStorage.setItem('als-token',d.token);sessionStorage.setItem('als-role',d.role);sessionStorage.setItem('als-name',d.displayName);
    location.href=d.role==='admin'?'/admin.html':'/counter.html';
  }catch(e){document.getElementById('error').textContent=e.message}
  finally{button.disabled=false}
}
document.getElementById('loginForm')?.addEventListener('submit',e=>{e.preventDefault();login(e.currentTarget)});
