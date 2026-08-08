# OUTSYNTH

## Documento conceptual y fundamento del MVP

**Estado:** concepto consolidado; MVP local implementado.  
**Objetivo actual:** validar que conducir, componer y escuchar forman una única experiencia.

---

## 1. Origen

La idea surge al escuchar una pista musical en la que el tiempo parecía ralentizarse y acelerarse. A partir de esa sensación aparece una primera imagen: una bicicleta, vista inicialmente desde arriba, cuya velocidad controla directamente la velocidad de una composición musical.

La primera intuición fue invertir la relación habitual entre música y desplazamiento.

En un secuenciador tradicional:

> tiempo → beats → eventos musicales

En OUTSYNTH:

> distancia → recorrido → eventos musicales

La composición deja de existir primariamente sobre una línea de tiempo y pasa a existir sobre un espacio recorrible.

El usuario no mueve un control de BPM: conduce a través de la composición.

---

## 2. Idea central

OUTSYNTH es un secuenciador musical espacial conducible.

Una pista o carretera contiene eventos musicales distribuidos físicamente a lo largo de su recorrido. Un vehículo se desplaza por ella y funciona como playhead.

La velocidad del vehículo determina cuánto tarda en alcanzar los eventos siguientes y, por lo tanto, determina el tempo resultante.

La música está fija en el espacio.

El tiempo emerge de la manera en que ese espacio es recorrido.

> No se reproduce una canción a determinada velocidad: se atraviesa una composición.

---

## 3. Del BPM al MPB

Una de las primeras ideas fue reemplazar conceptualmente BPM por una medida espacial.

### MPB — Metros por beat

En lugar de definir solamente:

`120 beats por minuto`

se puede definir:

`1 beat cada 4 metros`

La grilla musical es entonces una grilla espacial.

Ejemplo:

```text
|----|----|----|----|----|
0m   4m   8m  12m  16m
```

Si cada beat ocupa 4 metros y el vehículo circula a 8 m/s, recorre dos beats por segundo, equivalente a 120 BPM.

Conceptualmente:

```text
BPM = 60 × velocidad(m/s) / MPB
```

Pero el sistema no necesita pensar internamente en un BPM maestro.

Lo fundamental es:

- los eventos poseen una posición espacial;
- el vehículo posee una posición y una velocidad;
- un evento ocurre cuando el vehículo alcanza su posición.

Si el vehículo frena, tarda más en llegar al evento siguiente.

Si acelera, llega antes.

Si se detiene, el tiempo musical espacial también se detiene.

---

## 4. Regla fundamental

La regla que debería mantenerse durante todo el diseño es:

> **La música está fija en el espacio. El tiempo depende de la velocidad con la que se recorre ese espacio.**

Esto diferencia OUTSYNTH de:

- cambiar el playback rate de una canción;
- automatizar el BPM de un DAW;
- mover un playhead tradicional más rápido o más lento;
- usar un videojuego simplemente como visualización de una secuencia preexistente.

Los objetos musicales no se desplazan sobre una timeline.

El vehículo se desplaza hacia ellos.

---

## 5. Primera representación: bicicleta / vista cenital

La primera representación imaginada fue una bicicleta o vehículo visto desde arriba recorriendo una pista.

La pista podía ser:

- dibujada;
- elegida entre circuitos predeterminados;
- un óvalo;
- un circuito de carreras;
- una ruta;
- una serpentina;
- un loop.

La idea inicial era que una pista con varios carriles pudiera funcionar como un secuenciador con varios tracks.

Por ejemplo:

```text
TRACK 1   ·   ●   ·   ●   ·   ●   ·   ●
TRACK 2   ·   ·   ▲   ·   ·   ▲   ·   ·
TRACK 3   x x x x x x x x x x x x x x x
TRACK 4   ───────████────────████────────

                     🚲
```

El eje longitudinal representa la posición dentro de la composición.

El eje transversal representa tracks, instrumentos o zonas musicales.

El vehículo es el playhead.

---

## 6. De reproducir a componer manejando

Una evolución importante de la idea fue descartar que los objetos debieran estar necesariamente generados de antemano.

El usuario puede construir la secuencia mientras conduce.

La pista puede comenzar vacía.

Mientras maneja, deposita eventos musicales sobre ella.

Después, al completar la vuelta y volver a atravesar esos lugares, los eventos vuelven a sonar.

Esto convierte la experiencia en una mezcla de:

