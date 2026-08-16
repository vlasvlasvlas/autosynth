# OUTSYNTH — Arquitectura

## Flujo de ejecución

```text
teclado → Vehicle → posición espacial → Sequencer → AudioEngine
                  ↘ Road / renderer → canvas
YAML → ConfigLoader → ThemeEngine ────↗
```

`Game` coordina el ciclo de animación. La lógica se actualiza con `delta time` y el render se realiza después de cada actualización.

## Módulos

| Módulo | Responsabilidad |
|---|---|
| `ConfigLoader` | Carga cuatro YAML y ofrece acceso seguro a sus valores. |
| `ThemeEngine` | Traduce el tema activo a colores y estilos de render. |
| `InputHandler` | Expone estados held/pressed/released y acciones semánticas. |
| `Road` | Mantiene longitud, segmentos, curvatura suavizada y distancias circulares. |
| `Vehicle` | Mantiene posición, velocidad, lateralidad, snap y carril actual. |
| `Sequencer` | Almacena eventos por posición espacial; cuantiza, alterna y detecta cruces. |
| `AudioEngine` | Crea el contexto Web Audio, dispara eventos y modula DRIVE. |
| `Renderer` | Construye una proyección segmentada compartida por carretera, carriles, eventos y vehículo. |
| `Game` | Inicializa módulos, aplica la máquina de estados y coordina actualización/render. |

## Contrato espacial

- Una posición es un número entre `0` y `track.length`.
- La grilla tiene una unidad `mpb / subdivisions`.
- `Sequencer.toggle(lane, position)` redondea a esa unidad y usa `(lane, posición)` como identidad del evento.
- Al cruzar el final de pista, un rango se interpreta como `[origen, longitud] ∪ [0, destino]`.
- En reversa se invierten los límites del intervalo y el wrap: los eventos se disparan en el orden espacial contrario.
- El tempo informativo usa la magnitud: `BPM = 60 × |velocidad| / MPB`; la dirección se muestra como `REV`.

## Audio del MVP

El kit YAML describe la intención sonora. La implementación actual sintetiza cada carril con un oscilador breve para evitar que el prototipo dependa de assets aún inexistentes. El siguiente reemplazo debe conservar la API `trigger(lane)` y cambiar internamente a `AudioBufferSourceNode` para samples.

`trigger(lane, true)` es la variante reverse: invierte barridos y envolventes y agrega un release corto para terminar en silencio. Cuando existan samples, esa misma bandera deberá usar reproducción de buffer invertido.

## Contrato visual

La geometría musical sigue siendo espacial, no pixelar. En cada frame el renderer muestrea la curvatura futura y construye cortes de carretera por profundidad. Superficie, bordes, carriles, pórtico y eventos se proyectan sobre esos mismos cortes; ningún feedback de escritura utiliza coordenadas laterales independientes.

El minimap de v0.3 es una elipse paramétrica deliberada. Todavía no reconstruye la forma cenital exacta a partir de los segmentos.
