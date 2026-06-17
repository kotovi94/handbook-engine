# Compendio D20 Travesias

Aplicacion web oficial del servidor D20 Travesias para guiar la creacion de personajes de Dungeons & Dragons 5e 2024 y ayudar a jugadores a completar hojas fisicas durante sesiones presenciales.

## Arquitectura

- `index.html`: punto de entrada de la aplicacion.
- `src/pages`: vistas renderizadas por el sistema de navegacion.
- `src/components`: piezas reutilizables de interfaz.
- `src/styles`: hojas CSS separadas por responsabilidad.
- `src/scripts`: arranque, router y logica transversal.
- `src/data`: configuracion declarativa para navegacion, temas y registros escalables.
- `src/data/rules`: datos de reglas separados por dominio.

## Etapa 1

- Layout principal con sidebar fijo en escritorio.
- Sidebar responsive con overlay en pantallas pequenas.
- Navegacion modular basada en datos.
- Sistema de temas por clase CSS.
- Componentes reutilizables para layout, sidebar, botones y selector de tema.

## Etapa 2

- Motor de contenido en `src/scripts/contentEngine.js`.
- Registros separados para clases, subclases y builds en `src/data/content`.
- Relaciones por `classId` y `subclassId` para evitar duplicar datos.
- Rutas de listado y detalle para clases, subclases y builds.
- Tarjetas reutilizables con metadatos, etiquetas y enlaces internos.

## Etapa 3

- Busqueda global en `#/search`.
- Filtros por texto, tipo y clase conectados al motor de contenido.
- Filtros locales en listados de clases, subclases y builds.
- Modo oscuro por clase CSS `mode-dark`.
- Accion de impresion para guardar como PDF desde el navegador.
- Hoja `src/styles/print.css` para ocultar navegacion y limpiar el documento impreso.

## Etapa 4

- Cambio funcional: de wiki a asistente de creacion de personajes.
- Flujo paso a paso en `src/pages/CreatorPage.js`.
- Estado persistente del personaje en `src/scripts/characterState.js`.
- Motor de flujo en `src/scripts/creationEngine.js`.
- Motor de calculos en `src/scripts/rulesEngine.js`.
- Mapeo a hoja fisica en `src/scripts/sheetMapper.js`.
- Validacion basica de elecciones en `src/scripts/validationEngine.js`.
- Datos iniciales separados para especies, trasfondos, dotes, equipo y pasos de creacion.

## Etapa 5

- Creacion fijada por defecto a nivel 5.
- Seleccion de subclase agregada al flujo.
- Progresion acumulada de clase y subclase hasta nivel 5.
- Calculo de Proficiency Bonus como +3.
- Calculo de Hit Point Maximum para nivel 5 con dado de golpe promedio en niveles posteriores.
- Rasgos acumulados mapeados a Features & Traits y a instrucciones de hoja fisica.

## Etapa 6

- Mapeo de salida adaptado a la hoja del jugador 2024 en espanol.
- Instrucciones divididas por secciones reales de la hoja: identidad, combate, atributos, salvaciones, competencias, dotes, rasgos, especie, armas, magia, equipo e historia.
- `sheetMapper` ahora expone `mapCharacterToSheetSections`.
- El PDF usa secciones ordenadas en lugar de una lista plana de campos.

## Etapa 7

- Lavado visual de la interfaz sin cambiar la logica del asistente.
- Sidebar mas compacto, header mas integrado y tarjetas con estados claros.
- Stepper horizontal con microinteracciones.
- Summary panel con estilo de ficha rapida.
- Secciones de hoja mas limpias para pantalla y PDF.
- Modo oscuro mejorado y transiciones suaves.

## Etapa 8

- Paso final de ajustes antes de imprimir la hoja.
- Calculo de Clase de Armadura segun armadura y escudo equipados.
- Monedas derivadas por clase y trasfondo.
- Mapeo mecanico mas completo para la hoja 2024: velocidad, tamano, salvaciones, competencias, idiomas, monedas, PG, dados de golpe y armas.
- Se omiten campos personales como nombre, historia y aspecto para que los complete el jugador.

## Etapa 9: Modelo de reglas escalable

