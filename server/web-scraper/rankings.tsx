import { initPage, getText } from "./helpers";
import { urls } from "./constants";
import { WeekRankInfo, PlayerRankData } from "./types";
import * as puppeteer from 'puppeteer';

// Gets the overall rankings of a specific player
export const getPlayerRankingData = async (
    event: string, player: string, weeks: number
): Promise<Object> => {

    // Initializes browser and loads pages
    let page = await initPage(urls[event]);
    //await page.exposeFunction("getText", getText);

    let playerFull = '';
    let rankingData: WeekRankInfo[] = [];
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
        let data: PlayerRankData = {playerFull: '', rank: {rank: '', points: ''}};
        let weekData: WeekRankInfo = {week: date, rank: '', points: ''};
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
export const getOverallRankingData = async (
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

// Given a ranking page, returns the url for the next page
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

// Given a raknking page with a week selection option, selects the requested week
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

// Given a ranking page, searches the list of players for the specified player and returns their points and rank
const findPlayerPointRank = async (
    page: puppeteer.Page, player: string, event: string
):Promise<PlayerRankData> => {

    // Extract the player's rank for the week
    const pointRank = await page.evaluate((player, event): PlayerRankData => {
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

// Given a ranking page, fetches the ranks and points of the top players on the page
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