- conducción;
- secuenciador;
- looper;
- instrumento;
- paisaje audiovisual.

La primera vuelta puede ser composición.

Las siguientes vueltas son simultáneamente reproducción, interpretación y overdub.

---

## 7. Cuantización espacial

Para que la conducción no requiera una precisión imposible, los eventos no se almacenan exactamente donde el usuario pulsa el control.

Se cuantizan a una grilla espacial.

Ejemplo:

```text
1 beat = 4 metros

input:      10.7 m
               ↓
quantize:   12.0 m
               ↓
             ●
```

La cuantización ocurre en distancia, no en tiempo.

Esto permite que la persona toque de manera aproximada mientras maneja y que el resultado conserve una estructura musical clara.

La grilla puede existir internamente sin mostrarse explícitamente en pantalla.

---

## 8. Escritura y reproducción son cosas distintas

Una decisión importante surgió al discutir qué ocurre cuando el vehículo cambia de carril.

La solución más sólida es separar:

### Reproducción

Todos los tracks pueden reproducir sus eventos cuando el vehículo alcanza su posición longitudinal.

### Escritura

El carril o zona en la que está actualmente el vehículo determina en qué track se escribe un nuevo evento.

Por ejemplo:

```text
                       posición actual
                             ↓
KICK    ═══●══════●══════════●════════●══
SNARE   ═══════▲═════════════▲═══════════
HAT     ══x══x══x══x══x══x══x══x══x══x═
SYNTH   ═════◆══════════════════◆════════
                             🚗
```

Aunque el vehículo esté en HAT, al alcanzar esa posición pueden sonar simultáneamente eventos de KICK, SNARE y HAT.

Por lo tanto:

> **El carril actual determina dónde escribís. El paisaje completo determina qué escuchás.**

---

## 9. Los carriles como tracks

Una versión inicial simple podría utilizar cuatro carriles:

```text
Carril 1 → Kick
Carril 2 → Snare
Carril 3 → Hi-hat
Carril 4 → Synth
```

Cambiar de track deja de ser seleccionar una fila con el mouse.

Para escribir en otro instrumento hay que conducir hacia él.

Eso transforma el movimiento lateral en parte de la performance.

Sin embargo, visualmente los tracks no necesitan parecer cuatro líneas de un DAW.

Internamente pueden ser lanes discretos, mientras que visualmente pueden representarse como zonas del paisaje.

Por ejemplo:

```text
zona A | zona B | zona C | zona D
```

La interfaz puede aplicar una pequeña asistencia o magnetismo para que el vehículo tienda al centro de cada zona.

---

## 10. DROP

La operación fundamental de composición debería ser extremadamente simple.

Una hipótesis fuerte para una primera versión:

```text
↑ / ↓       acelerar / frenar
← / →       desplazamiento lateral
SPACE       tocar / grabar evento
```

No es necesario comenzar con `1 2 3 4`.

El carril ya selecciona el instrumento.

`SPACE` ejecuta el evento correspondiente al carril actual y lo almacena cuantizado en la grilla espacial.

### Feedback inmediato

Aunque el evento quede almacenado para futuras vueltas, debería escucharse inmediatamente cuando se pulsa SPACE.

Esto mantiene la relación gesto-sonido propia de un instrumento.

La secuencia sería:

1. el usuario pulsa SPACE;
2. el sonido ocurre inmediatamente;
3. la posición se cuantiza;
4. el evento queda almacenado;
5. en vueltas posteriores vuelve a sonar cuando el vehículo alcanza esa posición.

### Toggle

Si se intenta colocar nuevamente un evento en una celda ya ocupada, una posibilidad simple es eliminarlo.

```text
celda vacía + SPACE    → crear
celda ocupada + SPACE  → borrar
```

Esto evita inicialmente un modo de borrado separado.

---

## 11. El loop espacial

Una vez completado el circuito, el vehículo vuelve al comienzo.

Los objetos colocados permanecen.

La carretera funciona como un loop musical físico.

Primera vuelta:

```text
CARRIL 1   ─────●────────────●─────────
CARRIL 2   ──────────▲─────────────────
CARRIL 3   ───────────────■────■────────
CARRIL 4   ─────────────────────────────
```

Segunda vuelta:

los eventos anteriores suenan y el usuario puede agregar otros.

La composición se construye acumulativamente mediante vueltas.

---

## 12. Random

