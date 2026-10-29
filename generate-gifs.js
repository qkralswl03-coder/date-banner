const puppeteer = require('puppeteer');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const WIDTH = 860;
const HEIGHT = 200;

const PAGE_URL =
  'https://qkralswl03-coder.github.io/date-banner/index-1.html';

const OUTPUT_FILE = 'event-banner.gif';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1
  });

  await page.goto(PAGE_URL, {
    waitUntil: 'networkidle0'
  });

  await documentFontsReady(page);

  const encoder = new GIFEncoder(WIDTH, HEIGHT);

  encoder.createReadStream().pipe(
    fs.createWriteStream(OUTPUT_FILE)
  );

  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(100);
  encoder.setQuality(10);

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // 6초 동안 0.1초 간격으로 캡처
  for (let i = 0; i < 60; i++) {
    const screenshot = await page.screenshot({
      type: 'png'
    });

    const image = await loadImage(screenshot);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);

    encoder.addFrame(ctx);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  encoder.finish();

  await browser.close();

  console.log(`Created ${OUTPUT_FILE}`);
}

async function documentFontsReady(page) {
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
