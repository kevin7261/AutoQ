/**
 * 🛠️ 通用工具函數模組 (Common Utility Module)
 *
 * 功能說明 (Features):
 * 1. 🎨 圖標管理系統：統一管理應用程式中的所有圖標
 * 2. 🌐 多語言支援：提供中文和英文的圖標文字對應
 * 3. 🔧 圖標工具函數：提供便捷的圖標獲取和渲染方法
 * 4. 📱 響應式圖標：支援不同尺寸和樣式的圖標顯示
 * 5. 🎯 類型安全：提供完整的 TypeScript 類型定義
 *
 * 技術特點 (Technical Features):
 * - 集中式圖標管理，便於維護和更新
 * - 支援 Font Awesome 圖標庫
 * - 提供 HTML 和 CSS 類名兩種輸出格式
 * - 支援自定義 CSS 類名擴展
 *
 * 使用場景 (Use Cases):
 * - 表格排序圖標
 * - 載入狀態指示器
 * - 功能按鈕圖標
 * - 狀態指示圖標
 *
 * @file utils.js
 * @version 2.0.0
 * @author Kevin Cheng
 * @since 1.0.0
 */

// ==================== 🛠️ 圖標和介面輔助函數 (Icon and UI Helper Functions) ====================

/**
 * 🎨 圖標映射表 (Icon Mapping Table)
 *
 * 統一管理系統中使用的所有圖標，支援多語言和 FontAwesome 類名
 * 每個圖標包含中文名稱、英文名稱和對應的 FontAwesome 類名
 *
 * 設計原則：
 * - 使用語義化的鍵名，便於理解和維護
 * - 提供完整的中英文對照
 * - 統一使用 FontAwesome 5 圖標庫
 * - 保持圖標風格的一致性
 *
 * @type {Object.<string, {zh: string, en: string, icon: string}>}
 * @description 圖標鍵名對應到包含中英文名稱和 HTML 標籤的物件
 *
 * @example
 * // 圖標結構範例
 * {
 *   chart_line: {
 *     zh: '線圖',
 *     en: 'Line Chart',
 *     icon: '<i class="fas fa-chart-line"></i>'
 *   }
 * }
 */
export const ICONS = {
  // 圖表相關圖標
  chart_line: { zh: '線圖', en: 'Line Chart', icon: '<i class="fas fa-chart-line"></i>' },
  chart_bar: { zh: '長條圖', en: 'Bar Chart', icon: '<i class="fas fa-chart-bar"></i>' },

  // 載入狀態圖標
  spinner: { zh: '載入中', en: 'Loading', icon: '<i class="fas fa-spinner"></i>' },

  // 排序相關圖標
  sort: { zh: '排序', en: 'Sort', icon: '<i class="fas fa-sort"></i>' },
  sort_up: { zh: '升序', en: 'Sort Ascending', icon: '<i class="fas fa-sort-up"></i>' },
  sort_down: { zh: '降序', en: 'Sort Descending', icon: '<i class="fas fa-sort-down"></i>' },

  // 資訊和狀態圖標
  info_circle: { zh: '資訊', en: 'Information', icon: '<i class="fas fa-info-circle"></i>' },
  location_dot: { zh: '位置', en: 'Location', icon: '<i class="fa-solid fa-location-dot"></i>' },
  map: { zh: '地圖', en: 'Map', icon: '<i class="fas fa-map"></i>' },
  map_marked: { zh: '標記地圖', en: 'Marked Map', icon: '<i class="fas fa-map-marked-alt"></i>' },

  // 圖層和資料相關圖標
  layer_group: { zh: '圖層', en: 'Layer Group', icon: '<i class="fas fa-layer-group"></i>' },
  table: { zh: '表格', en: 'Table', icon: '<i class="fas fa-table"></i>' },
  json_data: { zh: '原始數據', en: 'Raw Data', icon: '<i class="fas fa-database"></i>' },
  draw_data: { zh: '繪製數據', en: 'Draw Data', icon: '<i class="fas fa-palette"></i>' },
  code: { zh: '代碼', en: 'Code', icon: '<i class="fas fa-code"></i>' },

  // 網格和網絡相關圖標
  project_diagram: { zh: '網絡圖', en: 'Network Diagram', icon: '<i class="fas fa-project-diagram"></i>' },
  th: { zh: '網格', en: 'Grid', icon: '<i class="fas fa-th"></i>' },
  file_code: { zh: '代碼文件', en: 'Code File', icon: '<i class="fas fa-file-code"></i>' },

  // 工作相關圖標
  work: { zh: '工作', en: 'Work', icon: '<i class="fas fa-briefcase"></i>' },
};

