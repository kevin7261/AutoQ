// # @title Colab 2-10: 站點往中心聚集 (修正版：鎖定轉折點)
// ==============================================================================
// 📝 程式說明：
// 1. 讀取 Step 7 (網格正規化後) 的資料 (09_grid_check_*.json)。
// 2. 執行「順序重排 (Reordering)」：
//    - 將同一條路線的 segments 依據幾何連通性重新排序。
//    - 自動翻轉反向線段，確保車站順序正確。
// 3. 執行「向量收縮 (Vector Shrinking)」：
//    - [關鍵保護] 偵測並鎖定所有「轉折點 (Turn Nodes)」。
//      (修正：過濾 Segment 接縫處的重複點，確保轉折偵測正確)。
//    - 讓非轉折點的車站向地圖中心收縮，消除空隙。
// 4. 輸出：
//    - Before / After 對比圖 (防止重複顯示)。
// ==============================================================================
/* eslint-disable no-console */

import { useDataStore } from '@/stores/dataStore.js';

// ==========================================
// 1. 檔案路徑與全域設定
// ==========================================
// 輸入：Step 7 網格正規化後的檔案
// 輸出：Step 8 順序修正後的檔案 (已直接傳給下一個圖層)

// ==========================================
// 2. 資料結構轉換 (Flat List <-> Grouped)
// ==========================================
/**
 * 提取路線名稱
 * @param {Object} item - 項目物件
 * @returns {string} 路線名稱
 */
function getRouteName(item) {
  const p = item.way_properties?.tags || {};
  return p.route_name || p.name || item.properties?.route_name || 'Unknown';
}

/**
 * 將扁平列表轉換為以路線為單位的結構。
 * 為了進行連續性分析，必須先將 segments 歸類到各自的路線中。
 * @param {Array} flatData - 扁平資料陣列
 * @returns {Array} 結構化資料陣列
 */
function groupFlatDataByRoute(flatData) {
  const grouped = new Map();
  for (const seg of flatData) {
    const rName = getRouteName(seg);
    if (!grouped.has(rName)) {
      grouped.set(rName, []);
    }
    grouped.get(rName).push(seg);
  }

  const structuredData = [];
  for (const [rName, segments] of grouped.entries()) {
    structuredData.push({
      route_name: rName,
      segments: segments,
      // 保留第一個 segment 的屬性作為路線參考 (顏色等)
      original_props: segments.length > 0 ? segments[0] : {},
    });
  }
  return structuredData;
}

/**
 * 將結構化資料還原為扁平列表 (輸出用)
 * @param {Array} structuredData - 結構化資料陣列
 * @returns {Array} 扁平列表
 */
function flattenData(structuredData) {
  const flatList = [];
  for (const route of structuredData) {
    for (const seg of route.segments) {
      flatList.push(seg);
    }
  }
  return flatList;
}

// ==========================================
// 3. 幾何運算與輔助函式
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
 * 在直線段上生成均勻分布的點 (輔助 Automator 建立向量場)
 * @param {Array<Array<number>>} polyline - 折線點陣列
 * @param {number} totalCount - 總點數
 * @returns {Array<Object>} 點資料陣列
 */