La generación aleatoria puede existir, pero no parece conveniente como experiencia principal inicial.

Posibles modos futuros:

### EMPTY

Circuito vacío. Todo es construido por el usuario.

### GENERATE

Se genera un paisaje/secuencia inicial.

### MUTATE

En cada vuelta se altera un porcentaje de los eventos.

Para la primera exploración, la opción más fuerte es:

> **vacío + conducción + drop cuantizado**

porque hace que la relación entre acción y composición sea completamente legible.

---

## 13. DRIVE SOUND

Otra evolución importante fue separar los eventos almacenados del sonido producido directamente por el vehículo.

El vehículo puede ser simultáneamente:

- playhead;
- cursor de escritura;
- instrumento.

Se propone una capa opcional:

```text
DRIVE SOUND [ON/OFF]
```

Cuando está activada, el vehículo produce un sonido continuo relacionado con la zona o carril que ocupa.

Esto genera dos sistemas paralelos:

### LANDSCAPE

Eventos grabados y distribuidos espacialmente.

### DRIVE

Sonido interpretado en tiempo real por el vehículo.

---

## 14. Carriles como notas

En un preset melódico, los carriles pueden corresponder a notas.

Por ejemplo:

```text
ROOT: C
SCALE: minor pentatonic

Carril 1 → C
Carril 2 → Eb
Carril 3 → G
Carril 4 → Bb
```

Con DRIVE SOUND activado, cambiar de carril equivale a tocar distintas notas.

```text
C3       Eb3       G3       Bb3
 ╲        ╲        ╲        ╲
  ╲        ╲        ╲        ╲
   ╲        ╲   🚗   ╲        ╲
```

Moverse lateralmente deja de ser solamente steering.

También es interpretación melódica.

Podría existir un pequeño glide o portamento entre carriles para que la transición sonora acompañe físicamente el desplazamiento.

---

## 15. Velocidad y timbre

La velocidad ya tiene una función estructural fundamental: determina la velocidad con la que se atraviesa la secuencia.

Puede también controlar un parámetro tímbrico del DRIVE SOUND, pero conviene evitar que controle demasiadas cosas simultáneamente.

Una hipótesis simple:

```text
carril    → pitch
velocidad → timbre / apertura de filtro
```

A baja velocidad, el synth puede sonar más oscuro.

Al acelerar, puede abrirse progresivamente.

La velocidad entonces tiene una consecuencia musical estructural y una consecuencia tímbrica perceptible, sin saturar el sistema de mappings.

---

## 16. Modo SOLO / carril audible

Se discutió también una variante donde solamente suena el carril que está ocupando el vehículo.

En ese modo, cambiar lateralmente podría actuar como:

- solo;
- mute;
- crossfader;
- selector de capas.

Si el vehículo se encuentra entre dos lanes, podría incluso existir un crossfade entre ambos.

Sin embargo, esto parece más apropiado como modo secundario.

Para la lógica principal:

> todos los tracks reproducen; el carril determina la escritura.

---

## 17. Cambio visual decisivo: pseudo-3D

La vista cenital o lateral tiene un problema: puede hacer que OUTSYNTH se perciba inmediatamente como un secuenciador lineal disfrazado.

Por eso aparece una nueva dirección visual:

> **un juego de conducción pseudo-3D, con cámara detrás del vehículo y sprites que se aproximan desde el horizonte.**

La gramática visual toma como referencia los juegos arcade de conducción de los años 80/90, especialmente la lógica de carretera en perspectiva tipo *OutRun* o *Super Hang-On*.

No necesariamente su estética literal.

La cámara:

- vehículo en la zona inferior;
- horizonte arriba;
- carretera convergiendo hacia un punto de fuga;
- objetos pequeños en la distancia;
- sprites que aumentan de tamaño al acercarse.

Conceptualmente:

```text
                    HORIZONTE
                       ·
                    ╱  │  ╲
                  ╱    ●    ╲
                ╱  ▲       x  ╲
              ╱       ●         ╲
            ╱  x          ◆       ╲
          ╱_________________________╲
                    🚗
```

---

## 18. Ver venir la música

Esta representación introduce una cualidad fundamental:

> **los eventos musicales se ven venir.**

Un objeto almacenado aparece pequeño en el horizonte.

A medida que el vehículo se acerca:

```text
· → • → ● → ⬤ → BOOM
```

Cuando alcanza la posición de trigger, suena y pasa hacia atrás.

