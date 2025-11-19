import { Output } from "./mod/Output.js";
import { OutputCanvas } from "./mod/OutputCanvas.js";
import { OutputHTML } from "./mod/OutputHTML.js";
import { Terminal } from "./mod/Terminal.js";

let output: Output = new OutputHTML(document.getElementById('out-container'));

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

const outSelector = document.getElementById('outputS');
if (outSelector) outSelector.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    output.derstroy();
    if (target.value == "html") output = new OutputHTML(document.getElementById('out-container'))
    else if (target.value == "canvas") output = new OutputCanvas(document.getElementById('out-container'));
    term.changeOutput(output);
}

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
