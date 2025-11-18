import { Output } from "./Output.js";
export class Terminal {
    output: Output;

    width = 80;
    height = 25;
    posX = 0;
    posY = 0;

    ctrlCodes = Array(32).fill((str: string) => console.log("wtf char: 0x" + str.charCodeAt(0).toString(16)));

    dirtyLines: boolean[] = [];
    dirty = true;

    constructor(output: Output, dirty = true) {
        this.output = output;
        this.dirty = dirty;
        this.initCtrl();
        this.onResize();
    }

    public print(str: string) {
        let outStr = "";
        let strPos = 0;
        const len = str.length;
        while (strPos < len) {
            let ch = str[strPos++];
            if (ch.charCodeAt(0) >= 0x20) {
                outStr += ch;
                continue;
            }
            this._print(outStr);
            strPos += this.ctrlCodes[ch.charCodeAt(0)](str.substring(strPos - 1));
            outStr = "";
        }
        this._print(outStr);
    }

    public goto(X: number, Y: number) {
        this.posX = X;
        this.posY = Y;
        if (this.posX > this.width - 1 || this.posX < 0) this.posX = 0;
        if (this.posY < 0) this.posY = 0;
    }

    public onResize() {
        this.width = this.output.getW();
        this.height = this.output.getH();
    }

    public cls(): void {
        if (this.dirty) {
            this.dirtyLines.length = 0;
            this.dirtyLines = Array(this.height).fill(true);
        } else {
            this.posX = this.posY = 0;
            this.output.cls();
        }
    }

    private initCtrl() {
        this.ctrlCodes[0x8] = () => { if (this.posX > 0) this.posX--; return 0 };
        this.ctrlCodes[0x9] = this.tab.bind(this);
        this.ctrlCodes[0xa] = this.newLine.bind(this);
        this.ctrlCodes[0xd] = () => this.posX = 0;
        this.ctrlCodes[0x1b] = this.esc.bind(this);
    }

    private esc(str: string): number {
        let strPos = 1;
        let outStr = '';
        let len = str.length;
        let ch = str[strPos++];
        if (ch == "[") {
            ch = " ";
            while (strPos < len && (ch <= "@" || ch >= "~")) {
                ch = str[strPos++];
                outStr += ch;
            }
            switch (ch) {
                case "C":
                    // right
                    break;
                case "D":
                    // left
                    break;
                case "H":
                    const cup = outStr.split(";");
                    this.goto(parseInt(cup[1]) - 1, parseInt(cup[0]) - 1);
                    break;
                case "J":
                    if (parseInt(outStr) == 2) this.cls();
                    break;
                default: console.log("wtf esc [ : " + ch);
            }
            return strPos - 1;
        } else if (ch == "]") {
            while (strPos < len && ch.charCodeAt(0) != 7) {
                ch = str[strPos++];
                outStr += ch;
            }
            document.title = outStr.substring(0, outStr.length - 1).split(";")[1];
            return strPos - 1;
        }
        console.log("esc without ][ 0x" + ch.charCodeAt(0).toString(16));
        return 0;
    }

    rawPrint(s: string) {
        if (this.dirty && this.dirtyLines[this.posY]) {
            this.output.clBlock(0, this.posY, this.width, 1);
            this.dirtyLines[this.posY] = false;
        }
        this.output.drawTextAt(s, this.posX, this.posY);
    }

    scrollUp() {
        this.output.scrollUp();
        this.posX = 0;
        this.posY = this.height - 1;
    }

    _print(s: string) {
        const len = s.length;
        if (len < 1) return;
        if (this.posX >= this.width) {
            this.posX = 0;
            this.posY++;
        }
        if (this.posY >= this.height) this.scrollUp();

        if (this.posX + len <= this.width) {
            this.rawPrint(s);
            this.posX += s.length;
            return;
        }
        this.print(s.substring(0, this.width - this.posX))
    }

    tab() {
        this.posX += 4;
        if (this.posX >= this.width) {
            this.posY++;
            this.posX -= this.width;
        }
        return 0
    }

    newLine() {
        this.posX = 0;
        this.posY++;
        return 0
    }

}