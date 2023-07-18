const cheerio = require('cheerio');
const puppet = require('puppeteer');
const xlsx = require('xlsx');
const fs = require('fs');

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
@url: URL of website to scrape; a string
@$: Cheerio instance with HTML content
@include: array of selectors to exclude (string[])
@rows: whether to format text in rows (boolean)
@separate: separator of rows, either an int (number of rows) or string (delimiter) */
function fullText($,url,include,rows,separate) {
    const sheet = [];
    if (!rows) {
        sheet.push(['Plain Text', 'URLs'], ['Links']);

        $('noscript').remove();

        var linkSearches = [];
        if (include.length !== 0) {
            for (let i = 0; i < include.length; i++) {
                linkSearches.push(include[i] + ' a');
                if ($(include[i] + ':first').attr("href")) linkSearches.push(include[i]);
            }
        } else linkSearches.push('a');

        for (let i = 0; i < linkSearches.length; i++) {
            $(linkSearches[i]).each((index, value) => {
                var link = $(value).attr("href");
                // this line gets links from elements wrapped in <a> tags
                // if (!link) link = $(value).parent().attr("href")
                if (typeof link === "string") { // removes spaces
                    link = link.replaceAll('\n', '');
                }
                var newText = $(value).text().replaceAll('\n', '');
                newText = newText.trim();
                newText = newText.replaceAll('"', "'");
                newText += '"'; // quotes to preserve commas in body text
                newText = '"'.concat(newText);
                if (link !== "javascript:void(0);" && link !== "javascript:void(0)" && link !== "" && link) {
                    sheet.push([newText, link]); // text/links into sheet array
                }
            });
        }
    }

    $('<p>markerKey</p>').insertAfter('div'); // marker for later text processing
    $('<p>markerKey</p>').insertAfter('span');
    $('<p>markerKey</p>').insertAfter('p');
    $('<p>markerKey</p>').insertAfter('br');

    if (!rows) {
        sheet.push(['']);
        sheet.push(['Body Text']);
    }

    var bodyTxt = (include.length !== 0) ? '' : $('body').prop('innerText').trim();
    if (include.length !== 0) {
        for (let i=0; i<include.length;i++) {
            // console.log(i);
            // console.log($(include[i]).text());
            let prevTxt;
            $(include[i]).each((index, value) => {
                let currTxt = $(value).prop('innerText').trim();
                if (index === 0) prevTxt = currTxt;
                if (index === 0 || currTxt.replaceAll('markerKey','') !== prevTxt.replaceAll('markerKey','')) {
                    bodyTxt += currTxt;
                }
                // console.log(index);
                // console.log($(value).text());
                prevTxt = currTxt;
                bodyTxt += '\n';
            });
        }
    }

    bodyTxt = bodyTxt.replace(/(<([^>]+)>)/gi, ""); // remove lingering HTML tags
    bodyTxt = bodyTxt.replace(/markerKey\s*markerKey/g, 'markerKey');
    bodyTxt = bodyTxt.replace(/markerKey/g,'\n'); // separate divs
    bodyTxt = bodyTxt.replace(/\n\s*\n\s*\n/g, '\n'); // replace multiple line breaks with one
    bodyTxt = bodyTxt.replace(/\s{3,}/g,'\n');
    bodyTxt = bodyTxt.replaceAll('"',"'");

    if (!rows) {
        bodyTxt += '"';
        // quotes to preserve commas in body text
        bodyTxt = '"'.concat(bodyTxt);
    }

    let csv;
    if (rows) {
        sheet.push(bodyTxt)
        if (typeof separate === "number") csv = formatRows(sheet, '', separate);
        else csv = formatRows(sheet, separate);
        // csv = csv.map(e => e.split(",")).join("\n");
        csv = csv.join("\n");
    } else {
        csv = sheet.map(e => e.join(",")).join("\n");
        csv += ',\n'+bodyTxt;
        console.log(csv)
    }

    fs.writeFile(url+'.csv', csv, err => { if (err) console.log(err) });

}

