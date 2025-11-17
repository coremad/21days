import { Output } from "./Output.js";
export class Terminal {
    posX = 0;
    posY = 0;
    width = 80;
    height = 25;
    output: Output;
    dirtyLines: boolean[] = [];
    dirty = true;

    constructor(output: Output, dirty = true) {
        this.output = output;
        this.dirty = dirty;
        this.onResize();
    }
    public onResize() {
        this.width = this.output.getW();
        this.height = this.output.getH();
    }

    public goto(X: number, Y: number) {
        this.posX = X;
        this.posY = Y;
        if (this.posX > this.width - 1 || this.posX < 0) this.posX = 0;
        if (this.posY < 0) this.posY = 0;
    }

    public cls(): void {
        if (this.dirty) {
            this.dirtyLines.length = 0;
            for (let i = 0; i < this.height; i++) this.dirtyLines.push(true);
        } else {
            this.posX = this.posY = 0;
            this.output.cls();
        }
    }

    rawPrint(s: string) {
        if (this.dirty && this.dirtyLines[this.posY]) {
            this.output.clBlock(0, this.posY, this.width, 1);
            this.dirtyLines[this.posY] = false;
        }
        this.output.drawTextAt(s, this.posX, this.posY);
    }

    _print(s: string) {
        const len = s.length;
        if (len < 1 || this.posY >= this.height) return;
        if (this.posX >= this.width) {
            this.posX = 0;
            this.posY++;
        }
        if (this.posX + len <= this.width) {
            this.rawPrint(s);
            this.posX += s.length;
            return;
        }
    }

    tab() {
        this.posX += 4;
        if (this.posX >= this.width) {
            this.posY++;
            this.posX -= this.width;
        }
    }
    newLine(): void {
        this.posX = 0;
        this.posY++;
    }

    public print(s: string) {
        // console.log(s);
        let outStr = "";
        let i = 0;
        const len = s.length;
        while (i < len) {
            let ch = s[i++];
            if (ch.charCodeAt(0) >= 0x20) {
                outStr += ch;
                continue;
            }
            this._print(outStr);
            outStr = "";
            switch (ch.charCodeAt(0)) {
                case 0x9:
                    this.tab();
                    break;
                case 0xd:
                    this.newLine();
                    break;
                case 0x1b:
                    ch = s[i++];
                    if (ch == "[") {
                        ch = " ";
                        while (i < len && (ch <= "@" || ch >= "~")) {
                            ch = s[i++];
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
                        outStr = "";
                    } else if (ch == "]") {
                        while (i < len && ch.charCodeAt(0) != 7) {
                            ch = s[i++];
                            outStr += ch;
                        }
                        document.title = outStr.substring(0, outStr.length-1).split(";")[1];
                    } else console.log("esc without ][ 0x" + ch.charCodeAt(0).toString(16));
                    break;
                default: console.log("wtf char: 0x" + ch.charCodeAt(0).toString(16));
            }
        }
        this._print(outStr);
    }

}