// 크롤링 결과와 현재 데이터를 비교만 하고 리포트 생성
// 자동으로 반영하지 않음 — 리포트 확인 후 apply_stores.js 실행 필요
//
// 사용법: node diff_stores.js <new_crawl.json>
// 출력: diff_report.md + pending_changes.json

var fs = require('fs');
var path = require('path');

var newDataPath = process.argv[2];
if (!newDataPath) {
  console.error('사용법: node diff_stores.js <new_crawl.json>');
  process.exit(1);
}

// 블랙리스트 로드
var blocklistCode = fs.readFileSync(path.join(__dirname, 'removed_stores.js'), 'utf8');
eval(blocklistCode);

// 기존 데이터 로드 (경쟁사)
var existingCode = fs.readFileSync(path.join(__dirname, 'competitors_data.js'), 'utf8');
eval(existingCode);

// 일룸 데이터 로드 (iloom_store_map.html 하드코딩)
var iloomHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
var iloomMatches = iloomHtml.matchAll(/\{\s*name:\s*"([^"]+)",\s*addr:\s*"([^"]*)",\s*lat:\s*([0-9.]+),\s*lng:\s*([0-9.]+)\s*\}/g);
for (var m of iloomMatches) {
  COMPETITORS_RAW.push({
    brand: '일룸',
    name: m[1],
    addr: m[2],
    lat: parseFloat(m[3]),
    lng: parseFloat(m[4]),
    stype: '직영'
  });
}
console.log('일룸 매장 로드:', COMPETITORS_RAW.filter(s => s.brand === '일룸').length + '개');

// 신규 크롤링 데이터
var newData = JSON.parse(fs.readFileSync(newDataPath, 'utf8'));

// ═══════════════════════════════════════════════
// 매장명 정리 규칙
// ═══════════════════════════════════════════════
function cleanStoreName(brand, name) {
  var n = name;
  // 1. 대괄호 태그 제거: [PICK], [직영점], [대리점] 등
  n = n.replace(/\[[^\]]+\]\s*/g, '');
  // 2. 브랜드 prefix 중복 제거 (예: "리바트 리바트 강남점" → "리바트 강남점")
  var brandRegex = new RegExp('^' + brand + '\\s+' + brand, 'i');
  n = n.replace(brandRegex, brand);
  // ⚠️ "리바트토탈", "리바트집테리어" 등 카테고리 접두사는 유지 (공식 매장명 그대로)
  return n.replace(/\s+/g, ' ').trim();
}

