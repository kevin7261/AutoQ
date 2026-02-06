// # @title Colab 4-1: 隨機加入權重
// ==============================================================================
// 📝 程式說明：
// 1. 讀取 Step 3 的結構化資料。
// 2. [關鍵修正] 生成權重邏輯：
//    - 不再對每一小段幾何線段生成權重。
//    - 而是找出同一條路線上相鄰的兩個「站點」(Station/Connect Node)。
//    - 在這兩個站點之間的整個路徑段(包含所有轉折)，只生成並顯示 *一個* 權重。
// 3. 繪圖邏輯：
//    - 計算兩個站點沿著軌跡的「路徑中點」(Path Midpoint)。
//    - 將權重文字標示在該中點上。
//    - 畫風嚴格比照 Colab 3 (紅字無框、黑點)。
// ==============================================================================
/* eslint-disable no-console */

import { useDataStore } from '@/stores/dataStore.js';

// ==========================================
// 1. 檔案路徑與全域設定
// ==========================================
// 輸入：Step 3 結構化資料
// 輸出：結構化權重資料 (已直接傳給下一個圖層)

const WEIGHT_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const WEIGHT_PROBS = [729, 512, 343, 216, 125, 64, 27, 8, 1];

// ==========================================
// 2. 幾何運算工具
// ==========================================
/**
 * 計算兩點距離
 * @param {Array<number>} p1 - 點1座標
 * @param {Array<number>} p2 - 點2座標
 * @returns {number} 距離
 */
function dist(p1, p2) {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
}

/**
 * 計算折線總長
 * @param {Array<Array<number>>} polyline - 折線點陣列
 * @returns {number} 總長度
 */
// eslint-disable-next-line no-unused-vars
function getPathLength(polyline) {
  let length = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    length += dist(polyline[i], polyline[i + 1]);
  }
  return length;
}

/**
 * 在折線上找出距離起點 target_dist 的座標
 * @param {Array<Array<number>>} polyline - 折線點陣列
 * @param {number} targetDist - 目標距離
 * @returns {Array<number>} 座標
 */
// eslint-disable-next-line no-unused-vars
function getPointAlongPath(polyline, targetDist) {
  if (targetDist <= 0) return polyline[0];
  let currentDist = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    const segLen = dist(p1, p2);
    if (currentDist + segLen >= targetDist) {
      const remain = targetDist - currentDist;
      const ratio = segLen > 0 ? remain / segLen : 0;
      const nx = p1[0] + (p2[0] - p1[0]) * ratio;
      const ny = p1[1] + (p2[1] - p1[1]) * ratio;
      return [nx, ny];
    }
    currentDist += segLen;
  }
  return polyline[polyline.length - 1];
}

// ==========================================
// 3. 核心邏輯：站點識別與權重生成
// ==========================================
/**
 * 找出 segment 中所有「站點」的索引位置 (包含起點、終點、中間站)。
 * 回傳一個排序好的索引列表 [0, 5, 12, ...]
 * @param {Object} segment - 線段物件
 * @returns {Array<number>} 站點索引列表
 */