- `src/data` queda preparado para contenido real antes de cargar libros completos.
- Nueva estructura de reglas en `src/data/rules` por dominio: classes, subclasses, species, backgrounds, feats, equipment, spells, proficiencies y advancement.
- Esquemas estables para entidades en `src/data/rules/schema/entitySchemas.js`.
- Contrato documentado en `src/data/rules/schema/README.md` y `docs/rule-model-stage-9.md`.
- Sistema central de efectos en `src/scripts/effectEngine.js`.
- Resolver de elecciones pendientes en `src/scripts/choiceEngine.js`.
- Panel de pendientes en `src/components/PendingPanel.js`.
- Validador reforzado en `src/data/rules/schema/validateRules.js`, ejecutable con `tools/validate-rules.mjs`.
- Datos de prueba migrados al formato nuevo con `description`, `effects`, `choices`, `sheetText` y `label`.
- Progresion de clase y subclase migrada desde texto plano a features estructuradas por nivel.
- Motores principales consumen reglas desde el nuevo modelo y los archivos antiguos quedan solo como compatibilidad temporal.

## Etapa 10: Normalizacion de idioma

- Normalizacion de idioma: IDs internos se mantienen en ingles y la UI usa etiquetas visibles en espanol.
- Las entidades de reglas pueden declarar `label` para mostrar nombres localizados sin cambiar `id` ni `name`.
- Nuevo helper `src/scripts/displayLabels.js` para resolver nombres visibles, listas de competencias y opciones de eleccion.
- La hoja fisica prefiere `sheetText`, `label` y traducciones visibles antes que nombres tecnicos.
- Ejemplo: `fighter` sigue siendo el ID interno, pero la interfaz muestra `Guerrero`.

## Etapa 11: Flujo oficial de creacion nivel 5

- El creador sigue el orden funcional del manual adaptado a mesa presencial de nivel 5.
- Paso `Clase`: clase base con nivel fijo 5.
- Paso `Origen`: trasfondo y especie juntos, preparando idiomas, rasgos, dotes, equipo y monedas.
- Paso `Atributos`: metodo de puntuaciones, valores base y aumentos de trasfondo.
- Compra por puntos implementada con 27 puntos y limite base 8-15.
- La pantalla de atributos usa tarjetas de metodo y controles tactiles `-` / `+` para facilitar uso en telefono o tablet.
- Paso `Progresion`: subclase y rasgos acumulados hasta nivel 5.
- Paso `Equipo`: equipo inicial e inventario.
- Paso `Combate`: CA, arma equipada, armadura, escudo, monedas y valores derivados.
- Paso `Pendientes`: elecciones finales como habilidades, idiomas, conjuros, dotes o equipo.
- Paso `Hoja`: instrucciones listas para copiar a la hoja fisica.
- Las armas poseidas se listan con ataque, dano, alcance si aplica y marca de arma equipada.
- Rasgos de clase y subclase se separan por rasgo para evitar bloques largos en pantalla y PDF.

## Carga inicial: Guerrero

- Guerrero PHB 2024 migrado como clase base hasta nivel 5.
- Rasgos agregados: Estilo de combate, Segundo aliento, Maestria con armas, Oleada de accion, Mente tactica, Subclase, Mejora de caracteristica, Ataque adicional y Desplazamiento tactico.
- Recursos de nivel 5 calculables: 3 usos de Segundo aliento, 1 Oleada de accion y 4 maestrias con armas.
- Subclases PHB 2024 agregadas con prioridad: Maestro de batalla, Campeon, Caballero arcano y Guerrero psiquico.
- Subclases adicionales no PHB agregadas solo si no duplican una subclase PHB: Arquero arcano, Caballero, Caballero runico y Samurai.
- Si una subclase existe en PHB 2024 y tambien en Xanathar/Tasha, se conserva la version PHB 2024 y se elimina la anterior.
- Elecciones pendientes nuevas: estilo de combate, armas con maestria, maniobras, herramientas, conjuros, trucos, runas y competencias de subclase.

## Carga inicial: Origenes

- Trasfondos PHB 2024 agregados: Acolito, Artesano, Charlatan, Criminal, Artista, Granjero, Guardia, Guia, Ermitano, Mercader, Noble, Sabio, Marinero, Escriba, Soldado y Errante.
- Especies PHB 2024 agregadas: Aasimar, Draconido, Enano, Elfo, Gnomo, Goliat, Mediano, Humano, Orco y Tiefling.
- Dotes de origen iniciales agregadas con texto para hoja y efectos basicos: Alerta, Artesano, Sanador, Afortunado, Iniciado magico, Musico, Atacante salvaje, Habilidoso, Peleador de taberna y Duro.
- Los trasfondos ahora otorgan habilidades, herramientas, dote, equipo inicial y monedas segun paquete A, manteniendo registrada la alternativa de 50 PO.
- Las especies ahora muestran rasgos listos para copiar y dejan pendientes las elecciones necesarias: idiomas, tamano, linajes, ascendencias, dotes, habilidades o aptitud magica.
- El equipo de origen incluye armas con dano y alcance cuando corresponde, para completar mejor la seccion de ataques de la hoja fisica.

