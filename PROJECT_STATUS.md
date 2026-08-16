# OUTSYNTH — Estado del proyecto

**Versión:** 0.3.0, prototipo local
**Estado:** instrumento/secuenciador espacial jugable, sin persistencia ni distribución.

## Fuente de verdad conceptual

`outsynth_README.md` define el concepto original. La especificación aprobada de v0.3 está en
`docs/superpowers/specs/2026-08-08-outsynth-v03-redesign.md`.

Los principios que gobiernan la implementación actual son:

- la composición se almacena en posiciones espaciales;
- el vehículo es el único playhead;
- la velocidad produce el tempo;
- el carril determina dónde se escribe, pero todos los carriles se reproducen;
- WRITE y DRIVE son modos distintos.

## Implementado y verificado

- Seis carriles con instrumentos diferenciados y configuración YAML.
- Aceleración, frenado, marcha atrás, desplazamiento lateral asistido al centro del carril y salto de dos carriles con `Shift + ←/→`.
- Circuito cerrado. La longitud efectiva proviene de la suma de sus segmentos.
- Carretera pseudo-3D segmentada: bordes, divisores, franjas, pórtico y eventos comparten una única proyección curva.
- Transiciones de curvatura suavizadas para evitar saltos arbitrarios del punto de fuga.
- WRITE: `SPACE` alterna una celda cuantizada y la representa como marca plana dentro del carril.
- DRIVE: `D` cambia de modo y `SPACE` sostenido interpreta la nota del carril sin escribir.
- Reproducción de eventos al cruzar su posición, incluido el cruce del final de vuelta.
- Reproducción inversa al cruzar eventos marcha atrás: cada instrumento usa pitch/filtro y envolvente invertidos con release anticlick.
- Mixer de seis canales, mute/solo, presets y selector de escala para DRIVE.
- Minimap, selector de acento y HUD mínimo.
- Pruebas automatizadas de geometría espacial, cuantización, loop, vehículo, configuración de audio y alineación de proyección.

## Corregido en la auditoría de agosto de 2026

- La pista ya no es un trapecio recto cuyo punto de fuga salta por segmento: ahora la geometría visible se acumula y curva por profundidad.
- El DROP ya no crea un aro decorativo desalineado. La marca del piso es el feedback y usa exactamente la misma proyección que su carril.
- El vehículo inicia y salta al centro real de un carril; antes empezaba sobre la divisoria central.
- `D` volvió a ser exclusivamente el selector de modo DRIVE y dejó de competir con dirección lateral.
- Se restauró el salto de carril especificado y se eliminó la variante experimental de salto vertical.
- La reversa se reintegró como transporte espacial completo: movimiento circular, cruces inversos y audio reverse coherente.
- El selector de acento actualiza el juego aunque se elija después de cargar la página.
- La pista `oval` usa giros consistentes en una misma dirección.
- Audio y DRIVE consumen los valores principales del kit YAML.

## Pendiente

- Samples reales y carga de `AudioBuffer`; el prototipo usa síntesis Web Audio.
- Persistencia, exportación e importación de composiciones.
- Más pistas, vehículos, temas y selección de contenido en runtime.
- Pruebas automatizadas de Web Audio en un navegador real y matriz de navegadores objetivo.
- Un minimap derivado de la geometría exacta de segmentos; el actual usa la elipse aprobada para v0.3.
- Completar la separación “JS motor / YAML contenido”: el catálogo de presets sigue en JavaScript y hay campos YAML reservados que aún no tienen runtime (`lookahead_ms`, `display`, scenery y carga de samples/polyphony).

## Controles

| Tecla | Acción |
|---|---|
| `↑` | Acelerar; si se estaba retrocediendo, frenar hasta avanzar |
| `↓` | Frenar; al mantener, entrar en marcha atrás |
| `← / →` | Desplazarse entre carriles |
| `Shift + ←/→` | Saltar dos carriles |
| `SPACE` en WRITE | Crear/borrar evento cuantizado y escucharlo |
| `D` | Alternar WRITE / DRIVE |
| `SPACE` sostenido en DRIVE | Interpretar la nota del carril |
| `Esc` o `M` | Abrir/cerrar Sound Studio |

## Ejecución

```bash
npm run dev
npm test
```