La perspectiva comunica visualmente la distancia restante hasta el próximo evento.

A mayor velocidad, los objetos se aproximan más rápidamente.

La transformación temporal se vuelve visible sin necesidad de mostrar un BPM.

---

## 19. Star Guitar

Una referencia conceptual importante es el video de **“Star Guitar” de The Chemical Brothers**, dirigido por Michel Gondry.

En ese trabajo, elementos del paisaje ferroviario se sincronizan con distintas capas musicales:

- postes;
- edificios;
- estructuras;
- árboles;
- infraestructura;
- elementos de distintas profundidades.

El paisaje funciona como representación visual de una música cuyo tiempo ya está determinado.

OUTSYNTH invierte parcialmente esa relación.

En OUTSYNTH:

> el paisaje contiene la composición, pero el usuario determina cómo transcurre el tiempo al recorrerla.

Un poste puede representar un hi-hat.

Un cartel puede representar un kick.

Una estructura puede representar un synth.

Pero si el vehículo frena antes de alcanzarlo, ese evento todavía no ocurre.

La relación deja de ser solamente audiovisual y pasa a ser performativa.

---

## 20. Los eventos como paisaje

Una decisión visual importante es evitar representar los eventos como cuadrados, notas MIDI o botones flotantes.

Los eventos pueden convertirse en elementos del mundo.

Ejemplos conceptuales:

```text
kick   → cartel / edificio / objeto grande
snare  → poste / árbol / estructura
hat    → cono / baliza / poste pequeño repetitivo
synth  → luz / arquitectura / elemento continuo
```

No son asociaciones definitivas.

La regla importante es:

> **la secuencia se materializa como paisaje.**

Así, el usuario no ve una timeline musical.

Ve el mundo que construyó.

---

## 21. Visualización del DROP en perspectiva

En una cámara mirando hacia adelante aparece un problema: al pulsar SPACE, el lugar exacto donde se realizó la acción puede quedar inmediatamente detrás del vehículo.

Una solución visual propuesta es que el evento sea proyectado hacia adelante y haga snap al próximo punto cuantizado.

```text
SPACE

🚗  ✦──────────────→ ●
                     ↑
               posición cuantizada
```

Esto tiene varias ventajas:

- produce feedback visual inmediato;
- muestra que existe cuantización;
- evita enseñar una grilla;
- refuerza la estética arcade;
- hace visible dónde quedará almacenado el evento.

---

## 22. La perspectiva como representación del tempo

La pseudo-perspectiva también permite comprender la relación velocidad/ritmo sin números.

A baja velocidad:

```text
🌴.................🌴.................🌴
```

A mayor velocidad:

```text
🌴....🌴....🌴....🌴....🌴
```

Sonoramente:

```text
tic..........tic..........tic
```

pasa a:

```text
tic....tic....tic....tic
```

y después:

```text
tic-tic-tic-tic-tic
```

La densidad espacial permanece igual.

Lo que cambia es la velocidad con la que esa densidad es atravesada.

---

## 23. Pistas y circuitos

La composición puede ocurrir sobre circuitos prediseñados.

Posibles formas:

- recta circular/infinita;
- óvalo;
- circuito de carreras;
- curvas amplias;
- serpentina;
- ruta abstracta;
- diferentes longitudes de loop.

La geometría puede afectar indirectamente la música.

Por ejemplo, si una curva obliga a reducir la velocidad, también provoca una desaceleración musical.

Esto es interesante porque el cambio de tempo no ocurre mediante un control musical explícito.

Ocurre como consecuencia de conducir.

---

## 24. Geometría como composición

En etapas posteriores, la forma del circuito puede convertirse en un parámetro compositivo.

Una recta permite mantener velocidad.

Una curva puede exigir desaceleración.

Una subida podría afectar la aceleración.

Una zona difícil podría generar irregularidades temporales.

De este modo:

> **la arquitectura de la pista puede convertirse en arquitectura temporal.**

Sin embargo, esto no debería complicar el primer prototipo.

---

# Primera revisión por comité

Se planteó un comité de tres perfiles:

### Experto 1 — Diseño de interacción / videojuegos

Evalúa:

- controles;
- aprendizaje;
- feedback;
- legibilidad;
- diversión;
- sensación de conducción.

### Experto 2 — Instrumentos musicales / secuenciadores

Evalúa:

- coherencia musical;
- comportamiento del clock;
- cuantización;
- interpretación;
- expresividad;
- relación entre gesto y sonido.

### Experto 3 — Arte digital / visualización

Evalúa:

- identidad visual;
- relación paisaje-sonido;
- representación espacial;
- autonomía conceptual respecto de un DAW tradicional.

---

## 25. Primera conclusión del comité: identidad

El proyecto no debería presentarse como:

> “un secuenciador con un auto”.

La experiencia debería entenderse como:

> **manejar por una ruta musical que uno mismo construye.**

La interfaz inicial debería ser mínima.

Idealmente:

```text
↑ acelerar
↓ frenar
← → moverse
SPACE colocar
```

La complejidad musical aparece mediante la interacción y no mediante un panel de configuración inicial.

---

## 26. Segunda conclusión: tiempo espacial

El comité considera esencial no abandonar la regla:

> **La música está fija en el espacio. El tiempo depende del movimiento.**

Los objetos deben conservar coordenadas espaciales estables.

No deberían desplazarse dinámicamente para satisfacer un BPM global.

El BPM, si se muestra, es una lectura derivada y secundaria.

---

## 27. Tercera conclusión: carriles

Los carriles son útiles internamente porque permiten organizar tracks.

Pero visualmente no deberían necesariamente parecer pistas de un secuenciador.

Pueden convertirse en zonas del paisaje.

La conducción lateral tiene entonces una doble función:

- navegación;
- selección del lugar/instrumento donde se escribe.

---

## 28. Cuarta conclusión: DROP

Para una primera versión:

> **SPACE = trigger + record toggle cuantizado.**

El gesto produce sonido inmediato y almacena un evento espacial.

La interfaz debe mostrar visualmente el snap hacia la grilla sin necesidad de revelar una timeline.

---

## 29. Quinta conclusión: DRIVE SOUND

El sonido continuo del vehículo es valioso, pero debe permanecer conceptualmente separado del paisaje grabado.

Dos capas:

```text
LANDSCAPE = memoria / loop / secuencia
DRIVE     = interpretación presente
```

Esta separación permite que la persona toque sobre su propia secuencia mientras la recorre.

---

## 30. Sexta conclusión: los primeros 90 segundos

La experiencia inicial imaginada es:

1. aparece una carretera vacía;
2. el usuario acelera;
3. pulsa SPACE;
4. escucha inmediatamente un sonido;
5. ve cómo un objeto se incorpora al mundo;
6. cambia de carril;
7. coloca otros sonidos;
8. continúa conduciendo;
9. completa la vuelta;
10. los objetos creados comienzan a aparecer nuevamente desde el horizonte;
11. los atraviesa;
12. vuelven a sonar;
13. frena;
14. escucha cómo toda la secuencia se estira;
15. acelera;
16. escucha cómo se comprime.

El momento fundamental es el reconocimiento:

> “Eso que viene hacia mí lo puse yo.”

Ahí se comprende el instrumento sin una explicación extensa.

---

# Segunda revisión integral del comité

Después de reconstruir la idea completa desde su origen, el comité vuelve a evaluarla.

---

## 31. Experto 1 — Interacción / videojuegos

### Lo que funciona

La evolución hacia pseudo-3D mejora mucho la propuesta.

La vista cenital explicaba el sistema, pero la perspectiva desde atrás permite **experimentarlo antes de entenderlo analíticamente**.

Eso es valioso.

La conducción no debe ser una simulación automovilística compleja.

OUTSYNTH necesita controles suficientemente físicos para sentir aceleración, inercia y desplazamiento, pero suficientemente simples para que la atención permanezca en el sonido.

### Riesgo

Si conducir requiere demasiada habilidad, la composición se vuelve frustrante.

Si conducir no requiere ninguna habilidad, el vehículo se convierte en un cursor decorativo.

### Recomendación

Buscar una conducción arcade mínima:

- aceleración progresiva;
- desaceleración;
- inercia leve;
- desplazamiento lateral;
- asistencia hacia lanes;
- curvas simples.

El desafío no debería ser “no chocar”.

El desafío debería ser **habitar musicalmente la velocidad y el espacio**.

---

## 32. Experto 2 — Instrumento / secuenciador

### Lo más original

El elemento más fuerte no es la estética del auto.

Tampoco los carriles.

Tampoco la referencia arcade.

Es la sustitución:

> **tiempo absoluto → distancia recorrida**

Eso debe gobernar toda decisión técnica y musical.

