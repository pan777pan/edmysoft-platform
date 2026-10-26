async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ediergallego59@gmail.com',
      password: 'edsoft1013341239',
    }),
  });

  console.log('Login status:', loginRes.status);
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie received:', cookie);

  const cookieVal = cookie ? cookie.split(';')[0] : '';

  const pricingRes = await fetch('http://localhost:3000/api/admin/pricing', {
    headers: { Cookie: cookieVal },
  });

  console.log('Pricing status:', pricingRes.status);
  const pricingData = await pricingRes.json();
  console.log('Pricing data:', JSON.stringify(pricingData, null, 2));
}

run();
