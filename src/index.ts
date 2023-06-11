import {
  BrowserLaunchArgumentOptions,
  Browser,
  Page,
  KeyInput,
  Frame,
} from 'puppeteer';
import {createRequire} from 'module';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-extra');

puppeteer.use(StealthPlugin());

const DefaultOptions: BrowserLaunchArgumentOptions = {
  headless: true,
};

class Uploader {
  options: BrowserLaunchArgumentOptions;
  url: string;
  frame: Frame | undefined;
  browser: Browser | undefined;
  constructor(url: string, options: BrowserLaunchArgumentOptions = {}) {
    this.url = url;
    this.options = options;
    if (!this.options.userDataDir) {
      throw new Error('UserDataDir is required');
    }
  }

  async upload(pathToFile: string): Promise<string> {
    if (!this.frame) {
      throw new Error('Frame not initialized');
    }
    await this.frame.waitForSelector('[type="file"]');
    const input = await this.frame.$('input[type="file"]');
    if (!input) {
      throw new Error('Input not found');
    }
    const fileName = encodeURIComponent(
      path.basename(pathToFile).replace(/\s/g, '+')
    );
    await input.uploadFile(pathToFile);
    await this.frame.waitForSelector(`img[src$="${fileName}"]`);
    const src = await this.frame.evaluate(
      fileName =>
        document.querySelector(`img[src$="${fileName}"]`)?.getAttribute('src'),
      fileName
    );
    if (!src) {
      throw new Error('Image not found');
    }

    // await page.click('div[data-tooltip="Insert image"]');
    return src;
    // return result;
  }

  async init() {
    puppeteer.use(StealthPlugin());
    const options = Object.assign({}, DefaultOptions, this.options);
    const browser = await puppeteer.launch(options);
    this.browser = browser;
    const page: Page = await browser.newPage();
    await page.goto(this.url);
    const language = await page.evaluate(() =>
      document.querySelector('html')?.getAttribute('lang')
    );
    if (language !== 'en' && !language?.startsWith('en-')) {
      throw new Error('page language is not english');
    }
    await page.waitForSelector('div[data-tooltip="Insert image"]');
    await this.focusClick(page, ['data-tooltip', 'Insert image']);
    await this.focusClick(
      page,
      ['aria-label', 'Upload from computer'],
      'ArrowDown'
    );
    await page.waitForSelector("[src^='https://www.blogger.com/picker']");
    const iframeName = await page.evaluate(() =>
      document
        .querySelector("[src^='https://www.blogger.com/picker']")
        ?.getAttribute('name')
    );
    await page.waitForFrame(frame => frame.name() === iframeName);
    const frame = page.frames().find(frame => frame.name() === iframeName);
    if (!frame) {
      throw new Error('Frame not found');
    }
    this.frame = frame;
  }

  private async focusClick(
    page: Page,
    selector: [string, string],
    navigator: KeyInput = 'Tab'
  ) {
    let found = false;
    while (!found) {
      await page.keyboard.press(navigator);
      await page.evaluate(() => document.activeElement);
      const isImage = await page.evaluate(
        selector =>
          document.activeElement?.getAttribute(selector[0]) === selector[1],
        selector
      );

      if (isImage) {
        found = true;
      }
    }

    await page.keyboard.press('Enter');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  // private changeFileName(pathToFile: string): {path: string; file: string} {
  //   const fileName = v4();
  //   const newPath = path.join(
  //     path.dirname(pathToFile),
  //     `${fileName}${path.extname(pathToFile)}`
  //   );

  //   return {path: newPath, file: fileName + path.extname(pathToFile)};
  // }
}

// const uploader = new Uploader(
//   'https://www.blogger.com/blog/post/edit/2287467253597550952/542979903295670849',
//   {
//     userDataDir: 'C:\\Users\\hhh\\AppData\\Local\\Google\\Chrome\\User Data',
//   }
// );
// await uploader.init();

// const result = await Promise.all([
//   uploader.upload('D:\\github\\blogger-image\\src\\image.png'),
//   uploader.upload('D:\\github\\blogger-image\\src\\image1.png'),
// ]);

// console.log(result);
// uploader.close();
export default Uploader;
