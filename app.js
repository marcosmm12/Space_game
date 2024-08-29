//EventEmitter's class for the publish and suscribe pattern
class EventEmitter {
    constructor() {
        this.listeners = {};
    }

    //this will manage suscribers
    on(message, listener) {
        if (!this.listeners[message]) this.listeners[message] = [];
        this.listeners[message].push(listener);
    }

    //this will manage publishers
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach((l) => l(message, payload));
        }
    }

    clear() {
        this.listeners = {};
    }
}

//class GameObject
class GameObject {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.dead = false;
        this.type = '';
        this.width = 0;
        this.height = 0;
        this.img = undefined;
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    //function to obtain the rectangle of a GameObject
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }
}

//class Hero extends GameObject's class
class Hero extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 99;
        this.height = 75;
        this.type = 'Hero';
        this.speed = {x:0, y: 0};
        this.cooldown = 0;
        this.life = 5;
        this.points = 0;
    }

    fire() {
        gameObjects.push(new Laser(this.x + 45, this.y - 10));
        this.cooldown = 500;

        let id = setInterval(() => {
            if (this.cooldown > 0) {
                this.cooldown -= 100;
            }
            else {
                clearInterval(id);
            }
        }, 200);
    }

    canFire() {
        return this.cooldown === 0;
    }

    decrementLife() {
        this.life--;
        if (this.life === 0) this.dead = true;
    }

    incrementPoints() {
        this.points += 100;
    }
}

//class Enemy extends GameObject's class
class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = 'Enemy';
        //we want the interval to be of 300 ms
        let id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y++;
            }
            else {
                console.log('Stopped at', this.y);
                clearInterval(id);
            }
        }, yEnemySpeed);
    }
}

//Laser's class
class Laser extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = 'Laser';
        this.img = laserImg;
        let id = setInterval(() => {
            if (this.y > 0) {
                this.y -= 15;
            }
            else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100)
    }
}

//function to load images' assets
function loadTexture (path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            //image loaded and ready to be used
            resolve(img);
        };
    });
}

//function that returns true if two GameObjects intersects, false otherwise
function intersectRect(r1, r2) {
    return !(r2.left > r1.right ||
        r1.left > r2.right ||
        r2.top > r1.bottom ||
        r1.top > r2.bottom);
}

//possible messages
const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    GAME_END_LOSS: "GAME_END_LOSS",
    GAME_END_WIN: "GAME_END_WIN",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
    KEY_NEXT_LEVEL: "KEY_NEXT_LEVEL",
    SHOW_RESULTS_AND_RESTART: "SHOW_RESULTS_AND_RESTART",
};

//game's constants
let heroImg, 
    enemyImg, 
    laserImg, 
    laserShotImg,
    lifeImg,
    canvas, 
    ctx, 
    gameObjects = [], 
    hero, 
    eventEmitter = new EventEmitter(),
    gameLoopId,
    yEnemySpeed = 100,
    gamesResults = [];

//this will determine what we will do depending of which key has been pressed
let onKeyDown = function (e) {
    console.log(e.keyCode);
    switch (e.keyCode) {
        case 37:
        case 38:
        case 39:
        case 40:    //Arrow Keys
        case 32:    //Space Key
            e.preventDefault(); //we set down the default behaviour
            break;
        default:
            break;  //do not block other keys
    }
};

//set down the default behaviour of arrows' and space's keys.
window.addEventListener('keydown', onKeyDown);

//add an event listener for Arrows' keys
window.addEventListener('keyup', (evt) => {
    if (evt.key === 'ArrowUp') eventEmitter.emit(Messages.KEY_EVENT_UP);
    else if (evt.key === 'ArrowDown') eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    else if (evt.key === 'ArrowLeft') eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    else if (evt.key === 'ArrowRight') eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    else if (evt.keyCode === 32) eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    else if (evt.key === 'Enter') eventEmitter.emit(Messages.KEY_EVENT_ENTER);
    else if (evt.key === 'c' || evt.key === 'C') eventEmitter.emit(Messages.KEY_NEXT_LEVEL);
    else if (evt.key === 'r' || evt.key === 'R') eventEmitter.emit(Messages.SHOW_RESULTS_AND_RESTART);
});

//create enemies and add them to gameObjects list
function createEnemies(img) {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * 98;
    const START_X = (canvas.width - MONSTER_WIDTH)/2;
    const STOP_X = START_X + MONSTER_WIDTH;

    for (let x = START_X; x < STOP_X; x += 98) {
        for (let y = 0; y < 50*5; y += 50) {
            const enemy = new Enemy(x, y);
            enemy.img = enemyImg;
            gameObjects.push(enemy);
        }
    }
}

//create hero and add him to gameObjects list
function createHero() {
    hero = new Hero(canvas.width/2 -45, 3*(canvas.height/4));
    hero.img = heroImg;
    gameObjects.push(hero);
}

//function for updating collisions
function updateGameObjects() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy');
    const lasers = gameObjects.filter(go => go.type === 'Laser');
    //laser hit something
    lasers.forEach(l => {
        enemies.forEach(m => {
            if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
                    first: l, second: m,
                });
            }
        });
    });
    enemies.forEach(enemy => {
        const heroRect = hero.rectFromGameObject();
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, {enemy});
        }
    })
    gameObjects = gameObjects.filter(go => !go.dead);
}

//function to draw all the gameObjects (elements of the game) 
function drawGameObjects() {
    gameObjects.forEach(go => go.draw(ctx));
}


