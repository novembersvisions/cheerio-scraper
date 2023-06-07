const puppet = require('puppeteer');
const cheerio = require('cheerio');
const {Readability} = require("@mozilla/readability");
// const scrape = require('./scrape');

// var url = 'https://www.design2dev.com/studio/';
// (async() => {
//     const browser = await puppet.launch();
//     const page = await browser.newPage();
//     await page.goto(url, {waitUntil: 'domcontentloaded'});
//
//     var html = await page.content();
//     const $ = cheerio.load(html);
//     site($, url, '.site-header', '.site-share', '.site-content')
//     await browser.close();
// })();

// var url = 'https://www.amazon.com/s?i=specialty-aps&bbn=16225009011&rh=n%3A%2116225009011%2Cn%3A7926841011&_encoding=UTF8&content-id=amzn1.sym.85f810d5-ce12-4423-a10d-231c7df04c87&painterId=billboard-card&pd_rd_r=977ec2fa-dffe-4eeb-ba91-ba21e7071502&pd_rd_w=JrUMU&pd_rd_wg=ElOQ4&pf_rd_p=85f810d5-ce12-4423-a10d-231c7df04c87&pf_rd_r=Y7NY9AZ45QHDCE8P3AEM&ref=nav_em__nav_desktop_sa_intl_video_game_consoles_and_accessories_0_2_5_15';
// (async() => {
//     const browser = await puppet.launch();
//     const page = await browser.newPage();
//     await page.goto(url, {waitUntil: 'domcontentloaded'});
//
//     var html = await page.content();
//     const $ = cheerio.load(html);
//     site($, url, '#navbar-main', '#search', '#navFooter');
//     await browser.close();
// })();

// var url = 'https://www.ibm.com/products/cloud-pak-for-watson-aiops';
// (async() => {
//     const browser = await puppet.launch();
//     const page = await browser.newPage();
//     await page.goto(url, {waitUntil: 'domcontentloaded'});
//
//     var html = await page.content();
//     const $ = cheerio.load(html);
//     site($, url, 'dds-megamenu-top-nav-menu', '.ibm-footer-corporate-links', '#ibm-content-wrapper')
//     await browser.close();
// })();

var url = 'https://www.ibm.com/products/cloud-pak-for-watson-aiops';
(async() => {
    const browser = await puppet.launch();
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'load'});

    var html = await page.content();
    const $ = cheerio.load(html);
    scrape.fullText($);
    await browser.close();
})();