/**
 * 🎯 根據鍵名獲取圖標資訊 (Get Icon Information by Key)
 *
 * 從全域圖標庫中獲取指定鍵名的圖標資訊，包括文字和圖標類名
 * 提供多語言支援和錯誤處理機制
 *
 * 功能說明：
 * - 支援中文和英文兩種語言
 * - 自動提取 FontAwesome 類名
 * - 提供預設的錯誤圖標
 * - 返回標準化的圖標資訊物件
 *
 * @param {string} iconKey - 圖標鍵名，必須在 ICONS 物件中定義
 * @param {string} [lang='zh'] - 語言代碼，支援 'zh'（中文）和 'en'（英文）
 * @returns {Object} 包含文字和圖標類名的物件
 * @returns {string} returns.text - 圖標的文字描述
 * @returns {string} returns.icon - FontAwesome 圖標類名
 *
 * @description 用於在組件中獲取圖標的文字和類名，支援多語言顯示
 *
 * @example
 * // 獲取線圖圖標的中文資訊
 * const chartIcon = getIcon('chart_line');
 * // 返回: { text: '線圖', icon: 'fas fa-chart-line' }
 *
 * // 獲取線圖圖標的英文資訊
 * const chartIconEn = getIcon('chart_line', 'en');
 * // 返回: { text: 'Line Chart', icon: 'fas fa-chart-line' }
 *
 * // 獲取不存在的圖標（會返回預設錯誤圖標）
 * const unknownIcon = getIcon('unknown_icon');
 * // 返回: { text: 'unknown_icon', icon: 'fas fa-question-circle' }
 */
export function getIcon(iconKey, lang = 'zh') {
  const iconInfo = ICONS[iconKey];
  if (!iconInfo) {
    // console.warn(`找不到圖標定義: ${iconKey}`);
    return {
      text: iconKey,
      icon: 'fas fa-question-circle',
    };
  }

  // 從完整的 HTML 標籤中提取 class 名稱
  const classMatch = iconInfo.icon.match(/class="([^"]+)"/);
  const iconClass = classMatch ? classMatch[1] : 'fas fa-question-circle';

  return {
    text: iconInfo[lang] || iconInfo.zh,
    icon: iconClass,
  };
}

/**
 * 🎨 根據鍵名獲取完整的圖標 HTML (Get Complete Icon HTML by Key)
 *
 * 從全域圖標庫中獲取指定鍵名的完整圖標 HTML 標籤
 * 支援自定義 CSS 類名擴展，用於添加動畫效果或樣式修飾
 *
 * 功能說明：
 * - 返回完整的 HTML 標籤，可直接插入 DOM
 * - 支援額外的 CSS 類名添加
 * - 提供錯誤處理和預設圖標
 * - 保持 HTML 標籤的完整性
 *
 * @param {string} iconKey - 圖標鍵名，必須在 ICONS 物件中定義
 * @param {string} [additionalClasses=''] - 額外的 CSS 類名，會添加到現有的 class 屬性中
 * @returns {string} 完整的圖標 HTML 標籤
 *
 * @description 用於在模板中直接渲染圖標 HTML，支援樣式擴展
 *
 * @example
 * // 獲取線圖圖標的完整 HTML
 * const chartIconHtml = getIconHtml('chart_line');
 * // 返回: '<i class="fas fa-chart-line"></i>'
 *
 * // 獲取帶有額外類名的載入圖標 HTML
 * const spinnerHtml = getIconHtml('spinner', 'fa-spin me-2');
 * // 返回: '<i class="fas fa-spinner fa-spin me-2"></i>'
 *
 * // 獲取帶有自定義樣式的圖標 HTML
 * const customIcon = getIconHtml('info_circle', 'text-primary fs-4');
 * // 返回: '<i class="fas fa-info-circle text-primary fs-4"></i>'
 *
 * // 獲取不存在的圖標（會返回預設錯誤圖標）
 * const unknownIcon = getIconHtml('unknown_icon', 'text-danger');
 * // 返回: '<i class="fas fa-question-circle text-danger"></i>'
 */
export function getIconHtml(iconKey, additionalClasses = '') {
  const iconInfo = ICONS[iconKey];
  if (!iconInfo) {
    // console.warn(`找不到圖標定義: ${iconKey}`);
    return `<i class="fas fa-question-circle${additionalClasses ? ' ' + additionalClasses : ''}"></i>`;
  }

  // 如果有額外的類名，則插入到現有的 class 中
  if (additionalClasses) {
    return iconInfo.icon.replace(/class="([^"]+)"/, `class="$1 ${additionalClasses}"`);
  }

  return iconInfo.icon;
}

// ==================== 📋 剪貼簿操作工具函數 (Clipboard Utility Functions) ====================

