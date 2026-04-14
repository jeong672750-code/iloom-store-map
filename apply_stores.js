// pending_changes.json의 toAdd / toRemove를 실제 competitors_data.js에 반영
// 수기 검토가 끝난 후 실행
//
// 사용법: node apply_stores.js

var fs = require('fs');
var path = require('path');

var pendingPath = path.join(__dirname, 'pending_changes.json');
if (!fs.existsSync(pendingPath)) {
  console.error('pending_changes.json이 없습니다. 먼저 node diff_stores.js 실행');
  process.exit(1);
}

var pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
var existingCode = fs.readFileSync(path.join(__dirname, 'competitors_data.js'), 'utf8');
eval(existingCode);

var toAdd = pending.toAdd || [];
var toRemove = pending.toRemove || [];

function normalize(s) {
  return (s || '').replace(/[\s\[\]\(\)\-\.,·]/g, '').toLowerCase();
}
var removeKeys = {};
toRemove.forEach(function(s) {
  removeKeys[s.brand + '|' + normalize(s.name)] = true;
});

// 삭제 대상 제외
var filtered = COMPETITORS_RAW.filter(function(s) {
  return !removeKeys[s.brand + '|' + normalize(s.name)];
});

// 추가 대상 병합
var merged = filtered.concat(toAdd.map(function(s) {
  return {
    brand: s.brand,
    name: s.name,
    place_name: s.place_name || s.name,
    addr: s.addr || '',
    lat: s.lat,
    lng: s.lng,
    stype: s.stype || '대리'
  };
}));

// 백업
var backupName = 'competitors_data.backup.' + Date.now() + '.js';
fs.writeFileSync(path.join(__dirname, backupName), existingCode);

// 저장
var lines = ['var COMPETITORS_RAW = ['];
merged.forEach(function(s, i) {
  var comma = (i < merged.length - 1) ? ',' : '';
  lines.push('  { brand: "' + s.brand + '", name: "' + s.name + '", place_name: "' + (s.place_name || s.name) + '", addr: "' + (s.addr || '') + '", lat: ' + s.lat + ', lng: ' + s.lng + ', stype: "' + (s.stype || '대리') + '" }' + comma);
});
lines.push('];');
fs.writeFileSync(path.join(__dirname, 'competitors_data.js'), lines.join('\n'));

// 처리 완료 후 pending_changes.json 보관
fs.renameSync(pendingPath, path.join(__dirname, 'applied_' + pending.date + '_' + Date.now() + '.json'));

console.log('═══════════════════════════════════');
console.log('  반영 완료');
console.log('═══════════════════════════════════');
console.log('추가: ' + toAdd.length + '건');
console.log('삭제: ' + toRemove.length + '건');
console.log('총 매장: ' + COMPETITORS_RAW.length + ' → ' + merged.length);
console.log('백업: ' + backupName);
console.log('');
console.log('다음: deploy 폴더 복사 → git push');
