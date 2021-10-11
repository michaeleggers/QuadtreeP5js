class Ball {
  constructor(radius, pos, velocity) {
    this.radius = radius;
    this.pos = pos;
    this.velocity =  velocity;
  }

  draw() {
    fill('red')
    stroke('black')
    strokeWeight(1)
    circle(this.pos.x, this.pos.y, this.radius*2.0)
  }
}

class LineSegment {
  constructor(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
  }
  
  draw() {
    line(this.v1.x, this.v1.y,
         this.v2.x, this.v2.y);
    //point(this.v1.x, this.v1.y);
  }
}

class Level {
  constructor(lineSegments) {
    this.lineSegments = lineSegments;
  }
  
  draw() {
    this.lineSegments.forEach((segment) => {
      segment.draw();
    })
  }
}

function linesegmentVsLinesegment(ls1, ls2) {
  let s = p5.Vector.sub(ls1.v2, ls1.v1);
  let t = p5.Vector.sub(ls2.v2, ls2.v1);

  let sXt = p5.Vector.cross(s, t);
  
  // early out if lines are parallel to each other
  if (sXt.z === 0.0) 
    return false;
  
  let a = p5.Vector.sub(p5.Vector.cross(ls2.v1, t), p5.Vector.cross(ls1.v1, t));
  let b = p5.Vector.add(p5.Vector.cross(p5.Vector.mult(ls1.v1, -1), s), p5.Vector.cross(ls2.v1, s));

  let d1 = (a.z) / sXt.z;
  let d2 = (b.z) / sXt.z;

  if (d1 >= 0.0 && d1 <= 1.0 && d2 >= 0.0 && d2 <= 1.0) 
    return true;

  return false; 
}

function pointVsBox(p, ls1, ls2, ls3, ls4) {
  if (p.x > ls1.v2.x) return false;
  if (p.x < ls1.v1.x) return false;
  if (p.y < ls1.v1.y) return false;
  if (p.y > ls2.v2.y) return false;

  return true;
}

function linesegmentVsBox(ls, top, right, bottom, left) {  
  let check1 = linesegmentVsLinesegment(ls, top);
  let check2 = linesegmentVsLinesegment(ls, right);
  let check3 = linesegmentVsLinesegment(ls, bottom);
  let check4 = linesegmentVsLinesegment(ls, left);
  
  if (check1 || check2 || check3 || check4)
    return true;
  
  return false;
}

class Quadtree {
  constructor(ls1, ls2, ls3, ls4, maxLinesegments) {
    this.ls1 = ls1;
    this.ls2 = ls2;
    this.ls3 = ls3;
    this.ls4 = ls4;
    this.w = ls1.v1.dist(ls1.v2);
    this.h = ls2.v1.dist(ls2.v2);
    this.a = undefined;
    this.b = undefined;
    this.c = undefined;
    this.d = undefined;
    this.linesegments = [];
    this.maxLinesegments = maxLinesegments;
  }
  
