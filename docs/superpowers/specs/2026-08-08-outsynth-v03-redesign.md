# OUTSYNTH v0.3 — Redesign Spec

**Fecha:** 2026-08-08  
**Estado:** aprobado por usuario, listo para implementación  
**Alcance:** rediseño visual completo + 6 carriles + salto de carril + selector de escala + rediseño de interacción SPACE/DRIVE

---

## Objetivo

Transformar OUTSYNTH de un prototipo con estética "AI retrosynth genérica" a un instrumento visual con identidad propia. Mantener la arquitectura existente; rediseñar la capa visual, extender de 4 a 6 carriles, agregar mecánica de salto y selector de escala musical.

---

## 1. Identidad visual

### Paleta
- Fondo: `#000000`
- Carretera: blanco (`#ffffff`) y gris medio (`#888888`) para franjas de velocidad
- Texto y líneas: blanco
- **Acento único**: ámbar `#f5a623` por defecto, seleccionable al inicio (opciones: ámbar, verde, rojo, cyan, blanco)
- El acento se usa SOLO en: punto del vehículo en el minimap, carril activo resaltado, flash breve del evento que acaba de sonar

### Sin efectos decorativos
- Eliminar: `shadowBlur`, gradientes de cielo, montañas, glow de horizonte, partículas de escape del vehículo, "LOOP GATE" con neon
- Sin paleta multi-color por carril (los 6 carriles son blanco — diferenciados solo por forma de sprite)
- Sin `Space Mono`. Tipografía nueva: `IBM Plex Mono` (Google Fonts, ya disponible en CDN)

### HUD
Solo dos elementos:
- Top-left: BPM en número grande (`700 32px`)
- Top-center: nombre del carril activo (`400 13px`)
- Eliminar: todo lo demás del HUD actual (SPEED, MPB, atajos, badge de DRIVE)
- Los controles se aprenden jugando, no leyendo el HUD

---

## 2. Renderer — perspectiva OutRun

### Proyección de sprites
- Escala de sprite: `scale = BASE_SIZE / distance` (1/z lineal puro)
- `BASE_SIZE = 2800` (calibrar para que en distancia 280 el sprite sea ~10px y a distancia 1 sea gigante)
- Reemplaza el actual `pz = Math.pow(zNorm, 2.2)` para el tamaño de sprites (mantener para posición Y en pantalla)
- Resultado: objetos crecen dramáticamente al acercarse — de punto a bloque

### Curvatura en sprites
- La posición X de cada sprite en pantalla se ajusta según `road.curveAt(vehicle.position)`:
  `spriteX += curve * (1 - distance/maxLookahead) * CURVE_SHIFT`
  donde `CURVE_SHIFT ≈ 80`
- Esto hace que en curvas los objetos delante se desplacen lateralmente en pantalla (comportamiento OutRun)

### Carretera
- Franjas horizontales alternadas blanco/gris que se generan por segmentos de profundidad Z
- Sin gradientes de color, sin glow en bordes
- Bordes de la carretera: línea blanca sólida, `lineWidth = 2`
- Cielo: `#000000` puro, sin decoración

### Clipping de sprites
- Los sprites que superen la línea del horizonte (`horizonY`) no se dibujan
- Condición: `if (screenY < horizonY) continue`

### Sprites rediseñados (todos en blanco, sin shadowBlur)

| Lane | Instrumento | Forma |
|------|-------------|-------|
| 0 | Kick | Rectángulo ancho y bajo (proporción 2:1) |
| 1 | Snare | Cruz / X (dos líneas diagonales cruzadas) |
| 2 | Hi-Hat cerrado | Línea horizontal fina `—` |
| 3 | Clap / Perc | Triángulo equilátero |
| 4 | Synth Low | Semicírculo / arco (mitad superior) |
| 5 | Synth High | Línea vertical fina con punto en el vértice superior |

Flash de acento: cuando un evento dispara, el sprite parpadea durante 80ms con el color de acento (`#f5a623`). Se implementa con un timestamp `lastHit` por evento.

### Vehículo
- Forma: rectángulo simple, bordes rectos, sin cockpit ni detalles
- Color: blanco con contorno negro (2px)
- Sin partículas de escape
- La línea trasera del vehículo se pinta con el color de acento (único uso de acento en el vehículo)

---

## 3. Minimap

### Posición y tamaño
- Esquina inferior derecha
- Canvas de 130×130px superpuesto sobre el `hud-canvas`
- O renderizado directamente en `hudCtx` en esa zona

### Contenido
- Trazo del circuito oval completo visto desde arriba: línea blanca fina sobre negro
- Todos los eventos colocados: puntos blancos de 2px en su posición relativa sobre el trazo
- Posición del vehículo: punto de acento (`#f5a623`) de 4px
- Sin texto, sin labels

