// 에몬스 크롤러 — 페이지네이션 HTML 파싱 + 상세 페이지 좌표 추출
var puppeteer = require('puppeteer');

async function crawlEmons() {
  console.log('[에몬스] 크롤링 시작...');
  var browser = await puppeteer.launch({ headless: 'new' });
  var page = await browser.newPage();

  // 1. 전체 리스트 페이지 돌면서 매장 seq 수집
  var allStores = [];
  for (var pg = 1; pg <= 20; pg++) {
    await page.goto('https://www.emons.co.kr/agent/findAgent.php?page=' + pg, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 500));
    var stores = await page.evaluate(() => {
      var items = [];
      // onclick 속성에서 num 추출
      document.querySelectorAll('[onclick]').forEach(el => {
        var onclick = el.getAttribute('onclick') || '';
        var m = onclick.match(/infoAgent\.php\?num=(\d+)/);
        if (m) items.push({ num: m[1] });
      });
      return items;
    });
    if (stores.length === 0) break;
    allStores = allStores.concat(stores);
  }
  // 중복 제거
  var seen = {};
  allStores = allStores.filter(s => { if (seen[s.num]) return false; seen[s.num] = true; return true; });
  console.log('[에몬스] 매장 수집:', allStores.length);

  // 2. 각 매장 상세 페이지에서 좌표/주소 추출
  var result = [];
  for (var i = 0; i < allStores.length; i++) {
    var s = allStores[i];
    try {
      await page.goto('https://www.emons.co.kr/agent/infoAgent.php?num=' + s.num, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 300));
      var info = await page.evaluate(() => {
        var name = '';
        // 정확한 매장명 selector
        var nameEl = document.querySelector('.agent-name');
        if (nameEl) name = nameEl.textContent.trim();
        // fallback: HTML 소스에서 직접 추출 (JS로 동적 생성되는 케이스)
        if (!name) {
          var html = document.documentElement.outerHTML;
          var m = html.match(/agent-name["'>]+([^<"']{2,50})/);
          if (m) name = m[1].trim();
        }
        // 주소: text 내용 중 지역명으로 시작하는 라인
        var addr = '';
        var txt = document.body.innerText;
        var addrM = txt.match(/(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충청북도|충청남도|충북|충남|전라북도|전라남도|전북|전남|경상북도|경상남도|경북|경남|제주)[^\n]{3,100}/);
        if (addrM) addr = addrM[0].trim();
        // 좌표: JS 내부 kakao map 스크립트에서 추출
        var html = document.documentElement.outerHTML;
        var latLngM = html.match(/(3[3-8]\.[0-9]{5,})[,\s]+(12[4-9]\.[0-9]{5,}|13[0-1]\.[0-9]{5,})/);
        return {
          name: name,
          addr: addr,
          lat: latLngM ? parseFloat(latLngM[1]) : null,
          lng: latLngM ? parseFloat(latLngM[2]) : null
        };
      });
      if (info.name) {
        result.push({
          brand: '에몬스',
          name: info.name,
          addr: info.addr,
          lat: info.lat,
          lng: info.lng,
          stype: info.name.includes('직영') ? '직영' : '대리'
        });
      }
    } catch (e) {
      console.warn('[에몬스] num=' + s.num + ' 실패:', e.message);
    }
    if ((i + 1) % 20 === 0) console.log('  [에몬스]', (i + 1) + '/' + allStores.length);
  }

  await browser.close();
  console.log('[에몬스] 완료:', result.length);
  return result;
}

module.exports = crawlEmons;

if (require.main === module) {
  crawlEmons().then(r => {
    var fs = require('fs');
    fs.writeFileSync(__dirname + '/../emons_out.json', JSON.stringify(r, null, 2));
    console.log('저장:', r.length + '건');
  }).catch(e => { console.error(e); process.exit(1); });
}
