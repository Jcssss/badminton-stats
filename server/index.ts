// server/index.js

import * as puppeteer from 'puppeteer';
import express from 'express';

const PORT = process.env.PORT || 3001;

const app = express();

const urls = {
    'MS': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=472',
    'WS': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=473',
    'MD': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=474',
    'WD': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=475',
    'XD': 'https://bwf.tournamentsoftware.com/ranking/category.aspx?id=39963&category=476',
}

type playerRankData = {
    playerFull: string, 
    rank: [string, string]
}

app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log(`Server listening on ${PORT}`);
});

app.get("/api/playerrank", async (req, res) => {
    const data = await getPlayerRankingData(
        req.query.event as string, 
        req.query.player as string,
        parseInt(req.query.weeks as string),
    );
    res.json({ message: data });
});

app.get("/api/playerhistory", async (req, res) => {
    const data = await getPlayerData(
        req.query.event as string,
        req.query.player as string,
        parseInt(req.query.years as string),
    );
    res.json({ message: 'Data retrieved', ...data});
});

app.get("/api/ranks", async (req, res) => {
    const data = await getOverallRankingData(
        req.query.event as string, 
        parseInt(req.query.players as string),
        parseInt(req.query.weeks as string),
    );
    res.json({ message: data });
});

// Initializes a browser window for puppeteer
const initPage = async (url: string): Promise<puppeteer.Page> => {  
    const browser = await puppeteer.launch({
        headless: false,
    });

    let page = await browser.newPage();
    await page.goto(`${url}`, {
        waitUntil: "domcontentloaded",
    });
    
    return page;
};

const getTournamentData = async (page: puppeteer.Page, event: string, playerName: string): Promise<Object[]> => {

    return await page.evaluate((event, playerName) => {
        let tournaments = document.querySelectorAll('#tabcontent > div.module--card');
        return Array.from(tournaments).map((tournament) => {
            let tourEvents = tournament.querySelectorAll('li.list__item > h5');
    
            // verifies that the player played in the specified event in the tournament
            let eventIndex = Array.from(tourEvents).findIndex((ev) => {
                return ev.textContent.replace(/[\\n\s]/g, '') == event;
            })
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
            })

            // Gets the matches played by the player in the tournament
            let allMatches = tournament.querySelectorAll('li.list__item > ol.match-group');
            let matches = Array.from(allMatches)[eventIndex].querySelectorAll('li.match-group__item');
            let matchData = Array.from(matches).map((match) => {
                let result = match.querySelector('span.match__status').textContent;

                // Gets the scores
                let pointCont = match.querySelectorAll('ul.points');
                let scores = Array.from(pointCont).map((cont) => {
                    return cont.textContent.replace(/(\d{2})/, '$1/').replace(/[\\n\s]/g, '');
                })

                // Gets the name of the opponents
                let players = match.querySelectorAll('.match__row:not(:has(span.match__status)) > div > div > span > a > span.nav-link__value');
                let opponents = Array.from(players).map((player) => player.textContent);

                // Gets the name of the player's partner (if possible)
                players = match.querySelectorAll('.match__row:has(span.match__status) > div > div > span > a > span.nav-link__value');
                let team = Array.from(players).map((player) => player.textContent);
                team = team.filter((name) => name.toLowerCase() != playerName.toLowerCase());
                let partnerName = (team.length == 1)? team[0] : 'None';

                return {result: result, scores: scores, opponents: opponents, partner: partnerName}
            });

            return {
                name: name,
                sdate: dates[0],
                edate: dates[1],
                matches: matchData,
            }
        }).filter(tournament => tournament)
    }, event, playerName);
}

