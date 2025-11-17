export class QueueFull extends Error {
    constructor(...params: any) {
        super(...params);
        this.name = 'QueueFull';
    }
}

export class QueueEmpty extends Error {
    constructor(...params: any) {
        super(...params);
        this.name = 'QueueEmpty';
    }
}

export class Queue<T> {
    maxSize: number;
    _getters = [];
    _putters = [];
    _items: T | any = [];

    constructor(maxSize: number = 0) {
        this.maxSize = maxSize;
    }

    get currSize() {
        return this._items.length;
    }

    isFull() {
        if (this.maxSize === 0) {
            return false;
        } else {
            return this._items.length >= this.maxSize;
        }
    }

    isEmpty() {
        return this._items.length === 0;
    }

    _put(item: T) {
        this._items.unshift(item);
    }

    _get() {
        return this._items.pop();
    }

    _wakeUp(waiters: any) {
        if (waiters.length > 0) {
            waiters.pop()();
        }
    }

    putNowait(item: T) {
        if (this.isFull()) {
            throw new QueueFull();
        }
        this._put(item);
        this._wakeUp(this._getters);
    }

    getNowait() {
        if (this.isEmpty()) {
            throw new QueueEmpty();
        }
        const item = this._get();
        this._wakeUp(this._putters);
        return item;
    }

    async put(item: T) {
        if (this.isFull()) {
            // @ts-ignore
            await new Promise((r) => this._putters.unshift(r));
        }
        this.putNowait(item);
    }

    async get() {
        if (this.isEmpty()) {
            // @ts-ignore
            await new Promise(r => this._getters.unshift(r));
        }
        return this.getNowait();
    }
}

export default Queue;
