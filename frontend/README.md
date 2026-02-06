# 🗺️ AutoQ - 網格示意圖響應式網站

[![Vue.js](https://img.shields.io/badge/Vue.js-3.2.13-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.8.0-F9A03C?style=flat-square&logo=d3.js)](https://d3js.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.0-7952B3?style=flat-square&logo=bootstrap)](https://getbootstrap.com/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1.0-FFD859?style=flat-square&logo=pinia)](https://pinia.vuejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> 基於 Vue 3 和 D3.js 的現代化網格示意圖響應式網站，專為網格數據視覺化和互動式展示而設計。所有程式碼均包含詳細的中文註解，便於學習和維護。

## 📋 目錄

- [專案概述](#專案概述)
- [主要功能](#主要功能)
- [技術棧](#技術棧)
- [快速開始](#快速開始)
- [專案結構](#專案結構)
- [開發指南](#開發指南)
- [數據格式](#數據格式)
- [API 文檔](#api-文檔)
- [故障排除](#故障排除)
- [貢獻指南](#貢獻指南)
- [授權條款](#授權條款)

## 專案概述

AutoQ 是一個現代化的響應式網格示意圖展示平台，結合 Vue 3 的前端技術和 D3.js 的視覺化能力，提供完整的網格數據視覺化解決方案。

### 核心特色

- **🎨 現代化設計**：採用 Bootstrap 5 響應式框架
- **⚡ 高性能**：使用 Vue 3 Composition API 和 Pinia 狀態管理
- **📱 完全響應式**：支援桌面、平板、手機等各種設備
- **📊 強大的視覺化**：整合 D3.js 提供豐富的網格數據視覺化
- **🔧 模組化架構**：採用組件化設計，易於維護和擴展
- **📝 詳細註解**：所有程式碼均包含完整的中文 JSDoc 註解
- **🎓 易於學習**：適合學習 Vue 3、D3.js 和現代前端開發

### 應用場景

- 網格數據視覺化
- 空間分析與數據展示
- 學術研究與教育培訓
- 數據分析與統計展示

## 主要功能

### 🗺️ 圖層管理系統

- **圖層支援**：網格示意圖測試圖層
- **動態載入**：按需載入圖層數據
- **狀態追蹤**：完整的圖層狀態管理

### 📊 數據視覺化

- **網格縮放視覺化**：互動式網格縮放展示
- **D3.js 整合**：互動式圖表、動畫效果、自定義渲染
- **互動功能**：要素選擇、懸停提示、縮放平移

### 📱 響應式設計

- **多設備適配**：
  - 桌面版 (≥1200px)：四面板佈局
  - 平板版 (768-1199px)：上下兩層佈局
  - 手機版 (<768px)：單欄佈局
- **觸控支援**：手勢識別、鍵盤導航、無障礙設計

### 📊 數據分析

- **統計摘要**：實時統計、數據摘要、性能指標
- **表格功能**：多圖層表格、動態欄位、排序篩選、分頁顯示
- **數據查看**：原始 JSON 數據、處理後 JSON 數據、繪製數據

## 技術棧

### 前端框架
- **Vue.js 3.2.13** - 現代化前端框架，使用 Composition API
- **Vue Router 4.5.1** - 單頁應用路由管理
- **Pinia 2.1.0** - Vue 3 官方推薦的狀態管理庫

### 視覺化庫
- **D3.js 7.8.0** - 數據驅動文檔視覺化庫
- **Bootstrap 5.3.0** - 響應式 UI 框架
- **Font Awesome 6.7.2** - 圖示字體庫

### 開發工具
- **Vue CLI 5.0.8** - 專案腳手架和構建工具
- **Vite** - 快速的前端構建工具
- **ESLint** - 代碼品質檢查
- **Prettier** - 代碼格式化

### 瀏覽器支援
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 快速開始

### 環境要求

- **Node.js** >= 14.0.0 (推薦 16.0.0+)
- **npm** >= 6.0.0 或 **yarn** >= 1.22.0

### 安裝步驟

1. **克隆專案**

```bash
git clone https://github.com/kevin7261/autoq.git
cd autoq
```

2. **安裝依賴**

```bash
npm install
# 或
yarn install
```

3. **啟動開發服務器**

```bash
npm run serve
# 或
yarn serve
```

開發服務器將在 `http://localhost:8080` 啟動。

### 建置生產版本

```bash
npm run build
```

### 部署到 GitHub Pages

```bash
npm run deploy
```

部署完成後，應用程式將在 `https://kevin7261.github.io/autoq` 上可用。

## 專案結構

```
autoq/
├── public/                 # 靜態資源
│   ├── data/              # 數據文件
│   │   └── test/          # 測試數據
│   └── index.html         # 入口 HTML
├── src/                   # 源代碼
│   ├── assets/           # 靜態資源（CSS、圖片）
│   ├── components/        # 可重用組件
│   │   ├── LoadingOverlay.vue
│   │   └── DetailItem.vue
│   ├── stores/           # Pinia 狀態管理
│   │   ├── dataStore.js   # 主要數據存儲
│   │   └── defineStore.js
│   ├── tabs/             # 分頁組件
│   │   ├── GridScalingTab.vue      # 網格縮放視覺化
│   │   ├── DashboardTab.vue      # 儀表板
│   │   ├── DataTableTab.vue        # 數據表格
│   │   ├── ProcessedJsonDataTab.vue # 處理後 JSON 數據
│   │   ├── JsonDataTab.vue         # 原始 JSON 數據
│   │   ├── DrawJsonDataTab.vue     # 繪製數據
│   │   ├── LayersTab.vue           # 圖層列表
│   │   ├── PropertiesTab.vue       # 屬性資訊
│   │   ├── LayerInfoTab.vue         # 圖層資訊
│   │   └── ControlTab.vue           # 操作控制
│   ├── utils/           # 工具函數
│   │   ├── dataProcessor.js  # 數據處理核心
│   │   ├── gridMergeReduce.js
│   │   ├── utils.js
│   │   └── dataExecute/     # 數據執行模組
│   ├── views/           # 頁面組件
│   │   ├── HomeView.vue
│   │   ├── LeftView.vue
│   │   ├── MiddleView.vue
│   │   ├── UpperView.vue
│   │   ├── BottomView.vue
│   │   ├── RightView.vue
│   │   └── ResponsiveLowerView.vue
│   ├── router/          # 路由配置
│   ├── App.vue          # 根組件
│   └── main.js          # 入口文件
├── docs/                # 文檔
│   ├── GRID_VALUES_DOCUMENTATION.md
│   ├── PACKAGE_JSON_DOCUMENTATION.md
│   └── QUICK_START_GRID_VALUES.md
├── package.json         # 專案配置
└── README.md           # 專案說明
```

### 核心目錄說明

#### `/src/components/`
可重用的 Vue 組件，提供通用的 UI 功能。

#### `/src/stores/`
Pinia 狀態管理，集中管理應用程式狀態，包含完整的 JSDoc 註解。

#### `/src/tabs/`
分頁組件，提供不同功能模組的界面，所有組件均包含詳細註解。

#### `/src/utils/`
工具函數，提供通用的功能和數據處理，包含最詳細的函數文檔。

#### `/src/views/`
頁面組件，定義主要的應用程式界面，包含完整的佈局說明。

## 開發指南

### 代碼風格

```bash
# 檢查代碼風格
npm run lint

# 自動修復代碼風格問題
npm run lint:fix

# 格式化代碼
npm run prettier

# 完整格式化（格式化 + 修復）
npm run format
```

### 組件開發規範

1. **選擇適當的目錄**
   - 通用組件 → `/src/components/`
   - 分頁組件 → `/src/tabs/`
   - 頁面組件 → `/src/views/`

2. **使用 Vue 3 Composition API**

```vue
<script>
export default {
  name: 'ComponentName',
  setup() {
    // Composition API 邏輯
    return {
      // 返回給模板的響應式數據和方法
    };
  },
};
</script>
```

3. **添加完整的 JSDoc 註解**

```javascript
/**
 * 函數描述
 * @param {string} param1 - 參數描述
 * @returns {Object} 返回值描述
 * @example
 * const result = exampleFunction('param');
 */
function exampleFunction(param1) {
  // 函數實現
}
```

### 狀態管理

使用 Pinia 進行狀態管理：

```javascript
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();

// 切換圖層可見性
await dataStore.toggleLayerVisibility('test_layer');

// 獲取可見圖層
const visibleLayers = computed(() =>
  dataStore.getAllLayers().filter((layer) => layer.visible)
);
```

### 數據載入

使用 `dataProcessor.js` 載入和處理數據：

```javascript
import {
  loadGridSchematicJson,
  processGridToDrawData,
} from '@/utils/dataProcessor';

// 載入網格示意圖
const layerData = await loadGridSchematicJson({
  jsonFileName: 'test/test.json',
});
```

## 數據格式

### 網格示意圖數據格式

```json
{
  "x": 10,
  "y": 10
}
```

- `x`: 網格的水平節點數量
- `y`: 網格的垂直節點數量

### 測試數據位置

測試數據位於 `public/data/test/` 目錄下：
- `test.json` - 主要測試數據
- `test_small_grid.json` - 小型網格測試數據

更多數據格式說明請參考 `docs/` 目錄下的文檔。

## API 文檔

### 數據存儲 API

#### `useDataStore()`

Pinia store 實例，提供圖層管理和狀態控制功能。

##### 主要方法

| 方法 | 參數 | 返回值 | 描述 |
|------|------|--------|------|
| `toggleLayerVisibility` | `layerId: string` | `Promise<void>` | 切換圖層可見性 |
| `findLayerById` | `layerId: string` | `Object\|null` | 根據 ID 搜尋圖層 |
| `getAllLayers` | - | `Array` | 獲取所有圖層 |
| `getAllLayers` | - | `Array` | 獲取所有圖層 |
| `setSelectedFeature` | `feature: Object` | `void` | 設定選中要素 |
| `clearSelectedFeature` | - | `void` | 清除選中要素 |
| `reloadLayer` | `layerId: string` | `Promise<void>` | 重新載入圖層 |
| `findGroupNameByLayerId` | `layerId: string` | `string\|null` | 根據圖層 ID 查找組名 |

##### 使用範例

```javascript
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();

// 切換圖層可見性
await dataStore.toggleLayerVisibility('test_layer');

// 設定選中的要素
dataStore.setSelectedFeature({
  id: 'feature-1',
  name: '測試要素',
  properties: { type: 'grid' },
});
```

### 數據處理 API

#### `loadGridSchematicJson(layer)`

載入網格示意圖 JSON 數據。

**參數：**
- `layer` - 圖層配置對象，包含 `jsonFileName` 屬性

**返回：**
- `Promise<Object>` - 包含處理後數據的對象

#### `processGridToDrawData(processedJsonData)`

處理網格數據為繪製數據。

**參數：**
- `processedJsonData` - 處理後的 JSON 數據

**返回：**
- `Object` - 繪製數據對象

## 故障排除

### 常見問題

#### 1. 數據載入失敗

**問題：** 圖層數據無法載入或顯示錯誤

**解決方案：**
1. 檢查數據文件路徑是否正確（應位於 `public/data/test/`）
2. 確認數據文件格式是否符合要求
3. 查看瀏覽器控制台的錯誤信息
4. 檢查網路連接和防火牆設定

#### 2. 響應式佈局問題

**問題：** 在不同設備上佈局顯示異常

**解決方案：**
1. 檢查 CSS 媒體查詢設定
2. 確認 Bootstrap 斷點配置
3. 測試不同螢幕尺寸
4. 檢查組件的響應式邏輯

#### 3. D3.js 視覺化問題

**問題：** 圖表無法正常顯示或互動異常

**解決方案：**
1. 檢查容器尺寸設定
2. 確認數據格式正確
3. 查看 D3.js 版本兼容性
4. 檢查瀏覽器控制台的錯誤信息

#### 4. 狀態管理問題

**問題：** 組件狀態不同步或更新異常

**解決方案：**
1. 檢查 Pinia store 配置
2. 確認響應式數據綁定
3. 檢查組件生命週期
4. 使用 Vue DevTools 調試

### 調試工具

- **瀏覽器開發者工具**：Console、Network、Elements、Sources
- **Vue DevTools**：查看組件狀態和 props
- **日誌系統**：使用 `console.log`、`console.warn`、`console.error`

## 貢獻指南

### 如何貢獻

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 代碼規範

- 遵循現有的代碼風格
- **必須添加完整的 JSDoc 註解**（這是本專案的重要特色）
- 確保代碼通過 ESLint 檢查
- 更新相關文檔

### 提交規範

使用語義化提交信息：

```
feat: 添加新功能
fix: 修復問題
docs: 更新文檔
style: 代碼格式調整
refactor: 代碼重構
test: 添加測試
chore: 構建過程或輔助工具的變動
```

### 代碼註解規範

本專案特別重視代碼註解品質，所有貢獻都必須遵循以下規範：

#### 必須包含的註解元素

1. **檔案層級註解**：模組功能說明、主要特點、技術棧說明
2. **函數/方法註解**：功能描述、參數說明、返回值、使用範例
3. **組件註解**：組件用途、Props、Events、使用範例
4. **複雜邏輯註解**：演算法說明、實現原因、效能考量

#### 註解品質標準

✅ **良好的註解範例**：

```javascript
/**
 * 📊 計算圖層統計數據 (Calculate Layer Statistics)
 *
 * 根據圖層的節點數據計算各種統計信息，包括最小值、最大值、平均值等。
 *
 * @param {Array<Object>} nodes - 節點數據陣列
 * @param {string} [field='value'] - 要統計的欄位名稱
 * @returns {Object} 統計結果對象
 * @returns {number} returns.min - 最小值
 * @returns {number} returns.max - 最大值
 * @returns {number} returns.avg - 平均值
 *
 * @example
 * const stats = calculateLayerStatistics(layerNodes);
 * console.log(`平均值: ${stats.avg}`);
 */
function calculateLayerStatistics(nodes, field = 'value') {
  // 實現...
}
```

❌ **不良的註解範例**：

```javascript
// 計算統計
function calc(data) {
  // 實現...
}
```

## 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 文件。

### MIT 授權條款摘要

- ✅ **商業使用**：允許商業用途
- ✅ **修改**：允許修改和分發
- ✅ **分發**：允許分發
- ✅ **私人使用**：允許私人使用
- ❌ **責任**：不提供任何責任擔保
- ❌ **保證**：不提供任何保證

## 聯絡資訊

- **作者：** Kevin Cheng
- **電子郵件：** kevin7261@gmail.com
- **GitHub：** [@kevin7261](https://github.com/kevin7261)
- **專案網址：** [https://kevin7261.github.io/autoq](https://kevin7261.github.io/autoq)

## 致謝

感謝以下開源專案和工具的支持：

- [Vue.js](https://vuejs.org/) - 優秀的前端框架
- [D3.js](https://d3js.org/) - 強大的數據視覺化庫
- [Bootstrap](https://getbootstrap.com/) - 響應式 UI 框架
- [Pinia](https://pinia.vuejs.org/) - 現代化狀態管理
- [Font Awesome](https://fontawesome.com/) - 豐富的圖示庫
- [GitHub Pages](https://pages.github.com/) - 免費的靜態網站託管

---

**⭐ 如果這個專案對您有幫助，請給它一個星標！**

**📧 如有任何問題或建議，歡迎透過 GitHub Issues 或電子郵件聯繫我們。**
