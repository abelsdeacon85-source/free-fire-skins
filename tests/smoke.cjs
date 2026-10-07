// Requires Playwright and Chromium. Start the Python server before running.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const catalog = require('../catalog.json');
const m4a1=catalog.guns.find(g=>g.id==='m4a1');
const base = process.env.SITE_URL || 'http://127.0.0.1:8000/';
(async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
 try {
 const page = await browser.newPage(); const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.goto(base); await page.locator('.category').first().waitFor();
 assert.equal(await page.locator('.category').count(), catalog.categories.length);
 await page.getByRole('link', {name: /Assault Rifles/}).click();
 await page.getByRole('link', {name: /M4A1/}).click();
 await page.locator('.skin-card').first().waitFor();
 assert.equal(await page.locator('.skin-card').count(), m4a1.skins.length);
 await page.selectOption('#rarity-filter', 'rare');
 assert.equal(await page.locator('.skin-card').count(), 14);
 assert.equal(await page.locator('.skin-card:not(.rare)').count(), 0);
 await page.selectOption('#rarity-filter', 'all');
 await page.selectOption('#sort-filter', 'rare-to-common');
 const ranks = await page.locator('.skin-card').evaluateAll(cs => cs.map(c => ['uncommon','rare','epic','mythic','artifact'].findIndex(r => c.classList.contains(r))));
 assert(!ranks.some((r,i) => i && r > ranks[i-1]));
 await page.getByLabel('Search skins').fill('no such skin');
 await page.getByRole('heading', {name: 'No matching skins'}).waitFor();
 await page.goto(base+'editor.html?gun=m4a1');
 await page.getByLabel('Skin name', {exact:true}).fill('Test Skin');
 await page.getByLabel('Rarity', {exact:true}).selectOption('epic');
 await page.getByRole('button', {name:'+ Add attribute'}).click();
 await page.getByLabel('Attribute', {exact:true}).selectOption('Damage');
 await page.getByLabel('Change', {exact:true}).selectOption('2');
 await page.getByLabel('Or choose an image').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
 await page.getByRole('button', {name:'Save skin',exact:true}).click();
 await page.getByText('Test Skin', {exact:true}).waitFor();
 await page.goto(base+'m4a1.html');
 await page.getByRole('heading',{name:'Test Skin',exact:true}).waitFor();
 assert.equal(await page.locator('.skin-card').count(),m4a1.skins.length+1);
 assert.match(await page.locator('.skin-card').filter({hasText:'Test Skin'}).locator('img').getAttribute('src'),/^data:image\/png;base64,/);
 assert.equal(await page.locator('.skin-card').filter({hasText:'Test Skin'}).locator('.plus').textContent(),'++');
 await page.goto(base+'editor.html?gun=m4a1');
 await page.locator('.edit-item').filter({hasText:'Test Skin'}).getByRole('button',{name:'Edit',exact:true}).click();
 await page.getByLabel('Skin name',{exact:true}).fill('Edited Test Skin');
 await page.getByRole('button',{name:'Update skin'}).click();
 await page.getByText('Edited Test Skin',{exact:true}).waitFor();
 await page.getByText('Add a gun',{exact:true}).click();
 await page.getByLabel('Gun name',{exact:true}).fill('Test Weapon');
 await page.getByRole('button',{name:'Add gun',exact:true}).click();
 await page.goto(base+'gun.html?id=test-weapon');
 await page.getByRole('heading',{name:'This collection is waiting for you.'}).waitFor();
 await page.goto(base+'editor.html');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export catalog'}).click();
 const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),'catalog.json');
 await download.saveAs('/tmp/free-fire-test-export.json');
 await page.evaluate(()=>localStorage.clear());
 await page.reload();
 page.on('dialog', dialog => dialog.accept());
 await page.getByLabel('Import a catalog backup').setInputFiles('/tmp/free-fire-test-export.json');
 await page.getByLabel('Gun',{exact:true}).selectOption('test-weapon');
 await page.goto(base+'m4a1.html');
 await page.getByRole('heading',{name:'Edited Test Skin',exact:true}).waitFor();
 await page.goto(base+'editor.html?gun=m4a1');
 await page.locator('.edit-item').filter({hasText:'Edited Test Skin'}).getByRole('button',{name:'Delete',exact:true}).click();
 assert.equal(await page.getByText('Edited Test Skin',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Reset browser draft'}).click();
 await page.goto(base+'m4a1.html');
 await page.locator('.skin-card').first().waitFor();
 assert.equal(await page.locator('.skin-card').count(),m4a1.skins.length);
 for(const route of ['index.html',...catalog.categories.map(c=>c.id+'.html'),...catalog.guns.map(g=>g.id+'.html')]) {
 const response=await page.goto(base+route);assert.equal(response.status(),200,route);await page.locator('h1').waitFor();
 }
 for(const gun of catalog.guns.filter(g=>g.skins.length)) {
 await page.goto(base+gun.id+'.html');await page.locator('.skin-card').first().waitFor();assert.equal(await page.locator('.skin-card').count(),gun.skins.length);
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'m4a1.html');await page.locator('.skin-card').first().waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'/tmp/free-fire-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);await page.locator('.category').first().waitFor();await page.screenshot({path:'/tmp/free-fire-home.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${1+catalog.categories.length+catalog.guns.length} routes, existing skin collections, filtering, sorting, search, editor add/edit/delete, new guns, persistent storage, export/import/reset, mobile layout, and no browser errors.`);
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
