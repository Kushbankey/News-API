import express from "express";
import puppeteer from "puppeteer";

const port=3000;
const app=express();

const newspapers=[
    {
        name: "TheHindu",
        address: "https://www.thehindu.com/latest-news",
        selector: "#sectiondivtrend"
    },
    {
        name: "TheHindustanTimes",
        address: "https://www.hindustantimes.com/trending",
        selector: "#dataHolder"
    },
    {
        name: "TheIndianExpress",
        address: "https://indianexpress.com/section/trending/trending-globally",
        selector: ".articles"
    }
]

let articles=[];
const titleToExclude=["Trending", "", "Whatsapp", "Twitter", "Facebook", "Linkedin", "Arfa Javaid", "2", "3"];

async function scrapeNewspapers() {
    const allArticles = [];

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const newspaper of newspapers) {
        await page.goto(newspaper.address, { waitUntil: 'networkidle0' });
        await page.waitForSelector(newspaper.selector);

        const articles = await page.evaluate((selector, newspaperName) => {
            const links = Array.from(document.querySelectorAll(`${selector} a`));
            return links.map(link => ({
                title: link.innerText,
                url: link.href,
                address: newspaperName
            }));
        }, newspaper.selector, newspaper.name);

        const filteredArticles=articles.filter(article => !titleToExclude.includes(article.title));

        allArticles.push(...filteredArticles);
    }

    await browser.close();
    console.log(allArticles);
    return allArticles;
}

app.get("/", (req,res) => {
    res.json(`Welcome to the NEWS hub!`);
});

app.get("/news", async (req, res) => {
    try {
        articles=await scrapeNewspapers();
        res.json(articles);
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts" });
    }
});

app.get("/news/:newspaperId" ,async(req,res) => {
    try {
        const newspaperId=req.params.newspaperId;

        const newspaper = newspapers.find((np) => np.name === newspaperId);
        console.log(newspaper);

        const specificArticles = [];

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto(newspaper.address, { waitUntil: 'networkidle0' });
        await page.waitForSelector(newspaper.selector);

        const articles = await page.evaluate((selector, newspaperName) => {
            const links = Array.from(document.querySelectorAll(`${selector} a`));
            return links.map(link => ({
                title: link.innerText,
                url: link.href,
                address: newspaperName
            }));
        }, newspaper.selector, newspaper.name);

        const filteredArticles=articles.filter(article => !titleToExclude.includes(article.title));

        specificArticles.push(...filteredArticles);

        await browser.close();
        console.log(specificArticles);

        res.json(specificArticles);
    }
    catch (error){
        console.error(error);
        res.status(500).json({ message: "Error fetching posts" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}.`);
});