  _putInSubtree(ls, maxDepth) {
    
    // Upper left
    if (pointVsBox(ls.v1, this.a.ls1, this.a.ls2, this.a.ls3, this.a.ls4) ||
        pointVsBox(ls.v2, this.a.ls1, this.a.ls2, this.a.ls3, this.a.ls4)) {
      this.a.insert(ls, maxDepth);
    }
    else {
      let topLeft  = linesegmentVsBox(ls, this.a.ls1, this.a.ls2, this.a.ls3, this.a.ls4);
      if (topLeft)
        this.a.insert(ls, maxDepth);
    }
    
    // Upper Right
    if (pointVsBox(ls.v1, this.b.ls1, this.b.ls2, this.b.ls3, this.b.ls4) ||
        pointVsBox(ls.v2, this.b.ls1, this.b.ls2, this.b.ls3, this.b.ls4)) {
      this.b.insert(ls, maxDepth);
    }
    else {
      let topRight  = linesegmentVsBox(ls, this.b.ls1, this.b.ls2, this.b.ls3, this.b.ls4);
      if (topRight)
        this.b.insert(ls, maxDepth);
    }
  
    // Bottom Right
    if (pointVsBox(ls.v1, this.c.ls1, this.c.ls2, this.c.ls3, this.c.ls4) ||
        pointVsBox(ls.v2, this.c.ls1, this.c.ls2, this.c.ls3, this.c.ls4)) {
      this.c.insert(ls, maxDepth);
    }
    else {
      let bottomRight  = linesegmentVsBox(ls, this.c.ls1, this.c.ls2, this.c.ls3, this.c.ls4);
      if (bottomRight)
        this.c.insert(ls, maxDepth);
    }
    
    // Bottom Left
    if (pointVsBox(ls.v1, this.d.ls1, this.d.ls2, this.d.ls3, this.d.ls4) ||
        pointVsBox(ls.v2, this.d.ls1, this.d.ls2, this.d.ls3, this.d.ls4)) {
      this.d.insert(ls, maxDepth);
    }
    else {
      let bottomLeft  = linesegmentVsBox(ls, this.d.ls1, this.d.ls2, this.d.ls3, this.d.ls4);
      if (bottomLeft)
        this.d.insert(ls, maxDepth);
    }
  }
  
  isLeaf() {
    return !this.a && !this.b && !this.c && !this.d;
  }
  
  insert(ls, maxDepth) {
    if (maxDepth === 0) {
      return this.linesegments.push(ls);
    }
    maxDepth--;
    console.log(maxDepth)
        
    if (this.isLeaf()) {
      if (this.linesegments.length < this.maxLinesegments) {
        return this.linesegments.push(ls);
      }
      else {
        this.split();
      }
    }
    
    // Push this linesegment into the subtree
    this._putInSubtree(ls, maxDepth);
    
    // Push existing linesegments down into subtree
    this.linesegments.forEach((lss) => { 
      this._putInSubtree(lss, maxDepth);
    });
    
    this.linesegments = [];
  }
  
  split() {
    let dxHalf = this.ls1.v1.dist(this.ls1.v2) / 2.0;
    let dyHalf = this.ls2.v1.dist(this.ls2.v2) / 2.0;
    
    // Upper Left Box
    let v1 = this.ls1.v1;
    let v2 = createVector(v1.x + dxHalf, v1.y);
    let v3 = createVector(v2.x, v2.y + dyHalf);
    let v4 = createVector(v1.x, v1.y + dyHalf);
    this.a = new Quadtree(
      new LineSegment(v1, v2),
      new LineSegment(v2, v3),
      new LineSegment(v3, v4),
      new LineSegment(v4, v1),
      this.maxLinesegments
    );
    
    // Upper Right Box
    let v11 = createVector(v1.x + dxHalf, v1.y);
    let v21 = createVector(v2.x + dxHalf, v2.y);
    let v31 = createVector(v3.x + dxHalf, v3.y);
    let v41 = createVector(v4.x + dxHalf, v4.y);
    this.b = new Quadtree(
      new LineSegment(v11, v21),
      new LineSegment(v21, v31),
      new LineSegment(v31, v41),
      new LineSegment(v41, v11),
      this.maxLinesegments
    );
    
    // Bottom Right Box
    let v12 = createVector(v1.x + dxHalf, v1.y + dyHalf);
    let v22 = createVector(v2.x + dxHalf, v2.y + dyHalf);
    let v32 = createVector(v3.x + dxHalf, v3.y + dyHalf);
    let v42 = createVector(v4.x + dxHalf, v4.y + dyHalf);
    this.c = new Quadtree(
      new LineSegment(v12, v22),
      new LineSegment(v22, v32),
      new LineSegment(v32, v42),
      new LineSegment(v42, v12),
      this.maxLinesegments
    );
    
    // Bottom Left Box
    let v13 = createVector(v1.x, v1.y + dyHalf);
    let v23 = createVector(v2.x, v2.y + dyHalf);
    let v33 = createVector(v3.x, v3.y + dyHalf);
    let v43 = createVector(v4.x, v4.y + dyHalf);
    this.d = new Quadtree(
      new LineSegment(v13, v23),
      new LineSegment(v23, v33),
      new LineSegment(v33, v43),
      new LineSegment(v43, v13),
      this.maxLinesegments
    );
    
    return this;
  }
  
