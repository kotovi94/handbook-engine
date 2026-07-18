# Hoja del jugador 2024 - referencia de mapeo

Archivo de referencia: `D:\Hojas del jugador en 2024.pdf`

## Observacion técnica

El PDF tiene 2 páginas y no contiene campos rellenables detectables. Compendio D20 Travesías debe generar instrucciones para completar la hoja física, no intentar escribir sobre campos PDF internos.

## Página 1

Campos principales detectados:

- Nombre del personaje
- Clase, subclase y nivel
- Especie
- Trasfondo
- Puntos de experiencia
- Clase de Armadura
- Iniciativa
- Velocidad
- Tamaño
- Percepcion pasiva
- Inspiración heroica
- Bonificador por competencia
- Puntos de golpe actuales, maximos y temporales
- Dados de golpe
- Salvaciones contra muerte
- Fuerza, Destreza, Constitucion, Inteligencia, Sabiduría y Carisma
- Tiradas de salvación
- Habilidades
- Entrenamiento y competencias con equipo
- Dotes
- Rasgos de clase
- Atributos de especie
- Armas y trucos de daño

## Página 2

Campos principales detectados:

- Trucos y conjuros preparados
- Espacios de conjuro por nivel
- Aptitud mágica
- Modificador por aptitud mágica
- CD de salvación de conjuros
- Bonificador de ataque de conjuros
- Equipo
- Monedas
- Idiomas
- Historia y personalidad
- Aspecto
- Sintonización con objetos mágicos
- Alíneamiento

## Implicacion para `sheetMapper`

El mapeo debe dividir la salida por sección real de la hoja:

- Identidad
- Atributos
- Combate y supervivencia
- Salvaciones y habilidades
- Competencias
- Dotes
- Rasgos de clase
- Atributos de especie
- Armas y trucos de daño
- Magia
- Equipo, monedas e idiomas
- Historia y apariencia

Los bloques largos no deben mezclarse en `Features & Traits`. En esta hoja existen espacios separados para `DOTES`, `RASGOS DE CLASE` y `ATRIBUTOS DE ESPECIE`.