// Given a player's name, searches for the player in the search bar and returns a matching result.
const getPlayerData = async (event: string, player: string, years: number): Promise<Object> => {
    
    // Initializes browser and loads page
    let page = await initPage('https://bwf.tournamentsoftware.com/ranking/ranking.aspx?rid=70');

    // Puts the players name into the search box, if no players appear, that player does not exist
    await page.type('input.search-box__field', player);
    try {
        await page.waitForSelector('a.nav-link.media__link', {timeout: 3000});
    } catch (e) {
        return 'There are no players with that name.'
    }

    // If the player exists, goes to their profile
    let playerPage = await page.evaluate(() => {
        const playerLink = document.querySelector('a.nav-link.media__link') as HTMLElement;
        return 'https://bwf.tournamentsoftware.com/' + playerLink.getAttribute('href');
    })

    const tags = {
        MS: 'Singles',
        WS: 'Singles',
        MD: 'Doubles',
        WD: 'Doubles',
        XD: 'Mixed',
    }

    await page.goto(playerPage);
    await page.waitForSelector(`#tabStats${tags[event]}`);
    
    let playerName = await page.evaluate(() => {
        return document.querySelector('h2 > span > span.nav-link__value').textContent;
    })
    // Gets the overall win/loss for the player in the specified event
    let data = await page.evaluate((id) => {
        const singlesStats = document.querySelector(id);
        const stats = singlesStats.querySelectorAll('div.flex-container--center > span.list__value-start');
        return Array.from(stats).map((stat) => {
            return stat.textContent.replace(/[\\n\s]/g, '');
        })
    }, `#tabStats${tags[event]}`);

    // Goes to the players tournament profile
    let curYear = 2024;
    let tournamentData = [];
    let playerUrl = await page.url();
    for (let i = 0; i < years; i++) {
        await page.goto(playerUrl + `/tournaments/${curYear}`);
        tournamentData = tournamentData.concat(await getTournamentData(page, event, playerName));
        curYear--;
    }

    //await page.browser().close();
    return {player: playerName, overall: data, tournaments: tournamentData};
}

// Gets the overall rankings of a specific player
const getPlayerRankingData = async (
    event: string, player: string, weeks: number
): Promise<Object> => {
    
    // Initializes browser and loads pages
    let page = await initPage(urls[event]);
    let playerFull = '';

    let rankingData: [string, string][] = [];
    for (let i = 0; i < weeks; i++) {
        
        await selectWeek(page, i);

        // Loops through all pages until reaches the last page or finds the player
        let data: playerRankData;
        let weekData: [string, string] = ['', ''];
        while (weekData[0] == '') {

            // Searches the current page for the player
            data = await findPlayerPointRank(page, (playerFull == '')? player: playerFull, event);
            weekData = data.rank;

            // If the player isn't on the page, goes to next page
            if (weekData[0] == '') {
                let pageLink = await getNextPageLink(page);

                // If there are no next pages, informs the user
                if (pageLink === '') {
                    rankingData.push(['', '']);
                
                // If there is another page, moves to that page
                } else {
                    await page.goto(`${pageLink}`, {
                        waitUntil: "domcontentloaded",
                    });
                }
            }
        }
        playerFull = data.playerFull;
        rankingData.push(weekData);
    }

    await page.browser().close();
    return {player: playerFull, rankingData: rankingData};
};

// Gets the overall rankings of the top X player
const getOverallRankingData = async (
    event: string, players: number, weeks: number
): Promise<string[][][]> => {
    
    // Initializes browser and loads pages
    let page = await initPage(urls[event]);

    let rankingData: string[][][] = [];
    for (let i = 0; i < weeks; i++) {
        
        await selectWeek(page, i);

        // Loops through all pages until reaches the last page or finds the player
        let weekData: string[][] = [];
        let playersOnPage = 0;
        for (let playersLeft = players; playersLeft > 0; playersLeft -= playersOnPage) {
            
            // Gets the number of players on the page, excludes the column headers,
            // blank row, and page number footer
            playersOnPage = await page.evaluate(() => {
                const playerContainer = document.querySelector('table.ruler > tbody');
                return playerContainer.childElementCount - 3;
            })

            // Searches the current page for the player
            let playersToGet = Math.min(playersOnPage, playersLeft);
            let pageData = await findWeeklyPointRank(page, playersToGet);
            weekData = weekData.concat(pageData);

            // If the player isn't on the page, goes to next page
            if (playersLeft > 0) {
                let pageLink = await getNextPageLink(page);

                // If there are no next pages, informs the user
                if (pageLink === '') {
                    rankingData.push(weekData);
                    playersLeft = 0;
                
                // If there is another page, moves to that page
                } else {
                    await page.goto(`${pageLink}`, {
                        waitUntil: "domcontentloaded",
                    });
                }
            }
        }
        rankingData.push(weekData)
    }

    await page.browser().close();
    return rankingData;
};

