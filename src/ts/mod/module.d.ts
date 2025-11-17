export interface WasmInstance {
    Asyncify: {
        handleSleep: (wakeUpCallback: (wakeUp: () => void) => void) => void;
    };
    Asyncify: any;
    buffer: ArrayBuffer;
    wasmMemory: WebAssembly.Memory;
    _test: () => Promise<number>;
    _winHeight: number;
    _winWidth: number;
    _start: () => Promise<void>;
}

declare module './module.js' {
    export default function createWasmModule(moduleArgs?: any): Promise<WasmModule>;
}

export { }; 
