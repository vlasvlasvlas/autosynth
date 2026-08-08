# OUTSYNTH — Estado del proyecto

**Versión:** 0.2.0 MVP local  
**Estado:** prototipo jugable, sin persistencia ni distribución.

## Qué es

OUTSYNTH es un secuenciador espacial: los eventos musicales están fijos sobre una pista y el vehículo es el playhead. La velocidad de conducción determina el tiempo entre eventos. No existe un reloj musical que avance por separado.

## Implementado

- Pantalla de inicio, canvas de alta densidad y controles de teclado.
- Vehículo con aceleración, frenado, fricción, desplazamiento lateral y carril activo.
- Circuito ovalado en loop; la posición vuelve a cero al completar una vuelta.
- Proyección visual de carretera, curvatura de segmento, carriles y vehículo.
- Secuenciador: `SPACE` añade o elimina un evento en el carril actual y en una posición cuantizada por distancia.
- Reproducción: los eventos disparan al cruzar su posición, incluso al pasar por la vuelta.
- Audio Web Audio: sonidos sintetizados por carril y modo DRIVE continuo con `D`.
- Configuración externa en YAML para grid, física, tema, sonidos y pista.

## Pendiente

- Samples reales y cargador de buffers; hoy el MVP usa osciladores para ser autocontenido.
- Persistir, exportar e importar composiciones.
- Más pistas, vehículos, temas y una interfaz para seleccionarlos.
- Render de curvas por segmentos más fiel, sprites y efectos avanzados.
- Modo solo, generación/mutación de patrones y eventos de duración espacial.
- Pruebas automatizadas y repositorio Git.

## Riesgos y decisiones abiertas

- Las unidades del mundo se usan como unidades espaciales del motor. Antes de una versión pública debe fijarse una conversión explícita a metros reales.
- El navegador solo habilita audio después del primer gesto del usuario; por eso el audio se inicia al salir de la pantalla inicial.
- `ESC` pausa y reanuda. Mientras está pausado, no se mueve el vehículo ni se dispara audio.

## Controles

| Tecla | Acción |
|---|---|
| Flecha arriba / abajo | Acelerar / frenar |
| Flecha izquierda / derecha | Cambiar de carril |
| Espacio | Crear o borrar un evento y escucharlo inmediatamente |
| D | Activar o desactivar DRIVE SOUND |
| Escape | Pausar o reanudar |

## Cómo ejecutar

```bash
npm run dev
```

Abrir `http://localhost:8080` en un navegador moderno. Se necesita red durante el arranque para cargar `js-yaml` desde CDN y las fuentes web.
