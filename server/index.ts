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
    const data = await getData(req.query.event as string, req.query.player as string);
    res.json({ message: data });
});

// Initializes a browser window for puppeteer
const initBrowser = async () => {  
    const browser = await puppeteer.launch({
        //headless: false,
    });
    return browser;
};

// Scrapes the requested data from the BWF website
const getData = async (event: string, player: string): Promise<string> => {
    
    // Initializes browser and loads pages
    const browser = await initBrowser();
    let page = await browser.newPage();
    await page.goto(`${urls[event]}`, {
        waitUntil: "domcontentloaded",
    });

    // Loops through all pages until reaches the last page or finds the player
    let playerData = ''
    while (playerData == '') {

        // Searches the current page for the player
        playerData = await findPlayerOnPage(page, player);

        // If the player isn't on the page, goes to next page
        if (playerData == '') {
            let pageLink = await getNextPageLink(page);
            console.log(pageLink)

            // If there are no next pages, informs the user
            if (pageLink === '') {
                return 'Player does not exist';
            
            // If there is another page, moves to that page
            } else {
                await page.goto(`${pageLink}`, {
                    waitUntil: "domcontentloaded",
                });
            }
        }
    }

    await browser.close();
    return playerData;
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

// Given a page, searches the list of players for the specified player
const findPlayerOnPage = async (page: puppeteer.Page, player: string):Promise<string> => {
    
    // Extract text content of elements matching the selector
    const data = await page.evaluate((player: string): string => {
        const links = document.querySelectorAll('table.ruler > tbody > tr > td > a');
        const playerLink: HTMLElement = Array.from(links).find((link) => {
            if (link.textContent.toLowerCase() == player.toLowerCase()) {
                return true;
            }
            return false;
        }) as HTMLElement;
        
        if (playerLink) {
            playerLink.click();
            return playerLink.getAttribute('href');
        } else {
            return '';
        }
    }, player);

    return data;
}