## Carga inicial: Dotes de expansion

- Dotes PHB 2024 cargadas como fuente principal: dotes de origen, dotes generales de nivel 4 y estilos de combate.
- Dotes de Tasha agregadas como contenido opcional solo cuando no duplican una dote PHB 2024: Artificer Initiate, Eldritch Adept, Fighting Initiate, Gunner y Metamagic Adept.
- Dotes raciales de Xanathar agregadas como contenido opcional: Bountiful Luck, Dragon Fear, Dragon Hide, Drow High Magic, Dwarven Fortitude, Elven Accuracy, Fade Away, Fey Teleportation, Flames of Phlegethos, Infernal Constitution, Orcish Fury, Prodigy, Second Chance, Squat Nimbleness y Wood Elf Magic.
- Si una dote existe en PHB 2024 y en Tasha/Xanathar, se conserva la version PHB 2024.
- Las dotes conservan su fuente, categoria y prerrequisito para que el selector de dote pueda filtrar por libro, especie y requisitos.
- Se agregaron elecciones pendientes para aumentos de atributo, pericia, invocaciones y metamagia.

## Mejora de nivel 4

- El paso de Progresion incluye selector de mejora de nivel 4.
- El jugador puede elegir subir caracteristicas o tomar una dote.
- La subida de caracteristicas permite +2 a un atributo o +1/+1 a dos atributos, respetando maximo 20.
- La dote elegida en nivel 4 entra al motor de dotes y muestra sus elecciones pendientes.
- Las dotes que aumentan atributo aplican ese +1 en los calculos derivados y en la hoja fisica.

## Motor de reglas de hechizos

- Se agrego `src/data/rules/spellcasting` para reglas generales de lanzamiento, separado de `src/data/rules/spells`.
- El motor calcula aptitud magica, modificador, CD de salvacion y bonificador de ataque de conjuro.
- La hoja muestra trucos y conjuros elegidos desde clase, subclase, especie o dote.
- Se agregaron reglas rapidas de mesa: conjuros preparados, siempre preparados, armadura, un espacio por turno, trucos, rituales, espacio superior, componentes, concentracion, camino claro y acumulacion de efectos.
- Los espacios de conjuro quedan definidos por progresion de nivel 5 para Mago y Caballero arcano.

## Carga inicial: Hechizos de Tasha

- Se agregaron los 21 hechizos del Caldero de Tasha en `src/data/rules/spells`.
- Cada hechizo queda con fuente, nivel, escuela, tiempo de lanzamiento, alcance, componentes, duracion, concentracion, ritual, clases y texto corto para hoja.
- Los hechizos de convocacion se guardan como entradas resumidas preparadas para una etapa posterior de bloques de criatura invocada.
- Los nombres visibles se normalizaron al espanol sin cambiar IDs internos.

## Carga inicial: Hechizos PHB 2024

- Se agregaron 391 hechizos del PHB 2024 como metadatos generados en `src/data/rules/spells/phb2024.generated.js`.
- La carga incluye nombre, nivel, escuela, clases, tiempo de lanzamiento, alcance, componentes, duracion, concentracion, ritual y texto corto para hoja.
- El indice de hechizos prioriza PHB 2024 y conserva de Tasha solo los hechizos que no existan en PHB.
- El conjuro `Shield` usa el ID interno `shield-spell` para no chocar con el equipo `shield`.
- Las descripciones largas quedan fuera por ahora; el motor usa resumen y datos estructurados para busqueda, seleccion y hoja fisica.

## Carga inicial: Mago

- Mago PHB 2024 migrado como clase jugable hasta nivel 5.
- Rasgos agregados: Lanzamiento de conjuros, Adepto ritual, Recuperacion arcana, Erudito, Subclase de Mago, Mejora de caracteristica y Memorizar conjuro.
- El selector de magia separa trucos, grimorio y conjuros preparados: 4 trucos, 14 conjuros en grimorio y 9 preparados a nivel 5.
- Espacios de conjuro de nivel 5: nivel 1 x4, nivel 2 x3 y nivel 3 x2.
- Equipo inicial de Mago agregado: paquete A con dagas, foco arcano, tunica, grimorio, paquete de erudito y 5 PO; alternativa B con 55 PO.
- Subclases PHB 2024 agregadas con prioridad: Abjurador, Adivino, Evocador e Ilusionista.
- Subclases opcionales no PHB agregadas: Canto de espada y Orden de escribas de Tasha, y Magia de guerra de Xanathar.
- Se agrego el tipo de eleccion `spellbook` para no confundir conjuros del grimorio con conjuros preparados.
- Se agrego pericia como efecto estructurado para rasgos como Erudito.

