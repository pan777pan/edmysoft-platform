async function testApi() {
  const turns = [
    'Hola',
    'Para un cita',
    'Edier mery gallego  para úna revisión odontológica y sacar un acarie',
    'Mañana a las 10am',
    'Sí, perfecto muchas gracias',
  ];

  let history = [];

  for (let i = 0; i < turns.length; i++) {
    const msg = turns[i];
    console.log(`\n=================== TURNO ${i + 1} ===================`);
    console.log('👤 CLIENTE:', msg);

    const res = await fetch('http://localhost:3000/api/admin/whatsapp/demo-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history }),
    });

    if (!res.ok) {
      console.log('Error HTTP:', res.status, await res.text());
      return;
    }

    const data = await res.json();
    console.log(`🤖 BOT (${data.businessName} | Intent: ${data.intent} | Modelo: ${data.modelUsed}):\n${data.reply}`);

    history.push({ role: 'user', content: msg });
    history.push({ role: 'assistant', content: data.reply });
  }
}

testApi().catch(console.error);