/* Scrapes the text content of a URL `url` using Puppeteer, excluding the selectors in `exclude` and/or including only the selectors in `include`. Will scrape all site content by default. Headers and footers can be listed in `exclude` to be excluded. No class in `include` should equal a class in `exclude` and vice versa.
@url: URL of website to scrape; a string
@include: array of selectors to include (string[])
@exclude: array of selectors to exclude (string[])
@rows: whether to format text in rows (boolean)
@separate: separator of rows, either an int (number of rows) or string (delimiter) */
function scrape(url,include=[],exclude=[''],rows=false,separate='') {
    (async() => {
        const browser = await puppet.launch();
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');

        await page.goto(url, {waitUntil: 'load',timeout: 0});

        var html = await page.content();
        const $ = cheerio.load(html);
        if (!arrayEquals(exclude,[''])) {
            for (let i = 0; i < exclude.length; i++) {
                $(exclude[i]).remove();
            }
        }

        let start = (url.includes('https://www.')) ? url.indexOf('.') : url.indexOf('//') + 1
        let end = url.indexOf('.', start + 1);
        url = url.slice(start+1,end);
        fullText($,url,include,rows,separate);

        await browser.close();
    })();
}

/* Formats text lines into spreadsheet rows. Specify either `lineLen` or `separate`, not both.
* @file: text as an array of strings or filename in directory, formatted as ./example.txt
* @separate: character or string acting as a delimiter between rows (optional)
* @lineLen: number of columns to fit in each row (optional) */
function formatRows(file, separate='',lineLen=999) {
    let array;
    if (typeof file === "string") {
        array = fs.readFileSync(file).toString();
        array = array.split('\n');
        // array = array.replaceAll(',','');
    } else {
        array = file.toString();
        array = array.split('\n');
    }
    let sheet = [];
    let sheetStr = '';
    let c = 1;
    for (let i=0;i<array.length;i++) {
        // let match = array[i].match(/[a-z][A-Z]/);
        // if (match) {
        //     let index = array[i].indexOf(match[0])+1;
        //     array[i] = array[i].slice(0,index) + "," + array[i].slice(index);
        // }
        if (lineLen !== 999) {
            // console.log(c)
            // console.log(c % lineLen === 0)
            // console.log(array[i])
            if (c % lineLen !== 0) sheetStr += '"' + array[i] + '",';
            if (c % lineLen === 0) {
                sheetStr += '"' + array[i] + '"';
                sheet.push(sheetStr);
                sheetStr = '';
            }
        c++;
        } else {
            if (array[i] !== separate) sheetStr += array[i] + ',';
            if (array[i] === separate) {
                sheet.push(sheetStr);
                sheetStr = array[i];
            }
        }
    }
    console.dir(sheet, {'maxArrayLength': null});

    return sheet;
    // console.log(sheet);
}

// formatRows('./rows.txt',2);
// scrape('https://gamesurconf.com/us/2023-speakers/',['h2'],[''],true,3)
// scrape('https://reopsconf22.joinlearners.com/')
// scrape('https://www.uxcon.at/speakers-2023')
// scrape('https://uxrconf23.joinlearners.com/',['.talks_name','.talks_position'])
// scrape('https://www.radicalresearchsummit.com/2021-home/#2021-Speakers',['.fusion-rollover-title'])
// scrape('https://rosenfeldmedia.com/advancing-research-2023/speakers/',['.text'],[''],true,1)
// scrape('https://www.talk-ux.com/',['strong','h4'])
// scrape('https://www.theiaconference.com/iac23-new-orleans/iac23-speakers/')
// scrape('https://www.userinterviews.com/youx',['.eventsr','.youx-agenda-speaker'],[''],true,'')
// scrape('https://www.userresearchlondon.com/urldn2022',['p'],[''],true,3)
// scrape('https://www.ux360summit.com/page/2473792/speakers',['.atom-fullname','.atom-text1','.atom-text2'])
// scrape('https://uxdx.com/usa/2023/speakers/',['.line-clamp-2'])
// scrape('https://uxdx.com/emea/2022/speakers/',['.line-clamp-2'])
// scrape('https://www.uxnewzealand.com/speakers',['.speaker-overlay'])
// scrape('https://www.uxnordic.com/',['.w-inline-block'])
// scrape('https://uxstrat.com/asia/',['.fourToOneGrid'])
// scrape('https://www.uxstrat.com/usa/',['.fourToOneGrid'])
// scrape('https://www.weyweyweb.com/#speakers',['.speaker'])
// scrape('https://worldusabilitycongress.com/conference/',['.wuc-speaker-detail'])
// scrape('https://designmatters.io/lineup/',['.profile-card'])
// scrape('https://www.urca.live/#Speakers-preview',['.team-card'])
// scrape('https://uxscotland.net/keynotes',['.mb-2 , h4'])
// scrape('https://techcircus.io/en/events/ux-writing-conference-online')
// scrape('https://productday.adplist.org/speakers',['.w-inline-block'])
// scrape('https://www.designdrives.org/conference',['.sqs-block-html'])
// scrape('https://www.designdrives.org/conference/agenda',['h2'])
// scrape('https://interaction23.ixda.org/speakers',['.w-dyn-items'])
// scrape('https://uxistanbul.org/')
// scrape('https://uxpa2023.org/our-speakers/',['.speakers__person'],[''],true,2)

