// 일룸 크롤러 — 공식 GET API
var https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      var chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function crawlIloom() {
  console.log('[일룸] 크롤링 시작...');
  var data = await fetchJson('https://www.iloom.com/store/storeListForMap.do');
  console.log('[일룸] 수신:', data.length);
  return data.map(s => ({
    brand: '일룸',
    name: s.name,
    addr: s.address || '',
    lat: s.position && s.position.latitude ? parseFloat(s.position.latitude) : null,
    lng: s.position && s.position.longitude ? parseFloat(s.position.longitude) : null,
    stype: s.type === 'P' ? '직영' : '대리', // P=프리미엄샵=직영, B=일반
    iloom_type: s.type
  }));
}

module.exports = crawlIloom;

if (require.main === module) {
  crawlIloom().then(r => {
    require('fs').writeFileSync(__dirname + '/../iloom_out.json', JSON.stringify(r, null, 2));
    console.log('저장:', r.length + '건');
  }).catch(e => { console.error(e); process.exit(1); });
}
