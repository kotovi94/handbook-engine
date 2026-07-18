# Modelo de campaña

Este modelo define la base de datos interna para ampliar la Bitácora de Campañas sin romper las campañas actuales. La regla principal es que todo lo que el DM escriba debe poder buscarse, enlazarse, revelarse a jugadores y conectarse en el tablero.

## Objetivos

- Mantener compatibilidad con campañas existentes.
- Separar datos de campaña, interfaz y herramientas del DM.
- Dar identidad propia a notas, lugares, ciudades, facciones, misiones, secretos, imágenes, links y conexiones.
- Permitir visibilidad por pieza de contenido: privado del DM, preparado, revelado o público.
- Preparar enlaces internos desde el editor con sintaxis tipo `[[Nombre de entidad]]`.
- Preparar búsqueda por campaña sin depender de una pantalla concreta.
- Preparar el tablero de detective con nodos, posiciones, relaciones editables y orden.

## Estructura principal

```js
Campaign {
  id,
  name,
  dm,
  systemId,
  system,
  description,
  theme,
  font,
  appearance,
  color,
  banner,
  passwordHash,
  characters,
  sessions,
  workspace
}
```

`characters` y `sessions` se mantienen por compatibilidad con la Bitácora actual. La expansión vive dentro de `workspace`.

```js
CampaignWorkspace {
  schemaVersion: 1,
  notes: [],
  places: [],
  cities: [],
  factions: [],
  missions: [],
  secrets: [],
  images: [],
  links: [],
  connections: [],
  dmTools: [],
  boards: [],
  onboarding: {
    firstVisitAt,
    completedSteps,
    dismissedAt
  }
}
```

## Entidad común

Todas las entidades narrativas usan una forma común. Esto permite búsqueda, enlaces internos, visibilidad y tablero sin lógica especial por cada colección.

```js
CampaignEntity {
  id,
  type,
  title,
  slug,
  summary,
  content,
  tags,
  visibility,
  imageIds,
  linkIds,
  relatedIds,
  metadata,
  createdAt,
  updatedAt
}
```

`content` es el contrato del editor:

```js
EditorContent {
  format: "campaign-blocks-v1",
  plainText,
  blocks
}
```

`plainText` existe para búsqueda rápida. `blocks` queda reservado para editor enriquecido: párrafos, títulos, listas, checkboxes, imágenes, citas, menciones internas y bloques especiales.

## Editor

La primera implementación del editor vive en la vista `Páginas` de la Bitácora. Permite crear y editar:

- notas
- lugares
- ciudades
- facciones
- misiones
- secretos

Cada página guarda:

- tipo
- visibilidad
- título
- resumen
- etiquetas
- contenido en `content.plainText`
- vínculos internos detectados en `metadata.mentions`
- IDs relacionados en `relatedIds`

El contenido usa una sintaxis ligera compatible con texto plano:

```md
# Título
- Lista
- [ ] Tarea
> Cita
[Texto](https://ejemplo.com)
[[Nombre de otra página]]
```

Los vínculos internos se resuelven contra páginas de campaña, personajes y sesiones. Si el destino existe, la vista previa lo convierte en un vínculo clicable. Si no existe, queda marcado como vínculo pendiente.

## Recursos

La primera implementación de recursos vive dentro del editor de `Páginas`.

- Las imágenes se guardan en `workspace.images` como recursos de campaña.
- Los links se guardan en `workspace.links`.
- Las páginas solo guardan referencias en `imageIds` y `linkIds`.
- El buscador global indexa imágenes y links.
- El tablero puede usar imágenes y links como nodos conectables.

En modo local, las imágenes se guardan como data URL dentro del respaldo del navegador con un límite de 2 MB por archivo. En modo remoto se guardan dentro del `workspace` JSONB de la campaña; si la biblioteca visual crece mucho, el siguiente paso profesional es mover binarios a Supabase Storage y dejar aquí solo metadatos.

## Herramientas DM

La primera implementación vive en la vista `Herramientas DM` de la Bitácora y guarda registros en `workspace.dmTools`.

