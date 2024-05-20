// server/index.js

import * as puppeteer from 'puppeteer';
import express from 'express';

const PORT = process.env.PORT || 3001;

const app = express();

app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log(`Server listening on ${PORT}`);
});

app.get("/api", async (req, res) => {
    const data = await getData();
    res.json({ message: data });
});

const initBrowser = async () => {  
    const browser = await puppeteer.launch();
    return browser;
};

const getData = async () => {
    const browser = await initBrowser();
    const page = await browser.newPage();

    await page.goto("https://bwf.tournamentsoftware.com/ranking/ranking.aspx?rid=70", {
        waitUntil: "domcontentloaded",
    });

    // Extract text content of elements matching the selector
    const data = await page.evaluate(() => {
        // Select all elements matching the specified selector
        const rankdate = document.querySelector(".rankingdate");
        // Map over the elements and return their text content
        return rankdate.textContent;
    });

    await browser.close();
    return data;
};