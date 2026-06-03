# Hoja del jugador 2024 - referencia de mapeo

Archivo de referencia: `D:\Hojas del jugador en 2024.pdf`

## Observacion tecnica

El PDF tiene 2 paginas y no contiene campos rellenables detectables. Handbook Engine debe generar instrucciones para completar la hoja fisica, no intentar escribir sobre campos PDF internos.

## Pagina 1

Campos principales detectados:

- Nombre del personaje
- Clase, subclase y nivel
- Especie
- Trasfondo
- Puntos de experiencia
- Clase de Armadura
- Iniciativa
- Velocidad
- Tamano
- Percepcion pasiva
- Inspiracion heroica
- Bonificador por competencia
- Puntos de golpe actuales, maximos y temporales
- Dados de golpe
- Salvaciones contra muerte
- Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria y Carisma
- Tiradas de salvacion
- Habilidades
- Entrenamiento y competencias con equipo
- Dotes
- Rasgos de clase
- Atributos de especie
- Armas y trucos de dano

## Pagina 2

Campos principales detectados:

- Trucos y conjuros preparados
- Espacios de conjuro por nivel
- Aptitud magica
- Modificador por aptitud magica
- CD de salvacion de conjuros
- Bonificador de ataque de conjuros
- Equipo
- Monedas
- Idiomas
- Historia y personalidad
- Aspecto
- Sintonizacion con objetos magicos
- Alineamiento

## Implicacion para `sheetMapper`

El mapeo debe dividir la salida por seccion real de la hoja:

- Identidad
- Atributos
- Combate y supervivencia
- Salvaciones y habilidades
- Competencias
- Dotes
- Rasgos de clase
- Atributos de especie
- Armas y trucos de dano
- Magia
- Equipo, monedas e idiomas
- Historia y apariencia

Los bloques largos no deben mezclarse en `Features & Traits`. En esta hoja existen espacios separados para `DOTES`, `RASGOS DE CLASE` y `ATRIBUTOS DE ESPECIE`.
