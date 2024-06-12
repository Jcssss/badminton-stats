"use strict";
// server/index.js
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = __importStar(require("puppeteer"));
const express_1 = __importDefault(require("express"));
const PORT = process.env.PORT || 3001;
const app = (0, express_1.default)();
const urls = {
    'MS': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=472',
    'WS': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=473',
    'MD': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=474',
    'WD': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=475',
    'XD': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=476',
};
app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log(`Server listening on ${PORT}`);
});
app.get("/api/playerrank", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield getPlayerRankingData(req.query.event, req.query.player, parseInt(req.query.weeks));
    res.json({ message: data });
}));
app.get("/api/playerhistory", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield getPlayerData(req.query.event, req.query.player, parseInt(req.query.years));
    res.json(Object.assign({ message: 'Data retrieved' }, data));
}));
app.get("/api/ranks", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield getOverallRankingData(req.query.event, parseInt(req.query.players), parseInt(req.query.weeks));
    res.json({ message: data });
}));
// Initializes a browser window for puppeteer
const initPage = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer.launch({
        headless: false,
    });
    let page = yield browser.newPage();
    yield page.goto(`${url}`, {
        waitUntil: "domcontentloaded",
    });
    return page;
});
const getTournamentData = (page, event) => __awaiter(void 0, void 0, void 0, function* () {
    return yield page.evaluate((event) => {
        let tournaments = document.querySelectorAll('#tabcontent > div.module--card');
        return Array.from(tournaments).map((tournament) => {
            let tourEvents = tournament.querySelectorAll('li.list__item > h5');
            // verifies that the player played in the specified event in the tournament
            let eventIndex = Array.from(tourEvents).findIndex((ev) => {
                return ev.textContent.replace(/[\\n\s]/g, '') == event;
            });
            if (eventIndex == -1) {
                return null;
            }
            // Gets the name of the tournament
            let header = tournament.querySelector('li.list__item > div.media');
            let name = header.querySelector('h4.media__title > a').getAttribute('title');
            // Get the start and end dates of the tournament
            let dateElements = header.querySelectorAll('time');
            let dates = Array.from(dateElements).map((time) => {
                return time.getAttribute('datetime');
            });
            // Gets the matches played by the player in the tournament
            let allMatches = tournament.querySelectorAll('li.list__item > ol.match-group');
            let matches = Array.from(allMatches)[eventIndex].querySelectorAll('li.match-group__item');
            let matchData = Array.from(matches).map((match) => {
                let result = match.querySelector('span.match__status').textContent;
                let pointCont = match.querySelectorAll('ul.points');
                let scores = Array.from(pointCont).map((cont) => {
                    return cont.textContent.replace(/(\d{2})/, '$1/').replace(/[\\n\s]/g, '');
                });
                return { result: result, scores: scores };
            });
            return {
                name: name,
                sdate: dates[0],
                edate: dates[1],
                matches: matchData,
            };
        }).filter(tournament => tournament);
    }, event);
});
// Given a player's name, searches for the player in the search bar and returns a matching result.
const getPlayerData = (event, player, years) => __awaiter(void 0, void 0, void 0, function* () {
    // Initializes browser and loads page
    let page = yield initPage('https://bwf.tournamentsoftware.com/ranking/ranking.aspx?rid=70');
    // Puts the players name into the search box, if no players appear, that player does not exist
    yield page.type('input.search-box__field', player);
    try {
        yield page.waitForSelector('a.nav-link.media__link', { timeout: 3000 });
    }
    catch (e) {
        return 'There are no players with that name.';
    }
    // If the player exists, goes to their profile
    let playerPage = yield page.evaluate(() => {
        const playerLink = document.querySelector('a.nav-link.media__link');
        return 'https://bwf.tournamentsoftware.com/' + playerLink.getAttribute('href');
    });
    const tags = {
        MS: 'Singles',
        WS: 'Singles',
        MD: 'Doubles',
        WD: 'Doubles',
        XD: 'Mixed',
    };
    yield page.goto(playerPage);
    yield page.waitForSelector(`#tabStats${tags[event]}`);
    // Gets the overall win/loss for the player in the specified event
    let data = yield page.evaluate((id) => {
        const singlesStats = document.querySelector(id);
        const stats = singlesStats.querySelectorAll('div.flex-container--center > span.list__value-start');
        return Array.from(stats).map((stat) => {
            return stat.textContent.replace(/[\\n\s]/g, '');
        });
    }, `#tabStats${tags[event]}`);
    // Goes to the players tournament profile
    yield page.goto((yield page.url()) + '/tournaments');
    let tournamentData = yield getTournamentData(page, event);
    //await page.browser().close();
    return { overall: data, tournaments: tournamentData };
});
// Gets the overall rankings of a specific player
const getPlayerRankingData = (event, player, weeks) => __awaiter(void 0, void 0, void 0, function* () {
    // Initializes browser and loads pages
    let page = yield initPage(urls[event]);
    let rankingData = [];
    for (let i = 0; i < weeks; i++) {
        yield selectWeek(page, i);
        // Loops through all pages until reaches the last page or finds the player
        let weekData = ['', ''];
        while (weekData[0] == '') {
            // Searches the current page for the player
            weekData = yield findPlayerPointRank(page, player);
            // If the player isn't on the page, goes to next page
            if (weekData[0] == '') {
                let pageLink = yield getNextPageLink(page);
                // If there are no next pages, informs the user
                if (pageLink === '') {
                    rankingData.push(['', '']);
                    // If there is another page, moves to that page
                }
                else {
                    yield page.goto(`${pageLink}`, {
                        waitUntil: "domcontentloaded",
                    });
                }
            }
        }
        rankingData.push(weekData);
    }
    yield page.browser().close();
    return rankingData;
});
// Gets the overall rankings of the top X player
const getOverallRankingData = (event, players, weeks) => __awaiter(void 0, void 0, void 0, function* () {
    // Initializes browser and loads pages
    let page = yield initPage(urls[event]);
    let rankingData = [];
    for (let i = 0; i < weeks; i++) {
        yield selectWeek(page, i);
        // Loops through all pages until reaches the last page or finds the player
        let weekData = [];
        let playersOnPage = 0;
        for (let playersLeft = players; playersLeft > 0; playersLeft -= playersOnPage) {
            // Gets the number of players on the page, excludes the column headers,
            // blank row, and page number footer
            playersOnPage = yield page.evaluate(() => {
                const playerContainer = document.querySelector('table.ruler > tbody');
                return playerContainer.childElementCount - 3;
            });
            // Searches the current page for the player
            let playersToGet = Math.min(playersOnPage, playersLeft);
            let pageData = yield findWeeklyPointRank(page, playersToGet);
            weekData = weekData.concat(pageData);
            // If the player isn't on the page, goes to next page
            if (playersLeft > 0) {
                let pageLink = yield getNextPageLink(page);
                // If there are no next pages, informs the user
                if (pageLink === '') {
                    rankingData.push(weekData);
                    playersLeft = 0;
                    // If there is another page, moves to that page
                }
                else {
                    yield page.goto(`${pageLink}`, {
                        waitUntil: "domcontentloaded",
                    });
                }
            }
        }
        rankingData.push(weekData);
    }
    yield page.browser().close();
    return rankingData;
});
// Given a page, returns the url for the next page
const getNextPageLink = (page) => __awaiter(void 0, void 0, void 0, function* () {
    const nextPageLink = yield page.evaluate(() => {
        const pageNumberCont = document.querySelector('span.pagenrs');
        let nextPageAnchor = pageNumberCont.querySelector('a.page_next');
        if (nextPageAnchor) {
            return 'https://bwf.tournamentsoftware.com/' + nextPageAnchor.getAttribute('href');
        }
        return '';
    });
    return nextPageLink;
});
// Given a page, searches the list of players for the specified player and returns their points and rank
const findPlayerPointRank = (page, player) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract text content of elements matching the selector
    const pointRank = yield page.evaluate((player) => {
        const links = document.querySelectorAll('table.ruler > tbody > tr > td > a');
        const playerLink = Array.from(links).find((link) => {
            if (link.textContent.toLowerCase() == player.toLowerCase()) {
                return true;
            }
            return false;
        });
        if (playerLink) {
            let player = playerLink.parentNode.parentNode;
            let rank = player.querySelector('td.rank').textContent;
            let points = player.querySelector('td.rankingpoints').textContent;
            return [rank, points];
        }
        else {
            return ['', ''];
        }
    }, player);
    return pointRank;
});
// Given a page, searches the list of players for the specified player and returns their points and rank
const findWeeklyPointRank = (page, players) => __awaiter(void 0, void 0, void 0, function* () {
    let data = [];
    for (let playerNum = 0; playerNum < players; playerNum++) {
        let rankData = yield page.evaluate((playerNum) => {
            let curPlayer = document.querySelector(`table.ruler > tbody > tr:nth-child(${playerNum + 3})`);
            if (curPlayer) {
                let rank = curPlayer.querySelector('td.rank').textContent;
                let points = curPlayer.querySelector('td.rankingpoints').textContent;
                let flags = curPlayer.querySelectorAll('span.flag');
                let country = flags[0].textContent.replace('[', '').replace(/\]\s?/, '');
                let nameAnchors = Array.from(flags).map((flag) => flag.parentNode.querySelector('a'));
                let names = nameAnchors.map((anch) => anch.textContent);
                return [country, ...names, rank, points];
            }
            else {
                return [];
            }
        }, playerNum);
        data.push(rankData);
    }
    return data;
});
const selectWeek = (page, week) => __awaiter(void 0, void 0, void 0, function* () {
    yield page.click('a.chosen-single');
    yield page.click(`.chosen-results > li:nth-child(${week + 1})`);
    yield page.waitForSelector('a.chosen-single');
});
