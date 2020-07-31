// FIT2102 2019 Assignment 1
// James Schubach - 29743338 - jsch0026@student.monash.edu

//Type for a ship, allows for a little cleaner code and holds all the variables needed for the ship
type ship = {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  isDead: boolean
  speed: number
  rot: number
  shoot: number
  life: number
}

// A type for a sprite, allows to store asteroids in an array and makes things neater
type sprite = {
  destroyed: boolean
  holder: Elem
  level? :number
}

// Object in world holders

// Had to make an asteroid array, only way to iterate over each one to check for collisions
let asteroid: Array<sprite> = []

// A simple value to tell the gameState if it is game over or not
let GAME_OVER = false

//To let the gameState know what level it is
let level = 3;

//To let the gameState know what the score is
let gameScore = 0;




//CONSTANTS
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second per second
const FPS = 30; // frames per second
const TURN_SPEED = 360; // turn speed in degrees per second
const ASTEROID_SPEED = [120,100,80,60]


function asteroids() {

  let currentTime = 0;

  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let g = createSvgGroup(300, 300, 0, 'g')
  
  

  //Ship object for keeping track of state
  let shipControl: ship

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
  }
  
  // create a polygon shape for the space ship as a child of the transform group

  let ships = new Elem(svg, 'rect', g.elem) 
    .attr("width","30")
    .attr("height","30")
    .attr("style","fill:lime;stroke:purple;stroke-width:1")


  
 
  // Listner for key presses, does not move ship rather lets movement observer control that
  const
    keypress = Observable.fromEvent<KeyboardEvent>(document, "keydown")
    .map(({key}) => ({keypressed: key}))

    //W key is thruster, speeds up ship. This will be triggered in gameObserv
    keypress.filter(({keypressed}) => keypressed === "w")
    .map((_) => shipControl.speed = 10)
    .subscribe((_) => 
      shipControl.w = true,
    )
    ,
    //E is to shoot, once again triggered in the gameObserv
    keypress.filter(({keypressed}) => keypressed === "e")
    .subscribe((_) => {
      shipControl.shoot += 1
    })
    
    ,

    //A and D both rotate the ship left and right respectively. This is done in this function tho
    keypress.filter(({keypressed}) => keypressed === "a")
    .map((_) => shipControl.rot = (shipControl.rot - 12) % 360)
    .subscribe((_) => 
      shipControl.a = true
    )
    ,

    keypress.filter(({keypressed}) => keypressed === "d")
    .map((_) => shipControl.rot = (shipControl.rot + 12) % 360)
    .subscribe((_) => 
      shipControl.d = true
    )
    ;


  //To keep track when w is let go off to reset speed
  const
    keyup = Observable.fromEvent<KeyboardEvent>(document, "keyup")
    .map(({key}) => ({keypressed: key}))
  
    keyup.filter(({keypressed}) => keypressed === "w")
    .map((_) => shipControl.speed = 5)
    .subscribe((_) => 
      shipControl.w = true,
    );
    


  //Main gameclock, it sets the speed with the FPS variable
  const gameClock = Observable.interval(FPS).map(() => ({
    shipControl
  }));

  //Main game observer, does majority of the work
  const gameObserv = gameClock
    .takeUntil(gameClock.filter(
      _ => 
        //Purely checks to see if the ship is dead, if it is, stops the game
        shipControl.isDead === true
    )
    )
    .map(_ => ({

      //Maps the current positon of the ship to pass into the variables
      x: parseInt(g.attr("x")),
      y: parseInt(g.attr("y")),
      rot: shipControl.rot,

    })
      
      );
  //To obserb the shooting, only triggers when their are more then one shots to be actioned upon
  gameObserv.filter(() => 
    shipControl.shoot >0
  )
  
  //Calls a function with creates an observable for the bullet
  .subscribe(({x, y, rot}) => {
      bulletObseravble(x, y, rot)
      shipControl.shoot -= 1
  })

  //Movement and collision observable
  gameObserv.subscribe(({x, y, rot}) => {
      currentTime += 1
      //Calls a function the moves the ship
      move(x,y,rot,g, shipControl.speed)

      //Foreach's through an array of the asteroids and moves them if they havent been destoryed
      asteroid.forEach(elem => {
        if (!elem.destroyed) {
          rot = Number(elem.holder.attr("rot")),
          x = (Number(elem.holder.attr("x"))),
          y = (Number(elem.holder.attr("y"))),
          
          move(x, y, rot, elem.holder, SHIP_THRUST)

          //Checks for collision with ship, if collision occurs, lowers the players life, if life is at 1, then
          //Changes the neccessary values to end the game
          if (isCollision(elem.holder, g, 10, 10)) {
            if (shipControl.life > 1) {
              shipControl.life -= 1
              elem.holder.elem.remove()
              elem.destroyed = true
            }
            else {
              shipControl.life -= 1
              shipControl.isDead = true
              GAME_OVER = true
            }
            //Updates the lives on the HTML page
            updateLives(shipControl.life)
        }
      }
      }

      )
      });
  //Spawns the asteroids at the given level, level increases as you destroy more asteroids
  gameObserv.filter(
    _ => 
      currentTime % ASTEROID_SPEED[level] == 0
  )
  .subscribe((_) => {
    asteroid[asteroid.length] = createAsteroid()
  }
  );
  
}

