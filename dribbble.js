const cheerio = require('cheerio');
const puppet = require('puppeteer');
const fs = require('fs');
const { scrollPageToBottom } = require('puppeteer-autoscroll-down');

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

/* Scrapes a dribbble.com Cheerio instance (with a specific user or agency "about" page), generating a spreadsheet with name, website, members, and email
@$: Cheerio instance with HTML content
@user: whether the website is a user page; boolean */
function uNameLink($, user) {
    const sheet = [];
    (!user) ? sheet.push(['Agency Name','Email','Website','Members']) : sheet.push(['First Name','Email','Website','Role','Location','LinkedIn','Agency Name','Agency URL'])

    // Name
    var name = $('.masthead-content h1').text();
    if (user) {
        let spacePos = name.indexOf(' ');
        if (spacePos !== -1) name = name.slice(0,spacePos);
    }
    let sheetStr = name+',';

    // Email
    let main = $('#main').text();
    if (main.includes('@')) {
        var start = main.indexOf('@');
        // console.log(main.charAt(start-3));
        let at = start;
        start = start-1;
        while (main.charAt(start).match(/[\w.-]/i)) {
            start = start-1; // find where email starts
        }
        let end = main.indexOf('.',at);
        while (main.charAt(end).match(/[A-Za-z_.-]/i)) {
            // console.log(main.charAt(end))
            end = end+1; // find where email ends
        }
        let email = main.slice(start+1,end);
        if (email.includes('.') && !email.includes(' ')) {
            sheetStr += [email];
            sheetStr += ',';
        }
        else {
            sheetStr += [''];
            sheetStr += ',';
        }
    }
    else {
        sheetStr += [''];
        sheetStr += ',';
    }

    // Website
    let website = $('.profile-social-section li').first().text().trim();
    if (website.includes('.')) sheetStr += website;

    // Members (for agency pages only)
    if (!user) {
        $('.team-members-list a').each((index, value) => {
            var link = $(value).attr("href")
            if (typeof link === "string") { // removes spaces
                link = link.replaceAll('\n', '');
            }

            if (link !== "javascript:void(0);" && link !== "javascript:void(0)" && link !== "") { // no js void links
                link = 'https://dribbble.com'.concat(link);
                (index === 0) ? sheetStr += [',' + link + '\n'] : sheetStr += [',,,' + link + '\n'];
            }
        });
    }

    // For user pages only
    let agency;
    if (user) {
        // Role
        let role = $('.masthead-profile-specializations').text().trim();
        if (role === '') role = $('.bio-text').text().trim();
        sheetStr += ',"'+role+'"';

        // Location
        let location = $('.masthead-profile-locality').text().trim();
        sheetStr += ',"'+location+'"';

        // LinkedIn
        let social = $('.profile-social-section li a');
        let linkedin;
        social.each((index, value) => {
            let link = $(value).attr("href")
            if (link.includes('linkedin')) linkedin = link;
        });
        if (linkedin !== undefined) {
            sheetStr += ',https://dribbble.com'+linkedin;
        } else {
            sheetStr += ',';
        }

        // Agency
        agency = $('.profile-teams-section a');

        sheetStr += ',"'+$('.profile-teams-section a span').text().trim()+'",';
        sheetStr += 'https://dribbble.com'+agency.attr("href");

    }

    sheet.push([sheetStr])

    let csv = sheet.map(e => e.join(",")).join("\n");
    console.log(csv)
    agency = $('.profile-teams-section a span').text().trim();
    agency = agency.replaceAll('/','|');
    fs.writeFile('csv/'+name+'_'+agency+'.csv', csv, err => { if (err) console.log(err) });

}

/* Scrapes the text content of a dribbble URL `url` using Puppeteer.
* @agency: whether the page being scraped is an agency page; boolean
* @user: whether the page being scraped is a user page; boolean */
function dScrape(url,agency=false,user=true) {
    (async() => {
        const browser = await puppet.launch({headless: user});
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
        const data = fs.readFileSync('./cookies.json',
            { encoding: 'utf8' });
        const cookies = JSON.parse(data);
        await page.deleteCookie(...await page.cookies());
        await page.setCookie(...cookies);
        // page.setDefaultNavigationTimeout(0);
        // page.setDefaultTimeout(0);

        await page.goto(url, {waitUntil: 'load', timeout: 10000}).then(() => {
            console.log('success')
        }).catch((res) => {
            console.log('fails', res)
        })
        // await page.goto(url, {waitUntil: 'load', timeout: 0});
        // page.setDefaultTimeout(0);

        if (!user && !agency) {
            let loadSeconds = 0;

            while (loadSeconds < 4) {
                await scrollPageToBottom(page, {size: 250, delay: 1000});
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
        (agency || user) ? uNameLink($, user) : dNameLink($);
        await browser.close();
    })();
}

/* Loops through URLs in agencies.csv and returns CSV files */
async function agencyLoop() {
    const agencies = fs.readFileSync('./agencies.csv').toString().split("\n");
    for (var i = 1040; i < agencies.length; i++) {
        console.log('Starting scrape');
        await timer(4100);
        dScrape(agencies[i]);
    }
}

function timer(ms) { return new Promise(res => setTimeout(res, ms)); }

/* Combines CSV files in the directory `directory`
* @directory: string formatted as ./csv/ */
function combineCsv(directory) {
    var files = fs.readdirSync(directory);
    let sheet = fs.readFileSync(directory+files[0]).toString();

    for (let i = 1; i < files.length; i++) {
        sheet += fs.readFileSync(directory+files[i]).toString();
        console.log(sheet)
    }

    fs.writeFile('userResults.csv', sheet, err => {
        if (err) console.log(err)
    });
}

/* Loops through user pages in agencyResults.csv and returns CSV files */
async function userLoop() {
    let sheet = fs.readFileSync('./agencyResults.csv').toString().split("\n");
    sheet = sheet.map(item => [...item.split(',')] );

    var col = sheet.map(d => d[3]);

    for (let i=3398;i<col.length;i++) {
        if (col[i].trim() !== 'Members' && col[i] !== '' && !col[i].includes('members')) {
            console.log(i)
            console.log(col[i])
            await timer(4000);
            dScrape(col[i]+'/about')
        }
    }
}

// userLoop()

dScrape('https://dribbble.com/designers?tab=results&search%5Bkeywords%5D=web&search%5Blocation%5D=United%20States&search%5BdesignerType%5D%5B%5D=freelance&search%5BworkType%5D=freelance&search%5BbookmarkCount%5D=0&search%5BsearchUid%5D=66646-1686769687845',false,false)