function generatePointsOnStraightSegments(polyline, totalCount) {
  if (totalCount <= 0) return [];
  if (totalCount === 1) {
    return [{ x: polyline[0][0], y: polyline[0][1], h: false, v: false }];
  }

  const segments = [];
  let totalLength = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    const d = dist(p1, p2);
    if (d < 1e-9) continue;
    const isH = Math.abs(p1[1] - p2[1]) < 0.1;
    const isV = Math.abs(p1[0] - p2[0]) < 0.1;
    segments.push({ len: d, p1: p1, p2: p2, h: isH, v: isV });
    totalLength += d;
  }

  if (totalLength === 0) {
    return Array(totalCount).fill({ x: polyline[0][0], y: polyline[0][1], h: false, v: false });
  }

  const resultPoints = [];
  const stepDist = totalLength / (totalCount - 1);
  let segIdx = 0;
  let coveredLen = 0;

  for (let i = 0; i < totalCount; i++) {
    const target = i * stepDist;
    while (segIdx < segments.length) {
      const seg = segments[segIdx];
      const segStartDist = coveredLen;
      const segEndDist = coveredLen + seg.len;
      if (target <= segEndDist + 1e-9) {
        const remain = target - segStartDist;
        const ratio = seg.len > 0 ? remain / seg.len : 0;
        const nx = seg.p1[0] + (seg.p2[0] - seg.p1[0]) * ratio;
        const ny = seg.p1[1] + (seg.p2[1] - seg.p1[1]) * ratio;
        resultPoints.push({ x: nx, y: ny, h: seg.h, v: seg.v });
        break;
      } else {
        coveredLen += seg.len;
        segIdx++;
      }
    }
  }

  while (resultPoints.length < totalCount) {
    resultPoints.push({
      x: polyline[polyline.length - 1][0],
      y: polyline[polyline.length - 1][1],
      h: false,
      v: false,
    });
  }
  return resultPoints;
}

/**
 * 取得顏色
 * @param {Object} props - 屬性物件
 * @returns {string} 顏色字串
 */
function getColor(props) {
  const p = props?.way_properties?.tags || props?.properties || props || {};
  return p.colour || p.color || '#555555';
}

/**
 * 從節點屬性中提取元數據
 * @param {Object} props - 節點屬性物件
 * @returns {Object} 元數據物件
 */
function getNodeMetadataFromProps(props) {
  const tags = props?.tags || {};
  let cNum = props?.connect_number;
  if (cNum === null || cNum === undefined) {
    cNum = tags.connect_number;
  }

  const meta = {
    connect_number: cNum,
    station_name: tags.station_name || tags.name || props?.station_name,
    station_id: tags.station_id || props?.station_id,
    route_name_list: props?.route_name_list || [],
    tags_object: tags,
    node_type: props?.node_type,
  };
  return Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== null && v !== undefined));
}

/**
 * 取得邊界
 * @param {Array} dataList - 資料列表
 * @param {number} buffer - 緩衝區大小
 * @returns {Array<number>} [minX, maxX, minY, maxY]
 */
function getBounds(dataList, buffer = 2) {
  const allX = [];
  const allY = [];
  for (const route of dataList) {
    for (const seg of route.segments) {
      for (const p of seg.points) {
        allX.push(p[0]);
        allY.push(p[1]);
      }
    }
  }
  if (allX.length === 0) return [0, 10, 0, 10];
  return [Math.min(...allX) - buffer, Math.max(...allX) + buffer, Math.min(...allY) - buffer, Math.max(...allY) + buffer];
}

// ==========================================
// 4. 拓撲排序邏輯
// ==========================================
/**
 * [核心函式] 重排 segments 順序以形成連續路徑 (A->B, B->C, C->D...)
 * 並處理「反向線段」的翻轉問題。
 * @param {Array} segmentsList - 線段列表
 * @returns {Array} 排序後的線段列表
 */
