//cuadro por segundo
const FPS = 30
//coeficiente de fricción del espacio (0 = no friction, 1 = lots of friction)
const friction = 0.7
//altura del barco en píxeles
const shipSize = 30
//aceleración de la nave en píxeles por segundo
const shipThrust = 5
//velocidad de giro en grados por segundo
const turnSpeed = 360

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas")
var ctx = canv.getContext("2d")

var ship = {
    x : canv.width / 2,
    y : canv.height / 2,
    r : shipSize / 2,
    //convertir a radianes
    a : 90 / 180 * Math.PI,
    rot : 0,
    thrusting : false,
    thrusting : {
        x : 0,
        y : 0
    }
}

//configurar controladores de eventos
document.addEventListener("keydown" , keyDown)
document.addEventListener("keyup" , keyUp)

//Configuracion del bucle del juego
setInterval(update, 1000 / FPS)

function keyDown(/** @type {KeyboardEvent} */ ev) {
    switch (ev.keyCode) {
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

function update() {
    //dibujar espacio
    ctx.fillStyle = "black"
    ctx.fillRect(0,0, canv.width, canv.height)

    //empujar el barco
    if (ship.thrusting) {
        ship.thrust.x += shipThrust * Math.cos(ship.a) / FPS
        ship.thrust.y -= shipThrust * Math.sin(ship.a) / FPS

        //dibuja el propulsor
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
    } else  {
        // aplica fricción (ralentiza el barco cuando no está empujando)
        ship.thrust.x -= friction * ship.thrust.x / FPS
        ship.thrust.y -= friction * ship.thrust.y / FPS
    }

    //dibuja el barco triangular
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

    //girar el barco
    ship.a += ship.rot

    //mover el barco
    ship.x += ship.thrust.x
    ship.y += ship.thrust.y

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

    //punto central
    ctx.fillStyle = "red"
    ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2)
}