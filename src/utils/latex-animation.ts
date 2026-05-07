export type AnimatedLikeObject = {
  __latexId?: string;
  opacity?: number;
};

export function resolveAnimationTargetOpacity(obj: AnimatedLikeObject): number {
  if (obj.__latexId) return 0;
  if ((obj as any)._targetOpacity !== undefined) return (obj as any)._targetOpacity;
  return typeof obj.opacity === 'number' ? obj.opacity : 1;
}

export function shouldAnimateLatexOverlay(obj: AnimatedLikeObject): boolean {
  return Boolean(obj.__latexId);
}