function reorderSegmentsContinuously(segmentsList) {
  if (!segmentsList || segmentsList.length === 0) return [];
  const workingList = JSON.parse(JSON.stringify(segmentsList));

  const getKey = (pt) => [Math.round(pt[0] * 100) / 100, Math.round(pt[1] * 100) / 100];

  // 1. 建立鄰接表 (Adjacency Map)
  const items = {};
  const adj = {};
  for (let i = 0; i < workingList.length; i++) {
    const seg = workingList[i];
    const pts = seg.points;
    if (!pts || pts.length === 0) continue;
    const pStart = getKey(pts[0]);
    const pEnd = getKey(pts[pts.length - 1]);
    const pStartStr = JSON.stringify(pStart);
    const pEndStr = JSON.stringify(pEnd);
    items[i] = { seg: seg, p_start: pStartStr, p_end: pEndStr, visited: false };
    if (!adj[pStartStr]) adj[pStartStr] = [];
    adj[pStartStr].push(i);
    if (!adj[pEndStr]) adj[pEndStr] = [];
    adj[pEndStr].push(i);
  }

  const degreeMap = {};
  for (const [k, v] of Object.entries(adj)) {
    degreeMap[k] = v.length;
  }

  const sortedResult = [];

  // 2. 開始遍歷
  while (sortedResult.length < Object.keys(items).length) {
    const remaining = Object.keys(items)
      .map(Number)
      .filter((i) => !items[i].visited);
    if (remaining.length === 0) break;

    // 尋找起點 (優先找端點 Degree=1)
    let startIdx = remaining[0];
    for (const idx of remaining) {
      const pS = items[idx].p_start;
      const pE = items[idx].p_end;
      if (degreeMap[pS] === 1 || degreeMap[pE] === 1) {
        startIdx = idx;
        break;
      }
    }

    const currItem = items[startIdx];
    currItem.visited = true;

    // 決定是否反轉第一段
    let needReverse = false;
    if (degreeMap[currItem.p_end] === 1 && degreeMap[currItem.p_start] !== 1) {
      needReverse = true;
    }
    let currCoord = needReverse ? currItem.p_start : currItem.p_end;

    const segData = currItem.seg;

    if (needReverse) {
      segData.points = segData.points.slice().reverse();
      if (segData.nodes) segData.nodes = segData.nodes.slice().reverse();
      if (segData.original_points) segData.original_points = segData.original_points.slice().reverse();
    }

    sortedResult.push(segData);

    // 鏈接下一段
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidates = adj[currCoord] || [];
      let nextIdx = null;
      for (const c of candidates) {
        if (!items[c].visited) {
          nextIdx = c;
          break;
        }
      }
      if (nextIdx === null) break;

      const nxtItem = items[nextIdx];
      nxtItem.visited = true;
      const nxtSeg = nxtItem.seg;

      if (nxtItem.p_start === currCoord) {
        currCoord = nxtItem.p_end;
      } else if (nxtItem.p_end === currCoord) {
        nxtSeg.points = nxtSeg.points.slice().reverse();
        if (nxtSeg.nodes) nxtSeg.nodes = nxtSeg.nodes.slice().reverse();
        if (nxtSeg.original_points) nxtSeg.original_points = nxtSeg.original_points.slice().reverse();
        currCoord = nxtItem.p_start;
      } else {
        break;
      }
      sortedResult.push(nxtSeg);
    }
  }

  return sortedResult;
}

/**
 * 建立全局拓撲
 * @param {Array} dataList - 資料列表
 * @returns {Object} 鄰接表
 */
function buildGlobalTopology(dataList) {
  const adjacency = {};
  for (const route of dataList) {
    for (const seg of route.segments) {
      const pts = seg.points;
      if (pts.length < 2) continue;
      for (let i = 0; i < pts.length - 1; i++) {
        const k1 = [Math.round(pts[i][0]), Math.round(pts[i][1])];
        const k2 = [Math.round(pts[i + 1][0]), Math.round(pts[i + 1][1])];
        const k1Str = JSON.stringify(k1);
        const k2Str = JSON.stringify(k2);
        if (k1Str === k2Str) continue;
        if (!adjacency[k1Str]) adjacency[k1Str] = new Set();
        if (!adjacency[k2Str]) adjacency[k2Str] = new Set();
        adjacency[k1Str].add(k2Str);
        adjacency[k2Str].add(k1Str);
      }
    }
  }
  return adjacency;
}

/**
 * 建立路線重疊映射
 * @param {Array} dataList - 資料列表
 * @returns {Object} 重疊映射表
 */
