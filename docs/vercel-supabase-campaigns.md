# Campanas compartidas con Vercel + Supabase

La bitacora ya esta preparada para usar dos modos:

- En `localhost` usa el guardado local del navegador.
- En Vercel usa Supabase mediante las funciones dentro de `api/`.

Tambien puedes forzar el modo local en Vercel agregando `?local=1` a la URL.

## 1. Crear las tablas en Supabase

1. Abre tu proyecto de Supabase.
2. Entra a SQL Editor.
3. Ejecuta el contenido completo de `docs/supabase-campaigns.sql`.

## 2. Variables en Vercel

En Vercel, ve a Project Settings > Environment Variables y agrega:

```txt
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
CAMPAIGN_UNLOCK_SECRET=una-frase-larga-aleatoria
```

`SUPABASE_SERVICE_ROLE_KEY` sale de Supabase > Project Settings > API > service_role. No debe ponerse en codigo del navegador ni compartirse.

`CAMPAIGN_UNLOCK_SECRET` puede ser cualquier frase larga aleatoria. Sirve para firmar el acceso temporal despues de poner la contrasena de una campana.

Despues de agregar o cambiar variables en Vercel, hay que hacer Redeploy.

## 3. Modelo de acceso

- Todos pueden ver la lista de campanas.
- Todos pueden abrir el resumen de una campana.
- Si la campana tiene contrasena, se abre en modo resumen.
- Con la contrasena se desbloquean personajes, sesiones, edicion y borrado.
- Las sesiones guardadas aplican PX o PP en Supabase para que todos vean el mismo avance.

## 4. Endpoints disponibles

```txt
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/unlock
POST   /api/campaigns/:id/characters
PATCH  /api/campaigns/:id/characters
DELETE /api/campaigns/:id/characters
POST   /api/campaigns/:id/sessions
DELETE /api/campaigns/:id/sessions
```

## 5. Prueba rapida

1. Despliega el proyecto en Vercel.
2. Abre `/campaigns/`.
3. Crea una campana.
4. Entra desde otra ventana o navegador y confirma que aparece en la lista.
5. Si la campana tiene contrasena, entra sin contrasena para ver resumen y luego desbloquea para editar.
