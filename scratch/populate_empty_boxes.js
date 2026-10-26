const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== POBLANDO PLANES Y MÓDULOS CON PRECIOS REALES DEL MERCADO COLOMBIANO ===\n');

  // 1. Obtener los servicios
  const srvWeb = await prisma.service.findUnique({ where: { slug: 'desarrollo-web' } });
  const srvRPA = await prisma.service.findUnique({ where: { slug: 'automatizacion-rpa' } });
  const srvApps = await prisma.service.findUnique({ where: { slug: 'desarrollo-aplicaciones' } });
  const srvIA = await prisma.service.findUnique({ where: { slug: 'inteligencia-artificial-agentes' } });

  // 2. Planes para Desarrollo Web
  if (srvWeb) {
    const webPlans = [
      {
        slug: 'web-landing',
        name: 'Landing Page de Alta Conversión',
        description: 'Página web moderna en Next.js 15 optimizada para captar prospectos y convertir visitantes en clientes.',
        setupPrice: 1450000,
        recurringPrice: 120000,
        billingPeriod: 'MONTHLY',
        isRecommended: false,
        featuresIncluded: JSON.stringify([
          'Desarrollada en Next.js 15 y Tailwind CSS',
          'Velocidad extrema 98+ en Google Lighthouse',
          'SEO técnico y etiquetas OpenGraph para redes',
          'Botón flotante inteligente de WhatsApp',
          'Hosting SSL de alta velocidad y dominio .com (1 año)',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 1,
      },
      {
        slug: 'web-corporativo',
        name: 'Sitio Web Corporativo & Catálogo',
        description: 'Sitio web profesional con hasta 8 secciones, catálogo de servicios/productos administrable y panel CMS visual.',
        setupPrice: 2900000,
        recurringPrice: 220000,
        billingPeriod: 'MONTHLY',
        isRecommended: true,
        featuresIncluded: JSON.stringify([
          'Hasta 8 páginas estructuradas a la medida',
          'Catálogo dinámico de productos o servicios',
          'Panel administrativo CMS para editar textos y precios',
          'Formularios conectados directo a WhatsApp y CRM',
          'Diseño responsive premium (móvil, tablet, escritorio)',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 2,
      },
      {
        slug: 'web-ecommerce-saas',
        name: 'Plataforma Web & E-Commerce Pro',
        description: 'Plataforma completa con pasarela de pagos Wompi/PSE/tarjetas, panel de clientes y base de datos en la nube.',
        setupPrice: 5400000,
        recurringPrice: 380000,
        billingPeriod: 'MONTHLY',
        isRecommended: false,
        featuresIncluded: JSON.stringify([
          'Integración con pasarela Wompi (tarjetas, Nequi, PSE)',
          'Portal privado para clientes con login y órdenes',
          'Base de datos relacional PostgreSQL / Supabase',
          'Control de inventario o agenda en tiempo real',
          'Notificaciones automáticas por correo y WhatsApp',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 3,
      },
    ];

    for (const p of webPlans) {
      await prisma.plan.upsert({
        where: { serviceId_slug: { serviceId: srvWeb.id, slug: p.slug } },
        update: p,
        create: { serviceId: srvWeb.id, ...p },
      });
      console.log(`Plan Web Creado/Actualizado: ${p.name}`);
    }
  }

  // 3. Planes para Automatización RPA
  if (srvRPA) {
    const rpaPlans = [
      {
        slug: 'rpa-esencial',
        name: 'Automatización Esencial de Leads',
        description: 'Captura y registro automático de prospectos desde WhatsApp y formularios web directo a hojas de cálculo y correo.',
        setupPrice: 1800000,
        recurringPrice: 250000,
        billingPeriod: 'MONTHLY',
        isRecommended: false,
        featuresIncluded: JSON.stringify([
          'Conexión WhatsApp → Google Sheets / Excel en la nube',
          'Alertas automáticas inmediatas por correo electrónico',
          'Asignación automática de prospectos por asesor',
          'Eliminación de digitación manual de contactos',
          'Monitoreo continuo de ejecución en servidor n8n',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 1,
      },
      {
        slug: 'rpa-integracion-crm',
        name: 'Integración CRM & Notificaciones',
        description: 'Sincronización bidireccional entre WhatsApp, tu CRM (HubSpot, Zoho, Salesforce o EDMYSOFT) y pasarelas de pago.',
        setupPrice: 3600000,
        recurringPrice: 480000,
        billingPeriod: 'MONTHLY',
        isRecommended: true,
        featuresIncluded: JSON.stringify([
          'Sincronización en tiempo real con tu CRM',
          'Disparo de mensajes automáticos según cambio de etapa',
          'Notificación a clientes tras confirmación de pago',
          'Mapeo completo de campos personalizados',
          'Flujos de contingencia ante caídas de red',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 2,
      },
      {
        slug: 'rpa-enterprise-dian',
        name: 'Flujos Empresariales & Facturación DIAN',
        description: 'Automatización operativa de alto nivel con integración contable, facturación electrónica DIAN y conciliación bancaria.',
        setupPrice: 7200000,
        recurringPrice: 850000,
        billingPeriod: 'MONTHLY',
        isRecommended: false,
        featuresIncluded: JSON.stringify([
          'Emisión automática de factura electrónica DIAN al pagar',
          'Conciliación de pagos bancarios contra pedidos',
          'Servidor n8n dedicado en Docker con alta disponibilidad',
          'Conexión a ERPs (SAP, Siigo, Alegra, World Office)',
          'Auditoría y trazabilidad completa de cada ejecución',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 3,
      },
    ];

    for (const p of rpaPlans) {
      await prisma.plan.upsert({
        where: { serviceId_slug: { serviceId: srvRPA.id, slug: p.slug } },
        update: p,
        create: { serviceId: srvRPA.id, ...p },
      });
      console.log(`Plan RPA Creado/Actualizado: ${p.name}`);
    }
  }

  // 4. Planes para Desarrollo de Aplicaciones
  if (srvApps) {
    const appPlans = [
      {
        slug: 'app-mvp-mobile',
        name: 'App Móvil iOS & Android (MVP)',
        description: 'Desarrollo de aplicación móvil híbrida en React Native con interfaz moderna, login de usuarios y consumo de APIs.',
        setupPrice: 6800000,
        recurringPrice: 490000,
        billingPeriod: 'MONTHLY',
        isRecommended: true,
        featuresIncluded: JSON.stringify([
          'Aplicación nativa para Android y iOS (React Native)',
          'Autenticación biométrica (FaceID / Huella) y correo',
          'Diseño UI/UX adaptado a lineamientos Apple & Google',
          'Notificaciones push personalizadas a usuarios',
          'Panel web administrativo para gestión de contenidos',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 1,
      },
      {
        slug: 'app-enterprise-custom',
        name: 'Software a Medida & App Empresarial',
        description: 'Arquitectura completa para operaciones de campo, geolocalización, sincronización offline y analítica en tiempo real.',
        setupPrice: 12500000,
        recurringPrice: 890000,
        billingPeriod: 'MONTHLY',
        isRecommended: false,
        featuresIncluded: JSON.stringify([
          'Geolocalización y seguimiento GPS en tiempo real',
          'Modo offline con sincronización automática de datos',
          'Pasarela de pagos in-app (Wompi, PSE, tarjetas)',
          'Dashboard gerencial con KPIs e informes exportables',
          'Arquitectura escalable en servidores dedicados',
          'Soporte prioritario por EDMYSOFT',
        ]),
        order: 2,
      },
    ];

    for (const p of appPlans) {
      await prisma.plan.upsert({
        where: { serviceId_slug: { serviceId: srvApps.id, slug: p.slug } },
        update: p,
        create: { serviceId: srvApps.id, ...p },
      });
      console.log(`Plan App Creado/Actualizado: ${p.name}`);
    }
  }

  // 5. Módulos Adicionales de Alto Valor
  const additionalModules = [
    {
      code: 'MOD_INSTAGRAM_DIRECT',
      name: 'Agente IA para Instagram Direct & Facebook',
      description: 'Atiende mensajes directos (DMs) de Instagram y comentarios de publicaciones 24/7 con IA, transfiriendo clientes calificados a WhatsApp.',
      setupPrice: 890000,
      recurringPrice: 140000,
      isTechnicalReady: true,
    },
    {
      code: 'MOD_DIAN_INVOICE',
      name: 'Facturación Electrónica DIAN Automática',
      description: 'Genera y envía automáticamente la factura electrónica validada ante la DIAN al cliente en cuanto se confirma el pago o anticipo.',
      setupPrice: 1250000,
      recurringPrice: 180000,
      isTechnicalReady: true,
    },
    {
      code: 'MOD_GOOGLE_CALENDAR',
      name: 'Sincronización Google Calendar & Agendamiento',
      description: 'Bloquea horarios en tiempo real, evita choques de citas y genera enlaces automáticos de Google Meet para videollamadas con el equipo.',
      setupPrice: 550000,
      recurringPrice: 60000,
      isTechnicalReady: true,
    },
    {
      code: 'MOD_CRM_SHEETS',
      name: 'Sincronización en Vivo con Google Sheets / Excel',
      description: 'Escribe cada lead, cotización y mensaje de WhatsApp en una fila de tu hoja de cálculo compartida en la nube con fecha y hora exacta.',
      setupPrice: 450000,
      recurringPrice: 50000,
      isTechnicalReady: true,
    },
    {
      code: 'MOD_WHATSAPP_BROADCAST',
      name: 'Difusiones Masivas Oficiales por WhatsApp',
      description: 'Envía campañas comerciales y promociones a bases de datos de clientes con plantillas aprobadas por Meta sin riesgo de bloqueo.',
      setupPrice: 950000,
      recurringPrice: 190000,
      isTechnicalReady: true,
    },
    {
      code: 'MOD_VOICE_NOTES',
      name: 'Comprensión y Transcripción de Notas de Voz',
      description: 'La IA escucha los audios de WhatsApp enviados por los clientes, extrae la intención y responde por texto de forma instantánea.',
      setupPrice: 650000,
      recurringPrice: 110000,
      isTechnicalReady: true,
    },
    {
      code: 'MOD_MULTILANGUAGE',
      name: 'Módulo Multilingüe Inteligente (Español / Inglés)',
      description: 'Detecta el idioma del interlocutor y atiende en español o inglés con terminología corporativa y modismos profesionales.',
      setupPrice: 750000,
      recurringPrice: 90000,
      isTechnicalReady: true,
    },
  ];

  for (const m of additionalModules) {
    await prisma.serviceModule.upsert({
      where: { code: m.code },
      update: m,
      create: {
        serviceId: srvIA?.id || null,
        billingPeriod: 'MONTHLY',
        defaultRule: 'OPTIONAL',
        isActive: true,
        ...m,
      },
    });
    console.log(`Módulo Creado/Actualizado: ${m.name} (${m.code})`);
  }

  console.log('\n--- ¡Todas las casillas y precios fueron poblados exitosamente! ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