function buildRouteOverlapMap(dataList) {
  const overlapMap = {};
  let routeIdx = 0;
  for (const route of dataList) {
    routeIdx++;
    const pointsInThisRoute = new Set();
    for (const seg of route.segments) {
      for (const p of seg.points) {
        pointsInThisRoute.add(JSON.stringify([Math.round(p[0]), Math.round(p[1])]));
      }
    }
    for (const pt of pointsInThisRoute) {
      if (!overlapMap[pt]) overlapMap[pt] = new Set();
      overlapMap[pt].add(routeIdx);
    }
  }
  return overlapMap;
}

/**
 * 偵測路徑中的轉折點 (Turn Nodes)。
 * 如果一個點的前後線段是垂直的 (Horizontal <-> Vertical)，則該點為轉折點。
 * @param {Array<Array<number>>} polyline - 折線點陣列
 * @returns {Set} 轉折點集合
 */
function detectSharpTurns(polyline) {
  const turns = new Set();
  if (polyline.length < 3) return turns;
  for (let i = 1; i < polyline.length - 1; i++) {
    const prev = polyline[i - 1];
    const curr = polyline[i];
    const nextP = polyline[i + 1];

    // 計算前後向量
    const v1x = curr[0] - prev[0];
    const v1y = curr[1] - prev[1];
    const v2x = nextP[0] - curr[0];
    const v2y = nextP[1] - curr[1];

    // 判定水平或垂直 (容許微小誤差)
    const isV1Horiz = Math.abs(v1y) < 0.1 && Math.abs(v1x) > 0.1;
    const isV1Vert = Math.abs(v1x) < 0.1 && Math.abs(v1y) > 0.1;

    const isV2Horiz = Math.abs(v2y) < 0.1 && Math.abs(v2x) > 0.1;
    const isV2Vert = Math.abs(v2x) < 0.1 && Math.abs(v2y) > 0.1;

    // 如果方向改變 (H->V 或 V->H)，則標記為轉折點
    if ((isV1Horiz && isV2Vert) || (isV1Vert && isV2Horiz)) {
      // 使用整數座標作為 Key，確保比對準確
      turns.add(JSON.stringify([Math.round(curr[0]), Math.round(curr[1])]));
    }
  }
  return turns;
}

/**
 * 準備 Automator 所需的 Sequence 序列，並在此處設定「保護機制」。
 * @param {Array} dataList - 資料列表
 * @returns {Array} [sequence, sortedData]
 */
