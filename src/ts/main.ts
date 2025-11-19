import { OutputCanvas } from "./mod/OutputCanvas.js";
import { Terminal } from "./mod/Terminal.js";

const output = new OutputCanvas(document.getElementById('out-container'), 2, true);

const term = new Terminal(output, false);

let worker: Worker = startWorker();

window.addEventListener('keydown', event => worker.postMessage({ dst: "key", par: [event.key] }));

window.onresize = function () {
    let timer: any;
    clearTimeout(timer);
    timer = setTimeout(() => {
        output.onResize();
        term.onResize();
        worker.postMessage({ dst: "size", W: term.width, H: term.height });
    }, 2000);
};

function startWorker(url = '/js/worker.js') {
    const worker = new Worker(url, { type: 'module' });
    worker.onmessage = messenger;
    worker.postMessage({ dst: "size", W: term.width, H: term.height });
    return worker;
}

async function messenger(event: MessageEvent) {
    if ('dst' in event.data)
        switch (event.data.dst) {
            case 'out': term.print(event.data.text); break;
            case 'kbd': output.refresh(); break;
            case 'end':
                worker.terminate();
                if (confirm("terminated, restart?")) worker = startWorker()
                else console.log("so, what now, mf?")
                break;
        }
    else console.log(event.data);
}
