import { handleDemoConversation, DEFAULT_DEMO_CONFIG, loadWhatsAppDemoConfig } from '../lib/whatsapp-demo';

const history: any[] = [
  { role: 'user', content: 'Hola' },
  { role: 'assistant', content: '¡Hola! Te damos la bienvenida a Clínica Dental Sonrisas Bogotá. Empresa dedicada a la venta y asesoría de productos y servicios especializados. ¿En qué te podemos ayudar hoy?' },
  { role: 'user', content: 'Para un cita' },
  { role: 'assistant', content: '¡Excelente! Con gusto tomamos tu solicitud para Clínica Dental Sonrisas Bogotá. Por favor indícanos tu nombre completo y los detalles de lo que necesitas y un asesor de nuestro equipo continuará la gestión contigo de inmediato.' }
];

const input = 'Edier mery gallego  para úna revisión odontológica y sacar un acarie';
const cfg = loadWhatsAppDemoConfig();
console.log('CFG active:', cfg.active, 'business:', cfg.clientBusinessName);
const res = handleDemoConversation(input, history, cfg, null);
console.log('Intent:', res.intent);
console.log('Reply:\n', res.reply);
