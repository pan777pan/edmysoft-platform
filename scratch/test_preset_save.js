async function main() {
  const res = await fetch('http://localhost:3000/api/admin/whatsapp-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientBusinessName: 'Parrilla & Fuego Steakhouse',
      clientIndustry: 'Gastronomía y Cortes Madurados',
      businessDescription: 'Restaurante campestre especialista en cortes finos madurados al carbón en Chía.',
      servicesAndPrices: '- Bife de Chorizo 400g: $68.000 COP\n- Tomahawk Steak 1kg: $145.000 COP',
      faqs: 'Horario: Miércoles a Domingo 12pm-10pm. Ubicación: Km 2 Vía Chía-Cajicá.',
      active: true,
    }),
  });
  const data = await res.json();
  console.log('Saved demo:', data.success, data.config?.clientBusinessName);

  // Check read
  const res2 = await fetch('http://localhost:3000/api/admin/whatsapp-demo');
  const data2 = await res2.json();
  console.log('Read back demo:', data2.success, data2.config?.clientBusinessName);
}

main().catch(console.error);
