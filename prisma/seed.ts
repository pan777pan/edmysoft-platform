import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Semilla de Datos Extendida de EDMYSOFT ---');

  // 1. Limpieza ordenada
  await prisma.contentRevision.deleteMany();
  await prisma.pageSection.deleteMany();
  await prisma.pageContent.deleteMany();
  await prisma.whatsAppConnection.deleteMany();
  await prisma.privateDocument.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.clientProject.deleteMany();
  await prisma.quoteRecurringCost.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.stageHistory.deleteMany();
  await prisma.taskReminder.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.message.deleteMany();
  await prisma.aILog.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.planModuleOverride.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.serviceModule.deleteMany();
  await prisma.service.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Usuarios: SuperAdmin y Clientes Autorizados
  const adminHash = bcrypt.hashSync('edsoft1013341239', 10);
  const client1Hash = bcrypt.hashSync('Cliente#2026!', 10);
  const client2Hash = bcrypt.hashSync('Clinica#2026!', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Edier Mery Gallego — Dirección',
      email: 'ediergallego59@gmail.com',
      passwordHash: adminHash,
      role: 'SUPERADMIN',
    },
  });

  const client1 = await prisma.user.create({
    data: {
      name: 'Grupo Logístico Andino',
      email: 'cliente@grupologistico.co',
      passwordHash: client1Hash,
      role: 'COMERCIAL',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'Clínica San Martín',
      email: 'sistemas@clinicasanmartin.co',
      passwordHash: client2Hash,
      role: 'COMERCIAL',
    },
  });

  // 3. Ajustes Globales de EDMYSOFT
  await prisma.systemSetting.createMany({
    data: [
      { key: 'BRAND_NAME', value: 'EDMYSOFT', group: 'GENERAL', description: 'Nombre de la empresa' },
      { key: 'PARTNER_BACKING', value: 'Backed by TuSoft', group: 'GENERAL', description: 'Alianza y respaldo tecnológico' },
      { key: 'LEAD_ENGINEER', value: 'Edier Mery Gallego', group: 'GENERAL', description: 'Líder Técnico & Fundador' },
      { key: 'PRODUCT_NAME', value: 'EDMYSOFT Atiende', group: 'GENERAL', description: 'Nombre comercial de la plataforma de IA' },
      { key: 'DEFAULT_CURRENCY', value: 'COP', group: 'BILLING', description: 'Moneda predeterminada' },
      { key: 'DEFAULT_TIMEZONE', value: 'America/Bogota', group: 'GENERAL', description: 'Zona horaria oficial' },
      { key: 'AI_MAX_AUTONOMOUS_DISCOUNT', value: '10', group: 'AI', description: 'Porcentaje máximo de descuento sin aprobación' },
      { key: 'WHATSAPP_SUPPORT_PHONE', value: '+57 323 416 6354', group: 'INTEGRATIONS', description: 'Teléfono comercial de WhatsApp' },
    ],
  });

  // 4. Catálogo de Servicios Oficiales
  const srvWeb = await prisma.service.create({
    data: {
      slug: 'desarrollo-web',
      name: 'Desarrollo Web & Web Apps',
      category: 'DESARROLLO_WEB',
      shortDesc: 'Sitios corporativos de alto impacto, plataformas SaaS, e-commerce y paneles interactivos.',
      longDesc: 'Desarrollamos soluciones web de alto nivel con React, Next.js y Tailwind CSS, respaldadas por la infraestructura de TuSoft.',
      icon: 'LayoutTemplate',
      badgeText: 'Alta Demanda',
      order: 1,
      status: 'ACTIVE',
      features: JSON.stringify([
        'React / Next.js / Tailwind CSS',
        'Arquitectura Cloud & Optimización SEO',
        'Paneles administrativos a medida',
        'Diseño responsive adaptado a móviles',
      ]),
    },
  });

  const srvRPA = await prisma.service.create({
    data: {
      slug: 'automatizacion-rpa',
      name: 'Automatización de Procesos (RPA)',
      category: 'AUTOMATIZACION',
      shortDesc: 'Optimización drástica de tiempos operativos, integración de APIs/ERPs y eliminación de tareas manuales.',
      longDesc: 'Workflows visuales con n8n y scripts en Python para cruzar facturación DIAN, sincronizar inventarios y disparar alertas.',
      icon: 'Workflow',
      order: 2,
      status: 'ACTIVE',
      features: JSON.stringify([
        'Sincronización de sistemas en tiempo real',
        'Bots operativos y reportes programados',
        'Webhooks con pasarelas de pago y Meta',
        'Reducción de hasta un 80% en horas operativas',
      ]),
    },
  });

  const srvIA = await prisma.service.create({
    data: {
      slug: 'inteligencia-artificial-agentes',
      name: 'Inteligencia Virtual & Agentes IA',
      category: 'IA',
      shortDesc: 'Agentes conversacionales autónomos, chatbots avanzados para WhatsApp/Web e integración con RAG.',
      longDesc: 'Diseño e integración de asistentes inteligentes que comprenden contexto en español, recomiendan planes oficiales y transfieren a asesores con un clic.',
      icon: 'Bot',
      badgeText: 'Especialidad',
      order: 3,
      status: 'ACTIVE',
      features: JSON.stringify([
        'Agentes RAG con memoria conversacional 24/7',
        'Conexión nativa con WhatsApp Cloud API y QR',
        'Cotizador dinámico automático',
        'Pausa y control humano inmediato',
      ]),
    },
  });

  const srvApps = await prisma.service.create({
    data: {
      slug: 'desarrollo-aplicaciones',
      name: 'Desarrollo de Aplicaciones',
      category: 'SOFTWARE_A_MEDIDA',
      shortDesc: 'Soluciones móviles (iOS/Android) y software de escritorio de alto rendimiento.',
      longDesc: 'Desarrollo multiplataforma para operaciones en campo, captura de datos offline y sincronización cloud.',
      icon: 'Smartphone',
      order: 4,
      status: 'ACTIVE',
      features: JSON.stringify([
        'Apps móviles multiplataforma',
        'Sistemas desktop empresariales',
        'Bases de datos dedicadas y sincronizadas',
        'Seguridad de datos según Ley 1581',
      ]),
    },
  });

  // 5. Planes Comerciales
  const planEstandar = await prisma.plan.create({
    data: {
      serviceId: srvIA.id,
      slug: 'estandar',
      name: 'Estándar',
      description: 'Ideal para validar producto o automatizar un canal específico en 2 a 4 semanas.',
      setupPrice: 2200000,
      recurringPrice: 350000,
      billingPeriod: 'MONTHLY',
      isRecommended: false,
      featuresIncluded: JSON.stringify([
        '1 Agente IA para WhatsApp',
        'Base de conocimiento con hasta 30 preguntas frecuentes',
        'Atención 24/7',
        'Bandeja con botón de control humano',
      ]),
      order: 1,
    },
  });

  const planPlus = await prisma.plan.create({
    data: {
      serviceId: srvIA.id,
      slug: 'plus',
      name: 'Plus (Recomendado)',
      description: 'Escalamiento profesional con cotizador dinámico, agendamiento y CRM (1 a 3 meses).',
      setupPrice: 3800000,
      recurringPrice: 550000,
      billingPeriod: 'MONTHLY',
      isRecommended: true,
      featuresIncluded: JSON.stringify([
        '1 Agente de IA comercial avanzado',
        'Cotizador dinámico automático integrado',
        'Agendamiento en Google Calendar',
        'Bandeja omnicanal con takeover humano',
        'Integración con n8n y webhooks',
      ]),
      order: 2,
    },
  });

  const planEnterprise = await prisma.plan.create({
    data: {
      serviceId: srvIA.id,
      slug: 'enterprise',
      name: 'Empresarial Multicanal',
      description: 'Arquitectura Enterprise para alta concurrencia con célula multidesarrollador TuSoft.',
      setupPrice: 6500000,
      recurringPrice: 950000,
      billingPeriod: 'MONTHLY',
      isRecommended: false,
      featuresIncluded: JSON.stringify([
        'Múltiples agentes especializados',
        'WhatsApp + Instagram + Messenger',
        'RAG vectorial y base de datos dedicada',
        'Soporte prioritario por EDMYSOFT',
      ]),
      order: 3,
    },
  });

  // 6. Módulos Adicionales
  const modBotApoyo = await prisma.serviceModule.create({
    data: {
      serviceId: srvIA.id,
      name: 'Bot de Apoyo / Segundo Agente Especializado',
      code: 'MOD_BOT_APOYO',
      description: 'Agente secundario para derivación y seguimiento automatizado.',
      setupPrice: 1650000,
      recurringPrice: 200000,
      billingPeriod: 'MONTHLY',
      defaultRule: 'OPTIONAL',
      isTechnicalReady: true,
    },
  });

  const modCotizadorPdf = await prisma.serviceModule.create({
    data: {
      serviceId: srvIA.id,
      name: 'Generador de Cotizaciones PDF con Membrete',
      code: 'MOD_COTIZADOR_PDF',
      description: 'Generación vectorizada de presupuestos formales para descarga inmediata.',
      setupPrice: 850000,
      recurringPrice: 0,
      billingPeriod: 'ONE_TIME',
      defaultRule: 'OPTIONAL',
      isTechnicalReady: true,
    },
  });

  // Módulo de PDF incluido sin costo en el Plan Enterprise
  await prisma.planModuleOverride.create({
    data: {
      planId: planEnterprise.id,
      moduleId: modCotizadorPdf.id,
      rule: 'INCLUDED',
      customSetupPrice: 0,
    },
  });

  // 7. Caso Real de Prueba Económica ($5.410.500 COP)
  const contactCarlos = await prisma.contact.create({
    data: {
      fullName: 'Carlos Mendoza',
      phone: '+57 312 456 7890',
      email: 'carlos.mendoza@innovaservicios.co',
      companyName: 'Innova Servicios Empresariales',
      preferredChannel: 'WHATSAPP',
      city: 'Bogotá, Colombia',
    },
  });

  const oppCarlos = await prisma.opportunity.create({
    data: {
      contactId: contactCarlos.id,
      title: 'Implementación Chatbot Multicanal + Bot de Apoyo',
      stage: 'COTIZACION_EN_PREPARACION',
      serviceInterest: 'Inteligencia Virtual & Agentes IA',
      identifiedNeed: 'Automatizar atención en WhatsApp con bot principal y soporte adicional.',
      estimatedValue: 5410500,
      assignedToId: adminUser.id,
    },
  });

  const quoteReal = await prisma.quote.create({
    data: {
      quoteNumber: 'COT-2026-0001',
      opportunityId: oppCarlos.id,
      contactId: contactCarlos.id,
      type: 'CUSTOM_PROPOSAL',
      status: 'APPROVED',
      version: 1,
      setupSubtotal: 5410500,
      setupDiscount: 0,
      setupTotal: 5410500,
      recurringTotal: 0,
      clientDirectTotal: 320000,
      depositRequired: 1504200,
      depositPaid: 1504200,
      balanceDue: 3906300,
      currency: 'COP',
      validUntil: new Date('2026-11-30'),
      notes: 'Proyecto de desarrollo de chatbot multicanal y bot de apoyo secundario.',
      commercialTerms: 'Tiempo estimado de entrega: 15 días hábiles a partir del anticipo.',
      requiresApproval: false,
      approvedById: adminUser.id,
      approvedAt: new Date(),
      snapshotData: JSON.stringify({
        desarrolloOriginal: 3760500,
        botApoyoAdicional: 1650000,
        total: 5410500,
        anticipo: 1504200,
        saldo: 3906300,
      }),
    },
  });

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quoteReal.id,
        conceptName: 'Desarrollo Original Chatbot Multicanal',
        setupPrice: 3760500,
        quantity: 1,
      },
      {
        quoteId: quoteReal.id,
        conceptName: 'Bot de Apoyo Adicional',
        setupPrice: 1650000,
        quantity: 1,
      },
    ],
  });

  await prisma.quoteRecurringCost.createMany({
    data: [
      {
        quoteId: quoteReal.id,
        providerName: 'Meta Cloud API',
        conceptName: 'Consumo WhatsApp Cloud API',
        mode: 'CLIENT_DIRECT',
        internalCost: 0,
        clientPrice: 150000,
      },
      {
        quoteId: quoteReal.id,
        providerName: 'OpenRouter',
        conceptName: 'Tokens Claude 3.5 Sonnet',
        mode: 'CLIENT_DIRECT',
        internalCost: 0,
        clientPrice: 80000,
      },
      {
        quoteId: quoteReal.id,
        providerName: 'VPS Hetzner / Cloud',
        conceptName: 'Hosting Cloud para n8n',
        mode: 'CLIENT_DIRECT',
        internalCost: 0,
        clientPrice: 90000,
      },
    ],
  });

  await prisma.paymentTransaction.create({
    data: {
      quoteId: quoteReal.id,
      gateway: 'MANUAL_TRANSFER',
      gatewayReference: 'TRANSF-BANCOLOMBIA-9921',
      amount: 1504200,
      currency: 'COP',
      status: 'APPROVED',
      paymentMethod: 'BANCOLOMBIA_TRANSFER',
      verifiedAt: new Date(),
    },
  });

  const convCarlos = await prisma.conversation.create({
    data: {
      contactId: contactCarlos.id,
      channel: 'WHATSAPP',
      status: 'AI_HANDLING',
      externalThreadId: 'wa_thread_573124567890',
      lastMessageAt: new Date(),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: convCarlos.id,
        senderType: 'CLIENT',
        senderName: 'Carlos Mendoza',
        content: 'Hola, buenas tardes. Me interesa cotizar un sistema de chatbot con un bot adicional de apoyo.',
        status: 'READ',
      },
      {
        conversationId: convCarlos.id,
        senderType: 'AI',
        senderName: 'EDMYSOFT Atiende',
        content: '¡Hola Carlos! Con gusto te acompaño en EDMYSOFT. Claro que sí, podemos implementar un bot principal para calificación y un segundo agente de apoyo especializado. ¿Qué volumen de mensajes diarios manejas aproximadamente?',
        status: 'DELIVERED',
      },
    ],
  });

  // 8. DATOS DEL PORTAL DE CLIENTES (MIGRACIÓN DESDE EL HTML)
  const prjAndino1 = await prisma.clientProject.create({
    data: {
      id: 'PRJ-101',
      name: 'Plataforma Web Logística & Agente IA WhatsApp',
      ownerEmail: 'cliente@grupologistico.co',
      clientName: 'Grupo Logístico Andino',
      progress: 68,
      stage: 'Desarrollo',
      eta: '2026-11-20',
      leadEngineer: 'Edier Mery Gallego (Backed by TuSoft)',
    },
  });

  const prjAndino2 = await prisma.clientProject.create({
    data: {
      id: 'PRJ-102',
      name: 'Automatización RPA Facturación & ERP',
      ownerEmail: 'cliente@grupologistico.co',
      clientName: 'Grupo Logístico Andino',
      progress: 90,
      stage: 'Pruebas',
      eta: '2026-11-05',
      leadEngineer: 'Célula TuSoft & Edier Gallego',
    },
  });

  const prjSanMartin = await prisma.clientProject.create({
    data: {
      id: 'PRJ-201',
      name: 'Agente Virtual de Triaje Médico & Historia Clínica',
      ownerEmail: 'sistemas@clinicasanmartin.co',
      clientName: 'Clínica San Martín',
      progress: 45,
      stage: 'Prototipado',
      eta: '2026-12-10',
      leadEngineer: 'Edier Mery Gallego (Backed by TuSoft)',
    },
  });

  // Bóveda Privada de Documentos
  await prisma.privateDocument.createMany({
    data: [
      {
        id: 'DOC-5001',
        projectId: prjAndino1.id,
        ownerEmail: 'cliente@grupologistico.co',
        title: 'Arquitectura_Microservicios_Andino_v2.pdf',
        sizeKb: 1420,
        classification: 'CONFIDENCIAL - PRIVADO',
        contentSummary: 'Especificación de APIs y webhooks para pasarela de flota logística.',
        signedToken: 'tok_andino_sec_99182',
        tokenExpiresAt: new Date('2026-12-31'),
      },
      {
        id: 'DOC-5002',
        projectId: prjSanMartin.id,
        ownerEmail: 'sistemas@clinicasanmartin.co',
        title: 'Protocolo_HIPAA_Ley1581_ClinicaSanMartin.pdf',
        sizeKb: 2150,
        classification: 'CONFIDENCIAL - SALUD',
        contentSummary: 'Arquitectura de seguridad para datos de historia clínica y triaje.',
        signedToken: 'tok_sanmartin_sec_3311',
        tokenExpiresAt: new Date('2026-12-31'),
      },
    ],
  });

  // Tickets de Soporte
  await prisma.supportTicket.create({
    data: {
      id: 'TCK-901',
      ownerEmail: 'cliente@grupologistico.co',
      clientName: 'Grupo Logístico Andino',
      subject: 'Integración de credenciales WhatsApp Cloud API',
      message: 'Ya tenemos el número verificado en Meta Business para iniciar pruebas de homologación.',
      status: 'En Revisión',
    },
  });

  // 9. CONEXIÓN DE WHATSAPP INICIAL (MÓDULO DUAL)
  await prisma.whatsAppConnection.create({
    data: {
      provider: 'QR_DEVICE',
      status: 'DISCONNECTED',
      phoneNumber: '+57 323 416 6354',
      accountName: 'EDMYSOFT Comercial (Edier Gallego)',
      errorLogs: JSON.stringify([
        {
          timestamp: new Date().toISOString(),
          type: 'INFO',
          message: 'Instancia lista para generar código QR bajo demanda.',
        },
      ]),
    },
  });

  // 10. CMS VISUAL INICIAL PARA LA PÁGINA DE INICIO (HOME)
  const homePage = await prisma.pageContent.create({
    data: {
      slug: 'home',
      title: 'Página de Inicio — EDMYSOFT',
      seoTitle: 'EDMYSOFT | Desarrollo Web, IA & Automatización - Backed by TuSoft',
      seoDesc: 'Ingeniería de software a medida, agentes de IA en WhatsApp y automatizaciones empresariales con el respaldo de TuSoft.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.pageSection.createMany({
    data: [
      {
        pageId: homePage.id,
        sectionKey: 'hero',
        title: 'Desarrollo Web, Inteligencia Artificial, Agentes Virtuales y Automatización Empresarial',
        subtitle: 'Transformamos desafíos complejos en software escalable a medida. Bajo la dirección técnica de Edier Mery Gallego y respaldados por la infraestructura multidesarrollador de TuSoft.',
        content: JSON.stringify({
          badgeText: 'Ingeniería de Software de Alto Nivel en Colombia | Alianza Oficial TuSoft',
          primaryBtnText: 'Cotizar Proyecto a Medida',
          primaryBtnLink: '#cotizador',
          secondaryBtnText: 'Agendar Reunión Diagnóstica',
          secondaryBtnLink: '#respaldo',
          stats: [
            { value: '100%', label: 'Arquitectura a Medida' },
            { value: '24/7', label: 'Agentes IA & Automatización' },
            { value: 'TuSoft', label: 'Respaldo Multidesarrollador' },
            { value: 'OWASP', label: 'Seguridad RBAC & PBKDF2' },
          ],
        }),
        order: 1,
        isVisible: true,
      },
      {
        pageId: homePage.id,
        sectionKey: 'respaldo_tusoft',
        title: 'Agilidad de Autor con la Solidez Corporativa de TuSoft',
        subtitle: 'En EDMYSOFT eliminamos la brecha entre el trato cercano de un arquitecto líder y la capacidad operativa de una casa de software consolidada.',
        content: JSON.stringify({
          leadName: 'Edier Mery Gallego',
          leadTitle: 'Líder Técnico & Fundador',
          leadEmail: 'ediergallego59@gmail.com',
          leadPhone: '+57 323 416 6354',
          quoteText: 'Nuestro compromiso no es solo entregar líneas de código, sino construir activos digitales seguros que automaticen la operación, reduzcan costos y multipliquen la capacidad comercial de cada cliente.',
        }),
        order: 2,
        isVisible: true,
      },
      {
        pageId: homePage.id,
        sectionKey: 'casos_exito',
        title: 'Evidencia de Impacto: Casos de Éxito',
        subtitle: 'Soluciones desplegadas bajo el liderazgo de Edier Mery Gallego y la arquitectura de respaldo de TuSoft.',
        content: JSON.stringify([
          {
            tag: 'Agentes IA & WhatsApp',
            sector: 'Sector Salud / Clínicas',
            title: 'Agente Virtual de Triaje y Agendamiento Médico',
            result: '-78% tiempo de respuesta • +42% citas',
            tech: ['FastAPI', 'WhatsApp Cloud', 'PostgreSQL'],
          },
          {
            tag: 'Plataforma Web SaaS',
            sector: 'Logística Nacional',
            title: 'Sistema Centralizado de Despachos y Flotas',
            result: 'Control en tiempo real de +180 vehículos',
            tech: ['Next.js', 'Node.js', 'Tailwind', 'AWS'],
          },
          {
            tag: 'Automatización RPA',
            sector: 'Finanzas & Contabilidad',
            title: 'Conciliación Automática Facturación DIAN & ERP',
            result: 'De 40 horas/mes a 15 minutos automatizados',
            tech: ['Python Workers', 'REST APIs', 'PostgreSQL'],
          },
        ]),
        order: 3,
        isVisible: true,
      },
    ],
  });

  // Crear la primera revisión histórica del CMS
  await prisma.contentRevision.create({
    data: {
      pageId: homePage.id,
      version: 1,
      snapshot: JSON.stringify({
        title: homePage.title,
        seoTitle: homePage.seoTitle,
        publishedAt: new Date().toISOString(),
      }),
      publishedBy: 'Edier Mery Gallego (Inicial)',
    },
  });

  console.log('--- Semilla Extendida completada con éxito. Base de datos 100% alineada con TuSoft, CMS y WhatsApp ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