function identifyStationIndices(segment) {
  const pts = segment.points || [];
  const indices = new Set();

  // 1. 頭尾屬性 (Step 3 新結構)
  if (segment.properties_start) indices.add(0);
  if (segment.properties_end) indices.add(pts.length - 1);

  // 2. 中間節點列表 (舊結構或混合結構)
  const nodes = segment.nodes || [];
  for (let i = 0; i < nodes.length; i++) {
    if (i >= pts.length) break;
    const node = nodes[i];
    // 有 connect_number 或 station_name/name 就算站點
    const tags = node.tags || {};
    if (node.connect_number || tags.connect_number || tags.station_name || tags.name) {
      indices.add(i);
    }
  }

  // 3. Points 內嵌屬性 (最舊結構)
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.length >= 3 && typeof p[2] === 'object') {
      const props = p[2];
      const tags = props.tags || {};
      if (props.connect_number || tags.connect_number || tags.station_name || tags.name) {
        indices.add(i);
      }
    }
  }

  // 確保頭尾都被視為站點 (為了路網連續性，即使沒有屬性也視為幾何端點)
  // 但題目要求「站點之間」才有權重，如果只是純轉折點不應算。
  // 這裡我們採取寬鬆策略：如果有 properties_start/end 已經加了，
  // 否則只依賴明確的站點標記。如果一條線只有幾何點，沒有站點，那它可能只是一段軌道。
  // 為了保險，強制加入 0 和 len-1 ? -> 不，這會讓純轉折變成站點。
  // 維持上述邏輯：只加「有屬性」的點。

  // [修正] 若完全沒抓到站點 (例如資料不齊全)，至少頭尾算站點，確保有權重生成
  if (indices.size === 0 && pts.length >= 2) {
    indices.add(0);
    indices.add(pts.length - 1);
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * [核心修正] 針對「站到站」區間生成權重。
 * @param {Array} dataList - 資料列表
 * @returns {number} 處理的數量
 */
function processWeightsStationToStation(dataList) {
  let processedCount = 0;
  for (const seg of iterSegments(dataList)) {
    const pts = seg.points || [];
    if (pts.length < 2) {
      seg.station_weights = [];
      continue;
    }

    let stationIndices = identifyStationIndices(seg);

    // 站點必須 >= 2 才能形成區間
    if (stationIndices.length < 2) {
      // 特例：如果只有一個站點或沒有，但有點 -> 視頭尾為區間
      stationIndices = [0, pts.length - 1];
    }

    const weightsInfo = [];
    // 遍歷相鄰的兩個站點索引
    for (let i = 0; i < stationIndices.length - 1; i++) {
      const startIdx = stationIndices[i];
      const endIdx = stationIndices[i + 1];

      // 生成一個隨機權重
      const w = randomChoices(WEIGHT_VALUES, WEIGHT_PROBS, 1)[0];

      weightsInfo.push({
        start_idx: startIdx,
        end_idx: endIdx,
        weight: w,
      });
    }

    seg.station_weights = weightsInfo;
    processedCount += weightsInfo.length;
  }

  return processedCount;
}

/**
 * 根據權重機率分佈隨機選擇權重值 (模擬 Python 的 random.choices)
 * @param {Array<number>} values - 權重值陣列
 * @param {Array<number>} weights - 權重機率陣列
 * @param {number} k - 選擇數量
 * @returns {Array<number>} 選擇的權重值陣列
 */
function randomChoices(values, weights, k) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const result = [];
  for (let i = 0; i < k; i++) {
    let random = Math.random() * total;
    for (let j = 0; j < values.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        result.push(values[j]);
        break;
      }
    }
  }
  return result;
}

// ==========================================
// 4. 繪圖核心
// ==========================================
/**
 * 迭代所有 segments
 * @param {Array} dataList - 資料列表
 * @yields {Object} 線段物件
 */
function* iterSegments(dataList) {
  if (!dataList) return;
  const isGrouped = dataList[0] && typeof dataList[0] === 'object' && 'segments' in dataList[0];
  if (isGrouped) {
    for (const route of dataList) {
      for (const seg of route.segments || []) {
        yield seg;
      }
    }
  } else {
    for (const seg of dataList) {
      yield seg;
    }
  }
}

/**
 * 取得原始顏色
 * @param {Object} seg - 線段物件
 * @returns {string} 顏色字串
 */
// eslint-disable-next-line no-unused-vars
function getOriginalColor(seg) {
  let p = seg.way_properties?.tags || {};
  if (!p || Object.keys(p).length === 0) p = seg.properties || {};
  return p.colour || p.color || '#555555';
}

/**
 * 取得邊界
 * @param {Array} dataList - 資料列表
 * @param {number} buffer - 緩衝區大小
 * @returns {Array<number>} [minX, maxX, minY, maxY]
 */
// eslint-disable-next-line no-unused-vars
function getBounds(dataList, buffer = 2) {
  const allX = [];
  const allY = [];
  for (const seg of iterSegments(dataList)) {
    for (const p of seg.points || []) {
      allX.push(p[0]);
      allY.push(p[1]);
    }
  }
  if (allX.length === 0) return [0, 10, 0, 10];
  return [
    Math.min(...allX) - buffer,
    Math.max(...allX) + buffer,
    Math.min(...allY) - buffer,
    Math.max(...allY) + buffer,
  ];
}

/**
 * 繪製權重視圖 (在 JavaScript 環境中，此功能由前端 d3jsmap 組件處理)
 * @param {Object} ax - 繪圖軸物件 (前端組件中處理)
 * @param {Array} dataList - 資料列表
 * @param {string} title - 標題
 * @param {string} mode - 模式 ('clean', 'single', 'fill')
 */