// ═══════════════════════════════════════════════
// 직영/대리 자동 분류
// ═══════════════════════════════════════════════
function classifyStype(brand, name, apiShopType) {
  // 매장명 기반 우선 (가장 명확)
  if (/대리점/.test(name)) return '대리';
  if (/\[직영/.test(name) || /직영점$/.test(name)) return '직영';
  // API 값: 브랜드별 코드 체계
  // 리바트: 01=직영, 02=대리
  // 한샘/까사미아: 1=직영, 2=대리
  if (apiShopType === '1' || apiShopType === '01' || apiShopType === 'DIRECT' || apiShopType === '직영') return '직영';
  if (apiShopType === '2' || apiShopType === '02' || apiShopType === 'DEALER' || apiShopType === '대리') return '대리';
  return '대리';
}

// ═══════════════════════════════════════════════
// 정규화 (중복 검출용 키)
// ═══════════════════════════════════════════════
function normalize(s) {
  return (s || '').replace(/[\s\[\]\(\)\-\.,·]/g, '').toLowerCase();
}
function coordKey(brand, lat, lng) {
  return brand + '|' + lat.toFixed(3) + ',' + lng.toFixed(3);
}

// ═══════════════════════════════════════════════
// 기존 데이터 인덱싱
// ═══════════════════════════════════════════════
var existingByKey = {};
var existingByCoord = {};
COMPETITORS_RAW.forEach(function(s) {
  existingByKey[s.brand + '|' + normalize(s.name)] = s;
  if (s.lat && s.lng) existingByCoord[coordKey(s.brand, s.lat, s.lng)] = s;
});

// ═══════════════════════════════════════════════
// 크롤링 데이터 분류
// ═══════════════════════════════════════════════
var toAdd = [];       // 신규 추가 (사람 승인 필요)
var blocked = [];     // 블랙리스트 제외 (자동)
var manualCheck = []; // 수기 확인 필요 (한샘 리하우스 등)
var unchanged = [];   // 기존과 동일
var newKeySet = {};

newData.forEach(function(s) {
  // 이름 정리 + stype 분류 먼저 적용
  var cleanedName = cleanStoreName(s.brand, s.name || '');
  var stype = classifyStype(s.brand, s.name || '', s.shop_type || s.stype);

  var normalized = {
    brand: s.brand,
    name: cleanedName,
    place_name: s.place_name || cleanedName,
    addr: s.addr || '',
    lat: s.lat,
    lng: s.lng,
    stype: stype,
    _original: s.name
  };

  var key = s.brand + '|' + normalize(cleanedName);
  newKeySet[key] = true;
  if (s.lat && s.lng) newKeySet[coordKey(s.brand, s.lat, s.lng)] = true;

  // 블랙리스트 검사 (자동 제외)
  if (isBlocked(s.brand, cleanedName)) {
    blocked.push(normalized);
    return;
  }

  // 수기 확인 키워드 검사
  var manualKeywords = (REMOVED_STORES.manualCheck && REMOVED_STORES.manualCheck[s.brand]) || [];
  var needsManualCheck = false;
  for (var i = 0; i < manualKeywords.length; i++) {
    if (cleanedName.indexOf(manualKeywords[i]) !== -1) {
      needsManualCheck = true;
      normalized._reason = manualKeywords[i];
      break;
    }
  }

  // 기존 존재 여부
  var matched = existingByKey[key] || (s.lat && s.lng && existingByCoord[coordKey(s.brand, s.lat, s.lng)]);
  if (matched) {
    unchanged.push(normalized);
  } else {
    if (needsManualCheck) manualCheck.push(normalized);
    else toAdd.push(normalized);
  }
});

// ═══════════════════════════════════════════════
// 삭제된 매장 검출 (기존에 있지만 크롤링에 없음)
// ═══════════════════════════════════════════════
var toRemove = [];
COMPETITORS_RAW.forEach(function(s) {
  var key = s.brand + '|' + normalize(s.name);
  var hasMatch = newKeySet[key];
  if (!hasMatch && s.lat && s.lng) hasMatch = newKeySet[coordKey(s.brand, s.lat, s.lng)];
  if (!hasMatch) toRemove.push(s);
});

// ═══════════════════════════════════════════════
// 리포트 생성
// ═══════════════════════════════════════════════
var now = new Date().toISOString().slice(0, 10);
var byBrand = function(arr) {
  var g = {};
  arr.forEach(function(s) { (g[s.brand] = g[s.brand] || []).push(s); });
  return g;
};

var report = '# 매장 업데이트 리포트 (' + now + ')\n\n';
report += '## 요약\n\n';
report += '| 구분 | 건수 |\n|------|------|\n';
report += '| ✅ 추가 예정 (승인 대기) | ' + toAdd.length + '건 |\n';
report += '| ⚠️ 수기 확인 필요 | ' + manualCheck.length + '건 |\n';
report += '| ❌ 삭제 예정 (승인 대기) | ' + toRemove.length + '건 |\n';
report += '| ⊘ 블랙리스트 자동 제외 | ' + blocked.length + '건 |\n';
report += '| = 변경 없음 | ' + unchanged.length + '건 |\n\n';

function renderSection(title, arr) {
  if (arr.length === 0) return '';
  var s = '## ' + title + ' (' + arr.length + '건)\n\n';
  var g = byBrand(arr);
  Object.keys(g).sort().forEach(function(brand) {
    s += '### ' + brand + ' — ' + g[brand].length + '건\n';
    g[brand].forEach(function(x) {
      s += '- ' + x.name + ' `' + x.stype + '`';
      if (x.addr) s += ' — ' + x.addr;
      if (x._reason) s += '  ⚠️ **' + x._reason + '** 키워드 포함';
      if (x._original && x._original !== x.name) s += '  (원본명: `' + x._original + '`)';
      s += '\n';
    });
    s += '\n';
  });
  return s;
}

report += renderSection('⚠️ 수기 확인 필요 (추가 여부 판단)', manualCheck);
report += renderSection('✅ 추가 예정', toAdd);
report += renderSection('❌ 삭제 예정', toRemove);
report += renderSection('⊘ 블랙리스트 자동 제외', blocked);

report += '\n---\n\n';
report += '## 다음 단계\n\n';
report += '1. 위 내용 검토\n';
report += '2. 추가/삭제 중 반영하지 말아야 할 항목은 `pending_changes.json`에서 제거\n';
report += '3. 수기 확인 대상은 판단 후 `pending_changes.json`의 `manualCheck` → `toAdd`로 이동 (추가할 경우)\n';
report += '4. `node apply_stores.js` 실행해서 최종 반영\n';

fs.writeFileSync(path.join(__dirname, 'diff_report.md'), report);
fs.writeFileSync(path.join(__dirname, 'pending_changes.json'), JSON.stringify({
  date: now,
  toAdd: toAdd,
  toRemove: toRemove,
  manualCheck: manualCheck,
  blocked: blocked
}, null, 2));

console.log('═══════════════════════════════════');
console.log('  매장 비교 리포트 생성 완료');
console.log('═══════════════════════════════════');
console.log('✅ 추가 예정      : ' + toAdd.length + '건');
console.log('⚠️ 수기 확인 필요 : ' + manualCheck.length + '건');
console.log('❌ 삭제 예정      : ' + toRemove.length + '건');
console.log('⊘ 블랙리스트      : ' + blocked.length + '건');
console.log('= 변경 없음       : ' + unchanged.length + '건');
console.log('');
console.log('→ diff_report.md 확인');
console.log('→ 검토 후 pending_changes.json 편집');
console.log('→ node apply_stores.js 실행');
