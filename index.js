const puppeteer = require('puppeteer');
const readline = require('readline');
const {promisify} = require('util');

const friendsNo = 10;
const parallelNo = 5;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const asyncPipe = (...fns) => x => (
  fns.reduce(async (y, f) => f(await y), x)
);

const rlP = (question) => new Promise((res) => 
    rl.question(question, val => res(val))
);

const questions = {
    'Fb login?': 'login',
    'Fb pwd?': 'pwd'
};


const buildConfig = async (qe, config = {}) => 
    qe.length === 0 
        ? config
        : buildConfig(qe.slice(1), {...config, [qe[0][1]]: await rlP(qe[0][0])})
 
const login = async (name, pwd, loginPage) => {

};

const grabFriends = async (count, msgsPage) => {

};

const scrapeFriend = async (friendPage) => {
}

const inParallel = async (fns) => {
}

(async () => {
    const config = await buildConfig(Object.entries(questions));
    rl.close();
    const mainPage = await login(config.login, config.pwd, loginPage);
    const friends = await grabFriends(friendsNo, mainPage);
    const bdays = await inParallel(parallelNo, friends.map(asyncPipe(scrapeFriend, announceFriend, writeToCsv)));

    console.log('done');
})();
