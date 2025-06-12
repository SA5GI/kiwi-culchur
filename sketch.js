let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

let engine, world;
let signs = [];
let ground;
let font;
let signImg;
let typedText = '';
let cursorVisible = true;
let lastCursorToggle = 0;

let animationText = '';
let fullPrompt = '';
let animIndex = 0;
let isErasing = false;
let lastAnimTime = 0;
let animDelay = 80;
let animationActive = true;

let lastUserActivity = 0;
let idleThreshold = 5000; // 15 seconds

const promptOptions = [
  "Fav street? Drop it.",
  "Street that raised you?",
  "Where’s the vibe?",
  "Street = main character?",
  "Name a street, any street.",
  "Street with best snacks?",
  "Dream street name?",
  "Your GPS’s favorite?",
  "Where’s the drama?",
  "Type a street that hits.",
  "Street you yell in arguments?",
  "Underrated street?",
  "Comfort street?",
  "Street that feels like home?",
  "Street you’d tattoo?",
  "Most chaotic street?",
  "Street that slaps?",
  "Favorite lost street?",
  "Coolest-sounding street?",
  "Street you'd haunt?",
  "Street you’d write a poem for?",
  "Your “origin story” street?",
  "Street with main vibe energy?",
  "Most mysterious street?",
  "Street you’d marry?",
  "Your cinematic street?",
  "Drop your daydream street.",
  "If a street was a crush..."
];

function preload() {
  font = loadFont('europa-bold-webfont.ttf');
  signImg = loadImage('Sign.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();
  world = engine.world;
  Engine.run(engine);

  ground = Bodies.rectangle(width / 2, height + 10, width, 20, { isStatic: true });
  let wallLeft = Bodies.rectangle(-10, height / 2, 20, height, { isStatic: true });
  let wallRight = Bodies.rectangle(width + 10, height / 2, 20, height, { isStatic: true });
  World.add(world, [ground, wallLeft, wallRight]);

  textFont(font);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  imageMode(CENTER);

  pickNewPrompt();
  lastUserActivity = millis();
}

function draw() {
  background('#155843');

  // Draw ground
  noStroke();
  fill('#155843');
  rect(ground.position.x, ground.position.y, width, 20);

  // Update signs
  for (let i = signs.length - 1; i >= 0; i--) {
    signs[i].update();
    signs[i].show();
    if (signs[i].isDone()) {
      World.remove(world, signs[i].body);
      signs.splice(i, 1);
    }
  }

  // Flickering cursor
  if (millis() - lastCursorToggle > 500) {
    cursorVisible = !cursorVisible;
    lastCursorToggle = millis();
  }

  // Resume animation if idle
  if (!animationActive && millis() - lastUserActivity > idleThreshold) {
    animationActive = true;
    pickNewPrompt();
  }

  // Animate prompt
  if (animationActive) {
    if (millis() - lastAnimTime > animDelay) {
      if (!isErasing) {
        if (animIndex < fullPrompt.length) {
          animationText += fullPrompt[animIndex];
          animIndex++;
        } else {
          isErasing = true;
        }
      } else {
        if (animationText.length > 0) {
          animationText = animationText.slice(0, -1);
        } else {
          pickNewPrompt(); // 🟢 switch to a new random prompt after erasing
        }
      }
      lastAnimTime = millis();
    }

    fill(255, 100);
    textSize(32);
    text(animationText + (cursorVisible ? '|' : ''), width / 2, height / 2);
  } else {
    // Show user-typed input
    fill(255);
    textSize(32);
    let displayText = capitalizeWords(typedText);
    if (cursorVisible) displayText += '|';
    text(displayText, width / 2, height / 2);
  }
}

function keyPressed() {
  lastUserActivity = millis();
  animationActive = false;

  if (keyCode === ENTER) {
    if (typedText.trim().length > 0) {
      const label = capitalizeWords(typedText.trim());
      signs.push(new Sign(label));
    }
    typedText = '';
    return false;
  }

  if (keyCode === BACKSPACE) {
    typedText = typedText.slice(0, -1);
    return false;
  }
}

function keyTyped() {
  lastUserActivity = millis();
  animationActive = false;

  if (key.length === 1) {
    typedText += key;
  }
  return false;
}

function mousePressed() {
  for (let sign of signs) {
    sign.checkClick(mouseX, mouseY);
  }
}

class Sign {
  constructor(label) {
    this.label = label;
    textSize(28);
    let baseWidth = 60;
    let textW = textWidth(label) * 1.2;
    let scale = 1.2;
    this.w = constrain((baseWidth + textW) * scale, 160 * scale, 600 * scale);
    this.h = 120 * scale;
    let x = width / 2 + random(-300, 300);
    let y = -100;

    this.body = Bodies.rectangle(x, y, this.w, this.h, {
      restitution: 0.6,
      friction: 0.1,
      frictionStatic: 10,
      angle: radians(random() > 0.5 ? random(30, 45) : random(-45, -30)),
      chamfer: { radius: 1 }
    });

    this.scale = 1;
    this.shrinking = false;
    this.removeFrame = 0;

    World.add(world, this.body);
  }

  update() {
    if (this.shrinking) {
      this.scale *= 0.85;
      if (this.scale < 0.05) {
        this.removeFrame = true;
      }
    }
  }

  show() {
    let pos = this.body.position;
    let angle = this.body.angle;

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    scale(this.scale);
    image(signImg, 0, 0, this.w, this.h);
    fill(0);
    textSize(28);
    text(this.label, 0, 0);
    pop();
  }

  checkClick(mx, my) {
    if (this.shrinking) return;

    let pos = this.body.position;
    let angle = this.body.angle;
    let local = createVector(mx - pos.x, my - pos.y).rotate(-angle);
    let hw = (this.w * this.scale) / 2;
    let hh = (this.h * this.scale) / 2;

    if (local.x > -hw && local.x < hw && local.y > -hh && local.y < hh) {
      this.shrinking = true;
      Matter.Body.setStatic(this.body, true);
    }
  }

  isDone() {
    return this.removeFrame;
  }
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function pickNewPrompt() {
  fullPrompt = random(promptOptions);
  animationText = '';
  animIndex = 0;
  isErasing = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
