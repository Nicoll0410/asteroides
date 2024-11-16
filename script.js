//cuadro por segundo
const FPS = 30
// coeficiente de fricción del espacio (0 = sin fricción, 1 = mucha fricción)
const friction = 0.7
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
//número inicial de asteroides
const roidsNum = 3
//Tamaño inicial de los asteroides en píxeles por segundo.
const roidsSize = 100
//velocidad inicial máxima de los asteroides en píxeles por segundo
const roidsSPD = 50
//número promedio de vértices en cada asteroide
const roidsVert = 10
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
const turnSpeed = 360
// mostrar u ocultar el límite de colisión
const showBounding = false
// muestra u oculta el punto central del barco
const showCentreDot = false

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas")
var ctx = canv.getContext("2d")

// configura el objeto de la nave espacial
var ship = newShip()

//establecer un asteroide
var roids = []
createAsteroidBelt()

//configurar controladores de eventos
document.addEventListener("keydown" , keyDown)
document.addEventListener("keyup" , keyUp)

//Configuracion del bucle del juego
setInterval(update, 1000 / FPS)


function createAsteroidBelt() {
    roids = []
    var x, y
    for (var i = 0; i < roidsNum; i ++){
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
    } else if (r == Math.ceil(roidsSize / 4)) {
        // asteroide mediano
        roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 8)))
        roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 8)))
    }
    // destruir el asteroide
    roids.splice(index, 1)
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function explodeShip() {
    ship.explodeTime = Math.ceil(shipExplodeDur * FPS)
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
    switch (ev.keyCode) {
        // barra espaciadora (disparar láser)
        case 32:
            shootLaser()
            break;
        // flecha izquierda (girar el barco hacia la izquierda)
        case 37:
            ship.rot = turnSpeed / 180 * Math.PI / FPS
            break;

        //flecha hacia arriba (empujar el barco hacia adelante)
        case 38:
            ship.thrusting = true
            break;

        //flecha derecha (barco rotar hacia la derecha)
        case 39:
            ship.rot = -turnSpeed / 180 * Math.PI / FPS
            break;
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
    switch (ev.keyCode) {
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

function newAsteroid(x, y) {
    var roid = {
        //en radianes
        a : Math.random() * Math.PI * 2,
        offs: [],
        r : roidsSize / 2,
        vert : Math.floor(Math.random() * (roidsVert + 1) + roidsVert / 2),
        x : x,
        y : y,
        xv : Math.random() * roidsSPD / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv : Math.random() * roidsSPD / FPS * (Math.random() < 0.5 ? 1 : -1)
    }
    // completa la matriz de compensaciones
    for (var i = 0; i < roid.length; i++) {
        roid.offs.push(Math.random() * roidJAG * 2 + 1 - roidJAG)
    }
    return roid
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
        explodeTime : 0,
        rot : 0,
        thrusting : false,
        thrust : {
            x : 0,
            y : 0
        }
    }
}

function update() {
    var blinkOn = ship.blinkNum % 2 == 0
    var exploding = ship.explodeTime > 0

    //dibujar espacio
    ctx.fillStyle = "black"
    ctx.fillRect(0,0, canv.width, canv.height)

    //dibujar los asteroides
    var a, r, x, y, offs, vert
    for (var i = 0; i < roids.length; i ++){
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
    if (ship.thrusting) {
        ship.thrust.x += shipThrust * Math.cos(ship.a) / FPS
        ship.thrust.y -= shipThrust * Math.sin(ship.a) / FPS

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
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
            )
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
        }
    } else  {
        // aplica fricción (ralentiza el barco cuando no está empujando)
        ship.thrust.x -= friction * ship.thrust.x / FPS
        ship.thrust.y -= friction * ship.thrust.y / FPS
    }

    //dibuja el barco triangular
    if (!exploding) {
        if (blinkOn) {
            ctx.strokeStyle = "white"
            ctx.lineWidth = shipSize / 20
            ctx.beginPath()
            ctx.moveTo(
                // nariz del barco
                ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
                ship.y + 4 / 3 * ship.r * Math.sin(ship.a)
            )
            ctx.lineTo(
                //trasera izquierda
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
            )
            ctx.lineTo(
                //trasera derecha
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
            )
            ctx.closePath()
            ctx.stroke()
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

    // comprueba si hay colisiones de asteroides (cuando no explotan)
    if (!exploding) {
        // solo verifica cuando no parpadea
        if (ship.blinkNum == 0) {
            for (var i = 0; i < roids.length; i++) {
                if (distBetweenPoints(ship.x, ship.y, roids[i].x, roid[i].y) < ship.r + roids[i].r) {
                    explodeShip()
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
            ship = newShip()
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
        if (roids[i].x < 0 - roids[i].r) {
            roids[i].x = canv.width + roids[i].r
        } else if (roids[i].x > canv.width + roids[i].r) {
            roids[i].x = 0 - roids[i].r
        }
    }
}