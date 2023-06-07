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

/* Scrapes the website of a Cheerio instance, generating a spreadsheet with all text content and links
@$: Cheerio instance with HTML content */
function fullText($) {
    const sheet = [];
    sheet.push(['Plain Text','URLs'],['Links']);

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

    sheet.push(['']);
    sheet.push(['Body Text']);

    var bodyTxt = $('body').prop('innerText').trim();
    bodyTxt = bodyTxt.replace(/(<([^>]+)>)/gi, "");

    bodyTxt = bodyTxt.replace(/\n/g,"");

    if (bodyTxt.length <= 32767) { // prevent length exception from xlsx
        sheet.push([bodyTxt]);
    } else { // break body text into pieces
        var txtInSheet = bodyTxt.length;
        while (txtInSheet > 32767) {
            var start = bodyTxt.length - txtInSheet;
            var end = start + 32767;
            sheet.push([bodyTxt.slice(start,end)]);
            txtInSheet = txtInSheet - 32767;
        }
        if (txtInSheet > 0) {
            sheet.push([bodyTxt.slice(txtInSheet)]);
        }
    }
    console.log(sheet)

    const worksheet = xlsx.utils.aoa_to_sheet(sheet);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet);

    xlsx.writeFile(workbook, "siteBody.xlsx", { compression: true });

    // let csv = sheet.map(e => e.join(",")).join("\n");
    // fs.writeFile('prueba.csv', csv, err => { if (err) console.log(err) });

}

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
    $('#ibm-footer-module-links , #ibm-footer , #ibm-duo-epp-l1__menu').remove();
    fullText($);
    await browser.close();
})();

// var url = 'https://www.amazon.com/s?i=specialty-aps&bbn=16225009011&rh=n%3A%2116225009011%2Cn%3A7926841011&_encoding=UTF8&content-id=amzn1.sym.85f810d5-ce12-4423-a10d-231c7df04c87&painterId=billboard-card&pd_rd_r=977ec2fa-dffe-4eeb-ba91-ba21e7071502&pd_rd_w=JrUMU&pd_rd_wg=ElOQ4&pf_rd_p=85f810d5-ce12-4423-a10d-231c7df04c87&pf_rd_r=Y7NY9AZ45QHDCE8P3AEM&ref=nav_em__nav_desktop_sa_intl_video_game_consoles_and_accessories_0_2_5_15';
// (async() => {
//     const browser = await puppet.launch();
//     const page = await browser.newPage();
//     await page.goto(url, {waitUntil: 'load'});
//
//     var html = await page.content();
//     const $ = cheerio.load(html);
//     // $('#ibm-footer-module-links, dds-top-nav, #ibm-footer').remove();
//     fullText($);
//     await browser.close();
// })();