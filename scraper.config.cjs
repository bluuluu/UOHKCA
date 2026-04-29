module.exports = {
  urls: ['https://www.uohkca.com/'],
  directory: 'site',
  recursive: true,
  maxDepth: 10,
  maxRecursiveDepth: 10,
  prettifyUrls: true,
  filenameGenerator: 'bySiteStructure',
  requestConcurrency: 10,
  sources: [
    { selector: 'img', attr: 'src' },
    { selector: 'img', attr: 'srcset' },
    { selector: 'source', attr: 'src' },
    { selector: 'source', attr: 'srcset' },
    { selector: 'link', attr: 'href' },
    { selector: 'script', attr: 'src' },
    { selector: 'iframe', attr: 'src' },
    { selector: 'audio', attr: 'src' },
    { selector: 'video', attr: 'src' },
    { selector: 'video', attr: 'poster' },
    { selector: '*', attr: 'style' }
  ],
  urlFilter: function(url) {
    try {
      const u = new URL(url);
      const host = u.hostname;
      if (host === 'www.uohkca.com' || host === 'uohkca.com') {
        return true;
      }
      return (
        host.endsWith('wixstatic.com') ||
        host.endsWith('parastorage.com') ||
        host.endsWith('wix.com') ||
        host.endsWith('googleapis.com') ||
        host.endsWith('gstatic.com')
      );
    } catch (e) {
      return false;
    }
  },
  ignoreErrors: true,
};
