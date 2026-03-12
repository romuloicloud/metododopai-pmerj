import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
        const isLogin = await page.$('input[type="email"]');
        if (isLogin) {
            await page.type('input[type="email"]', 'romulo@metododopai.com');
            await page.type('input[type="password"]', '123456');
            await page.click('button[type="submit"]');
            await new Promise(r => setTimeout(r, 2000));

            await page.evaluate(() => {
                const spans = Array.from(document.querySelectorAll('span'));
                const p = spans.find(span => span.textContent === 'Praticar');
                if (p && p.parentElement) p.parentElement.click();
            });
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: 'practice_screen.png' });
            console.log("Screenshot saved to practice_screen.png");
        }
    } catch (err) {
        console.error('Script Failed:', err);
    } finally {
        await browser.close();
    }
})();
