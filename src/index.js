import worker from 'phantomjs-render-worker';
import {EventEmitter} from 'events';

export default class WorkerCoach extends EventEmitter {
    static event = {
        init: 'init',
        rendered: 'rendered',
        error: 'error'
    };

    workers   = [];
    workState = {};
    works     = [];
    initCount = 0;

    constructor(poolSize, poller) {
        super();
        const {init, rendering, rendered, error} = worker.event;
        for (let i = 0, w; i < poolSize; i++) {
            w = new worker('pdf', null, poller || this.poller);
            w.on(init, this.onInit.bind(this, i));
            w.on(rendering, this.onRendering.bind(this, i));
            w.on(rendered, this.onRendered.bind(this, i));
            w.on(error, this.onError.bind(this, i));
            this.workers.push(w);
        }
    }

    poller() {
        // do override
        return true;
    }

    setWorkState(workerId, state) {
        this.workState[workerId] = state;
    }

    onInit(workerId) {
        this.setWorkState(workerId, false);
        if (++this.initCount === this.workers.length) {
            this.emit(WorkerCoach.event.init);
        }
    }
    onRendering(workerId) {
        this.setWorkState(workerId, true);
    }
    onRendered(workerId, file) {
        this.setWorkState(workerId, false);
        this.emitRendered(file);
        this.run();
    }

    onError(workerId) {
        this.setWorkState(workerId, false);
        this.emitRendered(arguments.slice(1));
        this.run();
    }

    getWorker(workerId) {
        return this.workers[workerId];
    }

    getIdleWorkerId() {
        return Object.keys(this.workState).filter(id => !this.workState[id])[0];
    }

    getWorkingCount() {
        return Object.keys(this.workState).filter(id => this.workState[id]).length;
    }
    emitRendered(file) {
        this.emit(WorkerCoach.event.rendered, file, this.works.length + this.getWorkingCount());
    }

    push(url, file) {
        this.works.push({url, file});
        this.run();
        return file;
    }

    run() {
        const workerId = this.getIdleWorkerId();
        if (typeof workerId !== 'string') {
            return;
        }

        const work = this.works.shift();
        if (work) {
            const worker = this.getWorker(workerId);
            this.setWorkState(workerId, true);
            worker.render(work.url, work.file);
        }
    }
}
