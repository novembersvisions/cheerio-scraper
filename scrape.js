const cheerio = require('cheerio');
const axios = require('axios');
const puppet = require('puppeteer');
const xlsx = require('xlsx');
const fs = require('fs');

/* Scrapes the website of a Cheerio instance, generating a spreadsheet with main navigation links, footer links, body content, body content links
@$: Cheerio instance with HTML content
@nav: class name of navigation section; a string
@footer: class name of footer section; a string
@body: class name of main body section; a string */
function site($, nav, footer, body) {

    var sheet = [];
    sheet.push(['Plain Text','URLs'],['Nav Links']);

    var nav_links = $(nav+' a');
    nav_links.each((index, value) => {
        var val = $(value).text().trim();
        if (val) {
            sheet.push([$(value).text(),$(value).attr("href")]);
        }
    })

    sheet.push(['']);
    sheet.push(['Footer Links']);

    var footer_links = $(footer+' a');
    footer_links.each((index, value) => {
        sheet.push([$(value).text(),$(value).attr("href")]);
    })

    sheet.push(['']);
    sheet.push(['Body Links']);

    var body_links = $(body+' a');
    body_links.each((index, value) => {
        sheet.push([$(value).text(),$(value).attr("href")]);
    })

    sheet.push(['']);
    sheet.push(['Body Content']);

    var body_content = $(body);
    sheet.push([body_content.text().trim()]);

    console.log(sheet.toString());

    const worksheet = xlsx.utils.aoa_to_sheet(sheet);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet);

    xlsx.writeFile(workbook, "site.xlsx", { compression: true });

}

/* Compares two arrays, returning true if their contents are the same.
@arr1: string[]
@arr2: string[] */
function arrayEquals(arr1,arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i<arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

/* Scrapes the website of a Cheerio instance, generating a spreadsheet with all text content and links
@$: Cheerio instance with HTML content */
function fullText($) {
    const sheet = [];
    sheet.push(['Plain Text','URLs'],['Links']);

    $('noscript').remove();

    $('a').each((index, value) => {
        var link = $(value).attr("href")
        if (typeof link === "string") { // removes spaces
            link = link.replaceAll('\n','');
        }
        var newText = $(value).text().replaceAll('\n','');
        if (link !== "javascript:void(0);" && link !== "javascript:void(0)" && link !== "") { // no js void links
            sheet.push([newText.trim(), link]); // text/links into sheet array
        }
    });

    $('<p>markerKey</p>').insertAfter('div'); // marker for later text processing

    sheet.push(['']);
    sheet.push(['Body Text']);

    var bodyTxt = $('body').prop('innerText').trim();

    bodyTxt = bodyTxt.replace(/(<([^>]+)>)/gi, ""); // remove lingering HTML tags
    bodyTxt = bodyTxt.replace(/markerKey\s*markerKey/g, '');
    bodyTxt = bodyTxt.replace(/\n\s*\n/g, '\n'); // replace multiple line breaks with one
    bodyTxt = bodyTxt.replace(/markerKey/g,'\n'); // separate divs
    bodyTxt += '"'; // quotes to preserve commas in body text
    bodyTxt = '"'.concat(bodyTxt);

    let csv = sheet.map(e => e.join(",")).join("\n");
    csv += ',\n'+bodyTxt;
    console.log(csv)
    fs.writeFile('prueba.csv', csv, err => { if (err) console.log(err) });

}

/* Scrapes the text content of a URL `url` using Puppeteer, excluding the selectors in `exclude` and including only the selectors in `include`. Will scrape all site content by default. Headers and footers can be listed in `exclude` to be excluded.
@url: URL of website to scrape; a string
@include: array of selectors to include (string[])
@exclude: array of selectors to exclude (string[]) */
function scrape(url,include=[''],exclude=['']) {
    (async() => {
        const browser = await puppet.launch();
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        await page.goto(url, {waitUntil: 'load'});

        var html = await page.content();
        const $ = cheerio.load(html);
        if (!arrayEquals(exclude,[''])) {
            for (let i = 0; i < exclude.length; i++) {
                $(exclude[i]).remove();
            }
        }
        if (!arrayEquals(include,[''])) {
            $('body').each(function (i, elem) {
                if (!include.includes(elem.name)) {
                    $(elem.name).remove();
                }
            });
        }
        fullText($);
        await browser.close();
    })();
}

// const divs = [".aem-GridColumn--default--12 ", ".cmp-global-header__language-selector ", ".cmp-global-header__primary-nav",".cmp-global-header__language-options"];
// scrape('https://www.accenture.com/us-en/insights/generative-ai',divs);

scrape('https://www.amazon.com/s?i=specialty-aps&bbn=16225009011&rh=n%3A%2116225009011%2Cn%3A7926841011&_encoding=UTF8&content-id=amzn1.sym.85f810d5-ce12-4423-a10d-231c7df04c87&painterId=billboard-card&pd_rd_r=977ec2fa-dffe-4eeb-ba91-ba21e7071502&pd_rd_w=JrUMU&pd_rd_wg=ElOQ4&pf_rd_p=85f810d5-ce12-4423-a10d-231c7df04c87&pf_rd_r=Y7NY9AZ45QHDCE8P3AEM&ref=nav_em__nav_desktop_sa_intl_video_game_consoles_and_accessories_0_2_5_15',[''],["#navFooter ", ".navFooterDescLine ", ".nav-a ", "#nav-hamburger-menu ", "#nav-flyout-accountList"]);

scrape('https://medium.com/analytics-vidhya/classification-model-on-custom-dataset-using-tensorflow-js-9458da5f2301')