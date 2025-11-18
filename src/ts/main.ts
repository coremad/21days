import { OutputCanvas } from "./mod/OutputCanvas.js";
import { Terminal } from "./mod/Terminal.js";

const output = new OutputCanvas(document.getElementById('out-container'), 2, true);

const term = new Terminal(output, true);

// const startTime = Date.now();
// for (let n = 0; n < 10; n++) {
//     for (let i = 0; i < term.width * term.height; i++) term.print(i.toString()[0]);
//     term.goto(0, 0);
//     for (let cy = 0; cy < 16; cy++) {
//         term.goto(0, cy);
//         for (let cx = 0; cx < 16; cx++)term.print(String.fromCharCode((32 + cy * 16 + cx)))
//     }
//     output.refresh();
// }
// const endTime = Date.now();
// console.log(endTime - startTime);

const worker = new Worker('/js/worker.js?s=' + Date.now(), { type: 'module' });

worker.onmessage = async function (event) {
    if (event.data.dst === "out") {
        if ('eval' in event.data)
            eval(event.data.eval)
        else if ('fun' in event.data) {
            switch (event.data.fun) {
                case "print":
                    term.print(event.data.text);
                    break;
                case "goto":
                    term.goto(event.data.X, event.data.Y);
                    break;
            }
        }
    } else if (event.data.dst === "kbd") {
        output.refresh();
    } else console.log(event.data);
};

worker.postMessage({ dst: "size", W: term.width, H: term.height });

window.addEventListener('keydown', event => worker.postMessage({ dst: "key", par: [event.key] }), false);

window.onresize = function () {
    let timer: any;
    clearTimeout(timer);
    timer = setTimeout(() => {
        output.onResize();
        term.onResize();
        worker.postMessage({ dst: "size", W: term.width, H: term.height });
    }, 2000);
};

// const intervalId = setInterval(() => output.refresh(), 300);
