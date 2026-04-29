const scrape = require('website-scraper').default;

const allowedAssetHosts = [
  'www.uohkca.com',
  'uohkca.com',
  'static.wixstatic.com',
  'static.parastorage.com',
  'siteassets.parastorage.com',
  'viewer-assets.parastorage.com',
  'frog.wix.com',
  'wix.com',
  'www.wix.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

function hostAllowed(hostname) {
  return allowedAssetHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

scrape({
  urls: ['https://www.uohkca.com/'],
  directory: 'site',
  recursive: true,
  maxRecursiveDepth: 10,
  filenameGenerator: 'bySiteStructure',
  requestConcurrency: 12,
  ignoreErrors: true,
  sourceSiteHost: 'https://www.uohkca.com',
  sources: [
    { selector: 'img', attr: 'src' },
    { selector: 'img', attr: 'srcset' },
    { selector: 'picture source', attr: 'srcset' },
    { selector: 'picture source', attr: 'src' },
    { selector: 'link', attr: 'href' },
    { selector: 'script', attr: 'src' },
    { selector: 'script', attr: 'data-url' },
    { selector: 'style', attr: 'data-href' },
    { selector: 'iframe', attr: 'src' },
    { selector: 'audio', attr: 'src' },
    { selector: 'video', attr: 'src' },
    { selector: 'video', attr: 'poster' },
    { selector: 'object', attr: 'data' },
    { selector: '*', attr: 'style' }
  ],
  urlFilter: function(url) {
    try {
      const parsed = new URL(url);
      return hostAllowed(parsed.hostname);
    } catch (_err) {
      return false;
    }
  }
})
  .then((result) => {
    console.log(`Downloaded ${result.length} files.`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
