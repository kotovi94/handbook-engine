# Rules Data Schemas

Estos esquemas definen la forma estable de los datos antes de cargar contenido real de libros.

## Entidades

- `class`: clase jugable. Debe incluir dado de golpe, salvaciones, entrenamientos, monedas iniciales, progresion, equipo y magia si aplica.
- `subclass`: subclase vinculada a una clase mediante `classId`.
- `species`: especie con tamaño, velocidad, idiomas y rasgos.
- `background`: trasfondo con habilidades, dote, equipo, monedas y futuras elecciónes.
- `feat`: dote con prerrequisitos, efectos y texto para hoja.
- `equipment`: armadura, escudo, armas, herramientas, foco, equipo o paquetes.
- `spell`: conjuro o truco con nivel, escuela, componentes, duración y efectos.
- `proficiency`: competencia normalizada.
- `advancement`: progresion de clase y subclase por nivel.

## Regla de oro

Cada entidad debe separar:

- Identidad: `id`, `name`, `source`.
- Texto para usuario: `label`, `summary`, `description`.
- Reglas calculables: `effects`, `choices`, valores numericos.
- Salida de hoja: `sheetText` o textos especificos para copiar.

Los IDs deben mantenerse en inglés estable. La UI debe usar `label` o helpers de presentacion para mostrar textos visibles en espanol.

## Rasgos por nivel

Los rasgos por nivel deben ser objetos estructurados, no strings:

```js
{
  id: "fighter-extra-attack",
  name: "Extra Attack",
  label: "Ataque adicional",
  description: "Attack twice when taking the Attack action.",
  level: 5,
  sheetSection: "classFeatures",
  effects: [
    { type: "attack.count", value: 2 }
  ],
  sheetText: "Ataque adicional: 2 ataques con la acción de Atacar."
}
```

Esto permite que la app calcule ataques, recursos, magia, competencias y otros valores sin depender de texto plano.

## Efectos soportados

El motor inicial reconoce estos tipos:

- `attack.count`
- `attack.criticalRange`
- `armor.ac`
- `armor.acBase`
- `armor.acBonus`
- `armor.shieldBonus`
- `coin.add`
- `equipment.grant`
- `feat.grant`
- `language.grant`
- `proficiency.armor`
- `proficiency.savingThrow`
- `proficiency.skill`
- `proficiency.tool`
- `proficiency.weapon`
- `resource.add`
- `sense.darkvision`
- `speed.set`
- `spell.slot.unlock`
- `spellcasting.initiate`
- `spellcasting.enable`
- `trait.grant`

Cada nueva regla calculable debe entrar por `effects` antes de usarse en el motor.

## Validación

Ejecuta el validador con:

```bash
node tools/validate-rules.mjs
```

El validador revisa:

- IDs duplicados por coleccion.
- IDs duplicados globales entre entidades principales.
- IDs duplicados de features.
- Campos requeridos por schema.
- Categorías válidas de equipo.
- Features con niveles entre 1 y 20.
- Features cuyo `level` coincida con el grupo de progresion.
- Tipos de efectos soportados por el motor.
- Payload requerido de cada efecto.
- Referencias desde subclases, progresion, trasfondos y efectos.
