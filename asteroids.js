"use strict";
let asteroid = [];
let GAME_OVER = false;
let level = 3;
let gameScore = 0;
const SHIP_THRUST = 5;
const FPS = 30;
const TURN_SPEED = 360;
const ASTEROID_SPEED = [120, 100, 80, 60];
function asteroids() {
    let currentTime = 0;
    const svg = document.getElementById("canvas");
    let g = createSvgGroup(300, 300, 0, 'g');
    let shipControl;
    shipControl = {
        w: false,
        a: false,
        s: false,
        d: false,
        isDead: false,
        speed: SHIP_THRUST,
        rot: 0,
        shoot: 0,
        life: 3
    };
    let ships = new Elem(svg, 'rect', g.elem)
        .attr("width", "30")
        .attr("height", "30")
        .attr("style", "fill:lime;stroke:purple;stroke-width:1");
    const keypress = Observable.fromEvent(document, "keydown")
        .map(({ key }) => ({ keypressed: key }));
    keypress.filter(({ keypressed }) => keypressed === "w")
        .map((_) => shipControl.speed = 10)
        .subscribe((_) => shipControl.w = true)
        ,
            keypress.filter(({ keypressed }) => keypressed === "e")
                .subscribe((_) => {
                shipControl.shoot += 1;
            })
        ,
            keypress.filter(({ keypressed }) => keypressed === "a")
                .map((_) => shipControl.rot = (shipControl.rot - 12) % 360)
                .subscribe((_) => shipControl.a = true)
        ,
            keypress.filter(({ keypressed }) => keypressed === "d")
                .map((_) => shipControl.rot = (shipControl.rot + 12) % 360)
                .subscribe((_) => shipControl.d = true);
    const keyup = Observable.fromEvent(document, "keyup")
        .map(({ key }) => ({ keypressed: key }));
    keyup.filter(({ keypressed }) => keypressed === "w")
        .map((_) => shipControl.speed = 5)
        .subscribe((_) => shipControl.w = true);
    const gameClock = Observable.interval(FPS).map(() => ({
        shipControl
    }));
    const gameObserv = gameClock
        .takeUntil(gameClock.filter(_ => shipControl.isDead === true))
        .map(_ => ({
        x: parseInt(g.attr("x")),
        y: parseInt(g.attr("y")),
        rot: shipControl.rot,
    }));
    gameObserv.filter(() => shipControl.shoot > 0)
        .subscribe(({ x, y, rot }) => {
        bulletObseravble(x, y, rot);
        shipControl.shoot -= 1;
    });
    gameObserv.subscribe(({ x, y, rot }) => {
        currentTime += 1;
        move(x, y, rot, g, shipControl.speed);
        asteroid.forEach(elem => {
            if (!elem.destroyed) {
                rot = Number(elem.holder.attr("rot")),
                    x = (Number(elem.holder.attr("x"))),
                    y = (Number(elem.holder.attr("y"))),
                    move(x, y, rot, elem.holder, SHIP_THRUST);
                if (isCollision(elem.holder, g, 10, 10)) {
                    if (shipControl.life > 1) {
                        shipControl.life -= 1;
                        elem.holder.elem.remove();
                        elem.destroyed = true;
                    }
                    else {
                        shipControl.life -= 1;
                        shipControl.isDead = true;
                        GAME_OVER = true;
                    }
                    updateLives(shipControl.life);
                }
            }
        });
    });
    gameObserv.filter(_ => currentTime % ASTEROID_SPEED[level] == 0)
        .subscribe((_) => {
        asteroid[asteroid.length] = createAsteroid();
    });
}
function bulletObseravble(x, y, rot) {
    let bull = createBullet(x, y, rot);
    const bulletClock = Observable.interval(FPS);
    const bulletObs = bulletClock.takeUntil(bulletClock.filter(_ => (bull.destroyed === true)))
        .subscribe(() => {
        move(Number(bull.holder.attr("x")), Number(bull.holder.attr("y")), Number(bull.holder.attr("rot")), bull.holder, 15);
        asteroid.forEach(astr => {
            if (!astr.destroyed) {
                if (isCollision(astr.holder, bull.holder, 1, 10)) {
                    if (astr.level == 1) {
                        create2Asteroid(astr);
                    }
                    gameScore += 1;
                    score(gameScore);
                    astr.holder.elem.remove();
                    astr.destroyed = true;
                    bull.holder.elem.remove();
                    bull.destroyed = true;
                }
            }
        });
    });
}
function updateLives(currLife) {
    const life = document.getElementById("life");
    const gameover = document.getElementById("centered");
    const canvas = document.getElementById("canvas");
    if (currLife >= 1) {
        life.innerHTML = `${currLife}`;
    }
    else {
        life.innerHTML = `${currLife}`;
        canvas.style.display = "none";
        gameover.style.display = "block";
    }
}
function score(currScore) {
    if (currScore > 10 && level == 0) {
        level += 1;
    }
    if (currScore > 20 && level == 1) {
        level += 1;
    }
    if (currScore > 30 && level == 2) {
        level += 1;
    }
    const score = document.getElementById("score");
    score.innerHTML = `${currScore}`;
}
function create2Asteroid(astr) {
    let x = Number(astr.holder.attr("x"));
    let y = Number(astr.holder.attr("y"));
    let astrer1;
    let astrer2;
    const svg = document.getElementById("canvas");
    const rot = getRandomInt(0, 359);
    const rot2 = getRandomInt(0, 359);
    let gAst = createSvgGroup(x, y, rot, "g");
    let gAst2 = createSvgGroup(x + 1, y + 1, rot2, "g");
    let astr1 = new Elem(svg, 'circle', gAst.elem)
        .attr("cx", "0")
        .attr("cy", "0")
        .attr("r", "15")
        .attr("style", "stroke:black; stroke-width:1; fill:red");
    let astr2 = new Elem(svg, 'circle', gAst2.elem)
        .attr("cx", "0")
        .attr("cy", "0")
        .attr("r", "15")
        .attr("style", "stroke:black; stroke-width:1; fill:red");
    astrer1 = {
        destroyed: false,
        holder: gAst,
        level: 2
    };
    astrer2 = {
        destroyed: false,
        holder: gAst2,
        level: 2
    };
    asteroid.splice(asteroid.indexOf(astr), 1, astrer1);
    asteroid[asteroid.length] = astrer2;
}
function createAsteroid() {
    let astrer;
    const svg = document.getElementById("canvas");
    const x = getRandomInt(0, document.body.clientWidth);
    const y = getRandomInt(0, (document.body.clientHeight * 0.8));
    const rot = getRandomInt(0, 359);
    let gAst = createSvgGroup(x, y, rot, "g");
    let astr = new Elem(svg, 'circle', gAst.elem)
        .attr("cx", "0")
        .attr("cy", "0")
        .attr("r", "25")
        .attr("style", "stroke:black; stroke-width:1; fill:red");
    astrer = {
        destroyed: false,
        holder: gAst,
        level: 1
    };
    return astrer;
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function isCollision(astr, elem2, width, height) {
    let circleDistanceX = Math.abs(Number(astr.attr("x")) - (Number(elem2.attr("x"))));
    let circleDistanceY = Math.abs(Number(astr.attr("y")) - (Number(elem2.attr("y"))));
    if (circleDistanceX > (20 / 2 + 25)) {
        return false;
    }
    if (circleDistanceY > (20 / 2 + 25)) {
        return false;
    }
    if (circleDistanceX < (20 / 2)) {
        return true;
    }
    if (circleDistanceY < (20 / 2)) {
        return true;
    }
    let cornerDistance_sq = (circleDistanceX - 20 / 2) ^ 2 +
        (circleDistanceY - 20 / 2) ^ 2;
    return (cornerDistance_sq < (20 ^ 2));
}
function move(x, y, rot, elem, speed) {
    let xReal = Math.abs(document.body.clientWidth + (x + speed * Math.cos((rot - 90) * (Math.PI / 180)))) % document.body.clientWidth;
    let yReal = Math.abs(document.body.clientHeight * 0.8 + (y + speed * Math.sin((rot - 90) * (Math.PI / 180)))) % (document.body.clientHeight * 0.8);
    elem.attr("transform", "translate(" + `${xReal}` + "," + `${yReal}` + ") rotate(" + rot + ")")
        .attr("x", xReal)
        .attr("y", yReal);
}
function createSvgGroup(x, y, rot, group) {
    const svg = document.getElementById("canvas");
    return new Elem(svg, 'g')
        .attr("transform", "translate(" + `${x}` + "," + `${y}` + ") rotate(" + `${rot}` + ")")
        .attr("x", x)
        .attr("y", y)
        .attr("rot", rot);
}
function createBullet(x, y, rot) {
    let bull;
    const svg = document.getElementById("canvas");
    let gBull = createSvgGroup(x, y, rot, "g");
    let bullet = new Elem(svg, 'line', gBull.elem)
        .attr("x1", "0")
        .attr("y1", "0")
        .attr("x2", "0")
        .attr("y2", "10")
        .attr("style", "stroke:rgb(255,0,0);stroke-width:2");
    bull = {
        destroyed: false,
        holder: gBull
    };
    return bull;
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map