Cada herramienta usa el contrato de entidad común, más:

- `toolType`: escena, encuentro, trampa, peligro, recompensa, facción, asentamiento, mazmorra, PNJ o reloj.
- `status`: borrador, listo, activo, resuelto o archivado.
- `data`: campos cortos propios de la plantilla.
- `content.plainText`: notas libres para dirigir en mesa.

Las herramientas se indexan en la búsqueda global, pueden enlazarse con `[[Nombre]]` desde el editor, pueden añadirse al tablero como nodos y se guardan en modo local o remoto junto al `workspace` de la campaña.

## Tutorial de primera visita

El tutorial vive dentro de la Bitácora y usa `workspace.onboarding` por campaña.

- `firstVisitAt`: primera vez que la guía se mostró en esa campaña.
- `completedSteps`: pasos vistos o completados por el DM.
- `dismissedAt`: fecha en que el DM cerró o finalizó la guía.

La guía se abre automáticamente si la campaña todavía no fue cerrada y puede reabrirse desde la barra lateral con `Ver tutorial`. Sus pasos cubren resumen, páginas, recursos, tablero y herramientas DM.

## Búsqueda

La primera búsqueda por campaña vive en el `Resumen`. Indexa en memoria el contenido de la campaña abierta y no modifica la estructura guardada.

Fuentes actuales:

- personajes
- sesiones
- notas
- lugares
- ciudades
- facciones
- misiones
- secretos

Cada resultado conserva el destino real. Al abrirlo, la interfaz navega a `Personajes`, `Bitácora` o `Páginas` y carga el elemento cuando corresponde. La búsqueda pondera coincidencias en título, metadatos, etiquetas y cuerpo del texto.

## Visibilidad

La visibilidad se separa en dos ideas: quién puede leer y en qué estado está la información.

```js
Visibility {
  audience: "dm" | "players",
  state: "draft" | "prepared" | "revealed" | "archived"
}
```

Ejemplos:

- Nota privada del DM: `{ audience: "dm", state: "draft" }`
- Secreto preparado: `{ audience: "dm", state: "prepared" }`
- Pista ya descubierta: `{ audience: "players", state: "revealed" }`
- Entrada pública del diario: `{ audience: "players", state: "revealed" }`

Reglas de lectura:

- El DM puede leer todo excepto contenido archivado cuando la vista no pide archivos.
- Los jugadores solo pueden leer contenido con `audience: "players"` y `state: "revealed"`.
- `prepared` significa listo para usar por el DM, pero no visible para jugadores.
- Los personajes existentes se normalizan como `kind: "player"` y quedan revelados.
- Las sesiones existentes se normalizan como contenido revelado para jugadores, porque representan la bitácora pública actual.
- Los PNJ futuros deben usar `kind: "npc"` y empezar como contenido privado del DM.

## Colecciones

`sessions`: sesiones jugadas. Hoy guardan asistencia, recompensas y notas de combate/roleo. En la expansión deben poder enlazarse a entidades descubiertas, imágenes y resumen público.

`characters`: personajes de la campaña. Los existentes se normalizan como `kind: "player"`. Pueden llevar `notes` y `metadata` para búsquedas, tablero e importaciones desde el creador. Más adelante puede admitir `kind: "npc"` cuando la interfaz separe personajes jugadores de PNJ.

`notes`: páginas libres del DM o diario público. Sirven para preparación, crónicas, handouts, reglas caseras y apuntes de mesa.

`places`: lugares concretos que no son ciudades completas: taberna, templo, ruina, mazmorra, tienda, casa noble, portal.

`cities`: asentamientos grandes o relevantes. Pueden tener gobierno, barrios, problemas, tiendas, facciones activas y rumores.

`factions`: grupos, gremios, cultos, casas nobles, bandas, ejércitos o comunidades. Deben soportar renombre, aliados, enemigos y objetivos.

`missions`: objetivos activos, completados o fallidos. Deben enlazarse a sesiones, PNJ, lugares, recompensas y secretos.