// Given a page, returns the url for the next page
const getNextPageLink = async (page: puppeteer.Page):Promise<string> => {
    
    const nextPageLink = await page.evaluate((): string => {
        const pageNumberCont = document.querySelector('span.pagenrs');
        let nextPageAnchor = pageNumberCont.querySelector('a.page_next');
        if (nextPageAnchor) {
            return 'https://bwf.tournamentsoftware.com/'  + nextPageAnchor.getAttribute('href');
        }
        return '';
    });

    return nextPageLink;
}

// Given a page, searches the list of players for the specified player and returns their points and rank
const findPlayerPointRank = async (
    page: puppeteer.Page, player: string, event: string
):Promise<playerRankData> => {

    // Extract text content of elements matching the selector
    const pointRank = await page.evaluate((player, event): playerRankData => {
        let isSingles: boolean = ['MS', 'WS'].includes(event);
        let selector = (isSingles)? 'table.ruler > tbody > tr > td > a' : 'tr.doubles > td > p:has(img) > a';
        
        const links = document.querySelectorAll(selector);
        const playerLink: HTMLElement = Array.from(links).find((link) => {
            if (link.textContent.toLowerCase().includes(player.toLowerCase())) {
                return true;
            }
            return false;
        }) as HTMLElement;
        
        if (playerLink) {
            let playerContainer = (isSingles)? playerLink.parentNode.parentNode : playerLink.parentNode.parentNode.parentNode;
            let playerFull = playerLink.textContent;
            let rank = playerContainer.querySelector('td.rank').textContent;
            let points = playerContainer.querySelector('td.rankingpoints').textContent;
            return {playerFull: playerFull, rank: [rank, points]};
        } else {
            return {playerFull: '', rank: ['', '']};
        }

    }, player, event);

    return pointRank;
}

// Given a page, searches the list of players for the specified player and returns their points and rank
const findWeeklyPointRank = async (
    page: puppeteer.Page, players: number
): Promise<string[][]> => {
    
    let data: string[][] = [];
    
    for (let playerNum = 0; playerNum < players; playerNum++) {
        let rankData = await page.evaluate((playerNum): string[] => {
            let curPlayer = document.querySelector(`table.ruler > tbody > tr:nth-child(${playerNum + 3})`);
            
            if (curPlayer) {
                let rank = curPlayer.querySelector('td.rank').textContent;
                let points = curPlayer.querySelector('td.rankingpoints').textContent;
                let flags = curPlayer.querySelectorAll('span.flag');
                let country = flags[0].textContent.replace('[', '').replace(/\]\s?/, '');
                let nameAnchors = Array.from(flags).map((flag) => flag.parentNode.querySelector('a'));
                let names = nameAnchors.map((anch) => anch.textContent);
                return [country, ...names, rank, points]; 
            } else {
                return [];
            }
        }, playerNum);

        data.push(rankData);
    }

    return data;
}

const selectWeek = async (page: puppeteer.Page, week: number) => {
    await page.click('a.chosen-single');
    await page.click(`.chosen-results > li:nth-child(${week + 1})`);
    await page.waitForSelector('a.chosen-single');
}