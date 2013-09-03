SpawnCube = function(side, x, y){
  this.name = "spawn_box";
  this.__proto__ = new Shape(x, y);

  this.points.push(new Point(0, side*Math.sqrt(2)/2));
  this.points.push(new Point(side*Math.sqrt(2)/2, 0));
  this.points.push(new Point(0, -side*Math.sqrt(2)/2));
  this.points.push(new Point(-side*Math.sqrt(2)/2, 0));
  this.move(this.origin);
};

Ship = function(x, y){
  this.name = "ship";
  this.__proto__ = new Shape(x, y);
  this.cannon_ready = true;
  this.cannon_timeout = 0.2;

  this.rotate = function(direction){
    var amt = 2.5;
    if( direction === "left" ){
      amt = amt * -1;
    }
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].rotate(amt, this.origin);
    }
  };

  this.thrust = function(){
    var force = new Point( this.points[0].subtract(this.origin) );
    var amt = 500;
    force = force.normalize().multiply(amt);
    this.force.set(force);
  };

  this.makeBullet = function(){
    var bullet = new Bullet(this.points[0].x, this.points[0].y);
    var velocity = new Point( this.points[0].subtract(this.origin) );
    var amt = 500;
    velocity = velocity.normalize().multiply(amt);
    bullet.vel.set(velocity);
    return bullet;
  };

  this.handleCollision = function(world){
    world.removeShape(this);
    world.addShape(this.makeFragment(this.points[0], this.points[1]));
    world.addShape(this.makeFragment(this.points[1], this.points[2]));
    world.addShape(this.makeFragment(this.points[2], this.points[0]));
  };

  this.makeFragment = function(point1, point2){
    var fragment = new Fragment(point1.x, point1.y);
    var velocity = new Point(1, 0);
    var amt = 20;
    fragment.__proto__.lifetime = 4;
    velocity = velocity.multiply(amt);
    fragment.vel.set(velocity);
    fragment.vel.rotate(Math.random()*360, new Point(0, 0));
    for (var i = 0; i < fragment.points.length; i++) {
      fragment.points[i].rotate(Math.random()*360, fragment.origin);
    };
    return fragment;
  }

  this.points.push(new Point(0, 20));
  this.points.push(new Point(10,-10));
  this.points.push(new Point(-10, -10));
  this.move(this.origin);
  this.scale(1/2);
};

Bullet = function(x, y){
  this.name = "bullet"
  this.lifetime = 0.75;
  this.kill = false;
  this.timer = 0;
  this.__proto__ = new Shape(x, y);
  this.handleCollision = function(world){
    world.removeShape(this);
  }
  this.update = function(time_step){
    if(this.timer > this.lifetime){
      this.kill = true;
    }
    else{
      this.timer += time_step;
    }
    this.__proto__.update(time_step);
  }

  this.points.push(new Point(0,2));
  this.points.push(new Point(2,0));
  this.points.push(new Point(0,-2));
  this.points.push(new Point(-2,0));
  this.move(this.origin);
};

Particle = function(x, y){
  this.__proto__ = new Bullet(x, y);
  this.name = "particle";
};

Fragment = function(x, y){
  this.__proto__ = new Bullet(x, y);
  this.name = "fragment";
  this.points.splice(0, this.points.length);
  this.points.push(new Point(0,10));
  this.points.push(new Point(0,20));
  this.move(this.origin);
}

Asteroid = function(x, y){
  this.name = "asteroid";
  this.__proto__ = new Shape(x,y);
  this.vel.set((new Point(1, 0)).multiply(75));
  this.rot_amt = Math.random()*20;

  this.makeParticle = function(){
    var particle = new Particle(this.origin.x, this.origin.y);
    var velocity = new Point(1, 0);
    var amt = 100;
    velocity = velocity.multiply(amt);
    particle.vel.set(velocity);
    particle.vel.rotate(Math.random()*360, new Point(0, 0));
    return particle;
  };
  this.handleCollision = function(world){
    world.removeShape(this);
    world.addShape(this.makeParticle());
    world.addShape(this.makeParticle());
    world.addShape(this.makeParticle());
    world.addShape(this.makeParticle());
  };

  this.update = function(time_step){
    this.__proto__.update(time_step);
    this.rotate(this.rot_amt*time_step);
  }


  this.points.push(new Point(0,3));
  this.points.push(new Point(0.7, 2));
  this.points.push(new Point(3, 4));
  this.points.push(new Point(4, 2.2));
  this.points.push(new Point(4.2, 0));
  this.points.push(new Point(2.8, -3.2));
  this.points.push(new Point(0, -3.5));
  this.points.push(new Point(-2, -2,7));
  this.points.push(new Point(-1, 1));
  this.move(this.origin);
  this.scale(20);
  this.rotate(Math.random()*360);
  this.vel.rotate(Math.random()*360, new Point(0, 0));
};

BigAsteroid = function(x, y){
  this.__proto__ = new Asteroid(x, y);
  this.handleCollision = function(world){
    this.__proto__.handleCollision.call(this, world);
    world.addShape(new MediumAsteroid(this.origin.x, this.origin.y));
    world.addShape(new MediumAsteroid(this.origin.x, this.origin.y));
    world.addShape(new MediumAsteroid(this.origin.x, this.origin.y));
  };
};

MediumAsteroid = function(x, y){
  this.__proto__ = new Asteroid(x, y);
  this.vel = this.vel.multiply(Math.random() * (1.5 - 0.75) + 0.75);
  this.handleCollision = function(world){
    this.__proto__.handleCollision.call(this, world);
    world.addShape(new SmallAsteroid(this.origin.x, this.origin.y));
    world.addShape(new SmallAsteroid(this.origin.x, this.origin.y));
    world.addShape(new SmallAsteroid(this.origin.x, this.origin.y));
  };
  this.__proto__.scale.call(this, 1/2);
};

SmallAsteroid = function(x, y){
  this.__proto__ = new Asteroid(x, y);
  this.vel = this.vel.multiply(Math.random() * (2 - 0.75) + 0.75);
  this.__proto__.scale.call(this, 1/8);
};