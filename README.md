# RomiOrg

Calendario personal (PWA) para iPhone con recordatorios que se vuelven más frecuentes —y más insistentes— según la prioridad y la dificultad de cada etiqueta. Cada persona elige su nombre (la app pasa a llamarse *NombreOrg*) y su color.

## Qué hace

- Vistas tipo Google Calendar: agenda, día, 3 días, semana y mes.
- Etiquetas propias con color, prioridad y dificultad; de ahí sale cuántos recordatorios recibe cada evento.
- Cuatro estilos de alerta: recordatorio, se acerca, urgente y "derretimiento" (dificultad máxima y está por empezar).
- Notificaciones push con la app cerrada (Web Push + QStash).
- Cuentas con Clerk: los datos quedan guardados en la cuenta y se sincronizan entre dispositivos.
- Funciona sin conexión: la app se guarda en el teléfono y sincroniza cuando vuelve internet.

## Stack

- Next.js 16 (App Router) + Tailwind CSS 4, desplegado en Vercel.
- Clerk (cuentas), Upstash Redis (datos y suscripciones push), Upstash QStash (envío programado de recordatorios), `web-push` (VAPID).

## Desarrollo local

```bash
npm install
vercel env pull     # trae las variables de entorno del proyecto de Vercel a .env.local
npm run dev
```

Variables que usa la app (se cargan desde Vercel; no se commitean):

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Cuentas (Clerk) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Base de datos (Upstash Redis) |
| `QSTASH_TOKEN`, `QSTASH_URL`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Envío programado (QStash) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Notificaciones push |
| `CRON_SECRET` | Tarea diaria que programa recordatorios lejanos |

## Publicar

```bash
vercel deploy --prod
```

## Instalar en el iPhone

Abrir la URL en Safari → Compartir → **Agregar a pantalla de inicio**, abrir la app desde el ícono, iniciar sesión y activar las notificaciones en Ajustes.
