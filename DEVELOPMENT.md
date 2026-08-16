# OUTSYNTH — Desarrollo v0.3

OUTSYNTH es un secuenciador espacial presentado como juego de conducción pseudo‑3D.

```text
distancia recorrida → posición espacial → eventos musicales
```

No existe un reloj musical independiente: si el vehículo se detiene, el playhead y la secuencia espacial también se detienen.

## Documentos y precedencia

1. `outsynth_README.md`: fundamento conceptual e historia de decisiones.
2. `docs/superpowers/specs/2026-08-08-outsynth-v03-redesign.md`: comportamiento aprobado para v0.3.
3. `PROJECT_STATUS.md`: estado real y limitaciones vigentes.
4. `ARCHITECTURE.md`: contratos entre módulos.
5. `CONFIG_REFERENCE.md`: formato del contenido YAML.

Los planes dentro de `docs/superpowers/plans/` son registro de implementación, no la descripción del runtime actual.

## Stack

- JavaScript vanilla con ES Modules.
- Canvas 2D en tres capas (`bg`, `road`, `hud`).
- Web Audio API para síntesis y mezcla.
- YAML para grilla, física, pista, tema y kit sonoro.
- Node test runner para contratos puros.

## Estructura

```text
outsynth/
├── index.html
├── style.css
├── config/
│   ├── default.yaml
│   ├── themes/minimalist.yaml
│   ├── sounds/classic-kit.yaml
│   └── tracks/oval.yaml
├── src/
│   ├── Game.js
│   ├── Renderer.js
│   ├── Road.js
│   ├── Vehicle.js
│   ├── Sequencer.js
│   ├── AudioEngine.js
│   ├── SoundMenu.js
│   ├── ConfigLoader.js
│   ├── ThemeEngine.js
│   └── InputHandler.js
└── test/
```

## Runtime

`Game` carga la configuración, crea los módulos y mantiene la máquina de estados:

```text
LOADING → START_SCREEN → PLAYING ↔ PAUSED
```

Cada frame jugable:

1. `Vehicle` actualiza velocidad, posición longitudinal y lateralidad.
2. `Sequencer` detecta qué eventos fueron cruzados.
3. `AudioEngine` dispara LANDSCAPE o actualiza DRIVE.
4. `Renderer` construye y dibuja la proyección compartida.

## Contrato espacial

- La pista es circular y su longitud efectiva es la suma de segmentos.
- La unidad de grilla es `mpb / subdivisions`.
- Cada evento se identifica por `(lane, posición cuantizada)`.
- El carril actual sólo determina dónde se escribe.
- Todos los eventos cruzados se reproducen, sin importar el carril del vehículo.
- `BPM = 60 × |velocidad| / MPB` es telemetría derivada, no un reloj maestro.

## Carretera y perspectiva

El renderer muestrea la geometría futura cada pocas unidades. La curvatura de esos cortes se integra para construir una línea central por profundidad. Sobre ese único modelo se dibujan:

- superficie y franjas espaciales;
- bordes y divisores;
- resaltado del carril activo;
- pórtico;
- marcas de eventos;
- punto de apoyo visual del vehículo.

Las curvas usan entrada y salida suavizadas. No se cambia un punto de fuga global de forma discreta.

En WRITE, las seis formas son marcas planas del asfalto: bloque, doble franja, punteado, triple franja, outline y línea fina. No existe un efecto circular separado para el DROP.

## Vehículo e input

- `↑`: acelerar o salir de la reversa.
- `↓`: frenar y, al mantener, entrar en marcha atrás.
- `← / →`: movimiento lateral con asistencia al centro del carril.
- `Shift + ←/→`: salto instantáneo de dos carriles.
- `SPACE`: toggle cuantizado en WRITE; sustain en DRIVE.
- `D`: alterna WRITE/DRIVE.
- `Esc` o `M`: pausa y Sound Studio.

El vehículo siempre inicia en el centro de un carril real. Los límites laterales también son centros de carril, no los bordes externos de la carretera.

## Audio

`AudioEngine` ofrece seis canales sintetizados, volumen master, volumen por canal, mute, solo y presets. El kit YAML define nombres, forma de onda, volumen, notas base y parámetros principales de DRIVE.

DRIVE usa:

- carril → frecuencia según root/escala;
- velocidad → apertura de filtro;
- `SPACE` sostenido → ganancia del sustain.

Al pausar se cierra el sustain para evitar audio colgado.

En marcha atrás, `Sequencer.crossed()` invierte los intervalos de cruce —también alrededor del wrap— y `AudioEngine.trigger(lane, true)` usa una envolvente creciente, barridos invertidos y un release final corto. Esto produce un reverse perceptual incluso con síntesis procedural, donde no existe un sample pregrabado que simplemente pueda reproducirse al revés.

## Ejecutar y verificar

```bash
npm run dev
npm test
```

El servidor puede elegir otro puerto si `8080` está ocupado; usar siempre la URL que imprime en terminal.

La verificación manual completa está en `TEST_PLAN.md`.
