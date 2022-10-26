import vm from 'vm';

import Bluebird from 'bluebird';
async function test() {
    const context = vm.createContext({});
    context.Bluebird = Bluebird;
    context.console = console;
    console.log('running')
    vm.runInContext(`
    async function test1() {
        console.log('before');
        await Bluebird.Promise.delay(5000);
        console.log('after');
    }
    test1();
    `, context);
}

test();