### Consecuencia importante

No debería existir un reloj musical independiente que continúe avanzando cuando el vehículo se detiene.

La posición musical debe derivarse de la posición espacial.

### Cuantización

La cuantización debe ser una operación sobre posición:

```text
posición física → celda espacial más cercana
```

y no:

```text
momento del input → beat temporal más cercano
```

### DRIVE SOUND

Es una segunda capa muy prometedora porque permite improvisar sobre el material almacenado.

Sin embargo, debería poder apagarse completamente para conservar la experiencia pura de secuenciador espacial.

---

## 33. Experto 3 — Arte digital / representación

### Lo más potente

OUTSYNTH puede esconder un secuenciador dentro de un paisaje.

Eso produce una inversión perceptiva interesante.

Al principio:

> estoy manejando.

Después:

> estos objetos producen sonidos.

Después:

> estos objetos son una secuencia.

Finalmente:

> yo construí la secuencia que ahora estoy atravesando.

Ese descubrimiento progresivo debería ser parte de la obra.

### Riesgo estético

Una estética demasiado literalmente *OutRun* puede convertir el proyecto en nostalgia synthwave.

La referencia debería ser estructural:

- pseudo-3D;
- sprite scaling;
- punto de fuga;
- objetos acercándose;
- carretera segmentada;
- velocidad visual.

No necesariamente:

- palmeras;
- Ferrari;
- sunset;
- neón rosa;
- estética Miami.

OUTSYNTH necesita desarrollar su propio universo visual.

---

# 34. Consenso integral

Después de revisar toda la evolución, los tres perfiles coinciden en la siguiente definición:

> **OUTSYNTH es un instrumento y secuenciador espacial presentado como un entorno de conducción pseudo-3D. El usuario recorre una carretera cuya distancia funciona como eje musical. Su velocidad determina el tempo resultante. Mientras conduce puede depositar eventos cuantizados en distintas zonas de la pista; estos eventos se materializan como elementos del paisaje y vuelven a sonar cada vez que son atravesados en vueltas posteriores. Opcionalmente, el vehículo funciona además como un sintetizador continuo controlado por su posición lateral y su velocidad.**

---

# 35. Principios que conviene conservar

## 1. El espacio es la partitura

La composición se almacena en posiciones, no en segundos.

## 2. El vehículo es el playhead

No existe un cursor temporal independiente del movimiento.

## 3. La velocidad produce el tempo

No es simplemente una animación vinculada al BPM.

## 4. La grilla es espacial

La cuantización ocurre en metros/unidades de recorrido.

## 5. El paisaje es memoria

Los eventos previamente grabados permanecen en el mundo.

## 6. Conducir también es editar

Para cambiar de track hay que desplazarse físicamente.

## 7. La interfaz debe poder aprenderse jugando

Los controles iniciales deben ser mínimos.

## 8. La representación no debería parecer un DAW

La estructura de secuenciador puede permanecer parcialmente oculta.

## 9. La velocidad debe escucharse y verse

El cambio temporal tiene que sentirse simultáneamente en sonido y movimiento.

## 10. DRIVE y LANDSCAPE son sistemas diferentes

Uno representa el presente performativo; el otro, la memoria espacial.

---

# 36. Hipótesis de primera versión conceptual

Sin entrar todavía en implementación, una primera experiencia podría limitarse a:

### Mundo

- un circuito cerrado;
- pseudo-3D;
- cuatro zonas/carriles;
- paisaje inicialmente vacío.

### Vehículo

- acelerar;
- frenar;
- moverse lateralmente.

### Música

- cuatro instrumentos;
- una grilla espacial;
- eventos cuantizados;
- reproducción de todos los tracks.

### Grabación

- SPACE dispara el sonido;
- SPACE almacena el evento;
- mismo punto + SPACE elimina.

### Loop

- completar circuito;
- volver a encontrar los eventos;
- continuar agregando y quitando.

### DRIVE

- ON/OFF;
- cuatro notas o pitches;
- lane → pitch;
- velocidad → un parámetro tímbrico.

### Visual

- los eventos se convierten en sprites/elementos del paisaje;
- aparecen desde el horizonte;
- aumentan de tamaño al acercarse;
- reaccionan visualmente cuando suenan.

---

# 37. Cosas deliberadamente postergadas

No son malas ideas. Simplemente no son necesarias para comprobar el núcleo.

