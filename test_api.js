async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'office@firm.com', password: 'password' }) // Or whatever credentials
  });
  if (!loginRes.ok) { console.error('Login failed', await loginRes.text()); return; }
  const loginData = await loginRes.json();
  const token = loginData.token;
  
  const itemsRes = await fetch('http://localhost:3000/api/items', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const items = await itemsRes.json();
  const appData = items.filter(i => i.name.startsWith('app_data'));
  console.log(JSON.stringify(appData, null, 2));
}
run();