### Proyección cenital
- Mapear `event.position` (0..trackLength) a un ángulo o coordenada sobre la silueta del óvalo
- Para el óvalo actual: se puede usar una elipse parametrizada `x = cx + rx * cos(t)`, `y = cy + ry * sin(t)` donde `t = (position / trackLength) * 2π`
- El vehículo se dibuja con el mismo mapeo usando `vehicle.position`

---

## 4. Seis carriles

### Configuración
- `config/default.yaml`: `lanes.count: 6`
- `config/themes/minimalist.yaml`: `lanes.colors` → 6 entradas, todas `#ffffff` (blanco uniforme)
- `config/sounds/classic-kit.yaml`: agregar 2 lanes nuevos (Clap/Perc, Synth High)

### AudioEngine
- `trackSettings` pasa de 4 a 6 entradas:
  - Lane 4: `{ id: 'synth_low', name: 'SYNTH LOW', preset: 'acid_bass', waveform: 'sawtooth', baseFreq: 130.81, filterFreq: 1400, decay: 0.35 }`
  - Lane 5: `{ id: 'synth_high', name: 'SYNTH HIGH', preset: 'dream_pad', waveform: 'sine', baseFreq: 261.63, filterFreq: 4200, decay: 0.50 }`
- `presets[4]` y `presets[5]`: al menos 2 presets cada uno
- `trigger(lane)`: agregar `case 4` y `case 5` — ambos usan `_playSynth()` con sus configs
- `updateDrive()`: frecuencias base para 6 carriles (ver sección 6)

### Game.js — patrón inicial
Actualizar el patrón pre-poblado para usar los 6 carriles de forma musical.

---

## 5. Salto de carril

### Input
- `InputHandler`: agregar detección de `Shift+ArrowLeft` y `Shift+ArrowRight`
- Nuevos getters: `jumpLeft` y `jumpRight` (wasPressed con Shift held)

### Vehicle
- `Vehicle.jumpLane(direction, laneCount)`: mueve `this.lateral` directamente a `+2` o `-2` carriles desde el actual
- El movimiento es instantáneo (no se anima — es un salto, no un desliz)
- Con clamp a los bordes (no puede saltar fuera del rango)

### Game._update
```
if (this.input.jumpLeft)  this.vehicle.jumpLane(-2, laneCount);
if (this.input.jumpRight) this.vehicle.jumpLane(+2, laneCount);
```

### Feedback visual
- El sprite del vehículo destella brevemente (80ms) con el color de acento al saltar

---

## 6. Selector de escala (Sound Studio)

### Ubicación en UI
- Sección nueva al inicio del Sound Studio (antes de las tarjetas de canal)
- Header: `DRIVE SCALE`
- Dos controles: root note + scale type
- Vista previa: muestra las 6 notas resultantes mapeadas a los 6 carriles

### Root note
Selector: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B  
Default: C

### Scale types disponibles

| ID | Nombre | Intervalos (semitonos) |
|----|--------|----------------------|
| `minor_pentatonic` | Minor Pentatonic | 0, 3, 7, 10, 12, 15 |
| `major_pentatonic` | Major Pentatonic | 0, 2, 4, 7, 9, 12 |
| `blues` | Blues | 0, 3, 5, 6, 7, 10 |
| `natural_minor` | Natural Minor | 0, 2, 3, 5, 7, 8, 10 (primeras 6) |
| `major` | Major | 0, 2, 4, 5, 7, 9 |
| `dorian` | Dorian | 0, 2, 3, 5, 7, 9, 10 (primeras 6) |

### Cálculo de frecuencias
```
baseFreq(root, octave) = 16.35 * 2^((rootSemitone + octave*12) / 12)
laneFreq[i] = baseFreq * 2^(intervals[i] / 12)
```
Octava base: 3 (C3 = 130.81 Hz)

### Integración con AudioEngine
- `AudioEngine.setScale(rootNote, scaleType)`: recalcula y almacena `this.driveFrequencies[6]`
- `updateDrive()` lee de `this.driveFrequencies[lane]` en vez de array hardcodeado
- El cambio es inmediato (próxima nota del DRIVE usa la nueva frecuencia)

### SoundMenu
- Agregar sección `DRIVE SCALE` con los dos selectores y el preview de notas
- El preview muestra: `C3 · Eb3 · G3 · Bb3 · C4 · Eb4` actualizado en tiempo real

---

## 7. Rediseño de interacción SPACE / DRIVE

La mecánica de SPACE y D se rediseña completamente. La barra espaciadora tiene **dos comportamientos** según el modo activo.

### Modo WRITE (default, D inactivo)