// Bullet obserable, every time a bullet is created, it is given an observable. This will check at the same tick as the
// Game to see if it has collided with any asteroids

function bulletObseravble(x: number, y:number, rot: number) {
  let bull = createBullet(x,y,rot)
  const bulletClock = Observable.interval(FPS)
  const bulletObs = bulletClock.takeUntil(bulletClock.filter(_ => (bull.destroyed === true)))
    


  .subscribe(() => {
    //Moves the bullet in the current direction it is travelling
    move(Number(bull.holder.attr("x")), Number(bull.holder.attr("y")), Number(bull.holder.attr("rot")), bull.holder, 15)

    //loops through each asteroid and see's if it has collided with said asteroid
    asteroid.forEach(astr => {
      if (!astr.destroyed) {
        if (isCollision(astr.holder, bull.holder, 1, 10)) {
          //If the asteroid is level 1, then it will spawn 2 more asteroids
          if(astr.level == 1) {
            create2Asteroid(astr)
          }
          //then it increments the game score and removes them from the screen
            gameScore += 1
            score(gameScore)
            astr.holder.elem.remove()
            astr.destroyed = true
            
            bull.holder.elem.remove()
            bull.destroyed = true
        }
      }
    }
  )
})


}

// Updates the lives on the HTML page, also plays around with the styles for visual effect
function updateLives(currLife: number) {
  const life: HTMLElement = document.getElementById("life")!;
  const gameover: HTMLElement = document.getElementById("centered")!;
  const canvas: HTMLElement = document.getElementById("canvas")!;
  if (currLife >= 1) {
    life.innerHTML = `${currLife}`;
  }
  else {
    life.innerHTML = `${currLife}`;
    canvas.style.display = "none"
    gameover.style.display = "block"
    
  }
}

// Similar to the updateLives function, updates the score on the HTML page, also in charge of updating the level
function score(currScore: number) {
  if (currScore > 10 && level == 0) {
    level += 1
  }
  if (currScore > 20 && level == 1) {
    level += 1
  }
  if (currScore > 30 && level == 2) {
    level += 1
  }
  const score: HTMLElement = document.getElementById("score")!;
  score.innerHTML = `${currScore}`;
}


