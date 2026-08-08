# OUTSYNTH — Verificación manual del MVP

## Arranque

1. Ejecutar `npm run dev` y abrir la aplicación.
2. Pulsar cualquier tecla: la pantalla inicial debe desaparecer y el HUD mostrar carril, velocidad y BPM aproximado.

## Conducción

1. Mantener flecha arriba: la velocidad debe aumentar hasta el máximo.
2. Soltarla: la velocidad debe caer gradualmente.
3. Usar izquierda y derecha: el vehículo debe desplazarse y el número de carril debe cambiar.
4. Llegar a una curva: el horizonte de carretera debe desplazarse levemente.

## Secuenciador

1. Con el vehículo en movimiento, pulsar espacio: debe aparecer un marcador en el carril y escucharse un sonido.
2. Pulsar espacio otra vez cerca de la misma celda: el marcador debe desaparecer.
3. Esperar una vuelta completa: cada marcador debe sonar al cruzarse, sin importar el carril actual.

## Audio y pausa

1. Pulsar `D`: DRIVE debe añadirse al sonido y reaccionar a velocidad/carril.
2. Pulsar `D` otra vez: DRIVE debe silenciarse.
3. Pulsar Escape: posición y velocidad deben congelarse. Pulsarlo otra vez debe reanudar.

## Comprobaciones técnicas realizadas

- Sintaxis de todos los módulos JavaScript: correcta mediante `node --check`.
- Longitud declarada del óvalo: coincide con la suma de sus segmentos.
- Pendiente antes de publicar: prueba visual y de interacción en los navegadores objetivo.