`secrets`: información preparada que todavía no debería aparecer en la vista de jugadores. Cuando se revela, puede convertirse en nota pública o vincularse a una sesión.

`images`: biblioteca visual de campaña. Guarda mapas, retratos, símbolos, pistas visuales y handouts.

`links`: hipervínculos externos o referencias internas importantes. Sirve para URLs, documentos, reglas, música, mapas o material propio.

`connections`: relaciones entre entidades. Cada conexión tiene origen, destino, etiqueta, descripción, visibilidad y orden.

`dmTools`: estados guardados de herramientas del DM: persecución, trampa, peligro, renombre, facción, asentamiento, mazmorra, veneno, recompensa o escena.

`boards`: tableros visuales. Guardan nodos, posición, color, icono, tamaño, estado colapsado y viewport.

## Conexiones

```js
Connection {
  id,
  boardId,
  from: { type, id },
  to: { type, id },
  label,
  description,
  visibility,
  order,
  style,
  createdAt,
  updatedAt
}
```

Ejemplos de etiquetas:

- conoce a
- trabaja para
- vive en
- oculta
- busca
- protege
- amenaza
- fue revelado en
- se conecta con

## Tablero

```js
Board {
  id,
  title,
  nodes: [
    {
      id,
      entityType,
      entityId,
      x,
      y,
      color,
      icon,
      width,
      collapsed,
      visibility
    }
  ],
  viewport: { x, y, zoom },
  updatedAt
}
```

El tablero no duplica datos narrativos. Solo guarda cómo se ven y se conectan las entidades. La ficha real vive en su colección.

La primera implementación vive en la vista `Tablero` de la Bitácora. Permite:

- añadir nodos desde personajes, sesiones y páginas de campaña;
- mover nodos con posición persistente;
- crear conexiones entre dos nodos;
- editar etiqueta y descripción de una conexión;
- cambiar el orden visual de conexiones selecciónadas;
- quitar nodos o conexiones sin borrar la entidad original;
- deshacer y rehacer cambios de tablero durante la sesión abierta.

En modo local se guarda dentro de `workspace.boards` y `workspace.connections`. En modo remoto se persiste en `campaign_workspaces.workspace` mediante la API de Vercel.

## Índice derivado

El buscador por campaña deriva su índice al vuelo. No se guarda como fuente de verdad. A medida que entren más módulos, debe cubrir:

- Título, resumen, texto plano, etiquetas y metadatos de cada entidad.
- Sesiones: nombre, número, fecha, notas, participantes y recompensas.
- Personajes: nombre, jugador, clase/rol y notas futuras.
- Conexiones: etiqueta y descripción.
- Links: etiqueta, URL y fuente.

## Persistencia

En local, `workspace` se guarda dentro del JSON de campaña existente.

En Supabase, la primera implementación remota usa una fila por campaña:

```sql
campaign_workspaces(campaign_id, workspace, updated_at)
```

`workspace` contiene páginas, recursos, herramientas DM, conexiones, tableros y tutorial. La app lo normaliza antes de guardar y lo carga al abrir la campaña desbloqueada.

Cuando haga falta colaboración simultánea, auditoría por entidad o búsqueda SQL avanzada, el siguiente paso recomendado es dividir ese JSON en tablas especializadas:

```sql
campaign_entities(id, campaign_id, type, title, slug, summary, content, visibility, tags, metadata, created_at, updated_at)
campaign_assets(id, campaign_id, title, src, alt, caption, mime_type, size, metadata, created_at, updated_at)
campaign_connections(id, campaign_id, board_id, from_type, from_id, to_type, to_id, label, description, visibility, style, sort_order, created_at, updated_at)
campaign_boards(id, campaign_id, title, nodes, viewport, updated_at)
campaign_tool_states(id, campaign_id, tool_type, title, status, visibility, data, created_at, updated_at)
```

No se debe migrar el backend remoto hasta que existan pantallas y endpoints para crear, editar, buscar y revelar estas entidades.
