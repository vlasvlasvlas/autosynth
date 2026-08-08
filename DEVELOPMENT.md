# OUTSYNTH — Documentación Técnica de Desarrollo

> **Secuenciador Musical Espacial Conducible (2.5D Sprite-Based Web Experience)**  
> **Complemento oficial de:** [outsynth_README.md](file:///Users/vladimirobellini/Documents/REPOS/outsynth/outsynth_README.md)  
> **Estado:** Fases 0, 1 y 2 integradas y operativas (Motor 2.5D + Audio Engine + Sound Studio & Mixer).  
> **Servidor local:** `http://localhost:8080` (ejecutado con `npx -y serve . -p 8080`)

---

## 1. Resumen de lo Implementado

Se ha transformado la visión conceptual de OUTSYNTH en una experiencia interactiva completa en el navegador, basada en el paradigma:
$$\text{Distancia Recorrida} \longrightarrow \text{Posición Espacial} \longrightarrow \text{Eventos Musicales}$$

### Principales características funcionales:
1. **Motor 2.5D Sprite-Based:**
   - Proyección en perspectiva de carretera con carriles definidos.
   - Sprites musicales con profundidad Z escalados con la ley $1/Z$ (Monolito Kick, Pilar Snare, Baliza Hi-Hat, Torre Synth).
   - Pórtico de meta ("LOOP GATE") en la coordenada $Z=0$ que marca el reinicio del circuito.
   - Vehículo estilo cyber-coupe con faros de iluminación proyectada en el asfalto, luces traseras del color del carril activo y partículas de escape.
   - Ondas de choque luminosas y partículas al activar o atravesar notas.
2. **Física del Vehículo y Control:**
   - Aceleración y frenado interactivos (la velocidad física determina el tempo BPM en tiempo real).
   - Movimiento lateral ultra-ágil ($750\text{ u/s}$) con las flechas ◀ / ▶ para deslizarse sin retardo entre los carriles de composición.
3. **Motor de Audio Web Audio API en Tiempo Real:**
   - Sintetizadores percusivos y melódicos dedicados para cada carril (sin necesidad de descargas externas pesadas).
   - Disparo inmediato de notas con `SPACE` al hacer **DROP**.
   - Sintetizador continuo **DRIVE SOUND** (tecla `D`), con frecuencia vinculada al carril y filtro pasa-bajos reactivo a la velocidad.
4. **Mixer y Sound Studio in-game (`ESC` / `M`):**
   - Pausa instantánea de la carrera al presionar `ESC` o `M`.
   - **Volumen Master** (0% a 100%).
   - **Volumen Individual por Canal** para cada uno de los 4 tracks.
   - **Botones MUTE & SOLO** por carril para silenciar o aislar pistas.
   - **Selector de Presets Tímbricos** (808 Sub, Club Punch, 909 Snare, Cyber Clap, Crisp Hat, Neon Saw Lead, Acid Bass, etc.).
   - **Selector de Formas de Onda** (Sine, Triangle, Sawtooth, Square).
   - **Controles de Decay (duración) y Frecuencia Base (Pitch/Hz).**
   - **Botón `▶ PROBAR CANAL`:** Audiciona el instrumento antes de volver a la pista.
5. **Configuración Dinámica vía YAML:**
   - Todos los parámetros de grilla (MPB), física, temas visuales y kits de sonido son leídos desde `config/`.

---

## 2. Arquitectura de Módulos (`src/`)

```
outsynth/
├── index.html              ← Contenedor principal con 3 capas de Canvas + Importmap
├── style.css               ← Estilos del juego, HUD, pantalla de inicio y Studio Mixer
├── package.json            ← Configuración de scripts de desarrollo local
├── DEVELOPMENT.md          ← Este documento
├── CONFIG_REFERENCE.md     ← Referencia completa de parámetros YAML
│
├── config/                 ← 🔧 Archivos de configuración YAML
│   ├── default.yaml        ← Parámetros globales de grilla, carriles, físicas y audio
│   ├── themes/
│   │   └── minimalist.yaml ← Paleta de colores, sprites, horizonte y efectos
│   ├── sounds/
│   │   └── classic-kit.yaml ← Kit de sonido base y escalas
│   └── tracks/
│       └── oval.yaml       ← Definición de circuito con curvas y longitud
│
└── src/
    ├── Game.js             ← Orquestador central, bucle de animación y máquina de estados
    ├── Renderer.js         ← Motor gráfico 2.5D: carretera, sprites Z, partículas y HUD
    ├── SoundMenu.js        ← Modal interactivo del Mixer y Sound Studio (ESC/M)
    ├── AudioEngine.js      ← Motor de síntesis Web Audio API (Canales, Mixer, Mute/Solo, Drive)
    ├── Sequencer.js        ← Secuenciador espacial cuantizado en metros (MPB)
    ├── Road.js             ← Modelo de pista espacial con loop infinito y curvas
    ├── Vehicle.js          ← Físicas del vehículo (posición Z, desplazamiento lateral X, inercia)
    ├── ConfigLoader.js     ← Cargador de archivos YAML con fallback
    ├── ThemeEngine.js      ← Gestor de paletas de color y estilos visuales
    └── InputHandler.js     ← Controlador de teclado (acelerar, frenar, cambiar carril, drop, pause)
```

---

## 3. Detalle Técnico Módulo por Módulo

### `src/Game.js`
- **Responsabilidad:** Gestiona la máquina de estados (`LOADING`, `START_SCREEN`, `PLAYING`, `PAUSED`) y ejecuta el bucle de renderizado a 60 FPS con `requestAnimationFrame`.
- **Integración:** Conecta el `Vehicle`, `Road`, `Sequencer`, `AudioEngine`, `Renderer` y `SoundMenu`.
- **Pre-población de notas:** Añade un patrón rítmico inicial cuantizado al arrancar para que la pista tenga música inmediatamente al conducir.

### `src/Renderer.js`
- **Renderizado 2.5D en perspectiva:**
  - Proyecta la carretera desde el punto de fuga en el horizonte $(W/2, H_{\text{horizon}})$ hacia la parte inferior de la pantalla.
  - Dibuja carriles con degradados suaves y resaltado neón del carril activo.
  - Líneas de velocidad dinámicas que avanzan por el asfalto en base a `vehicle.position`.
- **Sprites con profundidad Z (Algoritmo del Pintor):**
  - Calcula la distancia de los eventos hacia adelante con `road.distanceAhead(vehicle.position, event.position)`.
  - Escala cada sprite con una curva de perspectiva exponencial: $pz = (1 - \text{distancia} / \text{maxDist})^{2.2}$.
  - Renderiza monolitos, pilares, balizas y torres cristalinas según el instrumento del carril.
- **Vehículo y Efectos:**
  - Faros con gradientes de luz proyectada sobre la carretera.
  - Luces traseras neón que adoptan el color del instrumento del carril actual.
  - Emisión de partículas de escape y ondas de choque al cruzar notas.
- **HUD:**
  - Telemetría en vivo de **BPM** calculado: $\text{BPM} = 60 \times \text{velocidad} / \text{MPB}$.
  - Nombre del carril/instrumento activo.
  - Estado del modo DRIVE SOUND y atajos de teclado.

### `src/AudioEngine.js`
- **Síntesis en tiempo real:**
  - **Canal 1 (Kick):** Oscilador senoidal con rampa exponencial de frecuencia ($140\text{Hz} \to 42\text{Hz}$) y envolvente rápida.
  - **Canal 2 (Snare):** Combinación de cuerpo tonal y ráfaga de ruido blanco filtrado por pasa-altos ($1000\text{Hz}$).
  - **Canal 3 (Hi-Hat):** Ruido blanco procesado por filtro pasa-banda centrado en $8000\text{Hz}$ con $Q=4.0$.
  - **Canal 4 (Synth):** Oscilador diente de sierra/cuadrada con filtro pasa-bajos dinámico ($2400\text{Hz} \to 400\text{Hz}$).
- **Mixer y Control de Ganancia:**
  - `masterVolume`: Ganancia maestra global.
  - `trackSettings[lane].volume`: Ganancia individual por pista.
  - `effectiveVolume(lane)`: Aplica lógica de silenciamiento (`muted`) y aislamiento (`solo`).
- **DRIVE SOUND:**
  - Oscilador continuo (`sawtooth`) con filtro pasa-bajos (`driveFilter`) cuya frecuencia de corte se abre con la velocidad ($200\text{Hz} \to 5700\text{Hz}$) y tono según el carril (escala pentatónica menor: C3, Eb3, G3, Bb3).

### `src/SoundMenu.js`
- **Interfaz de Estudio Glassmorphism:**
  - Se activa con `ESC`, `M` o `P`.
  - Muestra tarjetas para los 4 canales con sus colores característicos (Rosa Kick, Cyan Snare, Dorado Hat, Violeta Synth).
  - Permite alterar presets, formas de onda, decay, tono base y volúmenes con respuesta auditiva inmediata mediante el botón `▶ PROBAR CANAL`.

### `src/Vehicle.js`
- **Físicas y Dirección:**
  - Aceleración ($140\text{ u/s}^2$), frenado ($220\text{ u/s}^2$) y fricción por inercia ($0.98$).
  - Velocidad lateral de respuesta rápida ($750\text{ u/s}$) con límites en los márgenes de la autopista.
  - Cálculo dinámico de carril actual `lane()` en base a la coordenada lateral $X$.

### `src/Sequencer.js`
- **Cuantización Espacial (MPB):**
  - $\text{unidad} = \text{MPB} / \text{subdivisiones}$.
  - $\text{posiciónCuantizada} = \text{round}(\text{posición} / \text{unidad}) \times \text{unidad}$.
  - Los eventos se almacenan en un mapa indexado por carril y coordenada longitudinal $Z$.
  - Detección de cruce de eventos `crossed(from, to, wrapped)` para activar sonidos al pasar sobre ellos.

---

## 4. Controles del Sistema

| Control | Tecla | Función |
|---|---|---|
| **Acelerar / Frenar** | **▲ / ▼** | Controla la velocidad del vehículo y altera el tempo BPM en tiempo real |
| **Cambio de Carril** | **◀ / ▶** | Desplazamiento lateral rápido entre pistas (Kick, Snare, Hat, Synth) |
| **Drop Note (Colocar/Borrar)** | **SPACE** | Graba una nota cuantizada en el carril actual o la borra si ya existe |
| **Drive Sound** | **D** | Enciende/apaga el sintetizador continuo que reacciona a la velocidad |
| **Studio Sound Menu** | **ESC / M** | Abre/cierra el mezclador de sonido para personalizar volúmenes y presets |

---

## 5. Verificación y Ejecución

Para iniciar o verificar el entorno:
```bash
cd outsynth
npx -y serve . -p 8080
```
Abrir `http://localhost:8080` en cualquier navegador moderno.
