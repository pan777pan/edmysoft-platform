# 🛡️ EDMYSOFT PLATFORM — ESTADO OFICIAL Y MEMORIA DEL PROYECTO

> **Última actualización:** 26 de Octubre de 2026  
> **Director Técnico & Creador:** Edier Mery Gallego  
> **Contacto Oficial:** +57 323 416 6354 | ediergallego59@gmail.com

---

## 📌 Arquitectura y Despliegue en la Nube (100% Gratuito y Permanente)

### 1. Repositorio Oficial de Código (GitHub)
- **Repositorio:** [https://github.com/pan777pan/edmysoft-platform](https://github.com/pan777pan/edmysoft-platform)
- **Descarga Directa en ZIP:** [https://github.com/pan777pan/edmysoft-platform/archive/refs/heads/main.zip](https://github.com/pan777pan/edmysoft-platform/archive/refs/heads/main.zip)
- **Rama principal:** `main`

### 2. Base de Datos en la Nube (Supabase)
- **Motor:** PostgreSQL (AWS us-east-1)
- **Proyecto ID:** `gtuncegkzclansgxonqe`
- **URL Proyecto:** [https://gtuncegkzclansgxonqe.supabase.co](https://gtuncegkzclansgxonqe.supabase.co)
- **Modelos:** Usuarios, Catálogo (Servicios y Planes), CRM (Contactos y Conversaciones), Cotizaciones, Auditoría, CMS y `WhatsAppConnection`.

### 3. Página Web y Panel Administrativo (Vercel)
- **Framework:** Next.js 16 con App Router, React 19 y TailwindCSS.
- **Acceso Administrativo:** `/admin/login`
- **Panel de WhatsApp:** `/admin/whatsapp`
- **Despliegues continuos:** Vercel se actualiza automáticamente ante cualquier push a GitHub.

### 4. Servidor Worker de WhatsApp 24/7 (Render)
- **Servicio:** `edmysoft-platform` en Render (Plan Free 24/7)
- **URL Pública:** [https://edmysoft-platform.onrender.com](https://edmysoft-platform.onrender.com)
- **Comando de arranque:** `npx tsx worker.ts`
- **Función:** Mantiene la conexión WebSocket con WhatsApp Web abierta de manera ininterrumpida sin depender del computador local.

---

## 🔒 Regla Crítica de Aislamiento de Chats (Blindaje de Conversaciones)

1. **Chat de Dirección (+57 323 416 6354 / "Yo - Tú"):**
   - Atendido **única y exclusivamente** por el **Copiloto Ejecutivo de Dirección**.
   - Identificación estricta: teléfono `3234166354`, LID específico del dueño o `fromJid === 'me'`.
   - Comandos activos:
     - `hola`: Saludo inmediato en <1ms.
     - `ayuda`: Despliega el menú completo de comandos.
     - `estado del sistema`: Diagnóstico en tiempo real de WhatsApp, Supabase y Vercel.
     - `resumen de hoy`: Métricas de personas que han escrito.
     - `ver catálogo`: Lista de precios activos.
     - `cambia el precio del Plan Plus a ...`: Modifica la base de datos y la web en vivo.
     - `aprende que [regla]`: Nueva directriz de aprendizaje para el bot comercial.

2. **Chats de Clientes Externos (Cualquier número o @lid ajeno):**
   - Atendidos **estrictamente por el Bot Comercial Corporativo de EDMYSOFT**.
   - Saludo oficial: *"¡Hola! Bienvenido a EDMYSOFT. Soy tu asesor comercial y consultor de inteligencia artificial..."*.
   - Responde sobre servicios, cotizaciones, planes (Estándar, Plus, Enterprise), demostraciones y agendamiento de videollamadas diagnósticas con Edier Mery Gallego.
   - Jamás se confunden clientes con el Director.
