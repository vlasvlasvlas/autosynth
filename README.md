# Autosynth

Autosynth es un secuenciador musical espacial interactivo. La música se distribuye en una pista virtual que el usuario recorre con un vehículo. El tiempo de reproducción (tempo/BPM) está determinado directamente por la velocidad de desplazamiento.

![Autosynth](https://img.shields.io/badge/Estado-Jugable-brightgreen?style=for-the-badge)

---

## 🏎️ Secuenciación Espacial

En lugar de depender de una línea de tiempo tradicional (`Tiempo → Beats → Eventos`), el secuenciador utiliza un modelo de espacio (`Distancia → Velocidad → Eventos`).

La longitud de la pista equivale a **8 compases de 4/4 (32 beats)**.
- **Grilla espacial**: Las notas musicales se posicionan como coordenadas físicas sobre la pista.
- **BPM variable**: Al controlar la velocidad del vehículo, el usuario ajusta el tempo en tiempo real. 
- **Cálculo de BPM**: El valor mostrado en pantalla se calcula dividiendo la velocidad actual del vehículo por la longitud espacial asignada a cada beat.

## 🎮 Controles

### Conducción
- `Flecha Arriba`: Acelerar (Aumentar BPM).
- `Flecha Abajo`: Frenar / Reversa (Disminuir BPM).
- `Izquierda` / `Derecha`: Cambiar de carril. Hay 6 carriles, cada uno asignado a un instrumento.
- `Shift` + `Izquierda` / `Derecha`: Salto rápido de 2 carriles.

### Secuenciador (Modo WRITE)
- `Espacio`: Coloca una nota en el carril actual. La posición se ajusta automáticamente según la configuración de pasos (Grid Steps).
- `X` (Mantener pulsado): Borra las notas con las que el vehículo entra en contacto.
- `1` a `9`: Carga plantillas predefinidas de ritmos y progresiones.

### Síntesis (Modo DRIVE)
- `D`: Alterna entre el modo secuenciador (WRITE) y el modo de síntesis en vivo (DRIVE).
- `Espacio` (Mantener en modo DRIVE): Reproduce un acorde continuo. La frecuencia de corte (cutoff) del filtro se modula mediante la velocidad del vehículo.

## 🎛️ Menú de Configuración

Presiona `M`, `ESC` o `P` para abrir el menú de sonido. Opciones disponibles:

- **Mezclador**: Funciones de Mute, Solo y ajuste de volumen independiente para los 6 carriles.
- **Presets**: Selección de sonidos para cada carril.
- **Grid Steps**: Configura la resolución de cuantización de la pista (16, 32, 64, 128 o 256 pasos). El minimapa visualiza la cuadrícula seleccionada.
- **Escala Drive**: Define la nota raíz y el modo musical (Mayor, Menor, Pentatónica, etc.) para el sintetizador.
- **Módulo de Síntesis**: Selección de algoritmos y formas de onda (Analog Dual, FM Bell, Bass Pulse, etc.) para el sintetizador principal.

## 🚀 Arquitectura Técnica

- **Audio**: Desarrollado sobre la API nativa de Web Audio (`AudioContext`). Generación de sonido basada en grafos de osciladores y filtros biquad, sin librerías externas.
- **Gráficos**: Motor de renderizado pseudo-3D construido sobre `<canvas>` de HTML5, prescindiendo de WebGL.
- **Despliegue**: Proyecto de archivos estáticos (HTML, CSS, JS). Cuenta con un flujo de trabajo de GitHub Actions para despliegue automatizado en GitHub Pages.
