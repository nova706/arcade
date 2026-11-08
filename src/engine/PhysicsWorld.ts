import * as Matter from "matter-js";

export type PhysicsBody = Matter.Body;

export interface PhysicsBodyOptions {
  isStatic?: boolean;
  friction?: number;
  frictionAir?: number;
  restitution?: number;
  label?: string;
}

export interface PhysicsPoint {
  x: number;
  y: number;
}

export interface PhysicsGravity extends PhysicsPoint {
  scale?: number;
}

/** Small Matter.js wrapper for deterministic ownership of a game's 2D bodies. */
export class PhysicsWorld {
  private readonly engine: Matter.Engine;
  private accumulator = 0;

  constructor(gravity: PhysicsGravity = { x: 0, y: 1, scale: 0.001 }) {
    this.engine = Matter.Engine.create({ gravity });
  }

  createRectangle(x: number, y: number, width: number, height: number, options: PhysicsBodyOptions = {}): PhysicsBody {
    const body = Matter.Bodies.rectangle(x, y, width, height, options);
    Matter.Composite.add(this.engine.world, body);
    return body;
  }

  createCircle(x: number, y: number, radius: number, options: PhysicsBodyOptions = {}): PhysicsBody {
    const body = Matter.Bodies.circle(x, y, radius, options);
    Matter.Composite.add(this.engine.world, body);
    return body;
  }

  getPosition(body: PhysicsBody): PhysicsPoint {
    return { x: body.position.x, y: body.position.y };
  }

  getVelocity(body: PhysicsBody): PhysicsPoint {
    return { x: body.velocity.x * 60, y: body.velocity.y * 60 };
  }

  setPosition(body: PhysicsBody, position: PhysicsPoint): void {
    Matter.Body.setPosition(body, position);
  }

  setVelocity(body: PhysicsBody, velocity: PhysicsPoint): void {
    Matter.Body.setVelocity(body, { x: velocity.x / 60, y: velocity.y / 60 });
  }

  scale(body: PhysicsBody, scaleX: number, scaleY: number): void {
    Matter.Body.scale(body, scaleX, scaleY);
  }

  step(deltaSeconds: number): void {
    const fixedStepMilliseconds = 1000 / 60;
    this.accumulator += Math.min(Math.max(deltaSeconds, 0), 0.05) * 1000;
    while (this.accumulator >= fixedStepMilliseconds) {
      Matter.Engine.update(this.engine, fixedStepMilliseconds);
      this.accumulator -= fixedStepMilliseconds;
    }
  }

  remove(body: PhysicsBody): void {
    Matter.Composite.remove(this.engine.world, body);
  }

  clear(): void {
    Matter.Composite.clear(this.engine.world, false, true);
    Matter.Engine.clear(this.engine);
    this.accumulator = 0;
  }
}