- generación random;
- mutaciones automáticas;
- edición con mouse;
- circuitos dibujables;
- múltiples samples por lane;
- MIDI;
- efectos individuales por objeto;
- automatizaciones;
- cambios de escala durante la vuelta;
- múltiples vehículos;
- multiplayer;
- obstáculos complejos;
- colisiones realistas;
- físicas automovilísticas;
- editor visual tradicional;
- diferentes profundidades de paisaje con mappings complejos;
- estructuras polirrítmicas avanzadas;
- exportación;
- sincronización externa.

---

# 38. Preguntas abiertas

Todavía conviene experimentar conceptualmente con:

### ¿Cuántos lanes?

Cuatro parece un buen comienzo, pero no necesariamente es definitivo.

### ¿Qué significa exactamente una vuelta?

Puede ser un circuito visual real o una longitud abstracta que vuelve al comienzo.

### ¿Qué ocurre al detenerse?

La hipótesis actual es que la secuencia se detiene completamente.

### ¿Se puede ir hacia atrás?

Esto podría producir reproducción inversa espacial, pero cambia bastante la lógica y debería evaluarse aparte.

### ¿Cómo se representan eventos simultáneos?

Deben ser legibles sin convertir el paisaje en una grilla explícita.

### ¿Qué ocurre con eventos muy densos?

La perspectiva puede saturarse visualmente.

### ¿Qué forma tiene un sonido largo?

Puede ser una estructura extendida espacialmente en vez de un sprite puntual.

### ¿Cómo se borra?

El toggle mediante SPACE es la hipótesis más simple, pero debe probarse.

### ¿Cómo se seleccionan presets?

Conviene mantener esta configuración fuera del flujo principal de conducción.

### ¿Cómo se comunica MPB?

Probablemente como dato secundario o incluso oculto al comienzo.

---

# 39. Una posibilidad importante: duración espacial

Hasta ahora la mayoría de los eventos se pensaron como puntos.

Pero la lógica espacial permite también eventos con longitud.

Por ejemplo:

```text
evento puntual

──────●────────────
```

frente a:

```text
evento sostenido

──────████████──────
```

Un synth pad podría comenzar cuando el vehículo entra en una zona y terminar cuando sale.

Esto permite traducir naturalmente:

- notas sostenidas;
- drones;
- filtros;
- texturas;
- samples largos.

La duración musical también puede expresarse como distancia.

---

# 40. Otra consecuencia: silencio como distancia

En un secuenciador tradicional, el silencio es tiempo vacío.

En OUTSYNTH, el silencio es **territorio vacío**.

Una gran distancia sin objetos produce una espera.

A alta velocidad puede durar poco.

A baja velocidad puede convertirse en un silencio largo.

Esto refuerza la idea de que la composición es geográfica.

---

# 41. Densidad

La densidad de objetos por unidad de distancia equivale aproximadamente a densidad de eventos musicales.

Una región cargada de elementos puede producir una sección rítmicamente intensa.

Una región vacía puede producir una pausa.

Por lo tanto, visualmente puede existir una correspondencia directa entre:

> densidad del paisaje ↔ densidad musical

sin necesidad de un analizador de audio.

---

# 42. El circuito como memoria visible

Una característica particularmente interesante es que el usuario puede observar progresivamente el resultado de sus decisiones anteriores.

El paisaje no es decorativo.

Es memoria.

Cada objeto dice:

> acá hiciste algo.

En vueltas sucesivas el circuito se convierte en un registro visible de la performance.

La composición se acumula como arquitectura.

---

# 43. Diferencia respecto de un juego musical tradicional

OUTSYNTH no debería funcionar principalmente como un juego de precisión donde hay que acertar notas preexistentes.

No hay necesariamente:

- score;
- combo;
- perfect;
- miss;
- objetivo de ganar;
- secuencia que copiar.

El usuario construye el sistema que después interpreta.

La lógica es más cercana a un instrumento que a un rhythm game.

La estética puede ser de videojuego sin que la estructura sea competitiva.

---

# 44. Diferencia respecto de un DAW

Un DAW normalmente presenta:

```text
X = tiempo
Y = tracks
```

OUTSYNTH conserva parcialmente esa estructura abstracta, pero la encarna en un mundo navegable.

```text
X / profundidad = distancia recorrida
Y / lateralidad = zonas o tracks
velocidad = tasa de lectura
```

La diferencia importante es que la posición temporal no avanza automáticamente.

