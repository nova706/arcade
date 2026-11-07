/** Shared canvas setup for renderers that draw their own game-specific scenes. */
export abstract class CanvasRenderer {
  resize(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D rendering is not supported by this browser.");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return context;
  }
}