function prepareSequenceAndSortedData(dataList) {
  const sequence = [];
  const sortedData = JSON.parse(JSON.stringify(dataList));
  const metadataMap = {};

  // 1. 建立 metadata map
  for (const route of sortedData) {
    for (const seg of route.segments) {
      const pts = seg.points;
      const nodes = seg.nodes || [];
      if (nodes.length === pts.length) {
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const nodeProps = nodes[i];
          const k = JSON.stringify([Math.round(p[0]), Math.round(p[1])]);
          const meta = getNodeMetadataFromProps(nodeProps);
          if (Object.keys(meta).length > 0) {
            if (!metadataMap[k]) {
              metadataMap[k] = meta;
            } else {
              Object.assign(metadataMap[k], meta);
            }
          }
        }
      }
    }
  }

  // 2. 建立拓樸與重疊表
  const topologyMap = buildGlobalTopology(sortedData);
  const routeOverlapMap = buildRouteOverlapMap(sortedData);

  let routeIdx = 0;
  for (const route of sortedData) {
    routeIdx++;
    const routeName = route.route_name || `Route ${routeIdx}`;
    const routeColor = getColor(route.original_props || {});

    // 排序 Segments
    const rawSegments = route.segments;
    const sortedSegmentsList = reorderSegmentsContinuously(rawSegments);
    route.segments = sortedSegmentsList;

    // [關鍵修正] 重建整條 polyline 以精確偵測轉折點
    // 必須過濾掉 Segment 銜接處的重複點，否則 detect_sharp_turns 會誤判
    let fullPolyline = [];
    if (sortedSegmentsList.length > 0) {
      const allPoints = [];
      for (const seg of sortedSegmentsList) {
        allPoints.push(...seg.points);
      }

      if (allPoints.length > 0) {
        fullPolyline.push(allPoints[0]);
        for (let i = 1; i < allPoints.length; i++) {
          const p = allPoints[i];
          // 若與前一點距離太近(重複)，則忽略
          if (dist(p, fullPolyline[fullPolyline.length - 1]) > 0.001) {
            fullPolyline.push(p);
          }
        }
      }
    }

    const turnCoords = detectSharpTurns(fullPolyline);

    // 產生 Sequence
    for (let segI = 0; segI < sortedSegmentsList.length; segI++) {
      const seg = sortedSegmentsList[segI];
      const pts = seg.points;
      const origPts = seg.original_points || [];
      const count = origPts.length > 0 ? origPts.length : pts.length;

      const stationPtsData = generatePointsOnStraightSegments(pts, count);

      for (let i = 0; i < stationPtsData.length; i++) {
        const pData = stationPtsData[i];
        const finalX = Math.round(pData.x);
        const finalY = Math.round(pData.y);
        const coordKey = JSON.stringify([finalX, finalY]);

        const ptMeta = metadataMap[coordKey] || {};
        const degree = (topologyMap[coordKey] || new Set()).size;
        const numRoutes = (routeOverlapMap[coordKey] || new Set()).size;

        // 判斷是否為轉折點
        const isTurn = turnCoords.has(coordKey);

        const ptObj = {
          x: finalX,
          y: finalY,
          route_idx: routeIdx,
          route_name: routeName,
          seg_idx: segI,
          point_idx: i,
          color: routeColor,
          connect_number: ptMeta.connect_number,
          tags: ptMeta.tags_object || {},
          station_name: ptMeta.station_name,
          station_id: ptMeta.station_id,
          route_name_list: ptMeta.route_name_list,
          is_turn: isTurn,
          seg_is_h: pData.h,
          seg_is_v: pData.v,
        };

        // [保護機制] 鎖定條件 (不可移動的點)
        // 轉折點如果移動，會導致相鄰的直線變成斜線，所以必須鎖定！
        if (ptObj.connect_number !== null && ptObj.connect_number !== undefined) {
          ptObj.marker_type = 'X';
          ptObj.color_code = '#D50000';
          ptObj.is_movable = false;
        } else if (isTurn) {
          // 藍色標記轉折點，並禁止移動
          ptObj.marker_type = 'X';
          ptObj.color_code = '#0046E3';
          ptObj.is_movable = false;
        } else if (numRoutes >= 2 || degree > 2) {
          ptObj.marker_type = 'X';
          ptObj.color_code = '#D50000';
          ptObj.is_movable = false;
        } else {
          ptObj.marker_type = 'O';
          ptObj.color_code = 'black';
          ptObj.is_movable = true;
        }

        sequence.push(ptObj);
      }
    }
  }

  return [sequence, sortedData];
}

// ==========================================
// 5. 繪圖 (單圖版)
// ==========================================
/**
 * 繪製地圖樣式 3
 * @param {Object} ax - 繪圖軸物件 (前端組件中處理)
 * @param {Array} dataList - 資料列表
 * @param {string} titleSuffix - 標題後綴
 * @param {Array|null} sequenceOverride - 序列覆蓋
 */
// eslint-disable-next-line no-unused-vars
function drawMapStyle3(ax, dataList, titleSuffix = '', sequenceOverride = null) {
  // 在 JavaScript 環境中，此功能由前端 d3jsmap 組件處理
  console.log(`[視覺化] ${titleSuffix}`);
}

// ==========================================
// 6. 自動化核心 (Automator)
// ==========================================
/**
 * 路線序列自動化器類別
 */
