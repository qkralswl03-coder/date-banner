const puppeteer = require('puppeteer');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { PNG } = require('pngjs');
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

  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });

  const gif = GIFEncoder();

  // 약 6초 동안 0.1초 간격으로 실제 화면을 캡처
  for (let i = 0; i < 60; i++) {
    const screenshot = await page.screenshot({
      type: 'png'
    });

    const png = PNG.sync.read(screenshot);

    const palette = quantize(png.data, 256);
    const index = applyPalette(png.data, palette);

    gif.writeFrame(index, WIDTH, HEIGHT, {
      palette,
      delay: 100,
      repeat: 0
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  gif.finish();

  fs.writeFileSync(OUTPUT_FILE, Buffer.from(gif.bytes()));

  await browser.close();

  console.log(`Created ${OUTPUT_FILE}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