/**
 * 📋 複製文字到剪貼簿 (Copy Text to Clipboard)
 *
 * 提供統一的剪貼簿複製功能，支援錯誤處理和成功回調
 * 使用現代瀏覽器的 Clipboard API，並提供備用方案
 *
 * 功能說明：
 * - 支援現代瀏覽器的 navigator.clipboard API
 * - 自動格式化 JSON 數據（如果傳入物件）
 * - 提供完整的錯誤處理機制
 * - 支援自定義成功和失敗訊息
 * - 自動清除狀態訊息（可選）
 *
 * @param {string|Object} data - 要複製的資料，可以是字串或物件
 * @param {Object} [options] - 選項配置
 * @param {string} [options.successMessage='✅ 已複製到剪貼簿'] - 成功訊息
 * @param {string} [options.errorMessage='❌ 複製失敗，請手動複製'] - 錯誤訊息
 * @param {number} [options.clearDelay=3000] - 清除訊息的延遲時間（毫秒），0 表示不清除
 * @param {Function} [options.onSuccess] - 成功回調函數
 * @param {Function} [options.onError] - 錯誤回調函數
 * @returns {Promise<Object>} 複製結果物件
 * @returns {boolean} returns.success - 是否複製成功
 * @returns {string} returns.message - 狀態訊息
 * @returns {string} returns.data - 實際複製的資料
 *
 * @description 用於複製各種資料到剪貼簿，特別適用於 JSON 數據複製
 *
 * @example
 * // 複製簡單文字
 * const result = await copyToClipboard('Hello World');
 * console.log(result.message); // '✅ 已複製到剪貼簿'
 *
 * // 複製 JSON 物件（自動格式化）
 * const jsonData = { name: 'test', value: 123 };
 * const result = await copyToClipboard(jsonData);
 *
 * // 自定義訊息和回調
 * const result = await copyToClipboard(data, {
 *   successMessage: '✅ 數據已複製',
 *   errorMessage: '❌ 複製失敗',
 *   clearDelay: 5000,
 *   onSuccess: (message) => console.log('成功:', message),
 *   onError: (error) => console.error('失敗:', error)
 * });
 */
export async function copyToClipboard(data, options = {}) {
  const {
    successMessage = '✅ 已複製到剪貼簿',
    errorMessage = '❌ 複製失敗，請手動複製',
    onSuccess,
    onError,
  } = options;

  try {
    // 格式化資料
    let textToCopy;
    if (typeof data === 'string') {
      textToCopy = data;
    } else if (typeof data === 'object' && data !== null) {
      textToCopy = JSON.stringify(data, null, 2);
    } else {
      textToCopy = String(data);
    }

    // 檢查是否有可複製的資料
    if (!textToCopy || textToCopy.trim() === '') {
      const errorResult = {
        success: false,
        message: '❌ 沒有可複製的資料',
        data: textToCopy,
      };
      if (onError) onError(new Error('沒有可複製的資料'));
      return errorResult;
    }

    // 嘗試使用 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // 備用方案：使用傳統的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (!successful) {
        throw new Error('document.execCommand 複製失敗');
      }
    }

    const successResult = {
      success: true,
      message: successMessage,
      data: textToCopy,
    };

    if (onSuccess) onSuccess(successResult);
    return successResult;
  } catch (error) {
    console.error('複製失敗:', error);
    const errorResult = {
      success: false,
      message: errorMessage,
      data: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    };
    if (onError) onError(error);
    return errorResult;
  }
}

/**
 * 📋 建立帶狀態管理的複製功能 (Create Copy Function with State Management)
 *
 * 建立一個包含狀態管理的複製功能，適用於 Vue 組件
 * 自動處理狀態訊息的生命週期管理
 *
 * 功能說明：
 * - 自動管理複製狀態訊息
 * - 支援自動清除狀態訊息
 * - 提供 Vue 響應式狀態管理
 * - 適用於組件中的複製按鈕
 *
 * @param {Object} stateRef - Vue 響應式狀態引用
 * @param {string} [stateKey='copyMessage'] - 狀態鍵名
 * @param {Object} [options] - 複製選項
 * @returns {Function} 複製函數
 *
 * @example
 * // 在 Vue 組件中使用
 * import { ref } from 'vue';
 * import { createCopyFunction } from '@/utils/utils.js';
 *
 * const copyMessage = ref('');
 * const copyFunction = createCopyFunction({ copyMessage });
 *
 * // 使用複製功能
 * await copyFunction(jsonData);
 */
export function createCopyFunction(stateRef, stateKey = 'copyMessage', options = {}) {
  return async (data) => {
    const result = await copyToClipboard(data, {
      ...options,
      onSuccess: (result) => {
        stateRef[stateKey] = result.message;
        if (options.clearDelay !== 0) {
          setTimeout(() => {
            stateRef[stateKey] = '';
          }, options.clearDelay || 3000);
        }
        if (options.onSuccess) options.onSuccess(result);
      },
      onError: (error) => {
        stateRef[stateKey] = error.message || '❌ 複製失敗';
        if (options.clearDelay !== 0) {
          setTimeout(() => {
            stateRef[stateKey] = '';
          }, options.clearDelay || 3000);
        }
        if (options.onError) options.onError(error);
      },
    });
    return result;
  };
}
