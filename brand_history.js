// 브랜드별 매장 데이터 기준 + 월별 변경 이력
// 매월 업데이트 시 이 파일도 함께 갱신

var BRAND_CRITERIA = {
  lastUpdated: '2026-04-14',

  brands: {
    '한샘': {
      count: 63,
      source: '한샘 공식몰 (remodeling.hanssem.com)',
      filterType: '가구 카테고리 (itemTypes=FN)',
      officialCount: 64,
      excluded: [
        { name: 'INT부천위탁유통_오늘의집대리점', reason: '오늘의집 위탁 매장 (삼성전자 부천중동점 내)', type: 'blocklist' }
      ],
      notes: '디자인파크/리하우스/플래그십 포함. 리하우스 신규 추가 시 수기 확인 필요.'
    },

    '리바트': {
      count: 92,
      source: '현대리바트 공식몰 (hyundailivart.co.kr)',
      filterType: '가구 카테고리 (shopScnCd 01 + 20 + 60 + 80 = 100개)',
      officialCount: 100,
      excluded: [
        { name: '리바트오피스/하움 직영송파전시장', reason: '사무가구 (오피스 패턴)', type: 'pattern' },
        { name: '리바트오피스/하움 직영강서전시장', reason: '사무가구', type: 'pattern' },
        { name: '리바트 오피스 대전직영전시장', reason: '사무가구', type: 'pattern' },
        { name: '리바트 오피스 광주 전시장', reason: '사무가구', type: 'pattern' },
        { name: '리바트 오피스 부산 전시장', reason: '사무가구', type: 'pattern' },
        { name: '리바트 용인점', reason: '상설 할인매장', type: 'blocklist' },
        { name: '리바트 상설할인점', reason: '상설 할인매장', type: 'blocklist' },
        { name: '리바트 대전상설점', reason: '상설 할인매장', type: 'blocklist' },
        { name: '리바트집테리어 현대아울렛 대전점', reason: '인테리어 카테고리 (집테리어) — 동일 주소에 가구 매장 별도', type: 'pattern' }
      ],
      notes: '리바트토탈/리바트집테리어 중복 매장은 "리바트"로 정리. 백화점 입점 아울렛(현대/신세계/롯데)은 포함.'
    },

    '까사미아': {
      count: 106,
      source: '까사미아 공식몰 (casamiamall.com)',
      filterType: '전체 매장 (대리점 + 직영점 + 기타유통)',
      officialCount: 134,
      excluded: [
        { name: '마테라소 매장 (21개)', reason: '매트리스 전문관 (가구점 아님)', type: 'pattern' },
        { name: '굳닷컴 쇼룸 서래마을점', reason: 'GUUD 쇼룸', type: 'blocklist' },
        { name: '카르페디엠베드 신세계강남점', reason: '매트리스 전문', type: 'blocklist' },
        { name: '팩토리아울렛 용인점', reason: '자체 아울렛', type: 'blocklist' },
        { name: '아울렛울산대리점', reason: '자체 아울렛 (울산)', type: 'blocklist' }
      ],
      notes: '자체 아울렛("아울렛"으로 시작) 자동 제외. 백화점 입점 아울렛(신세계사이먼/현대/롯데)은 포함.'
    },

    '에몬스': {
      count: 96,
      source: '에몬스 공식 (emons.co.kr)',
      filterType: '전체 매장',
      officialCount: 96,
      excluded: [],
      notes: '공식 사이트 매장 리스트 그대로 반영 (전시장 전체).'
    }
  }
};

// 월별 변경 이력
var BRAND_HISTORY = [
  {
    date: '2026-04-14',
    summary: '초기 데이터 정리 + 자동 업데이트 체계 구축',
    events: [
      { brand: '리바트', type: 'added', name: '스타필드 고양점', reason: '공식몰 확인 신규 추가' },
      { brand: '에몬스', type: 'removed', name: '금호월드점', reason: '공식몰에서 폐점 확인' },
      { brand: '한샘', type: 'blocked', name: 'INT부천위탁유통_오늘의집대리점', reason: '오늘의집 위탁매장 — 블랙리스트' },
      { brand: '리바트', type: 'blocked', name: '리바트 용인점 / 리바트 상설할인점', reason: '상설 할인매장 — 블랙리스트' }
    ]
  }
];
