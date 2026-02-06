/**
 * 📦 數據存儲模組 (Data Store Module) - Pinia Store
 *
 * 這是一個基於 Pinia 的集中式狀態管理模組，專為示意圖響應式網站設計。
 * 該模組負責管理整個應用程式的狀態，包括圖層配置、數據載入、用戶互動
 * 和視覺化設定等。它提供了統一的 API 介面，簡化了組件間的數據交互，
 * 並確保狀態的一致性和可預測性。
 *
 * 🎯 核心功能 (Core Features):
 * 1. 🏙️ 圖層管理系統：管理所有圖層的配置、狀態和數據
 *    - 圖層配置：定義圖層的基本屬性和載入方式
 *    - 圖層狀態：追蹤圖層的可見性、載入狀態和數據狀態
 *    - 圖層分組：將圖層組織成邏輯群組，便於管理
 * 2. 📊 數據載入控制：管理異步數據載入流程
 *    - 自動載入：當圖層開啟時自動載入對應數據
 *    - 載入狀態：追蹤載入進度和錯誤狀態
 *    - 數據快取：避免重複載入相同數據
 * 3. 🎯 用戶互動管理：處理用戶選擇和互動狀態
 *    - 要素選擇：管理當前選中的地理要素
 *    - 圖層切換：處理圖層的開啟和關閉
 *    - 視覺化設定：管理 D3.js 視覺化組件的設定
 * 4. 📈 統計數據管理：計算和快取統計信息
 *    - 實時統計：根據當前可見圖層計算統計數據
 *    - 數據摘要：提供圖層數據的摘要信息
 *    - 性能優化：避免重複計算，提高性能
 *
 * 🏗️ 架構設計 (Architecture Design):
 * - 集中式狀態管理：所有狀態集中在一個 store 中
 * - 響應式更新：使用 Vue 3 的響應式系統確保 UI 同步
 * - 模組化設計：將不同功能分離到不同的函數中
 * - 類型安全：提供完整的 TypeScript 類型定義
 * - 持久化支援：支援狀態的本地存儲和恢復
 *
 * 🔧 技術特點 (Technical Features):
 * - Pinia 狀態管理：使用 Vue 3 官方推薦的狀態管理庫
 * - Composition API：使用 Vue 3 的 Composition API 設計
 * - 異步操作：支援 Promise 和 async/await 語法
 * - 錯誤處理：完整的錯誤捕獲和恢復機制
 * - 性能優化：使用計算屬性和快取機制
 *
 * 📊 狀態結構 (State Structure):
 * - layers: 圖層配置和狀態陣列
 * - layerStates: 圖層狀態的詳細追蹤
 * - selectedFeature: 當前選中的地理要素
 * - d3jsDimensions: D3.js 視覺化組件的尺寸設定
 *
 * 🚀 使用範例 (Usage Examples):
 * ```javascript
 * // 在組件中使用 store
 * import { useDataStore } from '@/stores/dataStore';
 *
 * const dataStore = useDataStore();
 *
 * // 切換圖層可見性
 * await dataStore.toggleLayerVisibility('test_layer');
 *
 * // 獲取可見圖層
 * const visibleLayers = dataStore.visibleLayers;
 *
 * // 設定選中的要素
 * dataStore.setSelectedFeature(feature);
 * ```
 *
 * 🔄 數據流程 (Data Flow):
 * 1. 組件調用 store 方法
 * 2. Store 更新內部狀態
 * 3. 響應式系統觸發 UI 更新
 * 4. 組件重新渲染
 * 5. 用戶看到更新後的界面
 *
 * ⚠️ 注意事項 (Important Notes):
 * - 所有狀態變更都應該通過 store 方法進行
 * - 異步操作需要適當的錯誤處理
 * - 大型數據集可能需要較長的載入時間
 * - 建議在載入過程中顯示進度指示器
 *
 * @file dataStore.js
 * @version 3.0.0
 * @author Kevin Cheng
 * @since 1.0.0
 * @see {@link https://pinia.vuejs.org/} Pinia 官方文檔
 * @see {@link https://vuejs.org/guide/composition-api/} Vue 3 Composition API 文檔
 */
// ==================== 📦 第三方庫引入 (Third-Party Library Imports) ====================

/**
 * Pinia 狀態管理庫引入
 * Vue 3 官方推薦的狀態管理解決方案
 * 提供更好的 TypeScript 支援和開發者體驗
 *
 * @see https://pinia.vuejs.org/
 */
import { defineStore } from 'pinia';

/**
 * Vue 3 Composition API 核心功能引入
 * 提供響應式數據和計算屬性功能
 *
 * @see https://vuejs.org/
 */
import { ref, computed } from 'vue';

/**
 * 數據處理工具函數引入
 * 提供數據載入功能
 */

// ==================== 📦 主要數據存儲定義 (Main Data Store Definition) ====================

