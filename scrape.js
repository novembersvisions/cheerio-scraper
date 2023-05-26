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
    
    var nav_links = $('.'+nav+' a');
    nav_links.each((index, value) => {
        var val = $(value).text().trim();
        if (val) {
            sheet.push([$(value).text(),$(value).attr("href")]);
        }
    })
    
    sheet.push(['']);
    sheet.push(['Footer Links']);

    var footer_links = $('.'+footer+' a');
    footer_links.each((index, value) => {
        sheet.push([$(value).text(),$(value).attr("href")]);
    })

    sheet.push(['']);
    sheet.push(['Body Links']);

    var body_links = $('.'+body+' a');
    body_links.each((index, value) => {
        sheet.push([$(value).text(),$(value).attr("href")]);
    })

    sheet.push(['']);
    sheet.push(['Body Content']);

    var body_content = $('.'+body);
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
//         site($, url, 'site-header', 'site-share', 'site-content')
//     });