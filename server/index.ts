// server/index.js

import * as puppeteer from 'puppeteer';
import express from 'express';
import { initPage } from './web-scraper/helpers';
import { getOverallRankingData, getPlayerRankingData } from './web-scraper/rankings';
import { TournamentData } from './web-scraper/types';

const PORT = process.env.PORT || 3001;

const app = express();

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

app.get("/api/playersearch", async (req, res) => {
    const data = await searchForPlayer(
        req.query.player as string,
    );
    res.json({ message: 'Searched for player', data: {players: data}});
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

type YearlyTournamentSummary = {
    wins: number,
    matches: number,
    tournamentData: TournamentData[]
}

const getYearlyTournamentData = async (
    page: puppeteer.Page, event: string, playerName: string, curWins: number, curMatches: number
): Promise<YearlyTournamentSummary> => {

    return await page.evaluate((event, playerName, curWins, curMatches): YearlyTournamentSummary => {

        let totalMatchesWon = 0;
        let totalMatchesPlayed = 0;

        let tournaments = document.querySelectorAll('#tabcontent > div.module--card');
        let tournamentData = Array.from(tournaments).map((tournament): TournamentData => {
            let totalTournamentWins = 0;
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
                let datetime = time.getAttribute('datetime');
                if (datetime) {
                    return datetime.split(' ')[0];
                }
                return '';
            })

            // Gets the matches played by the player in the tournament
            let allMatches = tournament.querySelectorAll('li.list__item > ol.match-group');
            let matches = Array.from(allMatches)[eventIndex].querySelectorAll('li.match-group__item');
            let matchData = Array.from(matches).map((match) => {
                let resultContainer = match.querySelector('span.match__status');
                let result;
                if (resultContainer){
                    result = resultContainer.textContent;
                    if (result == 'W') {
                        totalTournamentWins++;
                    }
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

            // recalculates aggregate data
            let totalTournamentMatches = matchData.length;
            totalMatchesWon += totalTournamentWins;
            totalMatchesPlayed += totalTournamentMatches;

            return {
                name: name,
                sdate: dates[0],
                edate: dates[1],
                totalTournamentWins: totalTournamentWins,
                totalTournamentMatches: totalTournamentMatches,
                winRate: (curWins - totalMatchesWon + totalTournamentWins) / (curMatches - totalMatchesPlayed + totalTournamentMatches),
                matches: matchData,
            }
        }).filter(tournament => tournament)

        return {wins: totalMatchesWon, matches: totalMatchesPlayed, tournamentData: tournamentData}
    }, event, playerName, curWins, curMatches);
}

const searchForPlayer = async (player: string): Promise<string[]> => {
    // Initializes browser and loads page
    let page = await initPage(`https://bwf.tournamentsoftware.com/find/player?q=${player}`);


    // Puts the players name into the search box, if no players appear, that player does not exist
    try {
        await page.waitForSelector('div.module-container > ul.list--bordered', {timeout: 3000});
    } catch (e) {
        console.log('returned nothing');
        return [];
    }

    let playerNames = await page.evaluate(() => {
        const resultsList = document.querySelector('div.module-container > ul.list--bordered');
        
        let results: string[] = [];
        if (resultsList) {
            let playerNames = resultsList.querySelectorAll('h5.media__title > a > .nav-link__value');
            results = Array.from(playerNames).map((container): string => {
                let text = container.textContent;
                
                return (text)? text: '';
            })
        }

        return results;
    })

    return playerNames
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
        return {playerName: ''};
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

    //Get's the player's country
    let country = await page.evaluate((): string => {
        let countryContainer = document.querySelector('small.media__subheading > a > span');
        if (countryContainer) {
            let text = countryContainer.textContent;
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

        // Finds both the overall and yearly stats
        const stats = eventStats.querySelectorAll('div.flex-container--center > span.list__value-start');
        return Array.from(stats).map((stat) => {
            let text = stat.textContent;

            // Stats come in the format Wins/Losses(Overall)
            // Trims the stats and removes the overall games count
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

    let curWins = winloss[0].wins;
    let curMatches = winloss[0].wins + winloss[0].losses;
    for (let i = 0; i < years; i++) {
        await page.goto(playerUrl + `/tournaments/${curYear}`);
        let yearData = await getYearlyTournamentData(page, event, playerName, curWins, curMatches);
        tournamentData = tournamentData.concat(yearData.tournamentData);
        curWins -= yearData.wins;
        curMatches -= yearData.matches;
        curYear--;
    }

    //await page.browser().close();
    return {player: playerName, country: country, overallWinLoss: winloss[0], yearlyWinLoss: winloss[1], tournaments: tournamentData};
}