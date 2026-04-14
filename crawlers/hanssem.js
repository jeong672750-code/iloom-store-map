// 한샘 크롤러 — 공식 API 직접 호출 (가구=FN 필터)
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

async function crawlHanssem() {
  console.log('[한샘] 크롤링 시작...');
  // page=1 (0-based 아님), 가구 = itemTypes=FN
  var data = await fetchJson('https://gateway.hanssem.com/hanssem/shop-service/api/v1/shops?itemTypes=FN&page=1&size=200');
  var content = (data.data && data.data.content) || [];
  console.log('[한샘] 수신:', content.length);

  var result = content.map(s => {
    var addr = s.address || {};
    var addrStr = ((addr.basic || '') + ' ' + (addr.detail || '')).trim();
    var lat = null, lng = null;
    if (addr.coordinates) {
      lat = addr.coordinates.latitude;
      lng = addr.coordinates.longitude;
    }
    var nm = (s.dpName || s.name || '').trim();
    return {
      brand: '한샘',
      name: nm,
      addr: addrStr,
      lat: lat,
      lng: lng,
      stype: /대리/.test(nm) ? '대리' : '직영'
    };
  });

  return result;
}

module.exports = crawlHanssem;

if (require.main === module) {
  crawlHanssem().then(r => {
    var fs = require('fs');
    fs.writeFileSync(__dirname + '/../hanssem_out.json', JSON.stringify(r, null, 2));
    console.log('저장:', r.length + '건');
  }).catch(e => { console.error(e); process.exit(1); });
}
