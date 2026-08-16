# OUTSYNTH — Referencia de Configuración YAML

> Todos los aspectos visuales, sonoros y de gameplay se configuran via YAML.
> El código JS es el motor. El YAML es el contenido.

> **Soporte v0.3:** grilla, carriles, física, distancia de dibujo, paleta de carretera,
> formas de marcas, geometría de pista, nombres/volúmenes/waveforms de canal y parámetros
> principales de DRIVE están conectados al runtime. `lookahead_ms`, `display`, scenery,
> samples y polyphony quedan reservados para una fase posterior.

---

## Índice

1. [default.yaml](#defaultyaml) — Configuración global
2. [themes/*.yaml](#themesyaml) — Themes visuales
3. [sounds/*.yaml](#soundsyaml) — Kits de sonido
4. [tracks/*.yaml](#tracksyaml) — Definición de circuitos
5. [vehicles/*.yaml](#vehiclesyaml) — Apariencia del vehículo (futuro)

---

## default.yaml

Ubicación: `config/default.yaml`

Define los parámetros globales del sistema.

### Secciones

#### `outsynth.grid` — Grilla espacial

| Clave | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `mpb` | número | `4` | Metros por beat. Define la resolución de la grilla espacial. |
| `subdivisions` | número | `4` | Subdivisiones por beat (ej: 4 = semicorcheas). |
| `quantize` | booleano | `true` | Si los eventos se cuantizan automáticamente al hacer DROP. |

**Ejemplo:**
```yaml
grid:
  mpb: 4            # 1 beat = 4 metros
  subdivisions: 4   # 16ths
  quantize: true
```

**Relación con BPM:**
```
BPM = 60 × |velocidad(m/s)| / MPB
```
Si el vehículo va a 8 m/s y MPB = 4: `BPM = 60 × 8 / 4 = 120 BPM`

---

#### `outsynth.lanes` — Carriles

| Clave | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `count` | número | `6` | Cantidad de carriles (= tracks/instrumentos). |
| `snap_strength` | número (0-1) | `0.15` | Magnetismo lateral. 0 = libre, 1 = snap rígido al centro del carril. |
| `width` | número | `200` | Ancho de cada carril en unidades del mundo. |

---

#### `outsynth.vehicle` — Física del vehículo

| Clave | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `max_speed` | número | `300` | Velocidad máxima en unidades/segundo. |
| `reverse_max_speed` | número | `150` | Velocidad máxima de marcha atrás en unidades/segundo. |
| `acceleration` | número | `120` | Aceleración en unidades/s². |
| `deceleration` | número | `200` | Desaceleración (frenado) en unidades/s². |
| `lateral_speed` | número | `400` | Velocidad de movimiento lateral. |
| `inertia` | número (0-1) | `0.98` | Factor de fricción por frame. 1 = sin fricción, 0.9 = mucha fricción. |

---

#### `outsynth.track` — Pista

| Clave | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `default` | string | `"oval"` | Track por defecto a cargar. |
| `draw_distance` | número | `300` | Segmentos visibles hacia adelante. Más = más lejos se ve. |

---

#### `outsynth.audio` — Audio

| Clave | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `lookahead_ms` | número | `100` | Ventana de scheduling espacial (ms). Cuánto "hacia adelante" busca eventos. |
| `master_volume` | número (0-1) | `0.8` | Volumen master. |

---

#### `outsynth.start` — Pantalla de inicio

| Clave | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `mode` | string | `"press_any_key"` | `"press_any_key"` o `"auto_start"`. |

---

## themes/*.yaml

Ubicación: `config/themes/`

Define toda la apariencia visual: colores, formas de sprites, efectos.

### Estructura completa

```yaml
theme:
  name: "Nombre del Theme"
  
  sky:
    gradient:
      top: "#hexcolor"        # color superior del cielo
      bottom: "#hexcolor"     # color inferior (cerca del horizonte)
  
  horizon:
    color: "#hexcolor"        # línea del horizonte
    glow: true/false          # resplandor en el horizonte
  
  road:
    surface: "#hexcolor"      # color principal del asfalto
    surface_alt: "#hexcolor"  # color alternado (efecto velocidad)
    border: "#hexcolor"       # borde de la carretera
    center_line: "#hexcolor"  # línea central
    lane_markers: "#hexcolor" # divisiones entre carriles
  
  lanes:
    colors:                   # un color por carril (acento)
      - "#hexcolor"           # lane 0
      - "#hexcolor"           # lane 1
      - "#hexcolor"           # lane 2
      - "#hexcolor"           # lane 3
      - "#hexcolor"           # lane 4
      - "#hexcolor"           # lane 5
  
  sprites:
    kick:
      shape: "floor_block"
      scale: 1.0
    snare:
      shape: "floor_double"
      scale: 1.0
    hat:
      shape: "floor_dot"
      scale: 1.0
    clap:
      shape: "floor_triple"
      scale: 1.0
    synth_low:
      shape: "floor_outline"
      scale: 1.0
    synth_high:
      shape: "floor_line"
      scale: 1.0
  
  gate:                       # pórtico de vuelta
    color: "#hexcolor"
    opacity: 0.5              # 0-1
    flash_on_cross: true/false
    flash_color: "#hexcolor"
    flash_duration: 300       # ms
  
  vehicle:
    color: "#hexcolor"
    outline: "#hexcolor"
    trail: true/false
  
  effects:
    drop_flash_color: "#hexcolor"
    drop_flash_duration: 150  # ms
    delete_particles: true/false
    delete_particle_count: 12
    speed_lines: true/false
    speed_lines_color: "#hexcolor"
    speed_lines_min_speed: 100
  
  scenery:
    post_color: "#hexcolor"
    post_glow: true/false
```

### Shapes de sprites disponibles

| Shape | Descripción | Mejor para |
|-------|-------------|------------|
| `floor_block` | Franja llena dentro del carril | Kick |
| `floor_double` | Dos franjas paralelas | Snare |
| `floor_dot` | Línea punteada | Hi-hat |
| `floor_triple` | Tres franjas paralelas | Clap / percusión |
| `floor_outline` | Franja hueca | Synth low |
| `floor_line` | Línea fina sólida | Synth high |

### Cómo crear un nuevo theme

1. Copiar `config/themes/minimalist.yaml`
2. Cambiar el `name`
3. Modificar colores, shapes, efectos
4. Actualizar la referencia en el loader (futuro: selector en runtime)

---

## sounds/*.yaml

Ubicación: `config/sounds/`

Define qué suena en cada carril y cómo se comporta el DRIVE SOUND.

### Estructura completa

```yaml
sound_kit:
  name: "Nombre del Kit"
  
  landscape:                   # eventos del secuenciador espacial
    lanes:
      - name: "Nombre"        # nombre humano
        type: "sample"        # "sample" o "oscillator"
        
        # Si type = "sample":
        file: "assets/samples/kick.mp3"
        
        # Si type = "oscillator":
        waveform: "sawtooth"   # sine|square|sawtooth|triangle
        envelope:
          attack: 0.01         # segundos
          decay: 0.2
          sustain: 0.3         # nivel (0-1)
          release: 0.4
        filter:
          type: "lowpass"      # lowpass|highpass|bandpass
          frequency: 2000      # Hz
          resonance: 5
        note: "C4"             # nota musical
        
        # Común a ambos tipos:
        volume: 1.0            # 0-1
        polyphony: "mono"      # "mono" (corta anterior) | "poly" (permite overlap)
  
  drive:                       # sintetizador continuo del vehículo
    enabled: true/false
    toggle_key: "d"            # tecla para activar/desactivar
    waveform: "sawtooth"
    scale:
      root: "C3"
      type: "minor_pentatonic"
      notes: ["C3", "Eb3", "G3", "Bb3"]  # una nota por carril
    filter:
      type: "lowpass"
      min_frequency: 200       # a velocidad 0
      max_frequency: 8000      # a velocidad máxima
      resonance: 8
    portamento: 0.08           # glide entre carriles (segundos)
    volume: 0.4
```

### Tipos de sonido

| Tipo | Cuándo usar | Ventajas | Desventajas |
|------|-------------|----------|-------------|
| `sample` | Baterías, efectos, sonidos con carácter específico | Punch, identidad sonora | Requiere archivo mp3 |
| `oscillator` | Synths, tonos, pads | Zero carga, configurable | Sonido más genérico |

### Notas musicales

Las notas se expresan como `nombre + octava`: `C3`, `Eb4`, `G#2`, `Bb5`.

Para escalas, el campo `notes` mapea directamente: `notes[0]` = lane 0, `notes[1]` = lane 1, etc.

---

## tracks/*.yaml

Ubicación: `config/tracks/`

Define la geometría del circuito.

### Estructura completa

```yaml
track:
  name: "Nombre"
  length: 3200                 # longitud total en unidades

  segments:                    # secuencia de tramos
    - type: "straight"         # "straight" o "curve"
      length: 400              # longitud del tramo
    
    - type: "curve"
      length: 250
      direction: "right"       # "left" o "right"
      intensity: 2.0           # curvatura (0 = suave, 5 = cerrada)

  gate_position: 0             # posición del pórtico de vuelta

  scenery:                     # decoración lateral
    left:
      - type: "post"           # tipo de elemento
        spacing: 40            # cada N unidades
        offset: -1.3           # distancia lateral (negativo = izquierda)
    right:
      - type: "post"
        spacing: 40
        offset: 1.3
```

### Segmentos

| Tipo | Campos | Descripción |
|------|--------|-------------|
| `straight` | `length` | Tramo recto |
| `curve` | `length`, `direction`, `intensity` | Curva. La intensidad afecta cuánto se desvía lateralmente la carretera. |

### Longitud total

La suma de las `length` de todos los segmentos debe coincidir con `track.length`. Si no coincide, el sistema usará la suma real.

La longitud determina cuántos beats caben en una vuelta:
```
beats_por_vuelta = track.length / mpb
```
Con `length: 3200` y `mpb: 4` → **800 beats por vuelta**.

---

## vehicles/*.yaml (futuro)

Ubicación: `config/vehicles/`

Definirá la apariencia del vehículo. Por ahora el vehículo se configura dentro del theme.

### Estructura planeada

```yaml
vehicle:
  name: "Minimal Car"
  sprite: "assets/sprites/vehicle-minimal.png"
  width: 60
  height: 80
  # ... propiedades visuales
```

---

## Cómo funciona la carga

1. `ConfigLoader.js` carga los 4 YAML en paralelo con `fetch()` + `Promise.all()`
2. `js-yaml` parsea el texto a objetos JavaScript
3. `ThemeEngine.js` lee el theme y expone accessors tipados
4. Los módulos del juego acceden a la config via `config.get('outsynth.grid.mpb')`

### Orden de precedencia

```
default.yaml (base) → theme/sound/track YAML (específico)
```

Los YAML específicos no sobreescriben defaults — son configs separadas con sus propios namespaces (`theme:`, `sound_kit:`, `track:`).
