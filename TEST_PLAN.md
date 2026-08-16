# OUTSYNTH — Plan de verificación

## Automatizado

Ejecutar:

```bash
npm test
```

La suite comprueba:

- longitud y normalización circular de la pista;
- distancia hacia adelante y distancia firmada alrededor del loop;
- entrada/salida suave de curvas;
- cuantización, toggle y disparo al cruzar el final de vuelta;
- posición inicial, avance/reversa, wrap inverso, snap y salto de carriles;
- cruce de eventos en reversa y envolventes reverse con release anticlick;
- consumo de configuración YAML por AudioEngine;
- alineación matemática entre vehículo, carril y proyección curva.

## Arranque

1. Ejecutar `npm run dev` y abrir la URL informada por el servidor.
2. Elegir un acento y pulsar una tecla.
3. Verificar que vehículo, carril activo y minimap usan el acento elegido.
4. Confirmar que la consola no registra errores.

## Conducción y perspectiva

1. Mantener `↑`: velocidad y BPM deben aumentar.
2. Soltar: debe actuar la inercia; `↓` debe frenar, atravesar cero y entrar en reversa si se mantiene.
3. Usar `←/→`: el vehículo debe terminar centrado en un carril.
4. Usar `Shift + ←/→`: debe saltar dos carriles y destellar brevemente.
5. Entrar y salir de cada curva: la carretera debe doblarse de forma continua, sin teletransportar el punto de fuga.
6. Verificar que bordes, divisores, franjas, pórtico y marcas se curvan juntos.

## Secuenciador / WRITE

1. Con DRIVE apagado, pulsar `SPACE` en cada carril.
2. Debe sonar inmediatamente y aparecer la forma correspondiente dentro de ese carril.
3. No debe aparecer ningún círculo o efecto separado al costado.
4. Volver a pulsar en la misma celda: debe borrarse.
5. Completar una vuelta: todos los eventos deben disparar al cruzarse, sin depender del carril actual.
6. Probar un evento cerca del final de pista y confirmar el disparo después del wrap.
7. Retroceder sobre eventos: deben dispararse una sola vez, en orden inverso y con su sonido reverse.
8. Retroceder desde el inicio: los eventos precargados detrás del pórtico deben sonar sin necesitar una vuelta completa.

## DRIVE y Sound Studio

1. Pulsar `D`: `SPACE` ya no debe escribir.
2. Mantener y soltar `SPACE`: el sustain debe abrirse y silenciarse sin clicks evidentes.
3. Cambiar de carril con `SPACE` sostenido: debe cambiar la nota.
4. Abrir Sound Studio con `Esc` o `M`: movimiento y sustain deben detenerse.
5. Probar root/escala, volumen master, volúmenes de canal, mute, solo, presets y botones TEST.
6. Cerrar el menú y confirmar que el juego continúa desde la misma posición.

## Pendiente antes de publicar

- Prueba auditiva y de latencia en Chrome, Safari y Firefox.
- Prueba de alta densidad de eventos a velocidad máxima.
- Verificación de resize y distintas relaciones de aspecto.