Hay que producirla mediante movimiento.

---

# 45. Diferencia respecto de Star Guitar

En *Star Guitar*:

```text
música preexistente
       ↓
paisaje organizado para representarla
```

En OUTSYNTH:

```text
usuario construye paisaje
       ↓
paisaje almacena eventos
       ↓
usuario lo recorre
       ↓
movimiento produce temporalidad
       ↓
paisaje se convierte en música
```

Es un sistema circular e interactivo.

---

# 46. Frases conceptuales de trabajo

No necesariamente son nombres o textos finales, pero ayudan a condensar el proyecto.

> **La música está fija. Vos te movés a través de ella.**

> **El espacio es la partitura.**

> **La velocidad es el tempo.**

> **El paisaje es la secuencia.**

> **Conducir es reproducir.**

> **Conducir también es componer.**

> **No ves pasar una canción: construís una ruta y después manejás a través de ella.**

---

# 47. Nombre de trabajo

## OUTSYNTH

El nombre queda por ahora como nombre de proyecto.

Puede remitir simultáneamente a:

- conducción arcade;
- síntesis;
- salida;
- exterior;
- desplazamiento;
- instrumento.

No es necesario cerrar todavía una interpretación única.

---

# 48. Criterio para el futuro prototipo

Antes de agregar features, una primera prueba debería responder solamente algunas preguntas:

1. ¿Es divertido acelerar y desacelerar una secuencia espacial?
2. ¿Se entiende que los objetos están fijos y uno se mueve hacia ellos?
3. ¿Es natural cambiar de lane para escribir en distintos instrumentos?
4. ¿La cuantización permite tocar sin frustración?
5. ¿Es satisfactorio reencontrar en la siguiente vuelta los objetos que uno creó?
6. ¿La perspectiva permite anticipar auditivamente lo que está por ocurrir?
7. ¿El paisaje logra funcionar como representación de la composición?
8. ¿DRIVE SOUND suma interpretación o distrae del concepto principal?
9. ¿Se siente como un instrumento y no solamente como un juguete visual?
10. ¿La experiencia sigue siendo interesante sin menús, score ni objetivos externos?

Si esas preguntas funcionan, el resto puede crecer alrededor.

---

## Estado actual

La idea queda, por ahora, definida como un **instrumento/secuenciador espacial conducible**, construido alrededor de una regla extremadamente simple:

> **Los sonidos ocupan lugares. El vehículo ocupa una posición. La música ocurre al recorrer la distancia entre ellos.**

La siguiente etapa no necesita todavía ampliar el sistema.

Necesita comprobar esa regla.

---

# 49. Desarrollo

La implementación comenzó. El stack elegido es:

- **JavaScript vanilla** (ES Modules, sin frameworks)
- **Canvas 2D** para rendering pseudo-3D
- **Web Audio API** para audio espacial (samples + oscillators)
- **YAML** para toda la configuración (themes, sonidos, pistas, vehículos)

### Principio técnico

> **El código JS es el motor. El YAML es el contenido.**

Todo lo que define la experiencia visual y sonora vive en archivos YAML configurables. Esto permite crear themes ("épocas"), kits de sonido, y circuitos sin tocar código.

### Decisiones de diseño confirmadas

| Aspecto | Decisión |
|---------|----------|
| Audio | Híbrido: samples (mp3) para percusión + Web Audio oscillators para synth |
| Geometría | Curvas suaves desde el inicio |
| Inicio | Pantalla mínima → "press any key" |
| Loop | Pórtico/arco visible + efecto visual/sonoro |
| Estética | Minimalista para arrancar, configurable vía YAML |
| Vehículo | Reconocible (no un punto), configurable |

### Documentación técnica

- `DEVELOPMENT.md` — arquitectura, módulos, estructura del proyecto
- `CONFIG_REFERENCE.md` — referencia completa de configuración YAML
- `config/` — archivos YAML de configuración

### Fases de desarrollo

1. **Fase 0 — Fundación** ✅ (game loop, config YAML, state machine, input)
2. **Fase 1 — Motor Pseudo-3D** (carretera, sprites, vehículo)
3. **Fase 2 — Audio Espacial** (scheduler por posición, samples, DRIVE SOUND)
4. **Fase 3 — Experiencia** (onboarding, feedback, polish)

### Cómo correr

```bash
cd outsynth
npm run dev
# → http://localhost:8080
```