//initialize the game
function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();
    yEnemySpeed = 100;

    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
        hero.y -= 5;
    });

    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
        hero.y += 5;
    });

    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
        hero.x -= 5;
    });
    
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
        hero.x += 5;
    });

    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (hero.canFire()) {
            hero.fire();
        }
    });

    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, {first, second}) => {
        first.dead = true;
        second.dead = true;
        hero.incrementPoints();
        let laserShot = new LaserShot(first.x-23, first.y-11);
        gameObjects.push(laserShot);
        let waiting = 15;
        let id = setInterval(() => {
            if (waiting > 0) waiting -= 15;
            else {
                laserShot.dead = true;
                clearInterval(id);
            }
        }, 15);
        if (isEnemiesDead()) {
            eventEmitter.emit(Messages.GAME_END_WIN);
        }
    });  
    
    eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, {enemy}) => {
        enemy.dead = true;
        hero.decrementLife();
        if (isHeroDead()) {
            eventEmitter.emit(Messages.GAME_END_LOSS);
            return;
        }
        if (isEnemiesDead()) eventEmitter.emit(Messages.GAME_END_WIN);
    });

    eventEmitter.on(Messages.GAME_END_WIN, () => {
        endGame(true);
    });

    eventEmitter.on(Messages.GAME_END_LOSS, () => {
        endGame(false);
        gamesResults.push(hero.points);
    });

    eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
        resetGame();
    });

    eventEmitter.on(Messages.KEY_NEXT_LEVEL, () => {
        nextLevel();
    })

    eventEmitter.on(Messages.SHOW_RESULTS_AND_RESTART, () => {
        drawResults();
    })
}

class LaserShot extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 56;
        this.height = 54;
        this.type = 'LaserShot';
        this.img = laserShotImg;
    }
}

//function to draw the lifes of the hero
function drawLife() {
    const START_POS = canvas.width - 10;
    //life.png occupies 35 x 27, but we have to add some padding
    for (let i = 0; i < hero.life; i++) {
        ctx.drawImage(lifeImg, START_POS - (45*(i+1)), canvas.height - 37);
    }
}

//function to draw hero's points
function drawPoints() {
    ctx.font = "30px fantasy";
    ctx.fillStyle = "red";
    ctx.textAlign = "left";
    ctx.fillText("Points: " + hero.points, 10, canvas.height-20);
}

//function to know if the hero is dead
function isHeroDead() {
    return hero.life <= 0;
}

//function to know if all enemies are beaten
function isEnemiesDead() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy' && !go.dead);
    return enemies.length === 0;
}

//function to display a message
function displayMessage(message, color = "white") {
    ctx.font = "40px fantasy";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    const maxWidth = canvas.width * 0.7; 
    const lineHeight = 50;

    //split the message in words
    const words = message.split(" ");
    let line = "";
    const lines = [];

    //create the lines of the message
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if(testWidth > maxWidth) {
            lines.push(line);
            line = words[i] + " ";
        }
        else line = testLine;
    }
    lines.push(line);
    //calculate y pos to center the text
    const yStartingPoint = canvas.height/2 - (lines.length * lineHeight)/2;
    //paint lines in the canva
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], canvas.width/2, yStartingPoint + i*lineHeight);
    }
}

//function for managing endgame
function endGame(win) {
    clearInterval(gameLoopId);
    //we are going to set a delay so we are sure all paints have finished correctly
    setTimeout(() => {
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        if (win) displayMessage("Victory!! Press [C] to continue playing next level or [Enter] to start a new game", "green");
        else displayMessage("You died!!! Press [R] to show results and later [Enter] to start a new game.", "red");
    }, 200);
}

//function to continue playing nextlevel 
function nextLevel() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
        yEnemySpeed = (3*yEnemySpeed)/4;
        gameObjects = gameObjects.filter(go => go.type === 'Hero');
        createEnemies();
        gameLoopId = setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            updateGameObjects();
            drawGameObjects(ctx);
            drawPoints();
            drawLife();
        }, 100);
    }
}

//function for making reset of the game
function resetGame() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
        eventEmitter.clear();
        initGame();
        gameLoopId = setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            updateGameObjects();
            drawGameObjects(ctx);
            drawPoints();
            drawLife();
        }, 100);
    }
}

//function to draw a table with the results of the different games played
function drawResults() {
    gamesResults.sort((a, b) => {return b - a});
    const cellWidth = 100;
    const cellHeight = 50;
    const startX = canvas.width/2 - cellWidth;
    const startY = canvas.height/2 - (gamesResults.length * cellHeight)/2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = "40px fantasy";
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    for (let i = 0; i < gamesResults.length; i++) {
        //draw the cell
        ctx.strokeRect(x, y, cellWidth, -cellHeight);
        //write text in the cell
        let textMetrics = ctx.measureText(i);
        let textWidth = textMetrics.width;
        ctx.fillText(i+1, x + cellWidth/2 - textWidth/2 + 10, y - 10);
        x = x + cellWidth;
        ctx.strokeRect(x, y, cellWidth, -cellHeight);
        textMetrics = ctx.measureText(i);
        textWidth = textMetrics.width;
        ctx.fillText(gamesResults[i], x + cellWidth/2 - textWidth/2 + 10, y - 10);
    }
}

//game loop every 100 ms
window.onload = async () => {
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');
    heroImg = await loadTexture('images/player.png');
    enemyImg = await loadTexture('images/enemyShip.png');
    laserImg = await loadTexture('images/laserRed.png');
    laserShotImg = await loadTexture('images/laserRedShot.png');
    lifeImg = await loadTexture('images/life.png');

    initGame();
    gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateGameObjects();
        drawGameObjects(ctx);
        drawPoints();
        drawLife();
    }, 100);
};