/**
 * 📦 數據存儲 Store 實例 (Data Store Instance)
 *
 * 使用 Pinia 的 defineStore 創建數據存儲實例，採用 Composition API 設計模式。
 * 該 store 是整個應用程式的狀態管理中心，提供統一的狀態管理和數據操作介面。
 *
 * 🎯 Store 功能 (Store Features):
 * - 圖層管理：管理所有圖層的配置、狀態和數據
 * - 狀態追蹤：追蹤圖層的載入狀態、可見性等
 * - 數據載入：處理異步數據載入和錯誤處理
 * - 用戶互動：管理用戶選擇和互動狀態
 * - 視覺化設定：管理 D3.js 視覺化組件的設定
 *
 * 🔧 技術實現 (Technical Implementation):
 * - 使用 defineStore 創建 Pinia store
 * - 採用 Composition API 設計模式
 * - 支援狀態持久化（persist: true）
 * - 提供響應式狀態更新
 *
 * @type {Store} Pinia Store 實例
 * @since 1.0.0
 */
export const useDataStore = defineStore(
  'data',
  () => {
    // ==================== 🗺️ 圖層狀態管理 (Layer State Management) ====================

    /**
     * 📊 圖層狀態存儲 (Layer States Storage)
     *
     * 存儲所有圖層的詳細狀態信息，包括可見性、載入狀態、數據內容等。
     * 這個響應式對象會自動追蹤圖層狀態的變化，並觸發相關的 UI 更新。
     *
     * 狀態結構：
     * - layerId: 圖層唯一識別碼
     * - visible: 圖層是否可見
     * - isLoading: 圖層是否正在載入
     * - isLoaded: 圖層是否已載入完成
     * - jsonData: 圖層的原始 JSON 數據（不可修改）
     * - processedJsonData: 圖層的處理後 JSON 數據（用於顯示和計算）
     * - geojsonData: 圖層的 GeoJSON 數據（如果圖層包含 GeoJSON 格式數據）
     * - workData: 圖層的工作數據
     * - dashboardData: 圖層的儀表板數據
     * - dataTableData: 圖層的表格數據
     * - layerInfoData: 圖層的資訊數據
     *
     * @type {Ref<Object>} 圖層狀態響應式對象
     * @since 1.0.0
     */
    const layerStates = ref({});

    /**
     * 🗺️ 圖層配置定義 (Layer Configuration Definition)
     *
     * 靜態定義的圖層配置陣列，包含所有可用的圖層信息。每個圖層都包含
     * 完整的配置信息，包括載入方式、顯示設定、數據來源等。
     *
     * 圖層群組結構：
     * - 測試圖層：包含網格示意圖測試等開發用圖層
     *
     * 圖層屬性說明：
     * - layerId: 圖層唯一識別碼
     * - layerName: 圖層顯示名稱
     * - visible: 圖層初始可見性
     * - isLoading: 圖層載入狀態
     * - isLoaded: 圖層載入完成狀態
     * - type: 圖層類型（grid, point, line 等）
     * - colorName: 圖層顏色名稱
     * - jsonData: 圖層原始 JSON 數據（不可修改）
     * - processedJsonData: 圖層處理後 JSON 數據（用於顯示和計算）
     * - geojsonData: 圖層的 GeoJSON 數據（如果圖層包含 GeoJSON 格式數據）
     * - workData: 圖層工作數據
     * - dashboardData: 圖層儀表板數據
     * - dataTableData: 圖層表格數據
     * - layerInfoData: 圖層資訊數據
     * - jsonLoader: 圖層 JSON 數據載入函數
     * - geojsonLoader: 圖層 GeoJSON 數據載入函數
     * - jsonFileName: 圖層 JSON 文件名稱
     * - geojsonFileName: 圖層 GeoJSON 文件名稱
     * - display: 是否顯示
     *
     * @type {Ref<Array>} 圖層配置響應式陣列
     * @since 1.0.0
     */
    const layers = ref([
      {
        groupName: '測試圖層',
        groupLayers: [
          {
            layerId: 'test_layer',
            layerName: '測試',
            visible: false,
            isLoading: false,
            isLoaded: false,
            colorName: 'green',
            jsonData: null,
            processedJsonData: null,
            workData: null,
            dashboardData: null,
            dataTableData: null,
            layerInfoData: null,
            jsonLoader: null,
            jsonFileName: null,
            display: true,
            upperViewTabs: [
              'work',
              'dashboard',
            ],
          },
        ],
      },
    ]);

    /**
     * 💾 保存圖層狀態 (Save Layer State)
     *
     * 將圖層的狀態信息保存到 layerStates 響應式對象中。這個函數用於
     * 更新圖層的各種狀態，包括可見性、載入狀態、數據內容等。
     *
     * 🎯 主要功能 (Main Features):
     * - 狀態更新：更新指定圖層的狀態信息
     * - 自動初始化：如果圖層狀態不存在，會自動創建
     * - 合併更新：使用 Object.assign 合併新的狀態數據
     * - 響應式更新：觸發 Vue 的響應式更新機制
     *
     * 🔧 技術實現 (Technical Implementation):
     * - 檢查圖層狀態是否存在，不存在則創建空對象
     * - 使用 Object.assign 合併新的狀態數據
     * - 觸發響應式更新，通知相關組件重新渲染
     *
     * 🚀 使用範例 (Usage Examples):
     * ```javascript
     * // 更新圖層可見性
     * saveLayerState('test_layer', { visible: true });
     *
     * // 更新圖層載入狀態
     * saveLayerState('test_layer', { isLoading: true });
     *
     * // 更新圖層數據
     * saveLayerState('test_layer', {
     *   jsonData: data,
     *   dashboardData: summary,
     *   dataTableData: table,
     *   layerInfoData: info
     * });
     * ```
     *
     * @param {string} layerId - 圖層唯一識別碼
     * @param {Object} stateData - 要更新的狀態數據
     * @param {boolean} [stateData.visible] - 圖層可見性
     * @param {boolean} [stateData.isLoading] - 圖層載入狀態
     * @param {boolean} [stateData.isLoaded] - 圖層載入完成狀態
     * @param {Object} [stateData.jsonData] - 圖層原始 JSON 數據
     * @param {Object} [stateData.processedJsonData] - 圖層處理後 JSON 數據
     * @param {Object} [stateData.geojsonData] - 圖層的 GeoJSON 數據
     * @param {Object} [stateData.workData] - 圖層工作數據
     * @param {Object} [stateData.dashboardData] - 圖層儀表板數據
     * @param {Array} [stateData.dataTableData] - 圖層表格數據
     * @param {Object} [stateData.layerInfoData] - 圖層資訊數據
     *
     * @example
     * // 基本用法
     * saveLayerState('test_layer', { visible: true });
     *
     * @since 1.0.0
     */
    const saveLayerState = (layerId, stateData) => {
      if (!layerStates.value[layerId]) {
        layerStates.value[layerId] = {};
      }
      Object.assign(layerStates.value[layerId], stateData);
    };

    // ==================== 🔍 圖層搜尋函數 (Layer Search Functions) ====================

    /**
     * 🔍 根據 ID 搜尋圖層 (Find Layer by ID)
     *
     * 在靜態圖層配置中搜尋指定 ID 的圖層。這個函數會遍歷所有圖層群組，
     * 找到匹配的圖層並返回其配置對象。
     *
     * 🎯 主要功能 (Main Features):
     * - 圖層搜尋：根據 layerId 搜尋對應的圖層配置
     * - 深度搜尋：遍歷所有圖層群組和子圖層
     * - 精確匹配：使用嚴格相等比較確保精確匹配
     * - 安全返回：找不到時返回 null，避免錯誤
     *
     * 🔧 技術實現 (Technical Implementation):
     * - 使用雙重迴圈遍歷圖層群組和子圖層
     * - 使用嚴格相等比較（===）進行 ID 匹配
     * - 找到匹配圖層時立即返回，提高性能
     * - 遍歷完成後返回 null 表示未找到
     *
     * 🚀 使用範例 (Usage Examples):
     * ```javascript
     * // 搜尋圖層
     * const layer = findLayerById('test_layer');
     * if (layer) {
     *   console.log('找到圖層:', layer.layerName);
     * } else {
     *   console.log('圖層不存在');
     * }
     *
     * // 檢查圖層是否存在
     * if (findLayerById('test_layer')) {
     *   console.log('測試圖層存在');
     * }
     * ```
     *
     * 📊 搜尋範圍 (Search Scope):
     * - 測試圖層群組：包含網格示意圖測試等開發用圖層
     *
     * ⚠️ 注意事項 (Important Notes):
     * - 搜尋是線性的，大型圖層列表可能影響性能
     * - 返回的圖層對象是引用，修改會影響原始配置
     * - 建議在組件中使用前檢查返回值是否為 null
     *
     * @param {string} layerId - 要搜尋的圖層 ID
     * @returns {Object|null} - 找到的圖層配置對象，未找到時返回 null
     *
     * @example
     * // 基本用法
     * const layer = findLayerById('test_layer');
     * if (layer) {
     *   console.log(layer.layerName);
     * }
     *
     * @since 1.0.0
     */
    const findLayerById = (layerId) => {
      for (const mainGroup of layers.value) {
        for (const layer of mainGroup.groupLayers) {
          if (layer.layerId === layerId) {
            return layer;
          }
        }
      }
      return null;
    };

    /**
     * 📋 獲取所有圖層 (Get All Layers)
     *
     * 從靜態圖層配置中提取所有圖層的扁平陣列。這個函數會遍歷所有圖層群組，
     * 將所有子圖層合併成一個一維陣列，便於進行批量操作和搜尋。
     *
     * 🎯 主要功能 (Main Features):
     * - 扁平化提取：將嵌套的圖層群組結構扁平化為一維陣列
     * - 完整覆蓋：包含所有圖層群組中的所有子圖層
     * - 保持引用：返回的圖層對象保持對原始配置的引用
     * - 高效操作：提供便於批量操作的數據結構
     *
     * 🔧 技術實現 (Technical Implementation):
     * - 使用 for...of 迴圈遍歷圖層群組
     * - 使用展開運算符（...）合併子圖層陣列
     * - 保持原始圖層對象的引用，不進行深拷貝
     * - 返回新的陣列，避免修改原始配置
     *
     * 🚀 使用範例 (Usage Examples):
     * ```javascript
     * // 獲取所有圖層
     * const allLayers = getAllLayers();
     * console.log('總圖層數量:', allLayers.length);
     *
     * // 篩選可見圖層
     * const visibleLayers = allLayers.filter(layer => layer.visible);
     *
     * // 篩選載入中的圖層
     * const loadingLayers = allLayers.filter(layer => layer.isLoading);
     *
     * ```
     *
     * 📊 返回數據結構 (Return Data Structure):
     * ```javascript
     * [
     *   {
     *     layerId: string,        // 圖層唯一識別碼
     *     layerName: string,      // 圖層顯示名稱
     *     visible: boolean,       // 圖層可見性
     *     isLoading: boolean,     // 圖層載入狀態
     *     isLoaded: boolean,      // 圖層載入完成狀態
     *     type: string,           // 圖層類型
     *     colorName: string,      // 圖層顏色名稱
     *     jsonData: Object,       // 圖層原始 JSON 數據
     *     processedJsonData: Object, // 圖層處理後 JSON 數據
     *     workData: Object,       // 圖層工作數據
     *     dashboardData: Object,    // 圖層儀表板數據
     *     dataTableData: Array,       // 圖層表格數據
     *     layerInfoData: Object,      // 圖層資訊數據
     *     jsonLoader: Function,   // 圖層數據載入函數
     *     jsonFileName: string,   // 圖層 JSON 文件名稱
     *     display: boolean        // 是否顯示
     *   }
     * ]
     * ```
     *
     * 🔄 使用場景 (Use Cases):
     * - 批量操作：對所有圖層執行相同的操作
     * - 統計計算：計算圖層的統計信息
     * - 篩選搜尋：根據條件篩選特定圖層
     * - 狀態檢查：檢查圖層的整體狀態
     *
     * ⚠️ 注意事項 (Important Notes):
     * - 返回的陣列是動態的，會反映圖層配置的變化
     * - 圖層對象是引用，修改會影響原始配置
     * - 建議在需要時才調用，避免不必要的性能開銷
     *
     * @returns {Array} - 包含所有圖層的扁平陣列
     *
     * @example
     * // 基本用法
     * const allLayers = getAllLayers();
     * console.log('圖層數量:', allLayers.length);
     *
     * @since 1.0.0
     */
    const getAllLayers = () => {
      const allLayers = [];
      for (const mainGroup of layers.value) {
        allLayers.push(...mainGroup.groupLayers);
      }
      return allLayers;
    };

    // ==================== 🔄 主要圖層處理函數 (Main Layer Processing Functions) ====================

    /**
     * 🔄 切換圖層可見性 (Toggle Layer Visibility)
     *
     * 控制圖層的顯示/隱藏狀態，並在需要時自動載入數據。這是圖層管理的核心函數，
     * 負責處理圖層的開啟、關閉、數據載入等操作，確保圖層狀態的一致性和數據的及時載入。
     *
     * 🎯 主要功能 (Main Features):
     * - 可見性切換：切換圖層的顯示/隱藏狀態
     * - 自動載入：當圖層開啟且未載入時自動載入數據
     * - 狀態管理：更新圖層的各種狀態信息
     * - 錯誤處理：處理載入過程中的錯誤和異常
     * - 日誌記錄：提供詳細的操作日誌和調試信息
     *
     * 🔧 技術實現 (Technical Implementation):
     * - 異步操作：使用 async/await 處理數據載入
     * - 狀態檢查：檢查圖層的載入狀態和可見性
     * - 條件載入：只在需要時才載入數據，避免重複載入
     * - 錯誤恢復：載入失敗時恢復圖層狀態
     * - 狀態同步：確保所有相關狀態的一致性
     *
     * 🔄 操作流程 (Operation Flow):
     * 1. 搜尋圖層：根據 layerId 找到對應的圖層配置
     * 2. 狀態檢查：檢查圖層的當前狀態和載入條件
     * 3. 可見性切換：切換圖層的可見性狀態
     * 4. 條件載入：如果圖層開啟且未載入，則載入數據
     * 5. 狀態更新：更新圖層的載入狀態和數據內容
     * 6. 錯誤處理：處理載入過程中的錯誤和異常
     *
     * 🚀 使用範例 (Usage Examples):
     * ```javascript
     * // 開啟圖層
     * await toggleLayerVisibility('test_layer');
     *
     * // 關閉圖層
     * await toggleLayerVisibility('test_layer');
     *
     * // 在組件中使用
     * const handleLayerToggle = async (layerId) => {
     *   try {
     *     await toggleLayerVisibility(layerId);
     *     console.log('圖層切換成功');
     *   } catch (error) {
     *     console.error('圖層切換失敗:', error);
     *   }
     * };
     * ```
     *
     * 📊 載入條件 (Loading Conditions):
     * - 圖層必須存在且可訪問
     * - 圖層必須被開啟（visible: true）
     * - 圖層尚未載入（isLoaded: false）
     * - 圖層不在載入中（isLoading: false）
     *
     * ⚠️ 錯誤處理 (Error Handling):
     * - 圖層不存在：記錄錯誤並返回
     * - 載入失敗：恢復圖層狀態並記錄錯誤
     * - 網路錯誤：提供詳細的錯誤信息
     * - 數據格式錯誤：記錄錯誤並繼續執行
     *
     * 🔍 調試信息 (Debug Information):
     * - 圖層搜尋結果：記錄找到的圖層信息
     * - 載入條件檢查：記錄載入條件的評估結果
     * - 載入過程：記錄載入的開始、進度和完成
     * - 錯誤信息：記錄載入過程中的錯誤和異常
     *
     * @param {string} layerId - 要切換的圖層 ID
     * @returns {Promise<void>} - 異步操作，無返回值
     * @throws {Error} - 當圖層不存在或載入失敗時拋出錯誤
     *
     * @example
     * // 基本用法
     * await toggleLayerVisibility('test_layer');
     *
     * @since 1.0.0
     * @see {@link findLayerById} 圖層搜尋函數
     * @see {@link saveLayerState} 圖層狀態保存函數
     */
    const toggleLayerVisibility = async (layerId) => {
      const layer = findLayerById(layerId);
      if (!layer) {
        console.error(`❌ DataStore: Layer with id "${layerId}" not found.`);
        return;
      }

      // 切換可見性狀態
      layer.visible = !layer.visible;

      // 保存圖層的可見性狀態
      saveLayerState(layerId, { visible: layer.visible });

      // 如果圖層被開啟且尚未載入，則載入資料
      // 需要載入數據的情況：必須有 jsonLoader 或 geojsonLoader
      const shouldLoad =
        layer.visible &&
        !layer.isLoaded &&
        !layer.isLoading &&
        (layer.jsonLoader || layer.geojsonLoader);

      if (shouldLoad) {
        try {
          layer.isLoading = true;
          saveLayerState(layerId, { isLoading: layer.isLoading });

          let result;

          // 優先使用 jsonLoader，然後是 geojsonLoader
          // 所有數據載入都必須通過 jsonLoader 或 geojsonLoader，不允許直接調用載入函數
          if (layer.jsonLoader) {
            result = await layer.jsonLoader(layer);
          } else if (layer.geojsonLoader) {
            // 如果有 geojsonLoader，使用它載入 GeoJSON 數據
            result = await layer.geojsonLoader(layer);
          } else {
            throw new Error('圖層沒有有效的數據載入器（必須設置 jsonLoader 或 geojsonLoader）');
          }

          // 更新圖層資料
          // jsonData：保留給一般 JSON 載入/舊流程
          layer.jsonData = result.jsonData;
          // spaceNetworkGridJsonData：空間網絡網格專用資料欄位（execute_* 產物會寫入這裡）
          layer.spaceNetworkGridJsonData =
            result.spaceNetworkGridJsonData ?? layer.spaceNetworkGridJsonData;
          // layoutGridJsonData：版面網格專用資料欄位
          layer.layoutGridJsonData = result.layoutGridJsonData ?? layer.layoutGridJsonData;
          // layoutGridJsonData_Test：版面網格測試專用資料欄位
          layer.layoutGridJsonData_Test =
            result.layoutGridJsonData_Test ?? layer.layoutGridJsonData_Test;
          // layoutGridJsonData_Test2：版面網格測試2專用資料欄位
          layer.layoutGridJsonData_Test2 =
            result.layoutGridJsonData_Test2 ?? layer.layoutGridJsonData_Test2;
          // layoutGridJsonData_Test3：版面網格測試3專用資料欄位
          layer.layoutGridJsonData_Test3 =
            result.layoutGridJsonData_Test3 ?? layer.layoutGridJsonData_Test3;
          // layoutGridJsonData_Test4：版面網格測試4專用資料欄位
          layer.layoutGridJsonData_Test4 =
            result.layoutGridJsonData_Test4 ?? layer.layoutGridJsonData_Test4;
          layer.processedJsonData = result.processedJsonData;
          layer.geojsonData = result.geojsonData || null; // 如果有 geojsonData，則保存
          layer.dataTableData = result.dataTableData;
          layer.dashboardData = result.dashboardData;
          layer.layerInfoData = result.layerInfoData;

          // 生成繪製數據
          if (layer.processToDrawData && layer.processedJsonData) {
            layer.drawJsonData = layer.processToDrawData(layer.processedJsonData);
          }

          layer.isLoaded = true;

          // 保存完整的圖層狀態
          saveLayerState(layerId, {
            isLoaded: layer.isLoaded,
            jsonData: layer.jsonData,
            spaceNetworkGridJsonData: layer.spaceNetworkGridJsonData,
            layoutGridJsonData: layer.layoutGridJsonData,
            layoutGridJsonData_Test: layer.layoutGridJsonData_Test,
            layoutGridJsonData_Test2: layer.layoutGridJsonData_Test2,
            layoutGridJsonData_Test3: layer.layoutGridJsonData_Test3,
            processedJsonData: layer.processedJsonData,
            geojsonData: layer.geojsonData,
            drawJsonData: layer.drawJsonData,
            dataTableData: layer.dataTableData,
            dashboardData: layer.dashboardData,
            layerInfoData: layer.layerInfoData,
          });
        } catch (error) {
          console.error(`❌ 載入圖層 "${layer.layerName}" 失敗:`, error);
          layer.visible = false; // 載入失敗時恢復可見性狀態
          saveLayerState(layerId, { visible: false });
        } finally {
          layer.isLoading = false;
          saveLayerState(layerId, { isLoading: false });
        }
      }
    };

    // ==================== 地圖物件管理 ====================

    // 選中的地圖物件
    const selectedFeature = ref(null);

    // ==================== D3jsTab 尺寸管理 ====================

    // D3jsTab 繪製範圍尺寸
    const d3jsDimensions = ref({
      width: 0,
      height: 0,
    });

    // 更新 D3jsTab 尺寸
    const updateD3jsDimensions = (width, height) => {
      d3jsDimensions.value = {
        width: Math.round(width),
        height: Math.round(height),
      };
    };

    // 更新當前圖層計算後的網格狀態（可見行列與單元尺寸）
    const updateComputedGridState = (layerId, state) => {
      if (!layerStates.value[layerId]) {
        layerStates.value[layerId] = {};
      }
      layerStates.value[layerId].computedGridState = {
        visibleX: state.visibleX,
        visibleY: state.visibleY,
        cellWidth: Math.round(state.cellWidth),
        cellHeight: Math.round(state.cellHeight),
        updatedAt: Date.now(),
      };
    };

    // ==================== LayoutGridTab_Test2 尺寸管理 ====================

    // LayoutGridTab_Test2 當前尺寸（以 pt 為單位）
    const layoutGridTabTest2Dimensions = ref({
      x: 0, // 寬度（pt）
      y: 0, // 高度（pt）
    });

    // 更新 LayoutGridTab_Test2 尺寸
    const updateLayoutGridTabTest2Dimensions = (x, y) => {
      layoutGridTabTest2Dimensions.value = {
        x: Math.round(x),
        y: Math.round(y),
      };
    };

    // LayoutGridTab_Test2 網格最小尺寸（以 pt 為單位）
    const layoutGridTabTest2MinCellDimensions = ref({
      minWidth: 0, // 最小寬度（pt）
      minHeight: 0, // 最小高度（pt）
    });

    // 更新 LayoutGridTab_Test2 網格最小尺寸
    const updateLayoutGridTabTest2MinCellDimensions = (minWidth, minHeight) => {
      layoutGridTabTest2MinCellDimensions.value = {
        minWidth: Math.round(minWidth),
        minHeight: Math.round(minHeight),
      };
    };

    // LayoutGridTab_Test3 尺寸（以 pt 為單位）
    const layoutGridTabTest3Dimensions = ref({
      x: 0, // 寬度（pt）
      y: 0, // 高度（pt）
    });

    // 更新 LayoutGridTab_Test3 尺寸
    const updateLayoutGridTabTest3Dimensions = (x, y) => {
      layoutGridTabTest3Dimensions.value = {
        x: Math.round(x),
        y: Math.round(y),
      };
    };

    // LayoutGridTab_Test3 網格最小尺寸（以 pt 為單位）
    const layoutGridTabTest3MinCellDimensions = ref({
      minWidth: 0, // 最小寬度（pt）
      minHeight: 0, // 最小高度（pt）
    });

    // 更新 LayoutGridTab_Test3 網格最小尺寸
    const updateLayoutGridTabTest3MinCellDimensions = (minWidth, minHeight) => {
      layoutGridTabTest3MinCellDimensions.value = {
        minWidth: Math.round(minWidth),
        minHeight: Math.round(minHeight),
      };
    };

    // LayoutGridTab_Test4 當前尺寸（以 pt 為單位）
    const layoutGridTabTest4Dimensions = ref({
      x: 0, // 寬度（pt）
      y: 0, // 高度（pt）
    });

    // 更新 LayoutGridTab_Test4 尺寸
    const updateLayoutGridTabTest4Dimensions = (x, y) => {
      layoutGridTabTest4Dimensions.value = {
        x: Math.round(x),
        y: Math.round(y),
      };
    };

    // LayoutGridTab_Test4 網格最小尺寸（以 pt 為單位）
    const layoutGridTabTest4MinCellDimensions = ref({
      minWidth: 0, // 最小寬度（pt）
      minHeight: 0, // 最小高度（pt）
    });

    // ==================== LayoutGridTab_Test4 顯示控制（ControlTab 開關） ====================
    // 顯示權重（預設顯示；開啟才顯示 LayoutGridTab_Test4 的權重數字）
    const showWeightLabels = ref(true);
    const setShowWeightLabels = (value) => {
      showWeightLabels.value = !!value;
    };

    // 顯示粗細（預設不變化；開啟才依權重改變 route 粗細）
    const showRouteThickness = ref(false);
    const setShowRouteThickness = (value) => {
      showRouteThickness.value = !!value;
    };

    // 權重放大（預設等寬等高；開啟才依權重比例改變網格長寬）
    const enableWeightScaling = ref(false);
    const setEnableWeightScaling = (value) => {
      enableWeightScaling.value = !!value;
    };

    // 顯示網格（預設開啟；開啟才顯示網格線）
    const showGrid = ref(true);
    const setShowGrid = (value) => {
      showGrid.value = !!value;
    };

    // 顯示站名（預設關閉；開啟才顯示紅點車站的站名）
    const showStationNames = ref(false);
    const setShowStationNames = (value) => {
      showStationNames.value = !!value;
    };

    // 當前執行的合併操作（用於在 ControlTab 中顯示）
    const currentMergeOperation4 = ref(null);

    // 更新 LayoutGridTab_Test4 網格最小尺寸
    const updateLayoutGridTabTest4MinCellDimensions = (minWidth, minHeight) => {
      layoutGridTabTest4MinCellDimensions.value = {
        minWidth: Math.round(minWidth),
        minHeight: Math.round(minHeight),
      };
    };

    // 設置當前執行的合併操作
    const setCurrentMergeOperation4 = (operation) => {
      currentMergeOperation4.value = operation;
    };

    // 清除當前執行的合併操作
    const clearCurrentMergeOperation4 = () => {
      currentMergeOperation4.value = null;
    };

    // 自動合併閾值（預設 5pt，當網格最小寬度或高度小於此值時觸發合併）
    const autoMergeThreshold = ref(5);
    const setAutoMergeThreshold = (value) => {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        autoMergeThreshold.value = numValue;
      }
    };

    // 權重放大倍數（預設 5，開啟權重放大時使用此倍數）
    const weightScalingMultiplier = ref(5);
    const setWeightScalingMultiplier = (value) => {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        weightScalingMultiplier.value = numValue;
      }
    };

    // LayoutGridTab_Test4 當前滑鼠網格座標
    const layoutGridTabTest4MouseGridCoordinate = ref({
      x: null, // 網格 X 座標
      y: null, // 網格 Y 座標
    });

    // 更新 LayoutGridTab_Test4 滑鼠網格座標
    const updateLayoutGridTabTest4MouseGridCoordinate = (x, y) => {
      layoutGridTabTest4MouseGridCoordinate.value = {
        x: x !== null && x !== undefined ? Math.round(x) : null, // 網格座標為整數
        y: y !== null && y !== undefined ? Math.round(y) : null, // 網格座標為整數
      };
    };

    // 清除 LayoutGridTab_Test4 滑鼠網格座標
    const clearLayoutGridTabTest4MouseGridCoordinate = () => {
      layoutGridTabTest4MouseGridCoordinate.value = {
        x: null,
        y: null,
      };
    };

    // 權重縮放指數（預設 2，用於非線性縮放：值越大，最大值和最小值的差異越大）
    // 例如：指數 = 2 時，maxVal=1 -> weightedValue=1，maxVal=3 -> weightedValue=9，maxVal=5 -> weightedValue=25
    const weightScalingExponent = ref(2);
    const setWeightScalingExponent = (value) => {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        weightScalingExponent.value = numValue;
      }
    };

    const setSelectedFeature = (feature) => {
      // 記錄選取變化的log
      selectedFeature.value = feature;
    };

    const clearSelectedFeature = () => {
      selectedFeature.value = null;
    };

    /**
     * 🔄 強制重新載入圖層 (Force Reload Layer)
     *
     * 清除圖層的載入狀態並重新載入數據
     *
     * @param {string} layerId - 圖層 ID
     * @returns {Promise<void>}
     */
    const reloadLayer = async (layerId) => {
      const layer = findLayerById(layerId);
      if (!layer) {
        console.error(`❌ DataStore: Layer with id "${layerId}" not found.`);
        return;
      }

      // 清除載入狀態
      layer.isLoaded = false;
      layer.isLoading = false;

      // 如果圖層是可見的，重新載入
      if (layer.visible && (layer.jsonLoader || layer.geojsonLoader)) {
        try {
          layer.isLoading = true;
          saveLayerState(layerId, { isLoading: layer.isLoading });

          let result;
          if (layer.jsonLoader) {
            result = await layer.jsonLoader(layer);
          } else if (layer.geojsonLoader) {
            result = await layer.geojsonLoader(layer);
          }

          // 更新圖層資料
          layer.jsonData = result.jsonData;
          layer.spaceNetworkGridJsonData =
            result.spaceNetworkGridJsonData ?? layer.spaceNetworkGridJsonData;
          layer.layoutGridJsonData = result.layoutGridJsonData ?? layer.layoutGridJsonData;
          layer.layoutGridJsonData_Test =
            result.layoutGridJsonData_Test ?? layer.layoutGridJsonData_Test;
          layer.layoutGridJsonData_Test2 =
            result.layoutGridJsonData_Test2 ?? layer.layoutGridJsonData_Test2;
          layer.layoutGridJsonData_Test3 =
            result.layoutGridJsonData_Test3 ?? layer.layoutGridJsonData_Test3;
          layer.layoutGridJsonData_Test4 =
            result.layoutGridJsonData_Test4 ?? layer.layoutGridJsonData_Test4;
          layer.geojsonData = result.geojsonData ?? layer.geojsonData;
          layer.processedJsonData = result.processedJsonData ?? layer.processedJsonData;
          layer.drawJsonData = result.drawJsonData ?? layer.drawJsonData;
          layer.dashboardData = result.dashboardData ?? layer.dashboardData;
          layer.dataTableData = result.dataTableData ?? layer.dataTableData;
          layer.layerInfoData = result.layerInfoData ?? layer.layerInfoData;

          layer.isLoaded = true;
          layer.isLoading = false;
          saveLayerState(layerId, {
            isLoaded: layer.isLoaded,
            isLoading: layer.isLoading,
          });

          console.log(`✅ DataStore: Layer "${layerId}" reloaded successfully.`);
        } catch (error) {
          console.error(`❌ DataStore: Failed to reload layer "${layerId}":`, error);
          layer.isLoading = false;
          saveLayerState(layerId, { isLoading: layer.isLoading });
        }
      }
    };

    /**
     * 根據圖層ID找到對應的群組名稱
     * @param {string} layerId - 圖層ID
     * @returns {string|null} - 群組名稱，如果找不到則返回null
     */
    const findGroupNameByLayerId = (layerId) => {
      for (const mainGroup of layers.value) {
        for (const layer of mainGroup.groupLayers) {
          if (layer.layerId === layerId) {
            return mainGroup.groupName;
          }
        }
      }
      return null;
    };

    // ==================== 返回的狀態和方法 ====================

    return {
      layers,
      findLayerById, // 根據 ID 尋找圖層
      getAllLayers, // 獲取所有圖層的扁平陣列
      findGroupNameByLayerId, // 根據圖層ID找到對應的群組名稱
      toggleLayerVisibility,
      reloadLayer, // 強制重新載入圖層
      selectedFeature,
      setSelectedFeature,
      clearSelectedFeature,
      visibleLayers: computed(() => getAllLayers().filter((layer) => layer.visible)),
      loadingLayers: computed(() => getAllLayers().filter((layer) => layer.isLoading)),
      // 狀態管理相關函數
      layerStates,
      saveLayerState,
      // D3jsTab 尺寸管理
      d3jsDimensions,
      updateD3jsDimensions,
      updateComputedGridState,
      // LayoutGridTab_Test2 尺寸管理
      layoutGridTabTest2Dimensions,
      updateLayoutGridTabTest2Dimensions,
      layoutGridTabTest2MinCellDimensions,
      updateLayoutGridTabTest2MinCellDimensions,
      // LayoutGridTab_Test3 尺寸管理
      layoutGridTabTest3Dimensions,
      updateLayoutGridTabTest3Dimensions,
      layoutGridTabTest3MinCellDimensions,
      updateLayoutGridTabTest3MinCellDimensions,
      // LayoutGridTab_Test4 尺寸管理
      layoutGridTabTest4Dimensions,
      updateLayoutGridTabTest4Dimensions,
      layoutGridTabTest4MinCellDimensions,
      updateLayoutGridTabTest4MinCellDimensions,
      // LayoutGridTab_Test4 滑鼠網格座標
      layoutGridTabTest4MouseGridCoordinate,
      updateLayoutGridTabTest4MouseGridCoordinate,
      clearLayoutGridTabTest4MouseGridCoordinate,
      // LayoutGridTab_Test4 開關
      showWeightLabels,
      setShowWeightLabels,
      showRouteThickness,
      setShowRouteThickness,
      enableWeightScaling,
      setEnableWeightScaling,
      showGrid,
      setShowGrid,
      showStationNames,
      setShowStationNames,
      currentMergeOperation4,
      setCurrentMergeOperation4,
      clearCurrentMergeOperation4,
      // 自動合併閾值
      autoMergeThreshold,
      setAutoMergeThreshold,
      // 權重縮放指數
      weightScalingExponent,
      setWeightScalingExponent,
      // 權重放大倍數
      weightScalingMultiplier,
      setWeightScalingMultiplier,
    };
  },
  {
    persist: true,
  }
);
