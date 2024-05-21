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

app.get("/api", async (req, res) => {
    const data = await getPlayerRankingData(
        req.query.event as string, 
        req.query.player as string,
        parseInt(req.query.weeks as string),
    );
    //const data = await getPlayerData(req.query.player as string);
    res.json({ message: data });
});

// Initializes a browser window for puppeteer
const initBrowser = async () => {  
    const browser = await puppeteer.launch({
        headless: false,
    });
    return browser;
};

// Given a player's name, searches for the player in the search bar and returns a matching result.
const getPlayerData = async (player: string): Promise<string> => {
    
    // Initializes browser and loads pages
    const browser = await initBrowser();
    let page = await browser.newPage();
    await page.goto('https://bwf.tournamentsoftware.com/ranking/ranking.aspx?rid=70', {
        waitUntil: "domcontentloaded",
    });

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

    //await browser.close();
    return '';
}

// Gets the overall rankings in a specific event or of a specific player
const getPlayerRankingData = async (
    event: string, player: string, weeks: number
): Promise<[[string, string]]> => {
    
    // Initializes browser and loads pages
    const browser = await initBrowser();
    let page = await browser.newPage();
    await page.goto(`${urls[event]}`, {
        waitUntil: "domcontentloaded",
    });

    let rankingData: [[string, string]] = [['Rank', 'Points']];
    for (let i = 0; i < weeks; i++) {
        
        await selectWeek(page, i);

        console.log(await page.url());
        
        // Loops through all pages until reaches the last page or finds the player
        let playerData: [string, string] = ['', '']
        while (playerData[0] == '') {

            // Searches the current page for the player
            playerData = await findPlayerPointRank(page, player);

            // If the player isn't on the page, goes to next page
            if (playerData[0] == '') {
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

        rankingData.push(playerData)
    }

    //await browser.close();
    return rankingData;
};

// // Given a page, returns the url for the next page
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

// // Given a page, searches the list of players for the specified player
const findPlayerPointRank = async (page: puppeteer.Page, player: string):Promise<[string, string]> => {
    
    // Extract text content of elements matching the selector
    const pointRank = await page.evaluate((player: string): [string, string] => {
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

const selectWeek = async (page: puppeteer.Page, week: number) => {
    await page.click('a.chosen-single');

    // await page.evaluate((week: number) => {
    //     let options = document.querySelectorAll('.active-result');
    //     let anchor = Array.from(options).find((link): boolean => {
    //         return week.toString() == link.getAttribute('data-option-array-index');
    //     }) as HTMLElement;
    //     anchor.click();
    // }, week)

    await page.click(`.chosen-results > li:nth-child(${week + 1})`);
    await page.waitForSelector('a.chosen-single');
}