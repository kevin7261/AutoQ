// # @title Colab 2-2: 示意化網格運算
// ==============================================================================
// 📝 程式說明：
// 1. 讀取 Step 2.1 的直線化資料 (01_straighten_*.json)。
// 2. 執行「示意化 (Schematization)」：
//    將精細座標吸附到較粗的網格 (Grid Size = 5)，使地圖更具抽象感。
// 3. [關鍵] 屬性同步搬移：
//    當座標改變時，同步更新 `nodes` 列表，確保站點資訊 (黑點/紅點) 不會錯位或消失。
// 4. [防呆] 混合模式偵測：
//    同時檢查 `properties_start/end` 與 `nodes` 列表，確保交會點 (Connect Node) 被正確識別。
// ==============================================================================

import { useDataStore } from '@/stores/dataStore.js';

// ==========================================
// 3. 核心演算法函式
// ==========================================

/**
 * [數學運算] 線性插值
 * 在起點與終點間，重新計算均勻分布的座標點。
 * @param {Array<number>} pStart - 起點座標 [x, y]
 * @param {Array<number>} pEnd - 終點座標 [x, y]
 * @param {number} totalPoints - 總點數
 * @returns {Array<Array<number>>} 等距點陣列
 */
function getEquidistantPoints(pStart, pEnd, totalPoints) {
  if (totalPoints <= 1) return [[...pStart]];
  const newPoints = [];
  const [x1, y1] = pStart;
  const [x2, y2] = pEnd;
  for (let i = 0; i < totalPoints; i++) {
    const t = i / (totalPoints - 1);
    const nx = x1 + (x2 - x1) * t;
    const ny = y1 + (y2 - y1) * t;
    newPoints.push([nx, ny]);
  }
  return newPoints;
}

/**
 * [混合模式] 提取交會點 (Connect Nodes)
 * 為了防止紅點消失，我們同時檢查：
 * 1. properties_start / properties_end (頭尾屬性)
 * 2. nodes 列表 (詳細站點屬性)
 * @param {Array} segments - 線段陣列
 * @returns {Array<Array<number>>} 交會點座標陣列
 */
function extractConnectNodes(segments) {
  const connCoords = new Set();
  for (const seg of segments) {
    const points = seg.points || [];
    if (!points.length) continue;

    // 來源 A: 頭尾屬性
    const pStart = seg.properties_start || {};
    const pEnd = seg.properties_end || {};
    if (pStart.node_type === 'connect') {
      connCoords.add(JSON.stringify(points[0]));
    }
    if (pEnd.node_type === 'connect') {
      connCoords.add(JSON.stringify(points[points.length - 1]));
    }

    // 來源 B: nodes 列表 (若存在)
    const nodes = seg.nodes || [];
    if (nodes.length === points.length) {
      for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i];
        const props = nodes[i] || {};
        if (props.node_type === 'connect') {
          connCoords.add(JSON.stringify([x, y]));
        }
      }
    }
  }
  return Array.from(connCoords).map((s) => JSON.parse(s));
}

/**
 * [碰撞偵測]
 * 檢查是否有兩個不同的節點，吸附後會重疊在同一個網格點上。
 * 若發生碰撞，則將這些點標記為 'frozen' (不移動)，以避免拓撲改變。
 * @param {Array<Array<number>>} nodesCoords - 節點座標陣列
 * @param {number} gridSize - 網格大小
 * @returns {Set<string>} 凍結節點集合（JSON 字串格式）
 */
function detectFrozenNodes(nodesCoords, gridSize) {
  const snappedMap = new Map();
  for (const node of nodesCoords) {
    const gx = Math.round(node[0] / gridSize) * gridSize;
    const gy = Math.round(node[1] / gridSize) * gridSize;
    const key = `${gx},${gy}`;
    if (!snappedMap.has(key)) {
      snappedMap.set(key, []);
    }
    snappedMap.get(key).push([node[0], node[1]]);
  }

  const frozen = new Set();
  for (const origNodes of snappedMap.values()) {
    // 如果同一個網格點對應到多個不同的原始點 -> 發生碰撞
    const uniqueOrigs = new Set();
    for (const n of origNodes) {
      uniqueOrigs.add(JSON.stringify(n));
    }
    if (uniqueOrigs.size > 1) {
      for (const n of origNodes) {
        frozen.add(JSON.stringify(n));
      }
    }
  }
  return frozen;
}

/**
 * 單點吸附運算
 * @param {Array<number>} pt - 點座標 [x, y]
 * @param {number} gridSize - 網格大小
 * @param {Set<string>} frozenSet - 凍結節點集合（JSON 字串格式）
 * @returns {Array<number>} 吸附後的座標
 */
