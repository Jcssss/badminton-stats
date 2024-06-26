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

type weekRankInfo = {
    week?: string,
    rank: string,
    points: string,
}

type playerRankData = {
    playerFull: string, 
    rank: weekRankInfo
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
    res.json({ message: 'Ranks retrieved', ...data });
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
                let text = ev.textContent;
                return text && text.replace(/[\\n\s]/g, '') == event;
            })
            if (eventIndex == -1) {
                return {};
            }

            // Gets the name of the tournament
            let header = tournament.querySelector('li.list__item > div.media');
            if (!header) {
                return {};
            }

            let nameContainer = header.querySelector('h4.media__title > a');
            if (!nameContainer) {
                return {};
            }
            let name = nameContainer.getAttribute('title');
            
            // Get the start and end dates of the tournament
            let dateElements = header.querySelectorAll('time');
            let dates = Array.from(dateElements).map((time) => {
                return time.getAttribute('datetime');
            })

            // Gets the matches played by the player in the tournament
            let allMatches = tournament.querySelectorAll('li.list__item > ol.match-group');
            let matches = Array.from(allMatches)[eventIndex].querySelectorAll('li.match-group__item');
            let matchData = Array.from(matches).map((match) => {
                let resultContainer = match.querySelector('span.match__status');
                let result;
                if (resultContainer){
                    result = resultContainer.textContent;
                }

                // Gets the scores
                let pointCont = match.querySelectorAll('ul.points');
                let scores = Array.from(pointCont).map((cont) => {
                    let text = cont.textContent;
                    return text && text.replace(/(\d{2})/, '$1/').replace(/[\\n\s]/g, '');
                })

                // Gets the name of the opponents
                let players = match.querySelectorAll('.match__row:not(:has(span.match__status)) > div > div > span > a > span.nav-link__value');
                let opponents = Array.from(players).map((player) => player.textContent);

                // Gets the name of the player's partner (if possible)
                players = match.querySelectorAll('.match__row:has(span.match__status) > div > div > span > a > span.nav-link__value');
                let team = Array.from(players).map((player) => player.textContent);
                team = team.filter((name) => name && name.toLowerCase() != playerName.toLowerCase());
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
    
    //Get's the player's full name
    let playerName = await page.evaluate((): string => {
        let playerNameContainer = document.querySelector('h2 > span > span.nav-link__value');
        if (playerNameContainer) {
            let text = playerNameContainer.textContent;
            return (text)? text : '';
        }
        return '';
    })
    
    // Gets the overall win/loss for the player in the specified event
    let winloss = await page.evaluate((id) => {
        const eventStats = document.querySelector(id);
        if (!eventStats) {
            return [{wins: 0, losses: 0}];
        }

        const stats = eventStats.querySelectorAll('div.flex-container--center > span.list__value-start');
        return Array.from(stats).map((stat) => {
            let text = stat.textContent;
            if (text) {
                text = text.replace(/[\\n\s]/g, '');
                text = text.replace(/[\/\(]/g, ' ');
                console.log(text);
                let result = text.split(' ');
                if (result.length == 3) {
                    return {
                        wins: Number(result[0]),
                        losses: Number(result[1]),
                    }
                }
            }
            return {wins: 0, losses: 0};
        })
    }, `#tabStats${tags[event]}`);

    // Goes to the players tournament profile
    let curYear = 2024;
    let tournamentData: Object[] = [];
    let playerUrl = await page.url();
    for (let i = 0; i < years; i++) {
        await page.goto(playerUrl + `/tournaments/${curYear}`);
        let yearData = await getTournamentData(page, event, playerName)
        tournamentData = tournamentData.concat(yearData);
        curYear--;
    }

    //await page.browser().close();
    return {player: playerName, overall: winloss[0], year: winloss[1], tournaments: tournamentData};
}

// Gets the overall rankings of a specific player
const getPlayerRankingData = async (
    event: string, player: string, weeks: number
): Promise<Object> => {

    // Initializes browser and loads pages
    let page = await initPage(urls[event]);
    //await page.exposeFunction("getText", getText);

    let playerFull = '';
    let rankingData: weekRankInfo[] = [];
    let date: string = '';

    // Aggregate Stats
    let highestRank = 99999999;
    let lowestRank = -1;
    let highestPoints = 0;
    let lowestPoints = 9999999999;
    let totalPoints = 0;
    let totalRank = 0;

    // For each requested week
    for (let i = weeks; i > 0; i--) {
        
        // Selects the necessary week
        date = await selectWeek(page, i);

        // Loops through all pages until reaches the last page or finds the player
        let data: playerRankData = {playerFull: '', rank: {rank: '', points: ''}};
        let weekData: weekRankInfo = {week: date, rank: '', points: ''};
        while (weekData.rank == '') {

            // Searches the current page for the player
            let playerName = (playerFull == '')? player : playerFull;
            data = await findPlayerPointRank(page, playerName, event);
            weekData.rank = data.rank.rank;
            weekData.points = data.rank.points;

            // If the player isn't on the page, goes to next page
            if (weekData.rank == '') {
                let pageLink = await getNextPageLink(page);

                // If there are no next pages, informs the user
                if (pageLink === '') {
                    rankingData.push({week: date, rank: '', points: ''});
                    break;
                
                // If there is another page, moves to that page
                } else {
                    await page.goto(`${pageLink}`, {
                        waitUntil: "domcontentloaded",
                    });
                }
            }
        }
        let weekPoints = Number(weekData.points);
        let weekRank = Number(weekData.rank);

        // Updates the aggregate stats
        lowestRank = Math.max(weekRank, lowestRank);
        highestRank = Math.min(weekRank, highestRank);
        totalRank += weekRank;

        lowestPoints = Math.min(weekPoints, lowestPoints);
        highestPoints = Math.max(weekPoints, highestPoints);
        totalPoints += weekPoints;

        playerFull = data.playerFull;
        rankingData.push(weekData);
    }

    await page.browser().close();
    return {
        player: playerFull, 
        avgPoints: Math.round(totalPoints / weeks * 100) / 100,  highestPoints: highestPoints, lowestPoints: lowestPoints,
        avgRank: Math.round(totalRank / weeks * 100) / 100, highestRank: highestRank, lowestRank: lowestRank,
        rankingData: rankingData
    };
};

// Gets the overall rankings of the top X player
const getOverallRankingData = async (
    event: string, players: number, weeks: number
): Promise<string[][][]> => {
    
    // Initializes browser and loads pages
    let page = await initPage(urls[event]);
    //await page.exposeFunction("getText", getText);

    let rankingData: string[][][] = [];
    for (let i = weeks; i > 0; i--) {
        
        await selectWeek(page, i);

        // Loops through all pages until reaches the last page or finds the player
        let weekData: string[][] = [];
        let playersOnPage = 0;
        for (let playersLeft = players; playersLeft > 0; playersLeft -= playersOnPage) {
            
            // Gets the number of players on the page, excludes the column headers,
            // blank row, and page number footer
            playersOnPage = await page.evaluate(() => {
                const playerContainer = document.querySelector('table.ruler > tbody');
                if (playerContainer) {
                    return playerContainer.childElementCount - 3;
                }
                return 0;
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
        let nextPageAnchor: Element|null = null;

        if (pageNumberCont) {
            nextPageAnchor = pageNumberCont.querySelector('a.page_next');
        }
        if (nextPageAnchor) {
            return 'https://bwf.tournamentsoftware.com/'  + nextPageAnchor.getAttribute('href');
        }
        return '';
    });

    return nextPageLink;
}

const getText = (el: Element | null): string => {
    let text = el && el.textContent;
    return (text)? text : '';
}

// Given a page, searches the list of players for the specified player and returns their points and rank
const findPlayerPointRank = async (
    page: puppeteer.Page, player: string, event: string
):Promise<playerRankData> => {

    // Extract the player's rank for the week
    const pointRank = await page.evaluate((player, event): playerRankData => {
        let isSingles: boolean = ['MS', 'WS'].includes(event);
        let selector = (isSingles)? 'table.ruler > tbody > tr > td > a' : 'tr.doubles > td > p:has(img) > a';
        
        // Get's all player links on the page
        const links = document.querySelectorAll(selector);

        // Finds the requested player
        const playerLink: HTMLElement = Array.from(links).find((link) => {
            let text = link.textContent;
            if (text && text.toLowerCase().includes(player.toLowerCase())) {
                return true;
            }
            return false;
        }) as HTMLElement;
        
        // If the player s on the page
        if (playerLink) {
            let playerContainer: Element | null;
            playerContainer = playerLink.parentNode as Element
            playerContainer = playerContainer && playerContainer.parentNode as Element
            playerContainer = (isSingles)? playerContainer : playerContainer && playerContainer.parentNode as Element;
            
            // Extracts their full name
            let playerFull = playerLink && playerLink.textContent;
            playerFull = (playerFull)? playerFull : '';
            
            // Extracts their rank for the week
            let rankContainer = playerContainer && playerContainer.querySelector('td.rank');
            let rank = rankContainer && rankContainer.textContent;
            rank = (rank)? rank : '';
            
            // Extracts their points for the week
            let pointsContainer = playerContainer && playerContainer.querySelector('td.rankingpoints');
            let points = pointsContainer && pointsContainer.textContent;
            points = (points)? points : '';

            return {playerFull: playerFull, rank: {rank: rank, points: points}};
        } else {
            return {playerFull: '', rank: {rank: '', points: ''}};
        }
    }, player, event);

    return pointRank;
}

// Given a page, searches the list of players for the specified player and returns their points and rank
const findWeeklyPointRank = async (
    page: puppeteer.Page, players: number
): Promise<string[][]> => {
    
    let data: string[][] = [];

    // For each player
    for (let playerNum = 0; playerNum < players; playerNum++) {

        // Extracts the player's name, country, rank, and points
        let rankData = await page.evaluate((playerNum): string[] => {
            let curPlayer = document.querySelector(`table.ruler > tbody > tr:nth-child(${playerNum + 3})`);
            
            // If there are still players on the page
            if (curPlayer) {

                // Extracts their rank
                let rankContainer = curPlayer.querySelector('td.rank')
                let rank = rankContainer && rankContainer.textContent;
                rank = (rank)? rank : '';
                
                // Extracts their points
                let pointsContainer = curPlayer.querySelector('td.rankingpoints')
                let points = pointsContainer && pointsContainer.textContent;
                points = (points)? points : '';

                // Extracts their country
                let flags = curPlayer.querySelectorAll('span.flag');
                let country = flags[0] && flags[0].textContent;
                country = (country)? country : ''
                country = country.replace('[', '').replace(/\]\s?/, '');
                
                // Extracts their name
                let nameAnchors = Array.from(flags).map((flag) => {
                    let parent = flag.parentNode;
                    return parent && parent.querySelector('a');
                });
                let names = nameAnchors.map((anch) => getText(anch));

                return [country, ...names, rank, points]; 
            } else {
                return [];
            }
        }, playerNum);

        data.push(rankData);
    }

    return data;
}

// Given a page with a week selection option (rankings), selects the requested week
const selectWeek = async (page: puppeteer.Page, week: number): Promise<string> => {

    // Finds week selector
    await page.waitForSelector('a.chosen-single');
    await page.click('a.chosen-single');

    // Selects the requested week
    await page.click(`.chosen-results > li:nth-child(${week + 1})`);
    await page.waitForSelector('a.chosen-single');

    // Gets the week's date
    let weekDate = await page.evaluate (() => {
        let dateContainer = document.querySelector('a.chosen-single');
        let date = dateContainer && dateContainer.textContent;
        date = (date)? date : '';
        return date;
    })

    // Trims the week's date and returns it
    return weekDate.replace(/\s*[\n]\s*/g, '');
}