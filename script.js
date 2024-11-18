//cuadro por segundo
const FPS = 30
// coeficiente de fricción del espacio (0 = sin fricción, 1 = mucha fricción)
const friction = 0.7
// número inicial de vidas
const gameLives = 3
// la distancia máxima que el láser puede recorrer es una fracción del ancho de la pantalla
const laserDist = 0.6
// duración de la explosión del láser en segundos
const laserExplodeDur = 0.1
// número máximo de láseres en pantalla a la vez
const laserMax = 10
// velocidad de los láseres en píxeles por segundo
const laserSPD = 500
// coeficiente de fricción del espacio (0 = sin fricción, 1 = mucha fricción)
const roidJAG = 0.4
// puntos anotados por un gran asteroide
const roidPtsLge = 20
// puntos obtenidos por un asteroide mediano
const roidPtsMed = 50
// puntos anotados por un pequeño asteroide
const roidPtsSml = 100
//número inicial de asteroides
const roidsNum = 3
//Tamaño inicial de los asteroides en píxeles por segundo.
const roidsSize = 100
//velocidad inicial máxima de los asteroides en píxeles por segundo
const roidsSPD = 50
//número promedio de vértices en cada asteroide
const roidsVert = 10
// guarda la clave para el almacenamiento local de la puntuación más alta
const saveKeyScore = "highscore"
// duración en segundos de un solo parpadeo durante la invisibilidad del barco
const shipBlinkDur = 0.1
// duración de la explosión del barco en segundos
const shipExplodeDur = 0.3
// duración de la invisibilidad del barco en segundos
const shipInvDur = 3
//altura del barco en píxeles
const shipSize = 30
//aceleración de la nave en píxeles por segundo
const shipThrust = 5
//velocidad de giro en grados por segundo
const shipTurnSPD = 360
// mostrar u ocultar el límite de colisión
const showBounding = false
// muestra u oculta el punto central del barco
const showCentreDot = false
const musicOn = true
const soundOn = true
// tiempo de desvanecimiento del texto en segundos
const textFadeTime = 2.5
// altura de la fuente del texto en píxeles
const textSize = 40

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas")
var ctx = canv.getContext("2d")

// configurar efectos de sonido
var fxExplode = new Sound("sounds/explode.m4a")
var fxHit = new Sound("sounds/hit.m4a", 5)
var fxLaser = new Sound("sounds/laser.m4a", 5, 0.5)
var fxThrust = new Sound("sounds/thrust.m4a")

// configura la música
var music = new Music("sounds/music-low.m4a" , "sounds/music-high.m4a")
var roidsLeft, roidsTotal

// configura los parámetros del juego
var level, lives, roids, score, scoreHigh, ship, text, textAlpha
newGame()

//configurar controladores de eventos
document.addEventListener("keydown" , keyDown)
document.addEventListener("keyup" , keyUp)

//Configuracion del bucle del juego
setInterval(update, 1000 / FPS)

function createAsteroidBelt() {
    roids = []
    roidsTotal = (roidsNum + level) * 7
    roidsLeft = roidsTotal
    var x, y
    for (var i = 0; i < roidsNum + level; i ++){
        // ubicación aleatoria del asteroide (sin tocar la nave espacial)
        do {
            x = Math.floor(Math.random() * canv.width)
            y = Math.floor(Math.random() * canv.height)
        } while (distBetweenPoints(ship.x, ship.y, x, y) < roidsSize * 2 + ship.r)
        roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 2)))
    }
}

function destroyAsteroid(index) {
    var x = roids[index].x
    var y = roids[index].y
    var r = roids[index].r

    // divide el asteroide en dos si es necesario
    if (r == Math.ceil(roidsSize / 2)) {
        // gran asteroide
        roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 4)))
        roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 4)))
        score += roidPtsLge
    } else if (r == Math.ceil(roidsSize / 4)) {
        // asteroide mediano
        roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 8)))
        roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 8)))
        score += roidPtsMed
    } else {
        score += roidPtsSml
    }
    // comprobar la puntuación más alta
    if (score > scoreHigh) {
        scoreHigh = score
        localStorage.setItem(saveKeyScore, scoreHigh)
    }

    // destruir el asteroide
    roids.splice(index, 1)
    fxHit.play()

    // calcula la proporción de asteroides restantes para determinar el tiempo de la música
    roidsLeft--
    music.setAsteroidRatio(roidsLeft / roidsTotal)

    // nuevo nivel cuando no haya más asteroides
    if (roids.length == 0) {
        level++
        newLevel()
    }
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function drawShip(x, y, a, colour = "white") {
    ctx.strokeStyle = colour
    ctx.lineWidth = shipSize / 20
    ctx.beginPath()
    ctx.moveTo(
        //nariz del barc
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    )
    ctx.lineTo(
        // trasera izquierda
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    )
    ctx.lineTo(
        //trasera derecha
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    )
    ctx.closePath()
    ctx.stroke()
}

