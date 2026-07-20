# Consultas rápidas de mesa

La búsqueda combina tres fuentes sin duplicar sus datos:

- `equipment`: objetos y equipo existentes.
- `spells`: hechizos existentes.
- `quickReferenceRules`: respuestas breves mantenidas en `src/data/rules/quickReference.js`.

Cada regla rápida tiene un identificador estable, categoría, título, respuesta inmediata, detalle, palabras clave y fuente. Añadir una nueva consulta no requiere modificar la pantalla: basta con incorporar otra entrada válida a la colección.

Los favoritos se guardan en este dispositivo como claves con el formato `tipo:id`. Así pueden incluir reglas, objetos y hechizos sin copiar su contenido ni crear una segunda fuente de verdad. Si el navegador bloquea el almacenamiento, la búsqueda sigue funcionando y solo se pierde la persistencia de favoritos.

Las respuestas rápidas deben ser breves y permitir resolver una duda en mesa. Los matices van en “Ver detalles” y toda entrada indica su procedencia.
