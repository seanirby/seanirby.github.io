//Used to ensure that the ship spawns in a safe zone.
SpawnCube = Shape.extend({
  construct: function(side, x, y){
    arguments.callee.$.construct.call(this, x, y);
    this.name = "spawn_box";
    this.points.push(new Point(0, side*Math.sqrt(2)/2));
    this.points.push(new Point(side*Math.sqrt(2)/2, 0));
    this.points.push(new Point(0, -side*Math.sqrt(2)/2));
    this.points.push(new Point(-side*Math.sqrt(2)/2, 0));
    this.move(this.origin);
  }
});

Ship = Shape.extend({
  construct: function(x, y){
    arguments.callee.$.construct.call(this, x, y);
    this.name = "ship";
    this.cannon_ready = true;
    this.cannon_timeout = 0.2;
    this.points.push(new Point(0, 20));
    this.points.push(new Point(10,-10));
    this.points.push(new Point(-10, -10));
    this.move(this.origin);
    this.scale(1/2);
  },

  rotate: function(direction){
    var amt = 2.5;

    if( direction === "left" ){
      amt = amt * -1;
    }
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].rotate(amt, this.origin);
    }
  },

  thrust: function(){
    var force = new Point( this.points[0].subtract(this.origin) ),
      amt = 500;
    force = force.normalize().multiply(amt);
    this.force.set(force);
  },

  makeBullet: function(){
    var bullet = new Bullet(this.points[0].x, this.points[0].y),
      velocity = new Point(this.points[0].subtract(this.origin)),
      amt = 500;

    velocity = velocity.normalize().multiply(amt);
    bullet.vel.set(velocity);

    return bullet;
  },

  handleCollision: function(world){
    world.removeShape(this);
    world.addShape([ this.makeFragment(this.points[0], this.points[1]),
                     this.makeFragment(this.points[1], this.points[2]),
                     this.makeFragment(this.points[2], this.points[0])]);
  },

  makeFragment: function(point1, point2){
    var fragment = new Fragment(point1.x, point1.y),
      velocity = new Point(1, 0),
      amt = 20;

    fragment.__proto__.lifetime = 4;
    velocity = velocity.multiply(amt);
    fragment.vel.set(velocity);
    fragment.vel.rotate(Math.random()*360, new Point(0, 0));
    for (var i = 0; i < fragment.points.length; i++) {
      fragment.points[i].rotate(Math.random()*360, fragment.origin);
    };

    return fragment;
  }

});

Bullet = Shape.extend({
  construct: function(x,y){
    arguments.callee.$.construct.call(this, x, y);
    this.name = "bullet";
    this.lifetime = 0.75;
    this.kill = false;
    this.timer = 0;
    this.points.push(new Point(0,2));
    this.points.push(new Point(2,0));
    this.points.push(new Point(0,-2));
    this.points.push(new Point(-2,0));
    this.move(this.origin);
  },

  handleCollision: function(world){
    world.removeShape(this);
  },

  update: function(time_step){
    if(this.timer > this.lifetime){
      this.kill = true;
    }
    else{
      this.timer += time_step;
    }
    arguments.callee.$.update.call(this, time_step);
  }
});

//Used for asteroid explosions.
Particle = Bullet.extend({
  construct: function(x,y){
    arguments.callee.$.construct.call(this, x, y);
    this.name = "particle";
  }
});

//Used for ship explosions.
Fragment = Bullet.extend({
  construct: function(x,y){
    arguments.callee.$.construct.call(this, x, y);
    this.name = "fragment";
    this.points.splice(0, this.points.length);
    this.points.push(new Point(0,10));
    this.points.push(new Point(0,20));
    this.move(this.origin);
  }
});

Asteroid = Shape.extend({
  construct: function(x,y){
    arguments.callee.$.construct.call(this, x, y);
    this.name = "asteroid";
    this.vel.set(new Point(1,0).multiply(75));
    this.rot_amt = Math.random()*20;
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
  },

  makeParticles: function(){
    var amt = 100,
      number_of_particles = 4,
      particles = [];

    for (var i = 0; i < number_of_particles; i++) {
      var particle = new Particle(this.origin.x, this.origin.y),
        velocity = new Point(1, 0);

      velocity = velocity.multiply(amt);
      particle.vel.set(velocity);
      particle.vel.rotate(Math.random()*360, new Point(0, 0));
      particles.push(particle);
    };

    return particles;
  },

  handleCollision: function(world){
    world.removeShape(this);
    world.addShape(this.makeParticles());
  },

  update: function(time_step){
    arguments.callee.$.update.call(this, time_step);
    this.rotate(this.rot_amt*time_step);
  }
});

BigAsteroid = Asteroid.extend({
  construct: function(x, y){
    arguments.callee.$.construct.call(this, x,y);
  },

  handleCollision: function(world){
    arguments.callee.$.handleCollision.call(this, world);
    world.addShape([new MediumAsteroid(this.origin.x, this.origin.y),
                  new MediumAsteroid(this.origin.x, this.origin.y),
                  new MediumAsteroid(this.origin.x, this.origin.y)]);
  }
});

MediumAsteroid = Asteroid.extend({
  construct: function(x, y){
    arguments.callee.$.construct.call(this, x, y);
    this.vel = this.vel.multiply(Math.random() * 0.75 + 0.75);
    arguments.callee.$.scale.call(this, 1/2);
  },

  handleCollision: function(world){
    arguments.callee.$.handleCollision.call(this, world);
    world.addShape([new SmallAsteroid(this.origin.x, this.origin.y),
                  new SmallAsteroid(this.origin.x, this.origin.y),
                  new SmallAsteroid(this.origin.x, this.origin.y)]);
  }
});

SmallAsteroid = Asteroid.extend({
  construct: function(x, y){
    arguments.callee.$.construct.call(this, x, y);
    this.vel = this.vel.multiply(Math.random() * 1.25 + 0.75);
    arguments.callee.$.scale.call(this, 1/8);
  }
});