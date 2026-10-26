const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), '.edmysoft', 'whatsapp-demo.json');

const config = {
  active: false,
  expiresAt: null,
  clientBusinessName: "Clínica Dental Sonrisas Bogotá",
  clientIndustry: "Salud Oral y Odontología Estética",
  clientDescription: "Centro odontológico de alta especialidad en diseño de sonrisa, implantes dentales, ortodoncia invisible y urgencias en Chicó, Bogotá.",
  clientCatalog: "• Valoración odontológica inicial: $30.000 COP (Gratis al iniciar tratamiento)\n• Limpieza profunda con ultrasonido: $85.000 COP\n• Calzas estéticas en resina (caries): desde $90.000 COP por pieza\n• Ortodoncia invisible (mensualidad): $130.000 COP\n• Blanqueamiento LED profesional: $280.000 COP\n• Urgencias odontológicas: Atención prioritaria sin cita",
  clientFaqs: "• Horario: Lunes a Sábado de 8:00 AM a 7:00 PM.\n• Ubicación: Cra 15 # 93-40, Piso 3, Chicó, Bogotá.\n• Medios de pago: Efectivo, Nequi, Daviplata, PSE y todas las tarjetas de crédito.\n• Parqueadero: Contamos con convenio de parqueadero en el edificio.",
  clientTone: "Sé muy empático, tranquilizador y profesional. Saluda por su nombre al cliente si lo indica, confirma el procedimiento deseado, informa las tarifas con claridad y ofrece opciones de horario de mañana o tarde para agendar.",
  bookingUrl: "https://wa.me/573234166354?text=Quiero%20agendar%20cita%20odontologica",
  businessDescription: "Centro odontológico de alta especialidad en diseño de sonrisa, implantes dentales, ortodoncia invisible y urgencias en Chicó, Bogotá.",
  servicesAndPrices: "• Valoración odontológica inicial: $30.000 COP (Gratis al iniciar tratamiento)\n• Limpieza profunda con ultrasonido: $85.000 COP\n• Calzas estéticas en resina (caries): desde $90.000 COP por pieza\n• Ortodoncia invisible (mensualidad): $130.000 COP\n• Blanqueamiento LED profesional: $280.000 COP\n• Urgencias odontológicas: Atención prioritaria sin cita",
  faqs: "• Horario: Lunes a Sábado de 8:00 AM a 7:00 PM.\n• Ubicación: Cra 15 # 93-40, Piso 3, Chicó, Bogotá.\n• Medios de pago: Efectivo, Nequi, Daviplata, PSE y todas las tarjetas de crédito.\n• Parqueadero: Contamos con convenio de parqueadero en el edificio.",
  specialInstructions: "Sé muy empático, tranquilizador y profesional. Saluda por su nombre al cliente si lo indica, confirma el procedimiento deseado, informa las tarifas con claridad y ofrece opciones de horario de mañana o tarde para agendar.",
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(targetFile, JSON.stringify(config, null, 2), 'utf8');
console.log('Successfully wrote pristine whatsapp-demo.json with real dollar/COP amounts!');
