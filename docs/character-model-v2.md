# Modelo de personaje v2

## Objetivo

`CharacterDocument` es la fuente de verdad del personaje dentro del Compendio D20 Travesías. Envuelve el estado completo que ya usa el creador, sin reemplazar el motor de reglas ni transformar los campos existentes.

La migración es aditiva: la clave heredada `handbook-engine-character` no se elimina ni se sobrescribe. La colección nueva se guarda en `handbook-engine-characters-v2` y el personaje abierto se identifica mediante `handbook-engine-active-character-id`.

## Contrato

```js
CharacterDocument {
  schemaVersion: 2,
  id,
  systemId: "dnd5e2024",
  kind: "player",
  revision,
  createdAt,
  updatedAt,
  profile: {
    name,
    player,
    portrait,
    color
  },
  builder: {},
  progression: {
    level,
    xp,
    persistentConditions: [],
    rewards: [],
    history: []
  },
  campaign: {
    campaignId,
    storageMode,
    remoteCharacterId,
    assignedAt
  }
}
```

`builder` conserva íntegramente el modelo usado por `characterState.js`: clase, origen, atributos, progresión, equipo, combate, apariencia y elecciones. Las pantallas existentes pueden continuar leyendo ese objeto mientras la biblioteca trabaja con el documento completo.

## Reglas de identidad

- El `id` se crea una sola vez y no cambia al editar, imprimir o asignar el personaje.
- `revision` aumenta con cada escritura del documento.
- Una campaña debe conservar `id` o registrar su ID remoto en `campaign.remoteCharacterId`.
- Una segunda asignación con el mismo ID actualiza el registro; no crea otro personaje.
- Las sesiones deben añadir cambios a `progression` e historial en el documento canónico.

## Migración segura

1. Si ya existe una colección v2 válida, se normaliza y se utiliza sin leer nuevamente el borrador heredado.
2. Si no existe, se lee `handbook-engine-character`.
3. El JSON heredado válido se envuelve en un `CharacterDocument` sin descartar campos desconocidos.
4. Antes de completar la migración, el texto original se copia una sola vez a `handbook-engine-character-backup-v1`.
5. Si el JSON heredado está dañado, se conserva intacto y se crea un personaje nuevo de nivel 1.
6. La clave heredada nunca se elimina durante la Fase 1.
7. La migración es idempotente: recargar la aplicación no crea duplicados.

## Compatibilidad con Campañas

Los personajes históricos de Campañas pueden seguir usando su forma reducida. Cuando un registro tenga un `CharacterDocument` completo se guardará de forma aditiva en sus metadatos, manteniendo los campos actuales (`name`, `className`, `xp`, etc.) para las vistas y endpoints existentes.

En campañas remotas, el registro remoto asignado será la autoridad de sus cambios de sesión. La biblioteca local conservará el vínculo y una copia de trabajo identificada por revisión; no mostrará “Sincronizado” hasta que una escritura remota haya finalizado correctamente.

