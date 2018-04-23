'use strict'

const MAP_WIDTH = 5;
const MAP_HEIGHT = 6;
const MAP_TOP_SAVE_ZONES = 1;
const MAP_BOTTOM_SAVE_ZONES = 1;
const PX_BLOCK_WIDTH = 101;
const PX_BLOCK_HEIGHT = 83;
const PX_ENEMY_WIDTH = 72;
const PX_MAP_WIDTH = MAP_WIDTH * PX_BLOCK_WIDTH;
const directionUp = 38;
const directionDown = 40;
const directionLeft = 37;
const directionRight = 39;


// Entity representing either the player or enemies
let Entity = function() {
};

// Draw the entity on the screen, required method for game
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.getSprite()), this.getXPixels(), this.getYPixels());
};

Entity.prototype.getNumberBetween = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Enemies our player must avoid
let Enemy = function() {
    this.resetPosition();
};

// Enemy inherites from Entity
Enemy.prototype = Object.create(Entity.prototype);

Enemy.prototype.getSprite = function() {
  return 'images/enemy-bug.png';
};

Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for all computers.
    this.xPixels += dt * this.speed;

    if(this.xPixels >= PX_MAP_WIDTH) {
      this.resetPosition();
    }
};

Enemy.prototype.resetPosition = function() {
  let max = 10 * PX_ENEMY_WIDTH; // enemy starts up to 10 times off the screen to vary when they appear
  let min = PX_ENEMY_WIDTH; // to make it seem like the enemy moves in from the left
  this.xPixels = - (this.getNumberBetween(min, max));

  max = MAP_HEIGHT - MAP_TOP_SAVE_ZONES - MAP_BOTTOM_SAVE_ZONES;
  min = MAP_TOP_SAVE_ZONES;
  this.y = this.getNumberBetween(min, max);

  this.resetSpeed();
};

Enemy.prototype.resetSpeed = function() {
  this.speed = this.getNumberBetween(250, 600);
};

Enemy.prototype.stop = function() {
  this.speed = 0;
};

Enemy.prototype.getXPixels = function() {
  return this.xPixels;
};

Enemy.prototype.getYPixels = function() {
  //Returns the column pixel postion related to the current y-tile position
  return 62  + (this.y-1) * PX_BLOCK_HEIGHT;
};

// This is the player entity
let Player = function(charMadeItListener, gameWonListener) {
  this.charMadeItListener = charMadeItListener;
  this.gameWonListener = gameWonListener;

  this.sprites = ['images/char-boy.png',
                  'images/char-pink-girl.png',
                  'images/char-cat-girl.png',
                  'images/char-horn-girl.png',
                  'images/char-princess-girl.png'];
  this.currentSpriteIdx = 0;
  this.charMadeItListener(this.currentSpriteIdx, this.sprites.length);

  this.resetPosition();
};

// Player inherites from Entity
Player.prototype = Object.create(Entity.prototype);

Player.prototype.getSprite = function() {
  return this.sprites[this.currentSpriteIdx];
};

Player.prototype.update = function() {
  // Check for collisions when on stone-block tiles
  if (!this.isBlocked && this.y < MAP_HEIGHT - MAP_BOTTOM_SAVE_ZONES) {
    for(let i=0; i<allEnemies.length; i++) {
      // First check if player and enemy are on the same row
      if (allEnemies[i].y === this.y) {
        // Then check if the x-position collides
        if(this.getXPixels() >= allEnemies[i].getXPixels() && this.getXPixels() <= allEnemies[i].getXPixels() + PX_ENEMY_WIDTH) {
          this.onHit();
          break;
        }
      }
    }
  }
};

Player.prototype.onHit = function() {
  this.isBlocked = true;

  allEnemies.forEach(function(enemy) {
    enemy.stop();
  });

  setTimeout(function() {
    this.resetPosition();
    this.currentSpriteIdx = 0;
    this.charMadeItListener(this.currentSpriteIdx, this.sprites.length);

    allEnemies.forEach(function(enemy) {
      enemy.resetSpeed();
    });
  }.bind(this), 1000);
};

