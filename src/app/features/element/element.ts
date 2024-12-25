export interface Element {
    id: string;
    name: string;
    emoji: string;
}

export interface CanvasElement {
    canvasId: string;
    element: Element;
    x: number;
    y: number;
    isMarkedForMerge?: boolean;
}

export const DEFAULT_ELEMENTS: Element[] =  [
    { id: '1', name: 'Water', emoji: '💧' },
    { id: '2', name: 'Earth', emoji: '🪨' },
    { id: '3', name: 'Fire', emoji: '🔥' },
    { id: '4', name: 'Air', emoji: '🍃' },
] as const;