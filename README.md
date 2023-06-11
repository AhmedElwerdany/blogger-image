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

```javascript
import Uploader from 'blogger-image'

// link to an empty blog post
const link = 'https://www.blogger/blog/post/edit/../...'

// options:  https://pptr.dev/api/puppeteer.browserlaunchargumentoptions

const options = {
    // path to your data, so it's easier to be logged in to blogger.
    userDataDir: 'C:\\Users\\ahmed\\AppData\\Local\\Google\\Chrome\\User Data',
}

const uploader = new Uploader(link, options);
await uploader.init();

// upload two files
const result = await Promise.all([
  uploader.upload('./newtest.png'),
  uploader.upload('./Screenshot 2021-12-21 130153.png'),
]);

// or upload one by one 
const link1 = await uploader.upload('./newtest.png')
const link2 = await uploader.upload('./Screenshot 2021-12-21 130153.png')

console.log(result);
console.log(link1);
console.log(link2);
await uploader.close();

```