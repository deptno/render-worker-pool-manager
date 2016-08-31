import PoolManager from '../built';

describe('coach', () => {
    const urls = [ 'http://google.com', 'http://naver.com' ];
    const {init, rendered, error} = PoolManager.event;

    it(`worker ${2}`, done => {
        const coach = new PoolManager(2);
        let renderCount = 0;

        coach.on(init, () => {
            const files = urls.map((url, index) => {
                coach.push(url, `/dev/null`);
            });
            coach.on(rendered, (filename, works) => {
                console.log(`${rendered}: ${filename}, remain: ${works}`);
                if (++renderCount === urls.length) done();
            });
            coach.on(error, (filename) => {
                console.log(`${error}: ${filename}`);
                if (++renderCount === urls.length) done();
            });
        })
    });
});
