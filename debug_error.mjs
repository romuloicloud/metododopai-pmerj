import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('BROWSER ERROR:', msg.text());
        }
    });
    page.on('pageerror', error => console.error('PAGE ERROR EXCEPTION:', error.message));

    try {
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });

        // Simulate login by setting localStorage (we know supabase session is stored there)
        // Actually, setting localStorage directly might be hard if we don't have the token.
        // Let's just create a new profile through the UI.
        console.log("Navigated to App.");
        const isLogin = await page.$('input[type="email"]');
        if (isLogin) {
            console.log("Filling login info...");
            await page.type('input[type="email"]', 'romulo@metododopai.com');
            await page.type('input[type="password"]', '123456');
            await page.click('button[type="submit"]');
            await new Promise(r => setTimeout(r, 2000));

            // Let's see if we hit diagnostic welcome, we can just look for the bottom nav
            console.log("Looking for bottom nav Praticar button...");
            await page.evaluate(() => {
                const spans = Array.from(document.querySelectorAll('span'));
                const p = spans.find(span => span.textContent === 'Praticar');
                if (p && p.parentElement) p.parentElement.click();
            });
            await new Promise(r => setTimeout(r, 2000));
        }
    } catch (err) {
        console.error('Script Failed:', err);
    } finally {
        await browser.close();
    }
})();
