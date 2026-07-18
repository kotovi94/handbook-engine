# Handbook Engine

Handbook Engine es una aplicación web personal para preparar y dirigir partidas de rol de mesa, especialmente Dungeons & Dragons 5e/2024. Está pensada para jugadores, DMs y mesas presenciales que necesitan crear personajes, consultar reglas Útiles, preparar hojas físicas, organizar campañas y generar mazmorras jugables sin depender de servicios externos.

El proyecto fue creado por Kotovi para el entorno de D20 Travesías y desarrollado con asistencia de Codex, usando una arquitectura frontend modular en JavaScript, HTML y CSS.

## Para quien es

- Jugadores que quieren crear personajes de nivel 5 con una guía paso a paso.
- DMs que necesitan preparar sesiones, encuentros, mazmorras, tesoros y notas rápidas.
- Mesas presenciales que usan hojas físicas y necesitan instrucciones claras para completarlas.
- Campañas que mezclan preparación local, consulta rápida y bitácora de sesiones.

## Qué problema resuelve

Handbook Engine concentra varias herramientas de mesa en una sola app:

- Reduce el tiempo de preparación antes de la sesión.
- Convierte datos de reglas en elecciónes guiadas y textos listos para hoja.
- Ayuda a crear contenido jugable sin convertirlo en una aventura cerrada.
- Mantiene los datos editables para que el DM o jugador pueda ajustar cualquier resultado.
- Funciona como app web local, con persistencia en `localStorage` para herramientas personales.

## Apps incluidas

### Inicio

Pantalla de acceso rápido a las herramientas principales. Sirve como centro de navegación para crear personajes, buscar reglas, abrir la bitácora o generar mazmorras.

### Crear personaje

Asistente paso a paso para construir personajes de D&D 5e/2024, actualmente enfocado en personajes de nivel 5.

Incluye:

- Elección de clase, trasfondo, especie y subclase.
- Método de atributos y compra por puntos.
- Mejora de nivel 4 mediante subida de características o dote.
- Equipo inicial, equipo avanzado de nivel 5 y objetos mágicos sugeridos.
- Cálculos derivados como CA, PG, bono de competencia, ataques y monedas.
- Elecciones pendientes para habilidades, idiomas, conjuros, herramientas y rasgos.

### Resumen

Vista compacta del personaje creado. Sirve para revisar los datos principales antes de llevarlos a la hoja física o imprimirlos.

### Apariencia

Generador de descripción visual de personaje. No crea imágenes: organiza rasgos como edad aparente, rostro, ojos, cabello, postura, ropa y estilo para producir una descripción narrativa y un prompt visual reutilizable.

### Imprimir hoja

Salida preparada para copiar o imprimir la información importante del personaje. Está orientada a hojas físicas, por eso prioriza instrucciones claras por sección en lugar de producir solo una ficha digital.

### Campañas y bitácora

Módulo separado para administrar campañas, personajes y sesiones.

Sirve para:

- Registrar sesiones jugadas.
- Repartir experiencia en D&D 5e/2024.
- Repartir Puntos de Perfeccionamiento en Cyberpunk RED.
- Mantener personajes asociados a una campaña.
- Abrir campañas protegidas en modo resumen o modo edición.

En local usa `localStorage`. En despliegue puede usar Supabase mediante funciones serverless dentro de `api/`.

El modelo extendido de campaña para notas, lugares, ciudades, facciones, misiones, secretos, imágenes, links, conexiones, herramientas del DM, tablero visual y tutorial de primera visita está documentado en `docs/campaign-model.md`.

### Dungeon Generator

Generador procedural de mazmorras para DMs de mesa presencial. No pretende escribir una aventura completa; crea una base jugable que el DM puede editar.

Genera:

- Configuración por nivel, jugadores, dificultad, tamaño, tipo, tema, habitantes, densidad y tesoro.
- Nombre, resumen, zonas internas, causa interna, situación actual y relación entre habitantes.
- Mapa visual de tiles con salas de distintas formas, pasillos, puertas, secretos, elevación, entradas secundarias y salida.
- Salas con descripción, conexiones, pistas, peligros, tesoro, notas y encuentros.
- Encuentros por CR con criaturas oficiales del catálogo cuando existen.
- Avisos de revision cuando no hay criatura oficial adecuada; no inventa statblocks.
- Exportación a JSON, Markdown y borrador para Foundry VTT.

El generador funciona sin IA externa. Usa tablas internas, catálogos locales y algoritmos procedurales.

### Clases

Referencia navegable de clases cargadas en el motor de reglas. Sirve para revisar rasgos, subclases y datos visibles sin pasar por todo el flujo de creación.

### Búsqueda

Buscador global para reglas y contenido cargado. Incluye filtros para items y hechizos, Útil cuando el jugador o DM necesita consultar equipo, conjuros o datos de reglas rapidamente.

## Cómo está construida

La app es un frontend modular sin framework pesado. Cada pantalla se renderiza con funciones JavaScript que crean componentes DOM reutilizables.

Estructura principal:

- `index.html`: punto de entrada de la aplicación.
- `src/pages`: pantallas principales.
- `src/components`: componentes reutilizables de interfaz.
- `src/scripts`: router, estado de personaje, motores de reglas, búsqueda y utilidades.
- `src/styles`: estilos globales, componentes, temas e impresion.
- `src/data`: navegación, contenido y reglas estructuradas.
- `src/data/rules`: modelo escalable de reglas por dominio.
- `src/dungeon`: generador de mazmorras, mapas, encuentros, tesoros, puertas, validación y exportadores.
- `campaigns`: app de campañas y bitácora.
- `api`: funciones serverless para persistencia remota cuando se despliega con Supabase.
- `docs`: documentación técnica auxiliar.
- `tools`: scripts de validación y extracción de datos.

El extractor de metadatos de monstruos trabaja solo con texto pegado por el usuario y entradas manuales verificadas; no usa OCR del PDF escaneado.

## Arquitectura de reglas

El motor de personaje usa datos estructurados en vez de textos sueltos. Las entidades pueden declarar:

- IDs internos estables.
- Etiquetas visibles en espanol.
- Fuente.
- Efectos mecánicos.
- Elecciones pendientes.
- Texto corto para hoja física.

Esto permite calcular valores derivados, listar pendientes y mapear el resultado a instrucciones de hoja.

## Arquitectura del Dungeon Generator

El generador de mazmorras está separado por responsabilidad:

- `dungeonTypes.js`: opciónes, normalización de configuración y utilidades aleatorias.
- `dungeonTables.js`: tablas editables de tipos, temas, habitantes, salas, puertas y textos.
- `dungeonGenerator.js`: orquestación general de la mazmorra.
- `roomGenerator.js`: contenido de cada sala.
- `encounterGenerator.js`: encuentros por presupuesto de XP y CR.
- `monsterManualCatalog.js`: catálogo local de monstruos como metadatos.
- `monsterRules.js`: formato, notas y reglas de presentacion de criaturas.
- `treasureGenerator.js`: tesoros y recompensas.
- `doorGenerator.js` y `dungeonDoorUtils.js`: puertas, accesos y conexiones jugables.
- `dungeonMapGenerator.js`: mapa visual basado en tiles.
- `dungeonRoomShapes.js`: formas de sala.
- `dungeonConnectionShapes.js`: formas de pasillo y conexión.
- `dungeonMapFeatures.js`: detalles de mapa como escaleras, fosos, columnas o altares.
- `dungeonElevation.js`: niveles verticales básicos.
- `dungeonZones.js`: zonas internas de la mazmorra.
- `dungeonInhabitantMixes.js`: mezcla de habitantes principales y secundarios.
- `dungeonNarrativeThreads.js`: causa interna, situación actual y pistas.
- `dungeonValidation.js`: revision de conectividad, coherencia y riesgos.
- `dungeonMarkdownExporter.js` y `dungeonExporters.js`: salidas para notas de DM, JSON y Foundry draft.
- `dungeonStorage.js`: guardado y carga local.

## Encuentros y monstruos

Los encuentros usan CR, XP, cantidad y rol táctico. Si el sistema encuentra una criatura oficial adecuada en el catálogo local, muestra primero el nombre original en inglés:

```text
2 Mind Flayers (CR 7 c/u, 5800 XP total) - rol narrativo: cazadores de mente
```

Si no encuentra una criatura oficial adecuada, no inventa un statblock. El encuentro queda con una alerta para regenerar enemigos o elegir manualmente una criatura oficial del compendio.

Esto mantiene separada la información oficial del color narrativo que el DM puede ajustar.

## Persistencia y exportación

- El creador de personajes mantiene estado local de la sesión.
- El resumen del creador puede enviar el personaje terminado a Campañas como ficha rápida con notas de hoja.
- Dungeon Generator permite guardar y cargar mazmorras en `localStorage`.
- Las mazmorras se exportan como JSON, Markdown y Foundry draft.
- Dungeon Generator puede enviar una mazmorra a Campañas como herramienta DM para seguir preparándola en la bitácora.
- La bitácora puede trabajar localmente o con Supabase si se despliega con backend.

## Verificación rápida

Antes de publicar o después de tocar reglas, componentes de mazmorra o campañas:

```bash
node tools/validate-rules.mjs
node tools/smoke-test.mjs
```

El smoke test revisa el modelo de reglas, genera una mazmorra completa y renderiza el editor de salas para detectar errores de interfaz tempranos.

## Herramientas y autoría

- Proyecto: Handbook Engine.
- Autor/owner: Kotovi.
- Comunidad objetivo: D20 Travesías y mesas personales de rol.
- Herramienta de desarrollo asistido: Codex.
- Stack principal: JavaScript modular, HTML, CSS, datos estructurados y almacenamiento local.

## Estado del proyecto

Handbook Engine está en desarrollo activo. La base ya incluye creador de personajes, buscador, bitácora y Dungeon Generator. El enfoque actual es mejorar la calidad de datos, la utilidad en mesa y la modularidad para poder agregar más contenido sin reescribir la aplicación.