  draw() {
    strokeWeight(1);
    this.ls1.draw();
    this.ls2.draw();
    this.ls3.draw();
    this.ls4.draw();
    if (this.a != undefined) {
      stroke(0, 0, 0);
      this.a.draw();
    }
    if (this.b != undefined) {
      stroke(0, 0, 0);
      this.b.draw();
    }
    if (this.c != undefined) {
      stroke(0, 0, 0);
      this.c.draw();
    }
    if (this.d != undefined) {
      stroke(0, 0, 0);
      this.d.draw();
    }
    
    stroke(255);
    strokeWeight(4);
    this.linesegments.forEach((ls) => {
      ls.draw();
    })
  }
}

let lineSegment1;
let lineSegment2;
let level;
let qt;
let cnv;
let mouseStateType = {
  idle: 0,
  clickedOnce: 1,
} 
let mouseState;
let mouseX1;
let mouseY1;
let ModeType = {
  placeWall: 0,
  spawnBall: 1
};
let currentMode;
let toggleModeButton;
let balls;

function checkMouseState() {
  if (currentMode === ModeType.placeWall) {
    if (mouseState === mouseStateType.idle) {
      //console.log('idle -> mouseClicked')
      mouseState = mouseStateType.clickedOnce;
      mouseX1 = mouseX;
      mouseY1 = mouseY;
    }
    else if (mouseState === mouseStateType.clickedOnce) {
      //console.log('clickedOnce -> idle')
      mouseState = mouseStateType.idle;
      qt.insert(
        new LineSegment(
          createVector(mouseX1, mouseY1), createVector(mouseX, mouseY)), 10
      );
    }
  }
  else if (currentMode === ModeType.spawnBall) {
    balls.push(new Ball(5.0, createVector(mouseX, mouseY), createVector(10, 10)))
  }
}

function drawBalls() {
  balls.forEach((ball) => {
    ball.draw()
  })
}

function setup() {
  cnv = createCanvas(1000, 1000);
  cnv.mouseClicked(checkMouseState)
  
  mouseState = mouseStateType.idle;
  
  var segments = [
    new LineSegment(createVector(10, 10), createVector(500, 500)),
    new LineSegment(createVector(100, 100), createVector(300, 10)),
  ];
  level = new Level(segments);
  let test = linesegmentVsLinesegment(segments[0], segments[1]);
  console.log(test);
  
  qt = new Quadtree(
    new LineSegment(createVector(0, 0), createVector(width, 0)),
    new LineSegment(createVector(width, 0), createVector(width, height)),
    new LineSegment(createVector(width, height), createVector(0, height)),
    new LineSegment(createVector(0, height), createVector(0, 0)),
    3
  );

  currentMode = ModeType.placeWall

  toggleModeButton = createButton('spawn ball')
  toggleModeButton.position(0, 0)
  toggleModeButton.mousePressed(toggleMode)

  balls = []
}

function toggleMode() {
  if (currentMode === ModeType.placeWall) {
    currentMode = ModeType.spawnBall
    toggleModeButton.html('place wall')
  }
  else if (currentMode === ModeType.spawnBall) {
    currentMode = ModeType.placeWall
    toggleModeButton.html('spawn ball')
  }
}

function preload() {

}

function drawLinePreview() {
  line(mouseX1, mouseY1, mouseX, mouseY);
}

function draw() {
  stroke(0, 0, 0);
  strokeWeight(5);
  background(220);

  if (currentMode === ModeType.placeWall) {
    if (mouseState === mouseStateType.clickedOnce) {
      drawLinePreview();
    }
  }


 // level.draw();
  drawBalls();
  qt.draw();
}