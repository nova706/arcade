import { GameObject, type PhysicsBody, type PhysicsWorld } from "../../../engine";

export abstract class PhysicsObject extends GameObject {
  protected constructor(
    id: string,
    protected readonly physics: PhysicsWorld,
    protected readonly body: PhysicsBody,
  ) {
    super(id);
  }

  get x(): number {
    return this.physics.getPosition(this.body).x;
  }

  get y(): number {
    return this.physics.getPosition(this.body).y;
  }

  get velocity(): { x: number; y: number } {
    return this.physics.getVelocity(this.body);
  }

  setVelocity(x: number, y: number): void {
    this.physics.setVelocity(this.body, { x, y });
  }

  setPosition(x: number, y: number): void {
    this.physics.setPosition(this.body, { x, y });
  }

  scale(scaleX: number, scaleY: number): void {
    this.physics.scale(this.body, scaleX, scaleY);
  }

  protected onDestroy(): void {
    this.physics.remove(this.body);
  }
}
