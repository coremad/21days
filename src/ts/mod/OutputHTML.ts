import { Output } from "./Output.js";

type Chunk = {
    [key: number]: HTMLCanvasElement | OffscreenCanvas;
}

export class OutputHTML implements Output {
    container: HTMLElement;

    screen: HTMLDivElement[] = [];
    lines: HTMLDivElement[][] = [];

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

    conf = {
        fontFamily: "'Consolas', 'Lucida Console', monospace",
        fontSize: 20,
        scount: 100,
        wspace: 2,
        hspace: 2,
    };
    ctxConf = { alpha: false };

    constructor(container: HTMLElement | null, layersNum: 1 | 2 = 2, extconf = {}) {
        if (!container) throw ("wtf?!");
        this.container = container;
        this.layersNum = layersNum;
        if (typeof extconf === 'object') this.conf = { ...this.conf, ...extconf };

        for (let i = 0; i < this.layersNum; i++) {
            const div = document.createElement("div");
            this.container.appendChild(div);
            div.classList.add('html-layer');
            if (i == this.visibleLayer) div.classList.add('active');
            this.screen.push(div);
        }
        this.workingLayer = this.layersNum == 1 ? 0 : 1;

        this.onResize()
    }

    public derstroy() {
        for(const el of this.screen ) el.remove();
    }

    public onResize() {
        this.calcSize();
        this.width = this.widthInChars * this.charWidth;
        this.height = this.heightInChars * this.charHeight;
        for (let i = 0; i < this.layersNum; i++) {
            const screen = this.screen[i];
            screen.setAttribute("style", `
                width:              ${this.width}px;
                height:             ${this.height}px;
                background-color:   ${this.bcolor};
                color:              ${this.tcolor};
                font-size:          ${this.conf.fontSize}px;
                font-family:        ${this.conf.fontFamily};
                `
            );
            if (this.lines[i] && this.lines[i].length)
                for (const line of this.lines[i]) line.remove();

            this.lines[i] = [];

            for (let y = 0; y < this.heightInChars; y++) {
                const div = document.createElement("div");
                div.setAttribute("style", `height:${this.charHeight}px;`);
                div.innerText = '';
                screen.appendChild(div);
                this.lines[i].push(div);
            }
        }
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
        const innerText = this.lines[this.workingLayer][cy].innerText;
        if (!innerText.length && !cx) {
            this.lines[this.workingLayer][cy].innerText = text;
            return;
        }
        let outText = innerText.substring(0, cx);
        if (outText.length < cx) outText += " ".repeat(cx - outText.length);
        outText += text;
        if (outText.length < innerText.length) outText += innerText.substring(outText.length);
        this.lines[this.workingLayer][cy].innerText = outText.substring(0, this.widthInChars).replace(/ /g, "\u00a0");
        this.needRefresh = true;
    }

    exchg() {
        this.workingLayer ^= 1;
        this.visibleLayer ^= 1;
        this.screen[this.visibleLayer].classList.add('active');
        this.screen[this.workingLayer].classList.remove('active');
    }

    public cls() {
        this.needRefresh = false;
        for (const line of this.lines[this.workingLayer]) line.innerHTML = '';
    }

    clBlock(cx: number, cy: number, cw: number, ch: number): void {
        for (let y = cy; y < cy + ch; y++) this.lines[this.workingLayer][y].innerText = '';
    }

    scrollUp(): void {
    }

    public refresh() {
        if (!this.needRefresh) return;
        this.needRefresh = false;
        if (this.layersNum > 1) this.exchg();
    }
}
