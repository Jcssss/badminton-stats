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

app.get("/api/playerbio", async (req, res) => {
    const data = await getPlayerData(req.query.player as string);
    res.json({ message: data });
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
        //headless: false,
    });

    let page = await browser.newPage();
    await page.goto(`${url}`, {
        waitUntil: "domcontentloaded",
    });
    
    return page;
};

// Given a player's name, searches for the player in the search bar and returns a matching result.
const getPlayerData = async (player: string): Promise<string> => {
    
    // Initializes browser and loads page
    let page = await initPage('https://bwf.tournamentsoftware.com/ranking/ranking.aspx?rid=70');

    await page.type('input.search-box__field', player);
    try {
        await page.waitForSelector('a.nav-link.media__link', {timeout: 3000});
    } catch (e) {
        return 'There are no players with that name.'
    }

    await page.evaluate(() => {
        const playerLink = document.querySelector('a.nav-link.media__link') as HTMLElement;
        playerLink.click();
    })

    await page.browser().close();
    return 'Got Bio';
}

// Gets the overall rankings of a specific player
const getPlayerRankingData = async (
    event: string, player: string, weeks: number
): Promise<[[string, string]]> => {
    
    // Initializes browser and loads pages
    let page = await initPage(urls[event]);

    let rankingData: [[string, string]] = [['Rank', 'Points']];
    for (let i = 0; i < weeks; i++) {
        
        await selectWeek(page, i);

        // Loops through all pages until reaches the last page or finds the player
        let weekData: [string, string] = ['', '']
        while (weekData[0] == '') {

            // Searches the current page for the player
            weekData = await findPlayerPointRank(page, player);

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
        rankingData.push(weekData)
    }

    await page.browser().close();
    return rankingData;
};

// Gets the overall rankings of the top X player
const getOverallRankingData = async (
    event: string, players: number, weeks: number
): Promise<[[[string, string, string]]]> => {
    
    // Initializes browser and loads pages
    let page = await initPage(urls[event]);

    let rankingData: [[[string, string, string]]] = [[['Name', 'Rank', 'Points']]];
    for (let i = 0; i < weeks; i++) {
        
        await selectWeek(page, i);

        // Loops through all pages until reaches the last page or finds the player
        let weekData: [[string, string, string]] = [['', '', '']]
        while (weekData[0][0] == '') {

            // Searches the current page for the player
            weekData = await findWeeklyPointRank(page, players);

            // If the player isn't on the page, goes to next page
            if (weekData[0][0] == '') {
                let pageLink = await getNextPageLink(page);

                // If there are no next pages, informs the user
                if (pageLink === '') {
                    rankingData.push([['', '', '']]);
                
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
            return 'https://bwf.tournamentsoftware.com/' + nextPageAnchor.getAttribute('href');
        }
        return '';
    });

    return nextPageLink;
}

// Given a page, searches the list of players for the specified player and returns their points and rank
const findPlayerPointRank = async (page: puppeteer.Page, player: string):Promise<[string, string]> => {
    
    // Extract text content of elements matching the selector
    const pointRank = await page.evaluate((player): [string, string] => {
        const links = document.querySelectorAll('table.ruler > tbody > tr > td > a');
        const playerLink: HTMLElement = Array.from(links).find((link) => {
            if (link.textContent.toLowerCase() == player.toLowerCase()) {
                return true;
            }
            return false;
        }) as HTMLElement;
        
        if (playerLink) {
            let player = playerLink.parentNode.parentNode;
            let rank = player.querySelector('td.rank').textContent;
            let points = player.querySelector('td.rankingpoints').textContent;
            return [rank, points];
        } else {
            return ['', ''];
        }

    }, player);

    return pointRank;
}

// Given a page, searches the list of players for the specified player and returns their points and rank
const findWeeklyPointRank = async (page: puppeteer.Page, players: number):Promise<[[string, string, string]]> => {
    
    let data: [[string, string, string]];

    // Gets the number of players on the page, excludes the column headers,
    // blank row, and page number footer
    const playersOnPage = await page.evaluate(() => {
        const playerContainer = document.querySelector('table.ruler > tbody');
        return playerContainer.childElementCount - 3
    })
    
    for (let playerNum = 0; playerNum < playersOnPage; playerNum++) {
        let rankData = await page.evaluate((playerNum): [string, string, string] => {
            let curPlayer = document.querySelector(`table.ruler > tbody > tr:nth-child(${playerNum + 2})`);
            
            if (curPlayer) {
                let rank = curPlayer.querySelector('td.rank').textContent;
                let points = curPlayer.querySelector('td.rankingpoints').textContent;
                let name = curPlayer.querySelector('span.flag').textContent;
                return [name, rank, points];
            } else {
                return ['', '', ''];
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