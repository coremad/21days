mergeInto(LibraryManager.library, {

    CP866ArrayToString: (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
        const gt1 =
            "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐" +
            "└┴┬├─┼╞╟╚╔╩╦╠═╬╧" +
            "╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀";
        const gt2 = "ЁёЄєЇїЎў°∙·√№¤■⍽";
        let str = "";
        var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);

        for (let i = idx; heapOrArray[i] != 0 && i < endPtr; i++) {
            const byte = heapOrArray[i];
            if (byte < 0x80) {
                str += String.fromCharCode(byte);
            } else if (byte >= 0x80 && byte < 0xb0) {
                str += String.fromCharCode(0x0410 + byte - 0x80);
            } else if (byte >= 0xb0 && byte < 0xe0) {
                str += gt1[byte - 0xb0];
            } else if (byte >= 0xe0 && byte < 0xf0) {
                str += String.fromCharCode(0x0440 + byte - 0xe0);
            } else if (byte >= 0xf0 && byte <= 0xff) {
                str += gt2[byte - 0xf0];
            } else {
                str += String.fromCharCode(byte);
            }
        }
        return str;
    },

    mprintChar: (stream, curr) => {
        var buffer = printCharBuffers[stream];
        if (curr === 0 || curr === 10) {
            (stream === 1 ? out : err)(_CP866ArrayToString(buffer));
            buffer.length = 0;
        } else {
            buffer.push(curr);
        }
    },

    jgetch: () => {
        const key = lastkey;
        // console.log(`got key: ${key}`);
        switch (key) {
            case "Enter":
                return 0xd;
            case "Escape":
                return 0x1b;
        }
        if (key.length > 1) return 0;
        return key.charCodeAt(0);
    },

    jinit: (a, b) => {
        printChar = _mprintChar;
    },

    jend: () => {
        console.log("game over");
    },

    jgetWinWH: () => {
        HEAP16[_winWidth >> 1] = winW;
        HEAP16[_winHeight >> 1] = winH;
    },

    jcls: () => {
        messager.postMessage({
            dst: "out",
            eval: "term.cls()"
        });
        gotoReady = true;
    },

});
