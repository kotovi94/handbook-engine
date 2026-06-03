# Etapa 9: Modelo de reglas escalable

Esta etapa bloquea la arquitectura de datos antes de cargar contenido real. La aplicacion debe poder calcular, validar y resolver elecciones sin depender de texto plano.

## Objetivo

- Redisenar `src/data` para contenido real.
- Crear un esquema de entidades estable.
- Crear un sistema de efectos calculables.
- Crear un resolver de elecciones pendientes.
- Crear un validador de datos.
- Migrar los datos de prueba actuales al nuevo formato.

## Estructura de datos

```txt
src/data/rules/
  classes/
  subclasses/
  species/
  backgrounds/
  feats/
  equipment/
  spells/
  proficiencies/
  advancement/
  schema/
```

Cada dominio exporta entidades con IDs estables en ingles. La UI muestra `label` en espanol y la hoja usa `sheetText` cuando existe.

## Forma base de entidad

```js
{
  id: "fighter",
  name: "Fighter",
  label: "Guerrero",
  summary: "Resumen corto para UI.",
  description: "Explicacion de la regla.",
  effects: [],
  choices: [],
  sheetText: "Texto listo para copiar en la hoja."
}
```

## Features por nivel

Las progresiones ya no deben usar strings sueltos. Cada rasgo debe ser una entidad calculable:

```js
{
  id: "fighter-extra-attack",
  name: "Extra Attack",
  label: "Ataque adicional",
  level: 5,
  description: "Attack twice when taking the Attack action.",
  sheetSection: "classFeatures",
  effects: [
    { type: "attack.count", value: 2 }
  ],
  sheetText: "Ataque adicional: 2 ataques con la accion de Atacar."
}
```

## Efectos

Todo beneficio automatico debe entrar por `effects`. Esto permite combinar clase, subclase, especie, trasfondo, dotes y equipo.

Ejemplos:

```js
{ type: "proficiency.skill", items: ["Athletics", "Intimidation"] }
{ type: "language.grant", languages: ["Common"] }
{ type: "equipment.grant", items: ["longsword"] }
{ type: "coin.add", coins: { gp: 15 } }
{ type: "attack.count", value: 2 }
```

El resolver vive en `src/scripts/effectEngine.js`.

## Elecciones pendientes

Las reglas que requieren decision del jugador usan `choices`:

```js
{
  id: "fighter-skill-choice",
  label: "Habilidades de Guerrero",
  type: "skill",
  count: 2,
  from: ["Athletics", "Perception", "Survival"],
  optionLabels: {
    Athletics: "Atletismo",
    Perception: "Percepcion",
    Survival: "Supervivencia"
  }
}
```

`src/scripts/choiceEngine.js` detecta elecciones activas, calcula faltantes y convierte respuestas en efectos. `src/components/PendingPanel.js` muestra lo que falta resolver.

## Validacion

Antes de sumar contenido masivo, ejecutar:

```bash
node tools/validate-rules.mjs
```

El validador revisa:

- IDs duplicados por coleccion.
- IDs duplicados globales.
- Features duplicadas.
- Campos requeridos.
- Niveles validos de features.
- Referencias inexistentes.
- Categorias de equipo validas.
- Tipos de efecto soportados.
- Payload requerido por efecto.
- Choices con `count` y opciones suficientes.
- Subclases duplicadas por clase y nombre.

## Prioridad de fuentes

Para evitar duplicidad, una subclase debe existir una sola vez por clase y nombre.

Prioridad para Guerrero:

1. `Player's Handbook 2024`
2. Libros posteriores o complementarios solo si la subclase no existe en PHB 2024.

Ejemplo: si `Psi Warrior` aparece en Tasha y tambien en PHB 2024, la app conserva la version PHB 2024 y no carga la version de Tasha.

## Estado actual

Los datos de prueba actuales ya usan el modelo nuevo: clases, subclases, especies, trasfondos, dotes, equipo y progresion por nivel. La siguiente fase puede empezar a cargar contenido real sobre este contrato sin reescribir los motores.
