# AUTOSYNTH

**Autosynth** es un secuenciador musical espacial conducible. Invierte la relación tradicional entre la música y el tiempo: en lugar de una línea de tiempo que dicta cuándo ocurren los eventos, la música está físicamente distribuida en un circuito pseudo-3D infinito, y **el tiempo emerge a partir de cómo conduces a través de él.**

No ajustas un control de BPM; simplemente aceleras.

![Autosynth](https://img.shields.io/badge/Estado-Jugable-brightgreen?style=for-the-badge)

---

## 🏎️ Concepto Central: Secuenciación Espacial

En un secuenciador tradicional: `Tiempo → Beats → Eventos Musicales`  
En **Autosynth**: `Distancia → Velocidad de Recorrido → Eventos Musicales`

La longitud total de la pista representa físicamente y de manera exacta **8 compases (32 beats)**.
- **La grilla es espacial**: Cuando sueltas una nota, se pinta una marca física en el asfalto.
- **El tempo es físico**: Tu vehículo actúa como el cabezal de reproducción (playhead). Conducir más rápido cubre físicamente la distancia entre las notas en menos tiempo, aumentando de forma nativa el BPM.
- **La matemática es real**: El BPM que se muestra en el HUD es un cálculo matemático exacto basado en la velocidad de tu vehículo (unidades por segundo) relativa a la longitud de la pista de 32 beats. A máxima velocidad, puedes alcanzar más de **2500 BPM**.

## 🎮 Cómo Jugar (Controles)

Autosynth cuenta con una interfaz cruda y brutalista. El enfoque es puramente funcional, centrado en la interacción entre la conducción y la composición sonora.

### Conducción y Tempo
- `W` / `Flecha Arriba`: Acelerar (Aumentar BPM)
- `S` / `Flecha Abajo`: Frenar / Reversa (Disminuir BPM)
- `A` / `D` o `Izquierda` / `Derecha`: Moverse suavemente entre los 6 carriles (instrumentos).
- `Shift` + `Izquierda` / `Derecha`: Salto instantáneo de 2 carriles para cambios rítmicos rápidos.

### Secuenciador (Modo WRITE)
- `Espacio`: Soltar una nota en el carril actual, en tu ubicación física exacta. Se cuantizará automáticamente a los "Grid Steps" activos.
- `X` (Mantener pulsado): Modo borrar. Conduce sobre notas existentes mientras mantienes la X para eliminarlas de la pista.
- `1` - `9`: Cargar instantáneamente patrones de batería y progresiones de sintetizador pre-compuestas en la pista.

### Síntesis en Tiempo Real (Modo DRIVE)
- `D`: Alternar entre el modo **WRITE** (pintar notas) y el modo **DRIVE** (síntesis en vivo).
- `Espacio` (Mantener en modo DRIVE): Toca un acorde de sintetizador sostenido basado en tu carril actual. ¡El filtro del sintetizador (cutoff) se modula directamente con la velocidad de tu vehículo!

## 🎛️ Menú de Estudio de Sonido

Presiona `M`, `ESC` o `P` en cualquier momento para abrir el **Menú de Sonido** brutalista.

Aquí puedes:
- **Mutear / Solear** cualquiera de los 6 carriles de instrumentos.
- Ajustar los niveles de **Volumen** individuales.
- Cambiar el **Preset** (tipos de bombo, tipos de caja, etc.) por cada carril.
- Configurar los **Grid Steps (Pasos)**: Cambia la resolución de cuantización de la pista al vuelo (16, 32, 64, 128 o 256 pasos). El minimapa actualizará instantáneamente sus marcas visuales para coincidir con tu configuración.
- Seleccionar la **Escala Drive**: Elige la Nota Raíz y la Escala (Menor, Mayor, Blues, Dórica, etc.) en la que se bloqueará el sintetizador DRIVE.
- Modificar el **Módulo de Síntesis**: Elige entre diferentes algoritmos de osciladores y filtros para el Sintetizador Drive (ej., Analog Dual, FM Bell, Bass Pulse).

## 🚀 Arquitectura Técnica

- **Audio**: API nativa de Web Audio (`AudioContext`, grafos de osciladores personalizados, filtros biquad). Sin librerías de audio externas.
- **Gráficos**: Renderizado nativo en `<canvas>` HTML5 utilizando un algoritmo personalizado de rasterización pseudo-3D (inspirado en juegos de carreras clásicos como OutRun). Sin WebGL.
- **Despliegue**: Archivos estáticos puros (HTML, CSS, JS). Desplegado automáticamente a través de GitHub Actions hacia GitHub Pages.

---

*Conduce la música.*
