//A world is responsible for holding the canvas context,
//resizing the canvas, drawing onto the canvas, and
//keeping track of all its shapes.

World = Class.extend({
  construct: function(ctx, width, height, color){
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.background = color;
    this.stepAmt = 0.01;
    this.shapes = [];
    this.nextShapeID = 0;
    this.setBackground(this.background);
    this.resize(this.width, this.height);
  },

  addShape: function(shape){
    if(shape instanceof Array && shape.length > 0){
      for (var i = 0; i < shape.length; i++) {
        this.addShape(shape[i]);
      }
    }
    else if(!shape.id){
      shape.id = this.nextShapeID++;
      this.shapes.push(shape);
    }
  },

  removeShape: function(shape){
    for (var i = 0; i < this.shapes.length; i++) {
      if(this.shapes[i].id === shape.id){
        this.shapes.splice(i,1);
      }
    }
  },

  update: function(){
    for (var i = 0; i < this.shapes.length; i++) {
      if(this.shapes[i].kill){
        this.shapes.splice(i,1);
      }
      else{
        this.shapes[i].update(this.stepAmt);
      }
    }
  },

  setBackground: function(color){
    this.background = color;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0,0, this.width, this.height);
  },

  resize: function(width, height){
    this.ctx.canvas.setAttribute("width", width);
    this.ctx.canvas.setAttribute("height", height);
    this.setBackground(this.background);
  },

  render: function(){
    //TODO: Find better way to clear screen
    this.ctx.clearRect( 0, 0, this.width, this.height );
    if(this.shapes.length){
      for (var i = 0; i < this.shapes.length; i++) {
        this.shapes[i].draw(this.ctx);
      }
    }
  },

  //Tests to see if shape1 is is within shape2.
  testForCollision: function(shape1, shape2){
    var lines = [],
    nodes = [],
    test_point,
    test_line,
    left_side_count,
    right_side_count,
    i,
    j;

    for (i = 0; i < shape2.points.length; i++) {
      if (i === shape2.points.length - 1) {
        lines.push(new Line(shape2.points[i], shape2.points[0]));
      }
      else{
        lines.push(new Line(shape2.points[i], shape2.points[i+1]));
      }
    }

    for (i = 0; i < shape1.points.length; i++) {
      test_point = shape1.points[i];
      left_side_count = 0;
      right_side_count = 0;
      nodes = [];
      for (j = 0; j < lines.length; j++) {
        test_line = lines[j];
        if( ( (test_point.y < test_line.point1.y) && (test_point.y > test_line.point2.y ) ) || ( (test_point.y < test_line.point2.y) && (test_point.y > test_line.point1.y) ) ){
          nodes.push( test_line.xValueAt(test_point.y) );
        }
      }
      if(nodes.length > 0){
        for (j = 0; j < nodes.length; j++) {
          if( nodes[j] > test_point.x ){
            ++right_side_count;
          }
          else{
            ++left_side_count;
          }
        }
        if( (right_side_count % 2 !== 0) && (left_side_count % 2 !== 0) && (left_side_count === right_side_count) ){
          return true;
        }
      }
    }

    return false;
  }
});

//Point class used for vector calculations.
Point = Class.extend({
  construct: function(x, y){
    if(arguments.length === 1 && arguments[0] instanceof Point){
      this.x = arguments[0].x;
      this.y = arguments[0].y;
    }
    else{
      this.x = x;
      this.y = y;
    }
  },

  set: function(point){
    this.x = point.x;
    this.y = point.y;
  },

  add: function(point){
    return new Point(this.x + point.x, this.y + point.y);
  },

  subtract: function(point){
    return new Point(this.x - point.x, this.y - point.y);
  },

  multiply: function(amt){
    return new Point(this.x * amt, this.y * amt);
  },

  normalize: function(){
    var mag = Math.sqrt( Math.pow(this.x,2) + Math.pow(this.y ,2) );
    return new Point(this.x/mag, this.y/mag);
  },

  rotate: function(angle, origin){
    angle = angle * Math.PI / 180;

    var tempx = Math.cos(angle) * (this.x - origin.x) - Math.sin(angle) * (this.y - origin.y) + origin.x,
    tempy = Math.sin(angle) * (this.x - origin.x) + Math.cos(angle) * (this.y - origin.y) + origin.y;

    this.x = tempx;
    this.y = tempy;
  }
});

Line = Class.extend({
  construct: function(point1, point2){
    this.point1 = point1;
    this.point2 = point2;
    this.slope = (point2.y - point1.y) / (point2.x - point1.x);
    this.y_int = point1.y - this.slope * point1.x;
  },

  xValueAt: function(y){
    return (y - this.y_int) / this.slope;
  }
});

//Game objects are defined as a shape.  Shapes are defined as a number
//of points.
Shape = Class.extend({
  construct: function(x,y){
    this.origin = new Point(x, y);
    this.points = [];
    this.mass = 1;
    this.acc = new Point(0,0);
    this.vel = new Point(0,0);
    this.force = new Point(0 ,0);
    this.avg_acc = new Point(0,0);
  },

  update: function(time_step){
    var oldAcc = this.acc;
    this.updatePos(time_step);
    this.updateAcc();
    var avgAcc = new Point( (oldAcc.x + this.acc.x)/2 , (oldAcc.y + this.acc.y)/2 );
    this.vel = this.vel.add(avgAcc.multiply(time_step));
  },

  updatePos: function(time_step){
    var delta = new Point(this.vel.multiply(time_step));
    delta = delta.add(new Point(0.5 * this.acc.x * Math.pow(time_step, 2), 0.5 * this.acc.y * Math.pow(time_step, 2)));
    this.origin= this.origin.add(delta);
    for (var i = 0; i < this.points.length; i++) {
      this.points[i] = this.points[i].add(delta);
    }
  },

  move: function(point){
    this.origin.set(point);
    for (var i = 0; i < this.points.length; i++) {
      this.points[i] = this.points[i].add(this.origin);
    }
  },

  scale: function(factor){
    for (var i = 0; i < this.points.length; i++){
      this.points[i] = this.points[i].subtract(this.origin).multiply(factor);
    };
    this.move(this.origin);
  },

  rotate: function(angle){
    for (var i = 0; i < this.points.length; i++){
      this.points[i].rotate(angle, this.origin);
    }
  },

  updateAcc: function(){
    this.acc.set(this.force.multiply( 1 / this.mass ));
  },

  draw: function(ctx){
    for(var i = 0; i < this.points.length; i++){
      ctx.beginPath();
      ctx.moveTo(this.points[i].x, this.points[i].y);
      if(i === this.points.length - 1){
        ctx.lineTo(this.points[0].x, this.points[0].y);
      }
      else{
        ctx.lineTo(this.points[i+1].x, this.points[i+1].y);
      }
      ctx.stroke();
    }
  }
});
