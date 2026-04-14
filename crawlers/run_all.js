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
  for (var brand of Object.keys(crawlers)) {
    try {
      var result = await crawlers[brand]();
      all = all.concat(result);
      console.log('✓', brand, result.length + '개');
    } catch (e) {
      console.error('✗', brand, '실패:', e.message);
    }
  }
  fs.writeFileSync(__dirname + '/../crawled.json', JSON.stringify(all, null, 2));
  console.log('\n총:', all.length + '개 → crawled.json');
  console.log('다음: node diff_stores.js crawled.json');
})();
