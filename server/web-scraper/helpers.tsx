import * as puppeteer from 'puppeteer';

// Initializes a browser window for puppeteer
export const initPage = async (url: string): Promise<puppeteer.Page> => {  
    const browser = await puppeteer.launch({
        headless: false,
    });

    let page = await browser.newPage();
    await page.goto(`${url}`, {
        waitUntil: "domcontentloaded",
    });
    
    return page;
};

export const getText = (el: Element | null): string => {
    let text = el && el.textContent;
    return (text)? text : '';
}