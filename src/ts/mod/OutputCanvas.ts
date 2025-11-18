import { Output } from "./Output.js";

type Chunk = {
    [key: number]: HTMLCanvasElement | OffscreenCanvas;
}

export class OutputCanvas implements Output {
    container: HTMLElement;
    canvas: HTMLCanvasElement[] = [];
    ctx: CanvasRenderingContext2D[] = [];
    charWidth = 8;
    charHeight = 16;
    widthInChars = 80;
    heightInChars = 25;
    width = this.widthInChars * this.charWidth;
    height = this.heightInChars * this.charHeight;
    public needRefresh = false;
    bcolor = "darkslategrey";
    tcolor = "lightgrey";

    layersNum: 1 | 2 = 1;
    visibleLayer = 0;
    workingLayer = this.layersNum == 1 ? 0 : 1;

    chrCache = true;
    chrChunkShift = 4;
    chrChunkSize = 1 << this.chrChunkShift;
    chrChunkMask = this.chrChunkSize - 1;
    chrChunks: Chunk = {};

    conf = {
        fontFamily: "'Consolas', 'Lucida Console', monospace",
        fontSize: 20,
        scount: 100,
        wspace: 2,
        hspace: 2,
    };
    ctxConf = { alpha: false };

    constructor(container: HTMLElement | null, layersNum: 1 | 2 = 2, chrCache = true, extconf = {}) {
        if (!container) throw ("wtf?!");
        this.container = container;
        this.chrCache = chrCache;
        this.layersNum = layersNum;
        if (typeof extconf === 'object') this.conf = { ...this.conf, ...extconf };

        for (let i = 0; i < this.layersNum; i++) {
            const canvas = document.createElement("canvas");
            this.container.appendChild(canvas);
            canvas.classList.add('canvas-layer');
            if (i == this.visibleLayer) canvas.classList.add('active');
            this.canvas.push(canvas);
            this.ctx.push(canvas.getContext('2d', this.ctxConf) as CanvasRenderingContext2D);
        }
        this.workingLayer = this.layersNum == 1 ? 0 : 1;

        this.onResize()
    }

    public onResize() {
        this.calcSize();
        this.width = this.widthInChars * this.charWidth;
        this.height = this.heightInChars * this.charHeight;
        for (let i = 0; i < this.layersNum; i++) {
            this.canvas[i].width = this.width;
            this.canvas[i].height = this.heightInChars * this.charHeight;
            this.ctx[i].fillStyle = this.bcolor;
            this.ctx[i].textBaseline = 'top';
            this.ctx[i].font = this.conf.fontSize + "px " + this.conf.fontFamily;
            this.ctx[i].fillStyle = this.tcolor;
        }
        this.drawTextAt("if you this, try to press <enter>, <1> or hz", 0, 0);
    }

    private calcSize() {
        const stest = document.createElement('span');
        this.container.appendChild(stest);
        stest.style.fontFamily = this.conf.fontFamily;
        stest.style.fontSize = this.conf.fontSize + "px";
        stest.style.display = "flex";
        stest.innerHTML = "x".repeat(this.conf.scount);
        this.charWidth = stest.offsetWidth / this.conf.scount;
        this.charHeight = this.conf.fontSize;
        stest.remove();
        this.widthInChars = (window.innerWidth / this.charWidth | 0) - this.conf.wspace;
        this.heightInChars = (window.innerHeight / this.charHeight | 0) - this.conf.hspace;
    }

    public getW() {
        return this.widthInChars;
    };
    
    public getH() {
        return this.heightInChars;
    };

    pcount = 0;