// scrape('https://autos.mercadolibre.com.ar/volkswagen/',['.ui-search-result__content'])

// scrape('https://www.amazon.com/hz/mobile/mission?p=4EfTMuAy5j74uD%2BdbYs%2FVNxYoZ342zdQwZolf[…]dd80-6aa3-4b6f-b1b0-57e91ab13e97&pd_rd_w=kbBbi&pd_rd_wg=rz8CP',['._p13n-mission-desktop-carousel_style_productContainer__3p81X','._p13n-mission-desktop-carousel_TitleBlock_titleTextMaxRows4__2Bk2T','._p13n-mission-desktop-carousel_style_image__3ccEi'])

// const divs = [".aem-GridColumn--default--12 ", ".cmp-global-header__language-selector ", ".cmp-global-header__primary-nav",".cmp-global-header__language-options"];
// scrape('https://www.accenture.com/us-en/insights/generative-ai',divs);

// scrape('https://www.amazon.com/s?i=specialty-aps&bbn=16225009011&rh=n%3A%2116225009011%2Cn%3A7926841011&_encoding=UTF8&content-id=amzn1.sym.85f810d5-ce12-4423-a10d-231c7df04c87&painterId=billboard-card&pd_rd_r=977ec2fa-dffe-4eeb-ba91-ba21e7071502&pd_rd_w=JrUMU&pd_rd_wg=ElOQ4&pf_rd_p=85f810d5-ce12-4423-a10d-231c7df04c87&pf_rd_r=Y7NY9AZ45QHDCE8P3AEM&ref=nav_em__nav_desktop_sa_intl_video_game_consoles_and_accessories_0_2_5_15',["#navFooter"], [""]);

// scrape('https://www.amazon.com/s?i=specialty-aps&bbn=16225009011&rh=n%3A%2116225009011%2Cn%3A7926841011&_encoding=UTF8&content-id=amzn1.sym.85f810d5-ce12-4423-a10d-231c7df04c87&painterId=billboard-card&pd_rd_r=977ec2fa-dffe-4eeb-ba91-ba21e7071502&pd_rd_w=JrUMU&pd_rd_wg=ElOQ4&pf_rd_p=85f810d5-ce12-4423-a10d-231c7df04c87&pf_rd_r=Y7NY9AZ45QHDCE8P3AEM&ref=nav_em__nav_desktop_sa_intl_video_game_consoles_and_accessories_0_2_5_15');

// scrape('https://medium.com/analytics-vidhya/classification-model-on-custom-dataset-using-tensorflow-js-9458da5f2301')

// scrape('https://www2.deloitte.com','',['#header ', '#cmp-advanced-search'])

// scrape('https://www.pwc.com/','',['.mod__header-v2 ', '#onetrust-accept-btn-handler ', '.slim-navigation']);

// scrape('https://www.mckinsey.com/','',['#global-header ', '.show-nav ', '.primary-nav-list_H4L9v']);

// scrape('https://www.bain.com','',['.utility-navigation__wrapper ', '#nav-wrap'])

// scrape('https://www.tcs.com/','',['.py-0 ', '.navbar_links'])

// scrape('https://www.capgemini.com','',['.header-nav ', '.header-bottom'])

// scrape('https://www.cognizant.com','',['.cog-header__main-menu-item ', '.bg-gray-lighter ', '.cog-header__ribbon-menu'])

// scrape('https://www.salesforce.com/mx/?ir=1','',['.mobile-pl-24']);

// scrape('https://www.technologyreview.com/','.heroSection__wrapper--1e38a');

// scrape('https://www.economist.com/','#content')

// scrape('https://www.omaze.com/','.oz-homepage')

// scrape('https://colourpop.com/','.owl-drag')

// scrape('https://www.colourpop.com/collections/jelly-much-shadow','.listing')

// scrape('https://www.finops.org/introduction/what-is-finops/')

// scrape('https://www.cognizant.com/us/en','',['.position-relative ', '.align-items-center ', '.cog-header__ribbon-menu'])