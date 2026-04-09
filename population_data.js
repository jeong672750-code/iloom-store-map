// 시도별 인구통계 (2024년 주민등록인구 기준, 통계청)
// 세종특별자치시는 충남에 합산
var POPULATION_DATA = {
  '서울': { pop: 9386036, household: 4458428, area: 605 },
  '인천': { pop: 2980694, household: 1282767, area: 1063 },
  '경기': { pop: 13621699, household: 5770493, area: 10187 },
  '대전': { pop: 1446561, household: 653849, area: 540 },
  '충북': { pop: 1594690, household: 737714, area: 7408 },
  '충남': { pop: 2541861, household: 1139805, area: 8823 },
  '대구': { pop: 2367784, household: 1068854, area: 884 },
  '경북': { pop: 2575028, household: 1227180, area: 19033 },
  '부산': { pop: 3293718, household: 1499367, area: 770 },
  '울산': { pop: 1106813, household: 474285, area: 1062 },
  '경남': { pop: 3265883, household: 1439505, area: 10540 },
  '광주': { pop: 1424608, household: 637795, area: 501 },
  '전북': { pop: 1755048, household: 821925, area: 8069 },
  '전남': { pop: 1813028, household: 867494, area: 12335 },
  '강원': { pop: 1530760, household: 726373, area: 16828 },
  '제주': { pop: 679532, household: 301966, area: 1850 }
};
// pop: 인구수, household: 세대수, area: 면적(km²)