class RouteSequenceAutomator {
  /**
   * 初始化自動化器
   * @param {Array} data - 資料列表
   * @param {Array} sequence - 序列資料
   */
  constructor(data, sequence) {
    this.originalDataImmutable = JSON.parse(JSON.stringify(data));
    this.originalSequence = JSON.parse(JSON.stringify(sequence));
    this.data = JSON.parse(JSON.stringify(data));
    this.sequence = JSON.parse(JSON.stringify(sequence));
    const [xMin, xMax, yMin, yMax] = getBounds(this.data);
    this.centerX = (xMin + xMax) / 2;
    this.centerY = (yMin + yMax) / 2;
    this.routeGridMask = this._buildRouteGridMask();
    this.roundCount = 0;
    this.calculateVectorsOnly();
  }

  /**
   * 建立路線網格遮罩
   * @returns {Object} 路線網格遮罩
   */
  _buildRouteGridMask() {
    const mask = {};
    let rIdx = 0;
    for (const route of this.data) {
      rIdx++;
      const validCoords = new Set();
      for (const seg of route.segments) {
        const pts = seg.points;
        if (pts.length < 2) continue;
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const dx = p2[0] - p1[0];
          const dy = p2[1] - p1[1];
          const steps = Math.max(Math.abs(dx), Math.abs(dy));
          if (steps === 0) {
            validCoords.add(JSON.stringify([Math.round(p1[0]), Math.round(p1[1])]));
            continue;
          }
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            validCoords.add(JSON.stringify([Math.round(p1[0] + dx * t), Math.round(p1[1] + dy * t)]));
          }
        }
      }
      mask[rIdx] = validCoords;
    }
    return mask;
  }

  /**
   * 更新路線幾何
   * @param {Object} ptData - 點資料
   * @param {number} oldX - 舊 X 座標
   * @param {number} oldY - 舊 Y 座標
   * @param {number} newX - 新 X 座標
   * @param {number} newY - 新 Y 座標
   */
  updateRouteGeometry(ptData, oldX, oldY, newX, newY) {
    if (ptData.route_idx < 1 || ptData.route_idx > this.data.length) return;
    const route = this.data[ptData.route_idx - 1];
    const segIdx = ptData.seg_idx;
    const pointIdx = ptData.point_idx;

    if (segIdx < route.segments.length) {
      const seg = route.segments[segIdx];
      // A. 強制更新 Original Points
      if (seg.original_points) {
        if (pointIdx < seg.original_points.length) {
          seg.original_points[pointIdx][0] = newX;
          seg.original_points[pointIdx][1] = newY;
        }
      }
      // B. 更新路線幾何點
      if (seg.points) {
        for (const pt of seg.points) {
          if (Math.round(pt[0]) === oldX && Math.round(pt[1]) === oldY) {
            pt[0] = newX;
            pt[1] = newY;
          }
        }
      }
    }
  }

  /**
   * 僅計算向量
   */
  calculateVectorsOnly() {
    const occupied = new Set(this.sequence.map((pt) => JSON.stringify([pt.x, pt.y])));
    const targetCx = Math.round(this.centerX);
    const targetCy = Math.round(this.centerY);

    for (const pt of this.sequence) {
      pt.vector_dx = 0;
      pt.vector_dy = 0;
      pt.vector_type = '';

      // [保護檢查] 再次確認是否為可移動點 (Turn Points 應為 False)
      if (!pt.is_movable) continue;

      const rIdx = pt.route_idx;
      const px = pt.x;
      const py = pt.y;
      const isH = pt.seg_is_h || false;
      const isV = pt.seg_is_v || false;

      let dx = 0;
      let dy = 0;
      // 簡單向量場：往中心點移動
      if (isH && px !== targetCx) {
        dx = px < targetCx ? 1 : -1;
      }
      if (isV && py !== targetCy) {
        dy = py < targetCy ? 1 : -1;
      }
      if (dx === 0 && dy === 0) {
        pt.vector_type = 'C';
        continue;
      }

      const nx = px + dx;
      const ny = py + dy;
      const validCoords = this.routeGridMask[rIdx] || new Set();
      let blocked = false;
      if (!validCoords.has(JSON.stringify([nx, ny]))) blocked = true;
      if (occupied.has(JSON.stringify([nx, ny]))) blocked = true;

      pt.vector_dx = dx;
      pt.vector_dy = dy;
      pt.vector_type = blocked ? 'B' : 'G';
    }
  }

  /**
   * 優化一輪
   * @returns {number} 移動次數
   */
  optimizeOneRound() {
    let moved = 0;
    const occupied = new Set(this.sequence.map((pt) => JSON.stringify([pt.x, pt.y])));
    for (const pt of this.sequence) {
      if (!pt.is_movable) continue;
      if (pt.vector_type !== 'G') continue;

      const oldPos = [pt.x, pt.y];
      const newX = pt.x + pt.vector_dx;
      const newY = pt.y + pt.vector_dy;
      if (occupied.has(JSON.stringify([newX, newY]))) continue;

      occupied.delete(JSON.stringify(oldPos));
      pt.x = newX;
      pt.y = newY;
      occupied.add(JSON.stringify([newX, newY]));
      moved++;
      this.updateRouteGeometry(pt, oldPos[0], oldPos[1], newX, newY);
    }

    this.calculateVectorsOnly();
    return moved;
  }

  /**
   * 運行直到穩定
   * @param {number} maxRounds - 最大輪數
   */
  runUntilStable(maxRounds = 50) {
    console.log(`🚀 開始向量收縮 (Max ${maxRounds} rounds)...`);
    for (let r = 0; r < maxRounds; r++) {
      this.roundCount++;
      const m = this.optimizeOneRound();
      if (m === 0) break;
    }
    console.log('✅ 收縮完成。');
  }

  /**
   * 生成壓縮視圖
   * @returns {Array} [colSeq, colData]
   */
  generateCollapsedView() {
    // 1. 建立座標映射 (去除空行/空列)
    const validX = new Set();
    const validY = new Set();
    for (const pt of this.sequence) {
      validX.add(pt.x);
      validY.add(pt.y);
    }
    for (const route of this.data) {
      for (const seg of route.segments) {
        for (const p of seg.points) {
          validX.add(Math.round(p[0]));
          validY.add(Math.round(p[1]));
        }
      }
    }

    const sortedX = Array.from(validX).sort((a, b) => a - b);
    const sortedY = Array.from(validY).sort((a, b) => a - b);
    const mapX = {};
    const mapY = {};
    for (let i = 0; i < sortedX.length; i++) {
      mapX[sortedX[i]] = i;
    }
    for (let i = 0; i < sortedY.length; i++) {
      mapY[sortedY[i]] = i;
    }

    // 2. 轉換
    const colSeq = JSON.parse(JSON.stringify(this.sequence));
    for (const pt of colSeq) {
      if (pt.x in mapX) pt.x = mapX[pt.x];
      if (pt.y in mapY) pt.y = mapY[pt.y];
    }

    const colData = JSON.parse(JSON.stringify(this.data));
    for (const route of colData) {
      for (const seg of route.segments) {
        const newPoints = [];
        for (const p of seg.points) {
          const oldX = Math.round(p[0]);
          const oldY = Math.round(p[1]);
          if (oldX in mapX && oldY in mapY) {
            const newX = mapX[oldX];
            const newY = mapY[oldY];
            if (newPoints.length === 0 || newPoints[newPoints.length - 1][0] !== newX || newPoints[newPoints.length - 1][1] !== newY) {
              if (p.length > 2) {
                newPoints.push([newX, newY, p[2]]);
              } else {
                newPoints.push([newX, newY]);
              }
            }
          }
        }
        seg.points = newPoints;
      }
    }

    // 同步更新 Sequence 中的座標
    for (const pt of colSeq) {
      const rIdx = pt.route_idx - 1;
      const sIdx = pt.seg_idx;
      const pIdx = pt.point_idx;
      if (rIdx >= 0 && rIdx < colData.length) {
        const seg = colData[rIdx].segments[sIdx];
        if (seg.original_points) {
          if (pIdx < seg.original_points.length) {
            seg.original_points[pIdx][0] = pt.x;
            seg.original_points[pIdx][1] = pt.y;
          }
        }
      }
    }
    return [colSeq, colData];
  }

  /**
   * 顯示結果
   * @returns {Array} 最終扁平資料
   */
  showResults() {
    // 1. 產生最終的 Collapsed View 數據
    const [colSeq, colData] = this.generateCollapsedView();

    // 2. 設置雙張圖表 (Before & After)
    // 使用 subplot 1, 2 並排顯示
    // Note: 在 JavaScript 環境中，繪圖功能由前端 d3jsmap 組件處理
    drawMapStyle3(null, this.originalDataImmutable, ' (1. Before Shrinking)', this.originalSequence);
    drawMapStyle3(null, colData, ' (2. After Shrinking & Collapsed)', colSeq);

    console.log(`✅ 對比圖已處理 (由前端 d3jsmap 組件顯示)`);

    return flattenData(colData); // 回傳最終資料
  }
}

