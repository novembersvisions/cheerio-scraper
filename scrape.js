const cheerio = require('cheerio');
const axios = require('axios');
var xlsx = require('xlsx');

/* Scrapes the website `url`, returning a spreadsheet with main navigation links, footer links, body content, body content links
@url: URL of website to scrape; a string
@nav: class name of navigation section; a string
@footer: class name of footer section; a string
@body: class name of main body section; a string */
function site($, url, nav, footer, body) {

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

// var url = 'https://www.design2dev.com/studio/';
// axios.get(url).then((response) => {
//         html = response.data;
//         const $ = cheerio.load(html);
//         site($, url, '.site-header', '.site-share', '.site-content')
//     });

// var url = 'https://www.ibm.com/products/cloud-pak-for-watson-aiops';
// axios.get(url).then((response) => {
//         html = response.data;
//         const $ = cheerio.load(html);
//         site($, url, '.ibm-duo-epp-l1__wrapper', '.ibm-col-1-1', '.ibm-padding-top-0')
//     });

var url = 'https://www.ibm.com/products/cloud-pak-for-watson-aiops';
axios.get(url).then((response) => {
        html = response.data;
        const $ = cheerio.load(html);
        site($, url, 'dds-megamenu-top-nav-menu', '.ibm-footer-corporate-links', '#ibm-content-wrapper')
    });

// var url = 'https://www.amazon.com/s?i=specialty-aps&bbn=16225009011&rh=n%3A%2116225009011%2Cn%3A7926841011&_encoding=UTF8&content-id=amzn1.sym.85f810d5-ce12-4423-a10d-231c7df04c87&painterId=billboard-card&pd_rd_r=977ec2fa-dffe-4eeb-ba91-ba21e7071502&pd_rd_w=JrUMU&pd_rd_wg=ElOQ4&pf_rd_p=85f810d5-ce12-4423-a10d-231c7df04c87&pf_rd_r=Y7NY9AZ45QHDCE8P3AEM&ref=nav_em__nav_desktop_sa_intl_video_game_consoles_and_accessories_0_2_5_15';
// axios.get(url).then((response) => {
//         html = response.data;
//         const $ = cheerio.load(html);
//         site($, url, '#navbar-main', '#search', '#navFooter')
//     });