## Carga inicial: Equipo PHB 2024

- Inventario PHB 2024 cargado para creacion de personaje: armas, armaduras, escudo, herramientas, focos, equipo de aventura, paquetes, monturas y vehiculos simples.
- Las armas incluyen dano, alcance cuando aplica, propiedades, grupo y propiedad de maestria.
- Las armaduras incluyen CA base, limite de Destreza, requisito de Fuerza y desventaja en Sigilo cuando corresponde.
- El calculo de CA ahora soporta armadura media con Destreza maxima +2.
- La hoja fisica muestra dano, alcance, ataques y maestria del arma equipada o poseida.
- La eleccion de Maestria con armas del Guerrero ahora lista todas las armas del PHB cargadas.

## Selector de paquetes de equipo

- El paso Equipo separa paquetes de clase, paquetes de trasfondo y equipo adicional manual.
- Las opciones A/B/C de clase y A/B de trasfondo se eligen de forma explicita.
- Monedas y objetos iniciales ahora salen del paquete elegido, no de efectos fijos ocultos.
- La validacion marca pendiente el equipo de clase o de trasfondo si existe paquete y no se ha elegido.
- Como la mesa esta fijada en nivel 5, el paso Equipo agrega la regla PHB de nivel alto: 500 PO + 1d10 x 25 PO, ademas del equipo inicial normal.
- La tirada de oro avanzado queda como pendiente hasta elegir el resultado del d10.
- La hoja fisica muestra los objetos magicos sugeridos para nivel 5: 1 comun y 1 poco comun, marcados como decision del DM.

## DMG 1: Objetos magicos nivel 5

- Se agrego `src/data/rules/magic-items` con objetos magicos comunes y poco comunes del DMG 2024.
- La carga incluye nombre, rareza, tipo, fuente, sintonia, texto corto para hoja y efectos estructurados cuando aplican al motor actual.
- El paso Equipo permite elegir 1 objeto comun y 1 objeto poco comun para personajes que empiezan en nivel 5.
- La hoja fisica muestra los objetos elegidos con rareza, sintonia y efecto corto.
- Algunos objetos ya aplican calculos: por ejemplo Capa de proteccion y Escudo +1 suman bono magico a la CA.
- El validador revisa tambien la nueva coleccion `magicItem`.

## Mejora de impresion: Magia y equipo

- La hoja fisica ahora muestra conjuros de Mago con nombre visible en espanol y notas rapidas de mesa.
- Los conjuros preparados incluyen nivel, tiempo de lanzamiento, alcance, dano o efecto clave, CD si usan salvacion y bono de ataque si usan ataque de conjuro.
- El grimorio muestra los conjuros por nombre visible y nivel.
- El equipo impreso incluye precio, peso, dano, alcance, CA, propiedades y maestria cuando existen.
- El selector de equipo adicional muestra precio y datos basicos para compras mas rapidas.

## Etapa 12: Bitacora compartida y sistemas de campana

- La pantalla de inicio ahora enlaza directamente con la bitacora de campanas.
- La bitacora permite elegir sistema por campana: `D&D 5e 2024` o `Cyberpunk RED`.
- El modo D&D conserva el flujo de experiencia por sesion y subida de nivel.
- El modo Cyberpunk RED agrega el reparto de Puntos de Perfeccionamiento por sesion.
- Los PP se asignan desde una tabla por columna de estilo: Grupo, Guerrero, Sociable, Explorador y Actor.
- Cada personaje puede recibir mas de una asignacion de PP dentro de la misma sesion, con motivo y valor independientes.
- La bitacora imprime el detalle de PP entregados por personaje al guardar una sesion.
- Las campanas protegidas por contrasena pueden abrirse en modo resumen para visitantes.
- Con contrasena se habilita edicion de campana, gestion de personajes, sesiones y borrado.
- En `localhost`, la bitacora usa `localStorage` para seguir probando sin depender de red.
- En Vercel, la bitacora usa Supabase mediante funciones serverless dentro de `api/`.
- Se agrego `campaigns/remoteStorage.js` como cliente del frontend para la API compartida.
- Se agregaron endpoints para listar, crear, editar y borrar campanas, desbloquear contrasena, gestionar personajes y registrar/eliminar sesiones.
- Las sesiones guardadas en Supabase aplican o revierten PX/PP sobre los personajes compartidos.
- Se agrego el esquema SQL en `docs/supabase-campaigns.sql`.
- Se agrego la guia de despliegue en `docs/vercel-supabase-campaigns.md`.

Variables necesarias en Vercel:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CAMPAIGN_UNLOCK_SECRET
```
