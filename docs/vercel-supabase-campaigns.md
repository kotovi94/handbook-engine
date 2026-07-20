# Campañas compartidas con Vercel + Supabase

La bitácora ya está preparada para usar dos modos:

- En `localhost` usa el guardado local del navegador.
- En Vercel usa Supabase mediante las funciones dentro de `api/`.

También puedes forzar el modo local en Vercel agregando `?local=1` a la URL.

## 1. Crear las tablas en Supabase

1. Abre tu proyecto de Supabase.
2. Entra a SQL Editor.
3. Ejecuta el contenido completo de `docs/supabase-campaigns.sql`.

Puedes volver a ejecutar ese SQL sobre un proyecto existente. Las columnas nuevas de personajes, como `notes` y `metadata`, se agregan con `add column if not exists`.

## 2. Variables en Vercel

En Vercel, ve a Project Settings > Environment Variables y agrega:

```txt
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
CAMPAIGN_UNLOCK_SECRET=una-frase-larga-aleatoria
```

`SUPABASE_SERVICE_ROLE_KEY` sale de Supabase > Project Settings > API > service_role. No debe ponerse en código del navegador ni compartirse.

`CAMPAIGN_UNLOCK_SECRET` puede ser cualquier frase larga aleatoria. Sirve para firmar el acceso temporal después de poner la contraseña de una campaña.

Después de agregar o cambiar variables en Vercel, hay que hacer Redeploy.

Las contraseñas nuevas se guardan como PBKDF2 con sal. Las campañas creadas antes con SHA-256 simple siguen abriendo por compatibilidad, pero al cambiar su contraseña pasan al formato nuevo.

Las campañas protegidas existentes conservan su contraseña. Después de desbloquearlas, el DM puede generar un código de recuperación que se muestra una sola vez. El servidor guarda únicamente su hash. Al restablecer la contraseña, el código anterior y todos los accesos temporales quedan invalidados y se entrega un código nuevo.

## 3. Modelo de acceso

- Todos pueden ver la lista de campañas.
- Todos pueden abrir el resumen de una campaña.
- Si la campaña tiene contraseña, se abre en modo resumen.
- Con la contraseña se desbloquean personajes, sesiones, edición y borrado.
- Las sesiones guardadas aplican PX o PP en Supabase para que todos vean el mismo avance.
- La Bitácora avanzada guarda páginas, imágenes pequeñas, links, herramientas DM, conexiones, tablero y tutorial por campaña.

## 4. Endpoints disponibles

```txt
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/unlock
POST   /api/campaigns/:id/recovery
POST   /api/campaigns/:id/characters
PATCH  /api/campaigns/:id/characters
DELETE /api/campaigns/:id/characters
POST   /api/campaigns/:id/sessions
DELETE /api/campaigns/:id/sessions
GET    /api/campaigns/:id/workspace
PATCH  /api/campaigns/:id/workspace
```

## 5. Prueba rápida

1. Despliega el proyecto en Vercel.
2. Abre `/campaigns/`.
3. Crea una campaña.
4. Entra desde otra ventana o navegador y confirma que aparece en la lista.
5. Si la campaña tiene contraseña, entra sin contraseña para ver resumen y luego desbloquea para editar.
