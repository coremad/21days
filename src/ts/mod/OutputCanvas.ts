import { Output } from "./Output.js";

export class OutputCanvas implements Output {
    container: HTMLElement;
    canvas: HTMLCanvasElement[] = [];
    ctx: CanvasRenderingContext2D[] = [];
    charWidth = 80;
    charHeight = 25;
    widthInChars = this.charWidth * 8;
    heightInChars = this.charHeight * 16;
    needRefresh = false;
    bcolor = "darkslategrey";
    tcolor = "lightgrey";
    layersNum: 1 | 2 = 1;
    visibleLayer = 0;
    workingLayer = this.layersNum == 1 ? 0 : 1;

    conf = {
        fontFamily: "'Consolas', 'Lucida Console', monospace",
        fontSize: 20,
        scount: 100,
        wspace: 2,
        hspace: 2,
    };

    constructor(container: HTMLElement | null, layersNum: 1 | 2 = 1, extconf = {}) {
        if (!container) throw ("wtf?!");
        this.container = container;
        this.layersNum = layersNum;
        if (typeof extconf === 'object') this.conf = { ...this.conf, ...extconf };

        for (let i = 0; i < this.layersNum; i++) {
            const canvas = document.createElement("canvas");
            this.container.appendChild(canvas);
            canvas.classList.add('canvas-layer');
            if (i == this.visibleLayer) canvas.classList.add('active');
            this.canvas.push(canvas);
            this.ctx.push(canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D);
        }

        this.onResize()
        // this.offcanvas.push(new OffscreenCanvas(this.canvas[0].width, this.canvas[0].height));
    }

    public onResize() {
        this.calcSize();
        for (let i = 0; i < this.layersNum; i++) {
            this.canvas[i].width = this.widthInChars * this.charWidth;
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

    public drawTextAt(text: string, cx: number, cy: number) {
        const x = cx * this.charWidth;
        const y = cy * this.charHeight;
        this.ctx[this.workingLayer].fillStyle = this.bcolor;
        this.ctx[this.workingLayer].fillRect(x, y, this.ctx[this.workingLayer].measureText(text).width, this.charHeight);
        this.ctx[this.workingLayer].fillStyle = this.tcolor;
        this.ctx[this.workingLayer].fillText(text, x, y);
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
        this.ctx[this.workingLayer].fillRect(0, 0, this.canvas[this.workingLayer].width, this.canvas[this.workingLayer].height);
    }

    clBlock(cx: number, cy: number, cw: number, ch: number): void {
        const x = cx * this.charWidth;
        const y = cy * this.charHeight;
        const w = cw * this.charWidth;
        const h = ch * this.charHeight;
        this.ctx[this.workingLayer].fillStyle = this.bcolor;
        this.ctx[this.workingLayer].fillRect(x, y, w, h);
    }

    signColors = ["blue", "green"];
    nColor = 0;
    public refresh() {
        if (!this.needRefresh) return;
        this.needRefresh = false;
        if (this.layersNum > 1) this.exchg();

        // this.nColor ^= 1;
        // this.ctx[this.visibleLayer].fillStyle = this.signColors[this.nColor];
        // this.ctx[this.visibleLayer].fillRect(this.canvas[this.visibleLayer].width - 16, this.canvas[this.visibleLayer].height - 16, 16, 16);
    }
}