function explodeShip() {
    ship.explodeTime = Math.ceil(shipExplodeDur * FPS)
    fxExplode.play()
}

function gameOver() {
    ship.dead = true
    text = "Game Over"
    textAlpha = 1.0
}

function keyDown(/** @type {KeyboardEvent} */ ev) {

    if (ship.dead) {
        return
    }

    switch (ev.keyCode) {
        // barra espaciadora (disparar láser)
        case 32:
            shootLaser()
            break;
        // flecha izquierda (girar el barco hacia la izquierda)
        case 37:
            ship.rot = shipTurnSPD / 180 * Math.PI / FPS
            break;

        //flecha hacia arriba (empujar el barco hacia adelante)
        case 38:
            ship.thrusting = true
            break;

        //flecha derecha (barco rotar hacia la derecha)
        case 39:
            ship.rot = -shipTurnSPD / 180 * Math.PI / FPS
            break;
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {

    if (ship.dead) {
        return
    }

    switch (ev.keyCode) {
        // barra espaciadora (permitir disparar nuevamente)
        case 32:
            ship.canShoot = true
            break;
        //flecha izquierda (dejar de girar hacia la izquierda)
        case 37:
            ship.rot = 0
            break;

        //flecha hacia arriba (dejar de empujar)
        case 38:
            ship.thrusting = false
            break;

        //flecha derecha (bdejar de girar hacia la derecha)
        case 39:
            ship.rot = 0
            break;
    }
}

function newAsteroid(x, y, r) {
    var lvlMult = 1 + 0.1 * level
    var roid = {
        x : x,
        y : y,
        xv : Math.random() * roidsSPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv : Math.random() * roidsSPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        //en radianes
        a : Math.random() * Math.PI * 2,
        r : r,
        offs: [],
        vert : Math.floor(Math.random() * (roidsVert + 1) + roidsVert / 2),
    }
    // completa la matriz de compensaciones
    for (var i = 0; i < roid.vert; i++) {
        roid.offs.push(Math.random() * roidJAG * 2 + 1 - roidJAG)
    }
    return roid
}

function newGame() {
    level = 0
    lives = gameLives
    score = 0
    ship = newShip()

    // obtener la puntuación más alta del almacenamiento local
    var scoreStr = localStorage.getItem(saveKeyScore)
    if (scoreStr == null) {
        scoreHigh = 0
    } else {
        scoreHigh = parseInt(scoreStr)
    }
    newLevel()
}

function newLevel() {
    music.setAsteroidRatio(1)
    text = "Level " + (level + 1)
    textAlpha = 1.0
    createAsteroidBelt()
}

function newShip() {
    return {
        x : canv.width / 2,
        y : canv.height / 2,
        //convertir en radianes
        a : 90 / 180 * Math.PI,
        r : shipSize / 2,
        blinkNum : Math.ceil(shipInvDur / shipBlinkDur),
        blinkTime : Math.ceil(shipBlinkDur * FPS),
        canShoot : true,
        dead : false,
        explodeTime : 0,
        lasers : [],
        rot : 0,
        thrusting : false,
        thrust : {
            x : 0,
            y : 0
        }
    }
}

function shootLaser() {
    //crea el objeto láser
    if (ship.canShoot && ship.lasers.length < laserMax) {
        ship.lasers.push({
            //desde la nariz del barco
            x : ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y : ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv : laserSPD * Math.cos(ship.a) / FPS,
            yv : -laserSPD * Math.sin(ship.a) / FPS,
            dist : 0,
            explodeTime : 0
        })
        fxLaser.play()
    }

    //evitar más disparos
    ship.canShoot = false
}

function Music(srcLow, srcHigh) {
    this.soundLow = new Audio(srcLow)
    this.soundHigh = new Audio(srcHigh)
    this.low = true
    // segundos por latido
    this.tempo = 1.0
    // fotogramas restantes hasta el siguiente tiempo
    this.beatTime = 0

    this.play = function () {
        if (musicOn) {
            if (this.low) {
                this.soundLow.play()
            } else {
                this.soundHigh.play()
            }
            this.low = !this.low
        }
    }

    this.setAsteroidRatio = function (ratio) {
        this.tempo = 1.0 - 0.75 * (1.0 - ratio)
    }

    this.tick = function () {
        if (this.beatTime == 0) {
            this.play()
            this.beatTime = Math.ceil(this.tempo * FPS)
        } else {
            this.beatTime--
        }
    }
}

function Sound(src, maxStreams = 1, vol = 1.0) {
    this.streamNum = 0
    this.streams = []
    for (var i = 0; i < maxStreams; i++) {
        this.streams.push(new Audio(src))
        this.streams[i].volume = vol
    }
    this.play = function () {
        if (soundOn) {
            this.streamNum = (this.streamNum + 1) % maxStreams
            this.streams[this.streamNum].play()
        }
    }
    this.stop = function () {
        this.streams[this.streamNum].pause()
        this.streams[this.streamNum].currentTime = 0
    }
}

function update() {
    var blinkOn = ship.blinkNum % 2 == 0
    var exploding = ship.explodeTime > 0

    // marca la música
    music.tick()

    //dibujar espacio
    ctx.fillStyle = "black"
    ctx.fillRect(0,0, canv.width, canv.height)

    //dibujar los asteroides
    var a, r, x, y, offs, vert
    for (var i = 0; i < roids.length; i++){
        ctx.strokeStyle = "slatergrey"
        ctx.lineWidth = shipSize / 20

        //obtener las propiedades del asteroide
        a = roids[i].a
        r = roids[i].r
        x = roids[i].x
        y = roids[i].y
        offs = roids[i].offs
        vert = roids[i].vert

        //dibujar un camino
        ctx.beginPath()
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a)
        )

        //dibujar polígono
        for (var j = 1; j < vert; j++){
            ctx.lineTo (
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
            )
        }
        ctx.closePath()
        ctx.stroke()

        // muestra el círculo de colisión del asteroide
        if (showBounding) {
            ctx.strokeStyle = "lime"
            ctx.beginPath()
            ctx.arc(x, y, r, 0, Math.PI * 2, false)
            ctx.stroke()
        }
    }

    //empujar el barco
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x += shipThrust * Math.cos(ship.a) / FPS
        ship.thrust.y -= shipThrust * Math.sin(ship.a) / FPS
        fxThrust.play()

        //dibuja el propulsor
        if (!explodeShip && blinkOn) {
            ctx.fillStyle = "red"
            ctx.strokeStyle = "yellow",
            ctx.lineWidth = shipSize / 10
            ctx.beginPath()
            ctx.moveTo(
                // trasera izquierda
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
            )
            // centro trasero (detrás del barco)
            ctx.lineTo(
                ship.x - ship.r * 5 / 3 * Math.cos(ship.a),
                ship.y + ship.r * 5 / 3 * Math.sin(ship.a),
            )
            // trasera derecha
            ctx.lineTo(
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
            )
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
        }
    } else  {
        // aplica fricción (ralentiza el barco cuando no está empujando)
        ship.thrust.x -= friction * ship.thrust.x / FPS
        ship.thrust.y -= friction * ship.thrust.y / FPS
        fxThrust.stop()
    }

    //dibuja el barco triangular
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a)
        }
        // manejar parpadeando
        if (ship.blinkNum > 0) {
            //reducir el tiempo de parpadeo
            ship.blinkTime--

            // reduce el número de parpadeo
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(shipBlinkDur * FPS)
                ship.blinkNum--
            }
        }
    } else {
        // dibuja la explosión (círculos concéntricos de diferentes colores)
        ctx.fillStyle = "darkred"
        ctx.beginPath()
        ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.fillStyle = "red"
        ctx.beginPath()
        ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.fillStyle = "orange"
        ctx.beginPath()
        ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.fillStyle = "yellow"
        ctx.beginPath()
        ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.fillStyle = "white"
        ctx.beginPath()
        ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false)
        ctx.fill()
    }
    // muestra el círculo de colisión del barco
    if (showBounding) {
        ctx.strokeStyle = "lime"
        ctx.beginPath()
        ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false)
        ctx.stroke()
    }
    // muestra el punto central del barco
    if (showCentreDot) {
        ctx.fillStyle = "red"
        ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2)
    }

    //dibuja los láseres
    for (var i = 0; i < ship.lasers.length; i++) {
        if (ship.lasers[i].explodeTime == 0) {
            ctx.fillStyle = "salmon"
            ctx.beginPath()
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, shipSize / 15, 0, Math.PI * 2, false)
            ctx.fill()
        } else {
            // dibuja la explosión
            ctx.fillStyle = "orangered"
            ctx.beginPath()
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false)
            ctx.fill()
            ctx.fillStyle = "salmon"
            ctx.beginPath()
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false)
            ctx.fill()
            ctx.fillStyle = "pink"
            ctx.beginPath()
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false)
            ctx.fill()
        }
    }

    //dibuja el texto del juego
    if (textAlpha >= 0) {
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")"
        ctx.font = "small-caps " + textSize + "px dejavu sans mono"
        ctx.fillText(text, canv.width / 2, canv.height * 0.75)
        textAlpha -= (1.0 / textFadeTime / FPS)
    } else if (ship.dead) {
        // después de que el "juego terminado" desaparezca, comienza un nuevo juego
        newGame()
    }
    // dibuja las vidas
    var lifeColour
    for (var i = 0; i < lives; i++) {
        lifeColour = exploding && i == lives - 1 ? "red" : "white"
        drawShip(shipSize + i * shipSize * 1.2, shipSize, 0.5 * Math.PI, lifeColour)
    }

    // saca el marcador
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "white"
    ctx.font = (textSize * 0.75) + "px dejavu sans mono"
    ctx.fillText("BEST " + scoreHigh, canv.width / 2, shipSize)

    // detecta impactos de láser en asteroides
    var ax, ay, ar, lx, ly
    for (var i = roids.length - 1; i >= 0; i--) {
        // toma las propiedades del asteroide
        ax = roids[i].x
        ay = roids[i].y
        ar = roids[i].r

        // bucle sobre los láseres
        for (var j = ship.lasers.length - 1; j >= 0; j--) {
            // toma las propiedades del láser
            lx = ship.lasers[j].x
            ly = ship.lasers[j].y

            // detectar visitas
            if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
                // destruye el asteroide y activa la explosión láser
                destroyAsteroid(i)
                ship.lasers[j].explodeTime = Math.ceil(laserExplodeDur * FPS)
                break
            }
        }
    }

    // comprueba si hay colisiones de asteroides (cuando no explotan)
    if (!exploding) {
        // solo verifica cuando no parpadea
        if (ship.blinkNum == 0 && !ship.dead) {
            for (var i = 0; i < roids.length; i++) {
                if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
                    explodeShip()
                    destroyAsteroid(i)
                    break
                }
            }
        }

        //girar el barco
        ship.a += ship.rot

        //mover el barco
        ship.x += ship.thrust.x
        ship.y += ship.thrust.y
    } else {
        //reducir el tiempo de explosión
        ship.explodeTime--

        // reinicia la nave después de que la explosión haya terminado
        if (ship.explodeTime == 0) {
            lives--
            if (lives == 0) {
                gameOver()
            } else {
                ship = newShip()
            }
        }
    }

    //manejar el borde de la pantalla
    if (ship.x < 0 - ship.r) {
        ship.x = canv.width + ship.r
    } else if (ship.x > canv.width + ship.r) {
        ship.x = 0 - ship.r
    }
    if (ship.y < 0 - ship.r) {
        ship.y = canv.height + ship.r
    } else if (ship.y > canv.height + ship.r) {
        ship.y = 0 - ship.r
    }

    //mueve los láseres
    for (var i = ship.lasers.length - 1; i >= 0; i--) {
        // comprobar la distancia recorrida
        if (ship.lasers[i].dist > laserDist * canv.width) {
            ship.lasers.splice(i, 1)
            continue
        }

        // manejar la explosión
        if (ship.lasers[i].explodeTime > 0) {
            ship.lasers[i].explodeTime--

            // destruye el láser después de que se acabe la duración
            if (ship.lasers[i].explodeTime == 0) {
                ship.lasers.splice(i, 1)
                continue
            }
        } else {
            // mueve el láser
            ship.lasers[i].x += ship.lasers[i].xv
            ship.lasers[i].y += ship.lasers[i].yv

            //calcular la distancia recorrida
            ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math,pow(ship.lasers[i].yv, 2))
        }

        //manejar el borde de la pantalla
        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canv.width
        } else if (ship.lasers[i].x > canv.width) {
            ship.lasers[i].x = 0
        }
        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canv.height
        } else if (ship.lasers[i].y > canv.height) {
            ship.lasers[i].y = 0
        }
    }

    //mover el asteroide
    for (var i = 0; i < roids.length; i++) {
        roids[i].x += roids[i].xv
        roids[i].y += roids[i].yv

        //manejar el borde de la pantalla
        if (roids[i].x < 0 - roids[i].r) {
            roids[i].x = canv.width + roids[i].r
        } else if (roids[i].x > canv.width + roids[i].r) {
            roids[i].x = 0 - roids[i].r
        }
        if (roids[i].y < 0 - roids[i].r) {
            roids[i].y = canv.height + roids[i].r
        } else if (roids[i].y > canv.height + roids[i].r) {
            roids[i].y = 0 - roids[i].r
        }
    }
}