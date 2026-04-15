// 현대리바트 크롤러 — 공식 API 호출 (CSRF 토큰 자동 추출)
// 가구 카테고리: shopScnCd = 01 (대표직영) + 20 (일반) + 80 (리바트토탈) + 60 (오피스) = 100개 기준
// 추출 필드: brand, name, addr, lat, lng, stype

var puppeteer = require('puppeteer');

// 가구로 분류할 카테고리 코드
var FURNITURE_SCN_CD = ['01', '20', '80', '60'];

async function crawlLivart() {
  console.log('[리바트] 크롤링 시작...');
  var browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  var page = await browser.newPage();

  // 매장 찾기 페이지 방문 (세션 쿠키 + CSRF 토큰 확보)
  await page.goto('https://www.hyundailivart.co.kr/csCenter/shopMgmt', { waitUntil: 'networkidle0', timeout: 60000 });
  var csrf = await page.$eval('meta[name="X-CSRF-TOKEN"]', el => el.getAttribute('content'));

  // 브라우저 내부에서 fetch API 호출 (쿠키 자동 포함)
  var data = await page.evaluate(async (csrf) => {
    var res = await fetch('/csCenter/selectShopInfoList', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': csrf,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ shopScnCd: '', areaCd: '', keyword: '' })
    });
    return await res.json();
  }, csrf);

  await browser.close();

  var stores = data.resultData.list || [];
  console.log('[리바트] 전체 수신:', stores.length);

  // 가구 카테고리만 필터 + 필드 정리
  var result = stores
    .filter(s => FURNITURE_SCN_CD.includes(s.shopScnCd))
    .map(s => ({
      brand: '리바트',
      name: (s.shopNm || '').trim(),
      addr: s.addr || s.bizAddr || '',
      // ⚠️ 리바트 API는 la=경도, lo=위도 (표준과 반대)
      lat: parseFloat(s.lo || s.lat || s.latitude) || null,
      lng: parseFloat(s.la || s.lng || s.longitude) || null,
      // shopTypeCd: 01=직영, 02=대리
      stype: s.shopTypeCd === '01' || (s.shopNm || '').includes('[직영') ? '직영' : '대리',
      shop_scn_cd: s.shopScnCd,
      _raw: s
    }));

  console.log('[리바트] 가구 카테고리만:', result.length);
  return result;
}

module.exports = crawlLivart;

// 단독 실행 테스트
if (require.main === module) {
  crawlLivart().then(r => {
    var fs = require('fs');
    fs.writeFileSync(__dirname + '/../livart_out.json', JSON.stringify(r, null, 2));
    console.log('저장:', r.length + '건 → livart_out.json');
  }).catch(e => { console.error(e); process.exit(1); });
}