function snapPoint(pt, gridSize, frozenSet) {
  const ptStr = JSON.stringify([pt[0], pt[1]]);
  // 若該點在凍結名單中 (會碰撞)，則保持原位，不進行吸附
  if (frozenSet.has(ptStr)) {
    return [pt[0], pt[1]];
  }

  const gx = Math.round(pt[0] / gridSize) * gridSize;
  const gy = Math.round(pt[1] / gridSize) * gridSize;
  return [gx, gy];
}

/**
 * [核心邏輯] 網格吸附與屬性同步
 * 1. 計算起點與終點的新網格座標。
 * 2. 重新插值中間點。
 * 3. [重要] 直接沿用舊的 nodes 列表，因為點的數量不變，屬性順序自然對應。
 * @param {Object} stroke - 線段物件
 * @param {Set<string>} frozenNodes - 凍結節點集合
 * @param {number} gridSize - 網格大小
 */
function snapAndInterpolateStroke(stroke, frozenNodes, gridSize) {
  const points = stroke.points || [];
  const nodes = stroke.nodes || []; // 讀取屬性列表

  if (!points.length || points.length < 2) return;

  // 1. 吸附頭尾
  const pStartOld = points[0];
  const pEndOld = points[points.length - 1];

  const pStartNew = snapPoint(pStartOld, gridSize, frozenNodes);
  const pEndNew = snapPoint(pEndOld, gridSize, frozenNodes);

  // 2. 重新插值 (保持點數 n 不變)
  const n = points.length;
  const newPointsCoords = getEquidistantPoints(pStartNew, pEndNew, n);

  // 3. 寫回資料
  stroke.points = newPointsCoords;

  // [屬性保護]
  // 因為我們強制 n 不變，原本位於 index i 的站點屬性，
  // 在座標移動後，依然屬於 index i 的新座標。
  stroke.nodes = nodes;

  // 同步更新頭尾屬性 (防呆)
  if (nodes.length > 0) {
    stroke.properties_start = nodes[0];
    stroke.properties_end = nodes[nodes.length - 1];
  }
}

/**
 * 檢查並補全 nodes 列表，確保後續運算不會報錯。
 * @param {Array} segments - 線段陣列
 * @returns {Array} 處理後的線段陣列
 */
function formStrokesAndValidate(segments) {
  const processedStrokes = [];
  let missingCount = 0;

  for (const seg of segments) {
    const stroke = JSON.parse(JSON.stringify(seg));
    stroke.processed = false;

    const points = stroke.points || [];

    // [防呆] 檢查 nodes 是否存在且長度正確
    if (!stroke.nodes || stroke.nodes.length !== points.length) {
      missingCount++;
      // 建立預設 nodes (搶救頭尾)
      const newNodes = [];
      for (let i = 0; i < points.length; i++) {
        const props = { node_type: 'line' };
        if (i === 0) {
          Object.assign(props, stroke.properties_start || {});
        } else if (i === points.length - 1) {
          Object.assign(props, stroke.properties_end || {});
        }
        newNodes.push(props);
      }
      stroke.nodes = newNodes;
    }

    processedStrokes.push(stroke);
  }

  if (missingCount > 0) {
    console.log(`⚠️ [警告] 發現 ${missingCount} 條線段缺少完整 'nodes' 列表，已自動補全頭尾資訊。`);
  }

  return processedStrokes;
}

// ==========================================
// 4. 輔助函式：視覺化
// ==========================================
/**
 * 取得路線顏色
 * @param {Object} segment - 線段物件
 * @returns {string} 顏色字串
 */
// eslint-disable-next-line no-unused-vars
function getSegmentColor(segment) {
  let props = segment.way_properties?.tags || {};
  if (!props || Object.keys(props).length === 0) {
    props = segment.properties || {};
  }
  return props.colour || props.color || '#000000';
}

/**
 * 繪製地圖 (支援讀取 nodes 顯示紅點/黑點)
 * @param {Object} ax - 繪圖軸物件 (前端組件中處理)
 * @param {Array} data - 線段資料
 * @param {string} title - 圖表標題
 */
// eslint-disable-next-line no-unused-vars
function plotRoadData(ax, data, title) {
  // 在 JavaScript 環境中，此功能由前端 d3jsmap 組件處理
  console.log(`[視覺化] ${title}`);
}

