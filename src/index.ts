import {
  BrowserLaunchArgumentOptions,
  Browser,
  Page,
  KeyInput,
  Frame,
  LaunchOptions,
} from 'puppeteer';
import { createRequire } from 'module';
import languages from './languages.js';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-extra');


const DefaultOptions: LaunchOptions & BrowserLaunchArgumentOptions = {
  headless: true,
  ignoreDefaultArgs: true
};

class Uploader {
  options: LaunchOptions & BrowserLaunchArgumentOptions;
  url: string;
  frame: Frame | undefined;
  browser: Browser | undefined;
  constructor(url: string, options: LaunchOptions & BrowserLaunchArgumentOptions = {}) {
    this.url = url;
    this.options = options;
    if (!this.options.executablePath) {

      console.warn(`\x1b[43m   "executablePath" is missing:\x1b[0m
\x1b[33m    This package depends on puppeteer, which uses the latest version of Chromium.
    The latest Chromium has problems with persistent login sessions, which may cause errors or unexpected behavior.
    To avoid this, you need to provide the "executablePath" option in your "new Uploader()" call,
    pointing to the path of the Chromium or Chrome executable that you want to use.\x1b[0m`);

    }

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

    return src;
  }

  async init() {
    puppeteer.use(StealthPlugin());
    const options = Object.assign({}, DefaultOptions, this.options);

    const args = [`--user-data-dir=${options.userDataDir}`];
    if (options.headless) {
      args.push('--headless')
    }
    if (options.args && Array.isArray(options.args)) {
      args.push(...options.args)
    }
    options.args = args

    const browser = await puppeteer.launch(options);
    this.browser = browser;
    const page: Page = await browser.newPage();

    await page.goto(this.url);

    let language = await page.evaluate(() =>
      document.querySelector('html')?.getAttribute('lang')
    );

    if (language.includes('-')) {
      const index_of_dash = language.indexOf('-');
      language = language.slice(0, index_of_dash);
    }

    if (!page.url().startsWith(this.url)) {
      throw new Error("Sorry, You've been redirected to " + page.url())
    }

    if (language && !(language in languages)) {
      throw new Error('Sorry, language is not supported\nlanguage: ' + language);
    }

    await page.waitForSelector(`div[data-tooltip="${languages[language].insert_image}"]`);
    await this.focusClick(page, ['data-tooltip', languages[language].insert_image]);
    await this.focusClick(
      page,
      ['aria-label', languages[language].from_computer],
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
}

export default Uploader;
