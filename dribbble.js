const cheerio = require('cheerio');
const puppet = require('puppeteer');
const fs = require('fs');

/* Scrapes a dribbble.com Cheerio instance, generating a spreadsheet with all text content and links
@$: Cheerio instance with HTML content */
function dFullText($) {
    const sheet = [];
    sheet.push(['Plain Text','URLs'],['Links']);

    $('noscript').remove();

    $('a').each((index, value) => {
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

    $('<p>markerKey</p>').insertAfter('div'); // marker for later text processing
    $('<p>markerKey</p>').insertAfter('span');

    sheet.push(['']);
    sheet.push(['Body Text']);

    var bodyTxt = $('body').prop('innerText').trim();

    bodyTxt = bodyTxt.replace(/(<([^>]+)>)/gi, ""); // remove lingering HTML tags
    bodyTxt = bodyTxt.replace(/markerKey\s*markerKey/g, '');
    bodyTxt = bodyTxt.replace(/\n\s*\n/g, '\n'); // replace multiple line breaks with one
    bodyTxt = bodyTxt.replace(/markerKey/g,'\n'); // separate divs
    bodyTxt = bodyTxt.replaceAll('"',"'");
    bodyTxt += '"'; // quotes to preserve commas in body text
    bodyTxt = '"'.concat(bodyTxt);

    let csv = sheet.map(e => e.join(",")).join("\n");
    csv += ',\n'+bodyTxt;
    console.log(csv)
    fs.writeFile(url+'.csv', csv, err => { if (err) console.log(err) });

}

/* Scrapes the text content of a URL `url` using Puppeteer, excluding the selectors in `exclude` or including only the selector `include`. Will scrape all site content by default. Headers and footers can be listed in `exclude` to be excluded.
@url: URL of website to scrape; a string
@include: sole selector to include (string)
@exclude: array of selectors to exclude (string[]) */
function dScrape(url,include='',exclude=['']) {
    (async() => {
        const browser = await puppet.launch();
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
        await page.goto(url, {waitUntil: 'load'});

        var html = await page.content();
        const $ = cheerio.load(html);
        if (!arrayEquals(exclude,[''])) {
            for (let i = 0; i < exclude.length; i++) {
                $(exclude[i]).remove();
            }
        }

        start = (url.includes('https://www.')) ? url.indexOf('.') : url.indexOf('//') + 1
        end = url.indexOf('.', start + 1);
        url = url.slice(start+1,end);
        fullText($,url,include);
        await browser.close();
    })();
}