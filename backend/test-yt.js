const { Innertube } = require('youtubei.js');

async function test() {
  console.log('Initializing...');
  const yt = await Innertube.create({ generate_session_locally: true });
  console.log('Getting info for 720a3bhOIvM...');
  const info = await yt.getBasicInfo('720a3bhOIvM', 'ANDROID'); // sometimes specifying client helps
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  console.log('Format URL:', format.decipher ? format.decipher(yt.session.player) : format.url);
}

test().catch(console.error);
