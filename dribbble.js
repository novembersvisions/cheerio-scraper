const cheerio = require('cheerio');
const puppet = require('puppeteer');
const fs = require('fs');
const { scrollPageToBottom } = require('puppeteer-autoscroll-down');
const {loadGraphModel} = require("@tensorflow/tfjs");

/* Scrapes a dribbble.com Cheerio instance, generating a spreadsheet with name text content and links
@$: Cheerio instance with HTML content */
function dNameLink($) {
    const sheet = [];
    sheet.push(['Plain Text','URLs'],['Links']);

    $('.resume-card-profile-link').each((index, value) => {
        var link = $(value).attr("href")
        if (typeof link === "string") { // removes spaces
            link = link.replaceAll('\n','');
        }
        var newText = $(value).text().replaceAll('\n','');
        newText = newText.trim();
        newText = newText.replaceAll('"',"'");
        newText += '"'; // quotes to preserve commas in body text
        newText = '"'.concat(newText);
        if (link !== "javascript:void(0);" && link !== "javascript:void(0)" && link !== "") { // no js void links
            sheet.push([newText, link]); // text/links into sheet array
        }
    });

    let csv = sheet.map(e => e.join(",")).join("\n");
    console.log(csv)
    fs.writeFile('dribbble.csv', csv, err => { if (err) console.log(err) });
}

/* Scrapes a dribbble.com Cheerio instance (with a specific user/agency "about" page), generating a spreadsheet with name, website, members, and email
@$: Cheerio instance with HTML content */
function uNameLink($) {
    const sheet = [];
    sheet.push(['Members']);

    $('.team-members-list a').each((index, value) => {
        var link = $(value).attr("href")
        if (typeof link === "string") { // removes spaces
            link = link.replaceAll('\n','');
        }
        // var newText = $(value).text().replaceAll('\n','');
        // newText = newText.trim();
        // newText = newText.replaceAll('"',"'");
        // newText += '"'; // quotes to preserve commas in body text
        // newText = '"'.concat(newText);
        if (link !== "javascript:void(0);" && link !== "javascript:void(0)" && link !== "") { // no js void links
            sheet.push([link]); // text/links into sheet array
        }
    });

    let main = $('#main').text();
    if (main.includes('@')) {
        var start = main.indexOf('@');
        // console.log(main.charAt(start-3));
        let at = start;
        start = start-1;
        while (main.charAt(start).match(/[a-z]/i)) {
            start = start-1; // find where email starts
        }
        let end = main.indexOf(' ', at+1);
        let email = main.slice(start+1,end);
        sheet.push(['Email']);
        sheet.push([email]);
    }

    let csv = sheet.map(e => e.join(",")).join("\n");
    console.log(csv)
    fs.writeFile('userDribbble.csv', csv, err => { if (err) console.log(err) });

}

/* Scrapes the text content of a dribbble URL `url` using Puppeteer.
* @user: whether the page being scraped is a user page; boolean */
function dScrape(url,user=true) {
    (async() => {
        const browser = await puppet.launch({headless: user});
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
        const data = fs.readFileSync('./cookies.json',
            { encoding: 'utf8' });
        const cookies = JSON.parse(data);
        await page.setCookie(...cookies);

        await page.goto(url, {waitUntil: 'load'});

        if (!user) {
            let loadSeconds = 0;

            while (loadSeconds < 6) {
                await scrollPageToBottom(page, {size: 250, delay: 500});
                loadSeconds += 1;
                console.log(loadSeconds)
            }
            // while (loadAvailable) {
            //     await scrollPageToBottom(page, {size: 500, delay: 30, stepsLimit: 100000});
            //     // if (page.viewport().height >= await page.evaluate(() => document.body.scrollHeight)) {
            //     //     loadAvailable = false;
            //     // }
            // }
        }
        var html = await page.content();
        const $ = cheerio.load(html);
        (user) ? uNameLink($) : dNameLink($);
        await browser.close();
    })();
}

// dScrape('https://dribbble.com/designers?tab=results&search%5BbookmarkCount%5D=0&search%5BworkType%5D=freelance&search%5BdesignerType%5D%5B%5D=agency&search%5BsearchUid%5D=9921125-1686587763095',false);
dScrape('https://dribbble.com/Tubik/about');