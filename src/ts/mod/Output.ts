export interface Output {
    widthInChars: number;
    heightInChars: number;
    drawTextAt(text: string, cx: number, cy: number): void;
    cls(): void;
    clBlock(cx:number, cy:number, cw:number, ch:number): void;
    getW(): number;
    getH(): number;
    onResize():void;
}