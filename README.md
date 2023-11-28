# blogger image

<p align="center">
<img src="./public/logo.png" width="265" />
</p>

:arrow_up: blogger-image helps you upload photos to blogger using simple api

## install
```bash
npm i blogger-image
// or 
yarn add blogger-image
```

## Usage
```javascript
import Uploader from 'blogger-image'


const POST_ID = "https://www.blogger.com/blog/post/edit/.../...";

const uploader = new Uploader(
  POST_ID,
  {
    userDataDir: '/home/username/.config/chromium',
    // it is recommended to use an old version of chromium instead of the default browser.
    executablePath: '/home/username/.config/chrome-linux/chrome',  
  }
);
  
await uploader.init();

const result = await Promise.all([
  uploader.upload('./tree.png'),
]);

console.log(result);

// the `upload` method will not be available after this.
uploader.close();
```
### kowen Issues 
This package depends on `puppeteer`, which uses the latest version of Chromium.  
The latest Chromium has problems with persistent login sessions, which may cause errors or unexpected behavior.  
To avoid this, you need to use an old version on chromium and provide the "executablePath" option in your "new Uploader()" call, pointing to the path of the Chromium executable.

Follow the next instructions if you want to download an older version of Chromium and use it with the package.

#### Download an Old version of Chromium
```shell
cd ~/.config
```
```shell
wget "https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F962947%2Fchrome-linux.zip?generation=1643115368404678&alt=media" -q  --show-progress -O chrome_2f962947.zip
```
```shell
unzip chrome_2f962947.zip
```

#### Login to Blogger

This will open the The version that we just downloaded.
```shell
cd chrome-linux; ./chrome
```
- Go to `blogger.com`
- Login
- Close the browser
```shell
pwd
```
Copy the result becuase you're gonna need it in `excutablePath`.  
It should be `/home/{username}/.config/chrome-linux` where `{username}` is your username.

Add it to the options.
```javascript

const uploader = new Uploader(
  POST_ID,
  {
    userDataDir: '/home/username/.config/chromium',
    executablePath: '/home/username/.config/chrome-linux/chrome', // recomnded
  }
);

await uploader.init();


```

