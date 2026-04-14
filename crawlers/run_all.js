// 매월 1일: 4개 브랜드 크롤링 → crawled.json 생성
// 이후 diff_stores.js로 현재 데이터와 비교
var fs = require('fs');

var crawlers = {
  '일룸': require('./iloom'),
  '리바트': require('./livart'),
  '까사미아': require('./casamia'),
  '에몬스': require('./emons'),
  '한샘': require('./hanssem'),
};

(async () => {
  var all = [];
  var failed = [];
  for (var brand of Object.keys(crawlers)) {
    try {
      var result = await crawlers[brand]();
      if (!result || result.length === 0) {
        failed.push(brand + ' (0건 반환)');
        console.error('✗', brand, '0건 반환 — 실패로 처리');
      } else {
        all = all.concat(result);
        console.log('✓', brand, result.length + '개');
      }
    } catch (e) {
      failed.push(brand + ' (' + e.message + ')');
      console.error('✗', brand, '실패:', e.message);
      console.error(e.stack);
    }
  }
  fs.writeFileSync(__dirname + '/../crawled.json', JSON.stringify(all, null, 2));
  console.log('\n총:', all.length + '개 → crawled.json');

  if (failed.length > 0) {
    console.error('\n❌ 실패한 브랜드:', failed.length + '개');
    failed.forEach(f => console.error('  -', f));
    process.exit(1); // 워크플로우 fail
  }
  console.log('다음: node diff_stores.js crawled.json');
})();
