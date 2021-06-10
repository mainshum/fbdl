const pup = require('puppeteer');
const readline = require('readline');
const {promisify} = require('util');

const friendsNo = 10;
const parallelNo = 5;

const Friend = ({name, bday}) => ({name, bday});
const Question = (question, key, remap) => ({question, key, remap});

const csv = () => ({
    append(friend) {
    },
    close() {
    }
});

const rl = () => ({
    _rl: readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    }),
    ask(question) {
        return new Promise((res) => 
            this._rl.question(question, val => res(val))
        );
    },
    close() {
        this._rl.close();
    }
});

const asyncPipe = (...fns) => async x => (
  await fns.reduce(async (y, f) => f(await y), Promise.resolve(x))
);

const questions = [
    Question('Fb login?', 'user',  d => 'doseit@gmail.com'),
    Question('Fb pwd?', 'pwd',  d => 'tontyna123'),
    Question('Friends count?', 'fCount', Number)
];

const testConfig = {
    user: 'doseit@gmail.com',
    pwd: 'tontyna123',
    fCount: 10
};

const buildConfig = async (questions) => {
    const rlInt = rl();
    const config = {};

    for (const {question, key, remap} of questions) {
        config[key] = remap(await rlInt.ask(question));
    }

    rlInt.close();
    return config;
};
 
const login = async ({user, pwd}, page) => {

    console.log('attempting login');

    await page.goto('https://www.facebook.com', {waitUntil: 'networkidle2'});

    const acceptCookiesBtn = await page.evaluateHandle(() => {
        return document.querySelector('button[data-cookiebanner="accept_button"]')
    });

    await acceptCookiesBtn.click();

    const userInput = await page.evaluateHandle(() => {
        return document.querySelector('input#email')
    });

    const pwdInput = await page.evaluateHandle(() => 
        document.querySelector('input#pass')
    );

    await userInput.type(user);
    await pwdInput.type(pwd);

    const confirmBtn = await page.$('button[name="login"]');

    await Promise.all([
        confirmBtn.click(),
        page.waitForNavigation({waitUntil: 'networkidle2'}),
    ]);

    return page;
};

const waiter = t => () => new Promise(res => setTimeout(res, t));


const getFriendsInfoLinks = async (mainPage) => {

    console.log('going to friends page');

    await mainPage.goto('https://facebook.com/me/friends_all', {waitUntil: 'networkidle2'});

    console.log('loading friends...');

    return await mainPage.evaluate(async () => {

        const friendToInfo = friendPage => friendPage.includes('profile.php')
            ? `${friendPage}&sk=about_contact_and_basic_info`
            : `${friendPage}/about_contact_and_basic_info`;

        const getFriends = async () => {

            let lastHeight = document.body.clientHeight;

            const shouldStopScrolling = (friendsCnt, lastHeight, currentHeight) => 
                friendsCnt > 1;

            while (true) {
                window.scroll(0, 10000);
                await (new Promise(res => setTimeout(res, 2000)));

                const friendsEls = 
                    Array.from(document.querySelectorAll('a[role="link"][tabindex="-1"]'));

                if (shouldStopScrolling(friendsEls.length, lastHeight, document.body.clientHeight)) 
                    return friendsEls;

            };
        };

        return getFriends()
            .then(frs => frs.map(f => f.getAttribute('href')))
            .then(frs => frs.map(friendToInfo));
    });
};


const scrapeFriend = browser => async (friendLink) => {

    const p = await browser.newPage();
    await p.goto(friendLink, {waitUntil: 'networkidle2'});

    return await p.evaluate(() => {

        const makeFriend = (name, bday = 'Not found') => ({name, bday});

        const fName = document.querySelectorAll('h1')[1].innerHTML;

        const cakeSel = 
            'img[src="https://static.xx.fbcdn.net/rsrc.php/v3/yB/r/ODICuZSjkMe.png"]';

        const cakeImg = document.querySelector(cakeSel);

        if (!cakeImg)
            return makeFriend(fName);

        const fBday = 
            cakeImg.closest('div').nextSibling.querySelector('span').innerHTML;

        return makeFriend(fName, fBday);
    });
}

const announceFriend = async friend => {
    console.log(friend);
    return friend;
};
    

const writeToCsv = (csvInt) => async friend => friend;
    

const inParallel = async (fns) => {
}

(async () => {

    // services
    const browser = await pup.launch({
        headless: false, 
        defaultViewport: {width: 1920, height: 1080}, 
        devtools: true,
        args:[
           '--start-maximized' // you can also use '--start-fullscreen'
        ]
    });

    const page = await browser.newPage();

    // fns
    const processFriend = asyncPipe(scrapeFriend(browser), announceFriend, writeToCsv);

    const mainPage = await login(testConfig, page);
    const infos = await getFriendsInfoLinks(mainPage);

    await Promise.all([infos.slice(0, 3).map(processFriend)]);

    //await browser.close();
})();