- **Tap SPACE** → pinta una celda cuantizada en el carril actual del piso + suena el instrumento inmediatamente
- La celda pintada persiste en el piso. Cuando el vehículo la vuelve a cruzar en vueltas siguientes, suena
- **Tap SPACE sobre celda ya pintada** → la borra (toggle, igual que antes)
- Visualmente: la celda aparece como una franja/marca plana sobre el asfalto, en perspectiva. No un objeto 3D. Se ve como parte del piso — más tipo "grilla pintada en la carretera"

### Modo DRIVE (D activo)

- **SPACE no escribe nada en el piso**
- **Sostener SPACE** → suena el instrumento del carril actual, continuamente, mientras se mantiene apretado
- **Soltar SPACE** → silencio
- Cambiar de carril mientras SPACE está sostenido → la nota cambia al instante (como un instrumento de viento)
- Permite alternar entre sonido y silencio presionando y soltando, como tocar frágil, expresivo, sin dejar huella

### Resumen de la tecla SPACE

| Modo | Tap SPACE | Hold SPACE |
|------|-----------|------------|
| WRITE | Pinta celda + suena una vez | igual que tap (no distingue hold) |
| DRIVE | No hace nada | Suena mientras se sostiene |

### Representación visual de celdas (WRITE mode)

- Las celdas pintadas se renderizan como **marcas planas sobre el asfalto** vistas en perspectiva
- En la vista pseudo-3D: aparecen como franjas rectangulares que cruzan el ancho del carril, que se ven acercar junto con la carretera
- Cuando el vehículo las cruza: destella con el color de acento brevemente
- Cada carril tiene una **forma de marca** distinta en el piso (para distinguir el instrumento sin color):

| Lane | Instrumento | Marca en el piso |
|------|-------------|-----------------|
| 0 | Kick | Franja llena que ocupa todo el ancho del carril |
| 1 | Snare | Dos líneas paralelas (doble franja fina) |
| 2 | Hi-Hat | Una línea fina punteada |
| 3 | Clap / Perc | Tres líneas finas |
| 4 | Synth Low | Franja con borde grueso y centro vacío |
| 5 | Synth High | Línea fina sólida |

### Cambios en InputHandler

- `get drop()`: mantiene `wasPressed('Space')` → para WRITE mode
- `get drivePlay()`: `isDown('Space')` → para DRIVE mode (detecta hold)
- La distinción la hace `Game._update` según `audio.driveEnabled`

### Cambios en Game._update

```js
if (this.audio.driveEnabled) {
  // DRIVE mode: SPACE held = sound, release = silence
  if (this.input.drivePlay) {
    this.audio.triggerDriveSustain(lane);  // suena mientras se sostiene
  } else {
    this.audio.stopDriveSustain();
  }
} else {
  // WRITE mode: SPACE tap = paint floor + play once
  if (this.input.drop) {
    const result = this.sequencer.toggle(lane, this.vehicle.position);
    this.audio.trigger(lane);  // suena una vez
    this.renderer.triggerDrop(lane, result.action === 'deleted');
  }
}
```

### Cambios en AudioEngine

- `triggerDriveSustain(lane)`: si el oscilador DRIVE no está sonando en ese lane, lo inicia; si ya está en ese lane, no hace nada
- `stopDriveSustain()`: baja el gain del oscilador DRIVE suavemente (fade corto ~30ms para evitar click)
- El oscilador DRIVE existente se adapta: en vez de ser siempre activo cuando `driveEnabled`, ahora responde al estado de SPACE
- `driveEnabled` pasa a ser `driveMode` (el toggle D activa el modo, no el sonido)

---

## 8. Lo que NO cambia

- Arquitectura de módulos (Game, Road, Vehicle, Sequencer, AudioEngine, Renderer, SoundMenu, ConfigLoader, ThemeEngine, InputHandler)
- Lógica del Sequencer (cuantización espacial, toggle, crossed)
- State machine (LOADING → START_SCREEN → PLAYING → PAUSED)
- Física del vehículo (aceleración, fricción, inertia)
- Configuración YAML (estructura, no contenido)

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `config/default.yaml` | `lanes.count: 6`, corrección de fallbacks |
| `config/themes/minimalist.yaml` | Rediseño completo de paleta |
| `config/sounds/classic-kit.yaml` | Agregar lanes 4 y 5 |
| `src/Renderer.js` | Rediseño visual completo + minimap + sprites nuevos |
| `src/AudioEngine.js` | 6 tracks, scale selector, driveFrequencies dinámico |
| `src/SoundMenu.js` | DRIVE SCALE section, 6 tarjetas |
| `src/InputHandler.js` | jumpLeft/jumpRight con Shift, nuevo getter `drivePlay` (isDown Space) |
| `src/Vehicle.js` | `jumpLane()` method |
| `src/Game.js` | Conectar jump input, lógica SPACE/DRIVE nueva, patrón inicial para 6 carriles |
| `index.html` | Cambiar fuente a IBM Plex Mono |
| `style.css` | Actualizar referencias de font, colores base |