// ==========================================
// 5. 主執行流程
// ==========================================
// eslint-disable-next-line no-unused-vars
export function execute_2_1_to_2_2(_jsonData) {
  const dataStore = useDataStore();
  const taipei2_1Layer = dataStore.findLayerById('taipei_2_1');
  const taipei2_2Layer = dataStore.findLayerById('taipei_2_2');

  // ==========================================
  // 2. 檔案路徑與全域設定
  // ==========================================
  // 輸入：Step 2.1 直線化後的檔案
  const inputJsonFilename = taipei2_1Layer ? 'taipei_2_1 (in-memory)' : 'taipei_2_1';
  // 輸出：Step 2.2 示意化後的檔案 (已直接傳給下一個圖層)

  // [參數] 示意化網格大小 (數值越大，地圖越抽象/方正)
  const GRID_SIZE = 5;

  console.log('='.repeat(60));
  console.log('📂 [設定] 檔案路徑配置');
  console.log(`   - 輸入檔案: 從 taipei_2_1 圖層讀取`);
  console.log(`   - 輸出資料: 已直接傳給 taipei_2_2 圖層`);
  console.log(`   - 網格大小: ${GRID_SIZE}`);
  console.log('='.repeat(60));

  if (!taipei2_1Layer || !taipei2_1Layer.spaceNetworkGridJsonData) {
    console.error(`❌ [錯誤] 找不到檔案: ${inputJsonFilename}`);
    console.error('請確認 Colab 4 (Step 2.1) 是否已執行並產生檔案。');
    throw new Error(`找不到檔案: ${inputJsonFilename}`);
  }

  try {
    // --- [Step A] 讀取資料 ---
    console.log('\n🚀 [Step A] 讀取直線性資料 (Straightened Data)...');
    const L_topology = taipei2_1Layer.spaceNetworkGridJsonData;
    console.log(`   -> 讀取 ${L_topology.length} 條線段。`);

    // --- [Step B] 資料驗證與補全 ---
    console.log('\n🚀 [Step B] 驗證 nodes 完整性...');
    const S_strokes = formStrokesAndValidate(L_topology);

    // --- [Step C] 提取交會點與碰撞偵測 ---
    console.log('\n🚀 [Step C] 偵測交會點與網格碰撞...');
    const nodesInput = extractConnectNodes(S_strokes);
    console.log(`   -> 識別出 ${nodesInput.length} 個交會點 (Connect Nodes)。`);

    const frozenNodes = detectFrozenNodes(nodesInput, GRID_SIZE);
    if (frozenNodes.size > 0) {
      console.log(`   -> ⚠️ 發現 ${frozenNodes.size} 個節點發生網格碰撞，將強制鎖定位置 (Frozen)。`);
    }

    // --- [Step D] 執行示意化運算 ---
    console.log(`\n🚀 [Step D] 執行示意化 (Grid Size = ${GRID_SIZE})...`);
    let processedCount = 0;
    for (const stroke of S_strokes) {
      snapAndInterpolateStroke(stroke, frozenNodes, GRID_SIZE);
      processedCount++;
    }
    console.log(`   -> 完成 ${processedCount} 條線段的網格吸附運算。`);

    // --- [Step E] 儲存檔案 ---
    console.log('\n🚀 [Step E] 儲存 Schematized JSON...');
    if (!taipei2_2Layer) {
      throw new Error('找不到 taipei_2_2 圖層');
    }

    taipei2_2Layer.spaceNetworkGridJsonData = S_strokes;
    console.log(`✅ 資料已傳給 taipei_2_2 圖層`);

    // --- [Step F] 繪製對照圖 ---
    console.log('\n🚀 [Step F] 產生對照圖 (Input vs Output)...');
    // Note: 在 JavaScript 環境中，繪圖功能由前端 d3jsmap 組件處理
    plotRoadData(null, L_topology, '1. Straightened (Input)');
    plotRoadData(null, S_strokes, `2. Schematized (Output, Grid ${GRID_SIZE})`);

    // 自動開啟 taipei_2_2 圖層以便查看結果
    if (!taipei2_2Layer.visible) {
      taipei2_2Layer.visible = true;
      dataStore.saveLayerState('taipei_2_2', { visible: true });
    }

    // 產生摘要並存到 dashboardData
    const dashboardData = {
      inputSegments: L_topology.length,
      outputSegments: S_strokes.length,
      gridSize: GRID_SIZE,
      connectNodesCount: nodesInput.length,
      frozenNodesCount: frozenNodes.size,
      processedSegments: S_strokes.filter((s) => s.processed !== false).length,
    };

    taipei2_2Layer.dashboardData = dashboardData;
  } catch (error) {
    console.error(`\n❌ [例外狀況] 執行過程中發生錯誤：${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}