// eslint-disable-next-line no-unused-vars
function drawWeightedView(ax, dataList, title, mode = 'clean') {
  // 在 JavaScript 環境中，此功能由前端 d3jsmap 組件處理
  // 繪圖邏輯：
  // 1. 繪製線段與權重 (Layer 1)
  //    - 畫整條路線
  //    - 畫權重 (只在站與站之間畫一個)
  //      * 取出這一段的路徑 (包含中間所有轉折點)
  //      * 計算這段路徑的總長
  //      * 找出路徑中點座標 (幾何中點)
  //      * 繪製權重
  // 2. 繪製站點 (Layer 2 - Strict Colab 3 Style)
  //    - 收集所有可能的站點資訊來源 (Nodes List, Properties Start/End)
  //    - [紅色文字，無框] 如果 connect_number 存在
  //    - [黑色實心點] 如果 station_name 或 name 存在
  console.log(`[視覺化] ${title} (Mode: ${mode})`);
}

/**
 * 確保資料是 Grouped 結構
 * @param {Array} data - 資料陣列
 * @returns {Array} Grouped 結構的資料陣列
 */
function ensureGroupedStructure(data) {
  if (!data || data.length === 0) return [];
  if (data[0] && typeof data[0] === 'object' && 'segments' in data[0]) return data;

  const grouped = new Map();
  for (const seg of data) {
    let rName = 'Unknown';
    const p = seg.way_properties?.tags || {};
    rName = p.route_name || p.name || seg.properties?.route_name || 'Unknown';
    if (!grouped.has(rName)) {
      grouped.set(rName, []);
    }
    grouped.get(rName).push(seg);
  }
  const structuredData = [];
  for (const [rName, segments] of grouped.entries()) {
    structuredData.push({ route_name: rName, segments: segments });
  }
  return structuredData;
}

// ==========================================
// 5. 主程式
// ==========================================
// eslint-disable-next-line no-unused-vars
export function execute_3_1_to_4_1(_jsonData) {
  const dataStore = useDataStore();
  const taipei3_1Layer = dataStore.findLayerById('taipei_3_1');
  const taipei4_1Layer = dataStore.findLayerById('taipei_4_1');

  console.log('='.repeat(60));
  console.log('📂 [設定] 檔案路徑配置');
  console.log(`   - 輸入檔案: 從 taipei_3_1 圖層讀取`);
  console.log(`   - 輸出資料: 已直接傳給 taipei_4_1 圖層`);
  console.log('='.repeat(60));

  if (!taipei3_1Layer || !taipei3_1Layer.spaceNetworkGridJsonData) {
    console.error(`❌ 找不到輸入檔案: taipei_3_1`);
    throw new Error(`找不到輸入檔案: taipei_3_1`);
  }

  try {
    console.log('🚀 Step A: 讀取資料...');
    const rawData = JSON.parse(JSON.stringify(taipei3_1Layer.spaceNetworkGridJsonData));

    const dataGrouped = ensureGroupedStructure(rawData);

    console.log('🚀 Step B: 生成模擬權重 (Station-to-Station)...');
    const count = processWeightsStationToStation(dataGrouped);
    console.log(`   -> 已為 ${count} 個站間區段生成權重。`);

    console.log('🚀 Step C: 儲存 JSON...');
    if (!taipei4_1Layer) {
      throw new Error('找不到 taipei_4_1 圖層');
    }

    taipei4_1Layer.spaceNetworkGridJsonData = dataGrouped;
    console.log(`✅ 資料已傳給 taipei_4_1 圖層`);

    console.log('🚀 Step D: 繪製三視圖...');
    // 這裡因為 Single 和 Filled 的區別在「站間單一權重」的邏輯下可能不明顯，
    // 我們維持三圖結構，但在 Fill 模式下我們畫一樣的東西，或者未來可以改成畫密度。
    // Note: 在 JavaScript 環境中，繪圖功能由前端 d3jsmap 組件處理
    drawWeightedView(null, dataGrouped, '1. Clean (Original Layout)', 'clean');
    drawWeightedView(null, dataGrouped, '2. Weighted (Station-to-Station)', 'single');
    // 暫時讓第三張圖與第二張相同，因為沒有「更密」的填滿方式了 (一段只有一個權重)
    drawWeightedView(null, dataGrouped, '3. Weighted (Same for Check)', 'fill');

    // 自動開啟 taipei_4_1 圖層以便查看結果
    if (!taipei4_1Layer.visible) {
      taipei4_1Layer.visible = true;
      dataStore.saveLayerState('taipei_4_1', { visible: true });
    }

    // 產生摘要並存到 dashboardData
    const dashboardData = {
      processedSegmentCount: count,
      routeCount: dataGrouped.length,
    };

    taipei4_1Layer.dashboardData = dashboardData;
  } catch (error) {
    console.error(`\n❌ 執行錯誤：${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}
