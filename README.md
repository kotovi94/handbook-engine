# Handbook Engine

Handbook Engine es una aplicacion web personal para preparar y dirigir partidas de rol de mesa, especialmente Dungeons & Dragons 5e/2024. Esta pensada para jugadores, DMs y mesas presenciales que necesitan crear personajes, consultar reglas utiles, preparar hojas fisicas, organizar campanas y generar mazmorras jugables sin depender de servicios externos.

El proyecto fue creado por Kotovi para el entorno de D20 Travesias y desarrollado con asistencia de Codex, usando una arquitectura frontend modular en JavaScript, HTML y CSS.

## Para quien es

- Jugadores que quieren crear personajes de nivel 5 con una guia paso a paso.
- DMs que necesitan preparar sesiones, encuentros, mazmorras, tesoros y notas rapidas.
- Mesas presenciales que usan hojas fisicas y necesitan instrucciones claras para completarlas.
- Campanas que mezclan preparacion local, consulta rapida y bitacora de sesiones.

## Que problema resuelve

Handbook Engine concentra varias herramientas de mesa en una sola app:

- Reduce el tiempo de preparacion antes de la sesion.
- Convierte datos de reglas en elecciones guiadas y textos listos para hoja.
- Ayuda a crear contenido jugable sin convertirlo en una aventura cerrada.
- Mantiene los datos editables para que el DM o jugador pueda ajustar cualquier resultado.
- Funciona como app web local, con persistencia en `localStorage` para herramientas personales.

## Apps incluidas

### Inicio

Pantalla de acceso rapido a las herramientas principales. Sirve como centro de navegacion para crear personajes, buscar reglas, abrir la bitacora o generar mazmorras.

### Crear personaje

Asistente paso a paso para construir personajes de D&D 5e/2024, actualmente enfocado en personajes de nivel 5.

Incluye:

- Eleccion de clase, trasfondo, especie y subclase.
- Metodo de atributos y compra por puntos.
- Mejora de nivel 4 mediante subida de caracteristicas o dote.
- Equipo inicial, equipo avanzado de nivel 5 y objetos magicos sugeridos.
- Calculos derivados como CA, PG, bono de competencia, ataques y monedas.
- Elecciones pendientes para habilidades, idiomas, conjuros, herramientas y rasgos.

### Resumen

Vista compacta del personaje creado. Sirve para revisar los datos principales antes de llevarlos a la hoja fisica o imprimirlos.

### Apariencia

Generador de descripcion visual de personaje. No crea imagenes: organiza rasgos como edad aparente, rostro, ojos, cabello, postura, ropa y estilo para producir una descripcion narrativa y un prompt visual reutilizable.

### Imprimir hoja

Salida preparada para copiar o imprimir la informacion importante del personaje. Esta orientada a hojas fisicas, por eso prioriza instrucciones claras por seccion en lugar de producir solo una ficha digital.

### Campanas y bitacora

Modulo separado para administrar campanas, personajes y sesiones.

Sirve para:

- Registrar sesiones jugadas.
- Repartir experiencia en D&D 5e/2024.
- Repartir Puntos de Perfeccionamiento en Cyberpunk RED.
- Mantener personajes asociados a una campana.
- Abrir campanas protegidas en modo resumen o modo edicion.

En local usa `localStorage`. En despliegue puede usar Supabase mediante funciones serverless dentro de `api/`.

### Dungeon Generator

Generador procedural de mazmorras para DMs de mesa presencial. No pretende escribir una aventura completa; crea una base jugable que el DM puede editar.

Genera:

- Configuracion por nivel, jugadores, dificultad, tamano, tipo, tema, habitantes, densidad y tesoro.
- Nombre, resumen, zonas internas, causa interna, situacion actual y relacion entre habitantes.
- Mapa visual de tiles con salas de distintas formas, pasillos, puertas, secretos, elevacion, entradas secundarias y salida.
- Salas con descripcion, conexiones, pistas, peligros, tesoro, notas y encuentros.
- Encuentros por CR con criaturas oficiales del catalogo cuando existen.
- Avisos de revision cuando no hay criatura oficial adecuada; no inventa statblocks.
- Exportacion a JSON, Markdown y borrador para Foundry VTT.

El generador funciona sin IA externa. Usa tablas internas, catalogos locales y algoritmos procedurales.

### Clases

Referencia navegable de clases cargadas en el motor de reglas. Sirve para revisar rasgos, subclases y datos visibles sin pasar por todo el flujo de creacion.

### Busqueda

Buscador global para reglas y contenido cargado. Incluye filtros para items y hechizos, util cuando el jugador o DM necesita consultar equipo, conjuros o datos de reglas rapidamente.

## Como esta construida