Player.prototype.onMadeIt = function() {
  if(this.currentSpriteIdx < this.sprites.length -1) {
    this.currentSpriteIdx ++; // Switch to next character
    this.charMadeItListener(this.currentSpriteIdx, this.sprites.length);
    this.resetPosition();
  }
  else {
    // Game is won - block player movement and inform the callbacks
    this.isBlocked = true;
    this.charMadeItListener(this.sprites.length, this.sprites.length);
    this.gameWonListener();
  }
};

Player.prototype.resetPosition = function() {
  this.x = Math.floor(MAP_WIDTH/2);
  this.y = MAP_HEIGHT - 1;

  this.isBlocked = false;
};

Player.prototype.handleInput = function(direction) {
  if(this.isBlocked) return;

  switch(direction) {
    case directionUp:
      this.y -= 1;

      if(this.y === 0) {
        this.onMadeIt();
      }

      break;
    case directionDown:
      if(this.y < MAP_HEIGHT - 1) {
        this.y += 1;
      }
      break;
    case directionLeft:
      if(this.x > 0) {
        this.x -= 1;
      }
      break;
    case directionRight:
      if(this.x < MAP_WIDTH-1) {
        this.x += 1;
      }
      break;
    default:
      return;
  }
};

Player.prototype.getXPixels = function() {
  //Returns the row pixel postion related to the current x-tile position
  return this.x * PX_BLOCK_WIDTH;
};

Player.prototype.getYPixels = function() {
  //Returns the column pixel postion related to the current y-tile position
  return this.y * PX_BLOCK_HEIGHT - 10;
};


// Define global variables
let elmntTimerMin = document.querySelector('.score-panel .timer-minutes');
let elmntTimerSec = document.querySelector('.score-panel .timer-seconds');
let elmntSavedChars = document.querySelector('.score-panel .saved-value');
let elmntModal = document.querySelector('.modal');
let elmntModalTimerMin = document.querySelector('.modal .timer-minutes');
let elmntModalTimerSec = document.querySelector('.modal .timer-seconds');
let timerInterval;
let allEnemies;
let player;


// Character made it callback
let onCharMadeIt = function(savedChars, totalChars) {
  elmntSavedChars.textContent = savedChars + '/' + totalChars;
};

// Game won callback to show the winning modal
let onGameWon = function() {
  clearInterval(timerInterval);
  timerInterval = null;

  elmntModalTimerMin.textContent = elmntTimerMin.textContent;
  elmntModalTimerSec.textContent = elmntTimerSec.textContent;
  elmntModal.style.display = 'block'
};

// newGame function that will be used to start the game when the page is loaded
// and when the user hits the restart button
let newGame = function() {
  // Instantiate player and enemies
  player = new Player(onCharMadeIt, onGameWon);
  allEnemies = [new Enemy(), new Enemy(), new Enemy(), new Enemy(), new Enemy()];

  // Reset gui
  elmntModal.style.display = 'none';
  elmntTimerMin.textContent = '00';
  elmntTimerSec.textContent = '00';

  // Clear possible existing timers
  if(timerInterval != null) {
    clearInterval(timerInterval);
  }

  // Initialize timer to count the time it takes the user to win the game
  timerInterval = setInterval(function() {
    if(parseInt(elmntTimerSec.textContent) === 59) {
      elmntTimerSec.textContent = '00';
      elmntTimerMin.textContent = ('0' + (parseInt(timerMinElement.textContent) + 1)).slice(-2);
    }
    else {
      elmntTimerSec.textContent = ('0' + (parseInt(elmntTimerSec.textContent) + 1)).slice(-2);
    }
  }, 1000);
};


document.addEventListener('keyup', function(e) {
    player.handleInput(e.keyCode);
});

document.querySelectorAll('.restart').forEach(function(each) {
  each.addEventListener('click', function(event) {
    newGame();
  });
});

//finally start the game
newGame();
