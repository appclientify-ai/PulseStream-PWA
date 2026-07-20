async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'office@firm.com', password: 'password' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  
  const patchRes = await fetch('http://localhost:3000/api/items/app_data/test/patch', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ updates: { "data.2023.1234.r1": true } })
  });
  
  const text = await patchRes.text();
  console.log("PATCH RES:", patchRes.status, text);
}
run();
