import { Queue } from "./mod/Querue.js";

const kbfifo = new Queue<string>(256);

(self as any).winW = 80;
(self as any).winH = 30;
(self as any).lastkey = "ёпт";

self.onmessage = async (event) => {
  if (typeof event.data === 'object' && 'dst' in event.data) switch (event.data.dst) {
    case 'key':
      await kbfifo.put(event.data.par[0]);
      break;
    case 'size':
      (self as any).winW = event.data.W, (self as any).winH = event.data.H;
      break;
  }
  postMessage("yes sir");
};

const interval1 = setInterval(async () => await kbfifo.put("ёпт"), 250);

(self as any).getKey = async () => {
  const key = await kbfifo.get();
  if (typeof key != 'string' || key == "ёпт") return false;
  (self as any).lastkey = key;
  return true;
};

import createWasmModule from "./mod/module.js";

async function runWasm() {
  console.log("starting wasm...");
  const Module = await createWasmModule({
    locateFile: () => { return "/js/mod/module.wasm?s=" + Date.now() },
    // preRun: [],
    'print': (text: string) => {
      if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
      self.postMessage({
        dst: "out",
        fun: "print",
        text: text,
      });
    },
  });
  
  console.log("wasm ready");

  await Module._start();
  console.log("wasm done?!");
}

runWasm();
