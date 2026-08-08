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
| `Road` | Mantiene longitud, segmentos, curvatura y distancia circular. |
| `Vehicle` | Mantiene posición, velocidad, lateralidad y carril actual. |
| `Sequencer` | Almacena eventos por posición espacial; cuantiza, alterna y detecta cruces. |
| `AudioEngine` | Crea el contexto Web Audio, dispara eventos y modula DRIVE. |
| `Game` | Inicializa módulos, aplica la máquina de estados y dibuja el MVP. |

## Contrato espacial

- Una posición es un número entre `0` y `track.length`.
- La grilla tiene una unidad `mpb / subdivisions`.
- `Sequencer.toggle(lane, position)` redondea a esa unidad y usa `(lane, posición)` como identidad del evento.
- Al cruzar el final de pista, un rango se interpreta como `[origen, longitud] ∪ [0, destino]`.
- El tempo informativo se calcula como `BPM = 60 × velocidad / MPB`.

## Audio del MVP

El kit YAML describe la intención sonora. La implementación actual sintetiza cada carril con un oscilador breve para evitar que el prototipo dependa de assets aún inexistentes. El siguiente reemplazo debe conservar la API `trigger(lane)` y cambiar internamente a `AudioBufferSourceNode` para samples.

## Límites actuales

El render es pseudo-3D deliberadamente compacto: usa proyección por perspectiva y un desplazamiento para curvas. No intenta representar toda la geometría del circuito. La fuente de verdad musical sí es la pista espacial, no los píxeles renderizados.
