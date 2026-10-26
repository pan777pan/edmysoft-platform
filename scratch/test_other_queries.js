async function testOtherQueries() {
  const queries = [
    '¿Cuánto cuesta la ortodoncia invisible?',
    '¿Dónde están ubicados y qué horario manejan?',
    '¿Tienen parqueadero y reciben Nequi?',
    'Quiero hablar con un asesor humano por favor',
  ];

  for (const q of queries) {
    console.log('\n--- PREGUNTA:', q);
    const res = await fetch('http://localhost:3000/api/admin/whatsapp/demo-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q, history: [] }),
    });
    const d = await res.json();
    console.log(`RESPUESTA (${d.intent}):\n${d.reply}`);
  }
}

testOtherQueries().catch(console.error);