// A slightly different function to the createAsteroid, this spawns 2 asteroids instead of 1. Could have made this more generic
// But would have to refactor a lot of code to allow for the creation of 2 asteroids.
function create2Asteroid(astr: sprite) {
  let x = Number(astr.holder.attr("x"))
  let y = Number(astr.holder.attr("y"))
  let astrer1: sprite 
  let astrer2: sprite 
  const svg = document.getElementById("canvas")!;
  const rot =  getRandomInt(0, 359)
  const rot2 =  getRandomInt(0, 359)
  let gAst = createSvgGroup(x, y, rot, "g")
  let gAst2 = createSvgGroup(x+1, y+1, rot2, "g")
  let astr1 = new Elem(svg, 'circle', gAst.elem) 
  .attr("cx", "0") 
  .attr("cy", "0")
  .attr("r", "15")
  .attr("style","stroke:black; stroke-width:1; fill:red")
  let astr2 = new Elem(svg, 'circle', gAst2.elem) 
  .attr("cx", "0") 
  .attr("cy", "0")
  .attr("r", "15")
  .attr("style","stroke:black; stroke-width:1; fill:red")
  astrer1 = {
    destroyed: false,
    holder: gAst,
    level: 2
  }
  astrer2 = {
    destroyed: false,
    holder: gAst2,
    level: 2
  }
  asteroid.splice(asteroid.indexOf(astr), 1, astrer1)
  asteroid[asteroid.length] = astrer2
  
}


// Simple function that creates and asteroid and then returns said asterod
function createAsteroid(): sprite {
  let astrer: sprite 
  const svg = document.getElementById("canvas")!;
  const x = getRandomInt(0, document.body.clientWidth)
  const y = getRandomInt(0, (document.body.clientHeight*0.8))
  const rot =  getRandomInt(0, 359)
  let gAst = createSvgGroup(x, y, rot, "g")
  let astr = new Elem(svg, 'circle', gAst.elem) 
  .attr("cx", "0") 
  .attr("cy", "0")
  .attr("r", "25")
  .attr("style","stroke:black; stroke-width:1; fill:red")
  astrer = {
    destroyed: false,
    holder: gAst,
    level: 1
  }
  return astrer
}

//Function given a max and min returns a random int, used for deciding which way asteroids travek
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Function for detecting if a element has collided with the asteroid. Basic high school math functions
function isCollision(astr: Elem, elem2:Elem, width: number, height: number): boolean {
    let circleDistanceX = Math.abs(Number(astr.attr("x")) - (Number(elem2.attr("x"))));
    let circleDistanceY = Math.abs(Number(astr.attr("y")) - (Number(elem2.attr("y"))));

    if (circleDistanceX > (20/2 + 25)) { return false; }
    if (circleDistanceY > (20/2 + 25)) { return false; }

    if (circleDistanceX < (20/2)) { return true; } 
    if (circleDistanceY < (20/2)) { return true; }

    let cornerDistance_sq = (circleDistanceX - 20/2)^2 +
                         (circleDistanceY - 20/2)^2;

    return (cornerDistance_sq < (20^2));


}

// Generalised move function, given x, y, rotation and speed uses trig to calculate the new x, y cordinates and updates it on given elem
function move(x: number, y: number, rot: number, elem: Elem, speed: number) {
  let xReal = Math.abs(document.body.clientWidth + (x + speed * Math.cos((rot-90)*(Math.PI/180)))) % document.body.clientWidth
  let yReal = Math.abs(document.body.clientHeight*0.8 + (y + speed * Math.sin((rot-90)*(Math.PI/180)))) % (document.body.clientHeight*0.8)
  elem.attr("transform","translate("+`${xReal}`+","+`${yReal}`+") rotate(" + rot +")")
  .attr("x", xReal)
  .attr("y", yReal)
}

// Useful function to create a svgGroup, being reused a couple of times
function createSvgGroup(x: number, y: number, rot: number, group: string): Elem {
  const svg = document.getElementById("canvas")!;
  return new Elem(svg,'g')
  .attr("transform","translate("+`${x}`+","+`${y}`+") rotate("+`${rot}`+")")
  .attr("x", x)
  .attr("y", y)
  .attr("rot", rot)
}

// Function to create a bullet
function createBullet(x: number, y: number, rot: number): sprite {
  let bull: sprite
  const svg = document.getElementById("canvas")!;
  let gBull = createSvgGroup(x, y, rot, "g")
  let bullet = new Elem(svg, 'line', gBull.elem) 
  .attr("x1", "0")
  .attr("y1", "0")
  .attr("x2", "0")
  .attr("y2", "10")  
  .attr("style","stroke:rgb(255,0,0);stroke-width:2")
  bull = {
    destroyed: false,
    holder: gBull
  }
  return bull
  
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }



 