// ==========================================
// 7. 主程式
// ==========================================
// eslint-disable-next-line no-unused-vars
export function execute_2_9_to_2_10(_jsonData) {
  const dataStore = useDataStore();
  const taipei2_9Layer = dataStore.findLayerById('taipei_2_9');
  const taipei2_10Layer = dataStore.findLayerById('taipei_2_10');

  console.log('='.repeat(60));
  console.log('📂 [設定] 檔案路徑配置');
  console.log(`   - 輸入檔案: 從 taipei_2_9 圖層讀取`);
  console.log(`   - 輸出資料: 已直接傳給 taipei_2_10 圖層`);
  console.log('='.repeat(60));

  if (!taipei2_9Layer || !taipei2_9Layer.spaceNetworkGridJsonData) {
    console.error(`❌ 錯誤: 找不到 ${taipei2_9Layer ? 'taipei_2_9' : 'taipei_2_9'} (請先執行 Colab 9)`);
    throw new Error(`找不到 taipei_2_9 (請先執行 Colab 9)`);
  }

  try {
    console.log(`📂 讀取檔案: 從 taipei_2_9 圖層`);
    const dataFlat = JSON.parse(JSON.stringify(taipei2_9Layer.spaceNetworkGridJsonData));

    // 1. 轉為 Grouped (按路線分組)
    const dataGrouped = groupFlatDataByRoute(dataFlat);

    // 2. 準備 Sequence 並執行 [順序重排修正]
    console.log('🔄 執行順序重排與 Sequence 建立...');
    const [seqData, sortedData] = prepareSequenceAndSortedData(dataGrouped);

    // 3. 初始化並執行 Automator
    console.log('🚀 初始化 Automator (使用 Sorted Data)...');
    const automator = new RouteSequenceAutomator(sortedData, seqData);
    automator.runUntilStable();

    // 4. 顯示結果並獲取最終數據
    console.log('📊 繪製最終結果圖...');
    const finalFlatData = automator.showResults();

    // 5. 存檔
    if (!taipei2_10Layer) {
      throw new Error('找不到 taipei_2_10 圖層');
    }

    taipei2_10Layer.spaceNetworkGridJsonData = finalFlatData;
    console.log(`💾 結果已儲存 (所有座標與索引已同步): 已傳給 taipei_2_10 圖層`);

    // 自動開啟 taipei_2_10 圖層以便查看結果
    if (!taipei2_10Layer.visible) {
      taipei2_10Layer.visible = true;
      dataStore.saveLayerState('taipei_2_10', { visible: true });
    }

    // 產生摘要並存到 dashboardData
    const dashboardData = {
      inputSegmentCount: dataFlat.length,
      outputSegmentCount: finalFlatData.length,
      totalPoints: seqData.length,
      rounds: automator.roundCount,
    };

    taipei2_10Layer.dashboardData = dashboardData;
  } catch (error) {
    console.error(`\n❌ [例外狀況] 執行錯誤：${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}