La app es un frontend modular sin framework pesado. Cada pantalla se renderiza con funciones JavaScript que crean componentes DOM reutilizables.

Estructura principal:

- `index.html`: punto de entrada de la aplicacion.
- `src/pages`: pantallas principales.
- `src/components`: componentes reutilizables de interfaz.
- `src/scripts`: router, estado de personaje, motores de reglas, busqueda y utilidades.
- `src/styles`: estilos globales, componentes, temas e impresion.
- `src/data`: navegacion, contenido y reglas estructuradas.
- `src/data/rules`: modelo escalable de reglas por dominio.
- `src/dungeon`: generador de mazmorras, mapas, encuentros, tesoros, puertas, validacion y exportadores.
- `campaigns`: app de campanas y bitacora.
- `api`: funciones serverless para persistencia remota cuando se despliega con Supabase.
- `docs`: documentacion tecnica auxiliar.
- `tools`: scripts de validacion y extraccion de datos.

El extractor de metadatos de monstruos trabaja solo con texto pegado por el usuario y entradas manuales verificadas; no usa OCR del PDF escaneado.

## Arquitectura de reglas

El motor de personaje usa datos estructurados en vez de textos sueltos. Las entidades pueden declarar:

- IDs internos estables.
- Etiquetas visibles en espanol.
- Fuente.
- Efectos mecanicos.
- Elecciones pendientes.
- Texto corto para hoja fisica.

Esto permite calcular valores derivados, listar pendientes y mapear el resultado a instrucciones de hoja.

## Arquitectura del Dungeon Generator

El generador de mazmorras esta separado por responsabilidad:

- `dungeonTypes.js`: opciones, normalizacion de configuracion y utilidades aleatorias.
- `dungeonTables.js`: tablas editables de tipos, temas, habitantes, salas, puertas y textos.
- `dungeonGenerator.js`: orquestacion general de la mazmorra.
- `roomGenerator.js`: contenido de cada sala.
- `encounterGenerator.js`: encuentros por presupuesto de XP y CR.
- `monsterManualCatalog.js`: catalogo local de monstruos como metadatos.
- `monsterRules.js`: formato, notas y reglas de presentacion de criaturas.
- `treasureGenerator.js`: tesoros y recompensas.
- `doorGenerator.js` y `dungeonDoorUtils.js`: puertas, accesos y conexiones jugables.
- `dungeonMapGenerator.js`: mapa visual basado en tiles.
- `dungeonRoomShapes.js`: formas de sala.
- `dungeonConnectionShapes.js`: formas de pasillo y conexion.
- `dungeonMapFeatures.js`: detalles de mapa como escaleras, fosos, columnas o altares.
- `dungeonElevation.js`: niveles verticales basicos.
- `dungeonZones.js`: zonas internas de la mazmorra.
- `dungeonInhabitantMixes.js`: mezcla de habitantes principales y secundarios.
- `dungeonNarrativeThreads.js`: causa interna, situacion actual y pistas.
- `dungeonValidation.js`: revision de conectividad, coherencia y riesgos.
- `dungeonMarkdownExporter.js` y `dungeonExporters.js`: salidas para notas de DM, JSON y Foundry draft.
- `dungeonStorage.js`: guardado y carga local.

## Encuentros y monstruos

Los encuentros usan CR, XP, cantidad y rol tactico. Si el sistema encuentra una criatura oficial adecuada en el catalogo local, muestra primero el nombre original en ingles:

```text
2 Mind Flayers (CR 7 c/u, 5800 XP total) - rol narrativo: cazadores de mente
```

Si no encuentra una criatura oficial adecuada, no inventa un statblock. El encuentro queda con una alerta para regenerar enemigos o elegir manualmente una criatura oficial del compendio.

Esto mantiene separada la informacion oficial del color narrativo que el DM puede ajustar.

## Persistencia y exportacion

- El creador de personajes mantiene estado local de la sesion.
- Dungeon Generator permite guardar y cargar mazmorras en `localStorage`.
- Las mazmorras se exportan como JSON, Markdown y Foundry draft.
- La bitacora puede trabajar localmente o con Supabase si se despliega con backend.

## Herramientas y autoria

- Proyecto: Handbook Engine.
- Autor/owner: Kotovi.
- Comunidad objetivo: D20 Travesias y mesas personales de rol.
- Herramienta de desarrollo asistido: Codex.
- Stack principal: JavaScript modular, HTML, CSS, datos estructurados y almacenamiento local.

## Estado del proyecto

Handbook Engine esta en desarrollo activo. La base ya incluye creador de personajes, buscador, bitacora y Dungeon Generator. El enfoque actual es mejorar la calidad de datos, la utilidad en mesa y la modularidad para poder agregar mas contenido sin reescribir la aplicacion.