    private createChunk(chunk = 0) {
        const canvas = document.createElement("canvas");
        canvas.width = this.charWidth;
        canvas.height = this.charHeight * this.chrChunkSize;
        const ctx = canvas.getContext('2d', this.ctxConf) as CanvasRenderingContext2D;

        const chrCanvas = document.createElement("canvas");
        chrCanvas.width = this.charWidth;
        chrCanvas.height = this.charHeight;
        const chrCtx = chrCanvas.getContext('2d', this.ctxConf) as CanvasRenderingContext2D;
        chrCtx.textBaseline = 'top';
        chrCtx.textAlign = 'start';
        chrCtx.font = this.conf.fontSize + "px " + this.conf.fontFamily;

        let code = chunk << this.chrChunkShift;
        for (let i = 0; i < this.chrChunkSize; i++, code++) {
            chrCtx.fillStyle = this.bcolor;
            // chrCtx.fillStyle = 'black';
            chrCtx.fillRect(0, 0, this.charWidth, this.charHeight);
            chrCtx.fillStyle = this.tcolor;
            chrCtx.fillText(String.fromCharCode(code), 0, 0);
            ctx.drawImage(chrCanvas, 0, i * this.charHeight);
        }
        this.chrChunks[chunk] = canvas;
    }

    private fillChunkedText(text: string, x: number, y: number) {
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            const chunk = code >> this.chrChunkShift;
            if (!(chunk in this.chrChunks)) this.createChunk(chunk);
            this.ctx[this.workingLayer].drawImage(
                this.chrChunks[chunk],
                0, (code & this.chrChunkMask) * this.charHeight,
                this.charWidth, this.charHeight,
                x, y,
                this.charWidth, this.charHeight,
            );
            x += this.charWidth;
        }
    }

    public drawTextAt(text: string, cx: number, cy: number) {
        const x = cx * this.charWidth;
        const y = cy * this.charHeight;
        if (this.chrCache) {
            this.fillChunkedText(text, x, y);
        } else {
            this.ctx[this.workingLayer].fillStyle = this.bcolor;
            this.ctx[this.workingLayer].fillRect(x, y, this.ctx[this.workingLayer].measureText(text).width, this.charHeight);
            this.ctx[this.workingLayer].fillStyle = this.tcolor;
            this.ctx[this.workingLayer].fillText(text, x, y);
        }
        this.needRefresh = true;
    }

    exchg() {
        this.workingLayer ^= 1;
        this.visibleLayer ^= 1;
        this.canvas[this.visibleLayer].classList.add('active');
        this.canvas[this.workingLayer].classList.remove('active');
    }

    public cls() {
        this.needRefresh = false;
        this.ctx[this.workingLayer].fillStyle = this.bcolor;
        this.ctx[this.workingLayer].fillRect(0, 0, this.width, this.height);
    }

    clBlock(cx: number, cy: number, cw: number, ch: number): void {
        const x = cx * this.charWidth;
        const y = cy * this.charHeight;
        const w = cw * this.charWidth;
        const h = ch * this.charHeight;
        this.ctx[this.workingLayer].fillStyle = this.bcolor;
        this.ctx[this.workingLayer].fillRect(x, y, w, h);
    }

    scrollUp(): void {
        let y = 0;
        for (let cy = 0; cy <= this.heightInChars - 2; cy++) {
            this.ctx[this.workingLayer].drawImage(this.canvas[this.workingLayer],
                0, y + this.charHeight, this.width, this.charHeight,
                0, y,
                this.width, this.charHeight
            );
            y += this.charHeight;
        }
        this.ctx[this.workingLayer].fillStyle = this.bcolor;
        this.ctx[this.workingLayer].fillRect(0, y, this.width, this.charHeight);
        if (this.layersNum > 1) {
            this.exchg();
            this.ctx[this.workingLayer].drawImage(this.canvas[this.visibleLayer], 0, 0);
        }
    }

    signColors = ["blue", "green"];
    nColor = 0;
    public refresh() {
        if (!this.needRefresh) return;
        this.needRefresh = false;
        if (this.layersNum > 1) this.exchg();

        // let x = this.charWidth;
        // console.log(Object.keys(this.chrChunks).length);
        // for (const chunk_id in this.chrChunks) {
        //     this.ctx[this.visibleLayer].drawImage(this.chrChunks[chunk_id], x, this.charHeight);
        //     x += this.charWidth;
        // }
        // this.nColor ^= 1;
        // this.ctx[this.visibleLayer].fillStyle = this.signColors[this.nColor];
        // this.ctx[this.visibleLayer].fillRect(this.canvas[this.visibleLayer].width - 16, this.canvas[this.visibleLayer].height - 16, 16, 16);
    }
}
