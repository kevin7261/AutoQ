/**
 * 📊 Google Sheets 工具模組 (Google Sheets Utility Module)
 *
 * 功能說明 (Features):
 * 1. 📝 寫入題目到 Google Sheets：將生成的題目自動記錄到 Google Sheets
 * 2. 🔗 Google Apps Script 整合：使用 Google Apps Script Web App 作為中間層
 * 3. ⚙️ 配置管理：支援自定義 Google Sheets URL 和配置
 * 4. 🛡️ 錯誤處理：完整的錯誤捕獲和處理機制
 *
 * 技術特點 (Technical Features):
 * - 使用 Google Apps Script Web App 方式，無需 OAuth
 * - 支援異步操作和 Promise
 * - 提供完整的錯誤處理
 * - 支援自定義配置
 *
 * 使用前準備 (Prerequisites):
 * 1. 創建 Google Apps Script 專案
 * 2. 部署為 Web App（執行身份：我，權限：任何人）
 * 3. 將 Web App URL 配置到 GOOGLE_SHEETS_WEB_APP_URL
 *
 * Google Apps Script 範例代碼：
 * ```javascript
 * function doPost(e) {
 *   try {
 *     const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getActiveSheet();
 *     const data = JSON.parse(e.postData.contents);
 *     
 *     // 如果第一行是空的，添加標題
 *     if (sheet.getLastRow() === 0) {
 *       sheet.appendRow(['時間', '題目類型', '難度', '題目內容', '提示', '目標檔案']);
 *     }
 *     
 *     // 添加數據
 *     sheet.appendRow([
 *       new Date(),
 *       data.qtype || '',
 *       data.level || '',
 *       data.question_content || '',
 *       data.hint || '',
 *       data.target_filename || ''
 *     ]);
 *     
 *     return ContentService.createTextOutput(JSON.stringify({success: true}))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } catch (error) {
 *     return ContentService.createTextOutput(JSON.stringify({
 *       success: false,
 *       error: error.toString()
 *     })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * ```
 *
 * @file googleSheets.js
 * @version 1.0.0
 * @author Kevin Cheng
 * @since 1.0.0
 */

// ==================== ⚙️ 配置常數 (Configuration Constants) ====================

/**
 * Google Sheets Web App URL
 * 
 * 從 Google Sheets URL 中提取 Sheet ID，然後創建對應的 Google Apps Script Web App URL
 * 
 * 使用方式：
 * 1. 打開 Google Sheets: https://docs.google.com/spreadsheets/d/1JTrp2bRtwkv0pgTt9pIvmcmYRkEzgMCXA9tSdOAbc6M/edit
 * 2. 提取 Sheet ID: 1JTrp2bRtwkv0pgTt9pIvmcmYRkEzgMCXA9tSdOAbc6M
 * 3. 創建 Google Apps Script 專案並部署為 Web App
 * 4. 將 Web App URL 設置到這裡
 * 
 * 如果沒有設置，將使用 Google Sheets API 直接寫入（需要配置）
 */
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzswsKdfsh5oI1G2Ztjl6xBBgar2xJ0HYzW0z1LXsX0fsTQgtMJU_2XbWCv78Fbfx_B/exec';

/**
 * Google Sheets ID（從 URL 中提取）
 * 格式：https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
 */
const GOOGLE_SHEET_ID = '1JTrp2bRtwkv0pgTt9pIvmcmYRkEzgMCXA9tSdOAbc6M';

/**
 * 是否啟用 Google Sheets 寫入功能
 */
const ENABLE_GOOGLE_SHEETS = true;

// ==================== 📝 寫入 Google Sheets 函數 ====================

/**
 * 📝 寫入題目到 Google Sheets (Write Question to Google Sheets)
 *
 * 將生成的題目數據寫入到指定的 Google Sheets
 * 支援兩種方式：
 * 1. 通過 Google Apps Script Web App（推薦，無需 OAuth）
 * 2. 直接使用 Google Sheets API（需要配置服務帳號）
 *
 * @param {Object} questionData - 題目數據物件
 * @param {string} questionData.question_content - 題目內容
 * @param {string} [questionData.hint] - 提示
 * @param {string} [questionData.target_filename] - 目標檔案名稱
 * @param {string} [questionData.qtype] - 題目類型（如：實作題）
 * @param {string} [questionData.level] - 難度等級（如：進階）
 * @param {Object} [options] - 選項配置
 * @param {string} [options.webAppUrl] - 自定義 Web App URL
 * @param {boolean} [options.silent] - 是否靜默模式（不顯示錯誤提示）
 * @returns {Promise<Object>} 寫入結果
 *
 * @example
 * // 基本用法
 * await writeQuestionToSheets({
 *   question_content: '請實作...',
 *   hint: '提示內容',
 *   target_filename: 'test.js',
 *   qtype: '實作題',
 *   level: '進階'
 * });
 */
export async function writeQuestionToSheets(questionData, options = {}) {
  // 檢查是否啟用功能
  if (!ENABLE_GOOGLE_SHEETS) {
    console.log('Google Sheets 寫入功能已停用');
    return { success: false, message: '功能已停用' };
  }

  // 驗證必要數據
  if (!questionData || !questionData.question_content) {
    console.warn('題目數據不完整，跳過寫入 Google Sheets');
    console.warn('questionData:', questionData);
    return { success: false, message: '題目數據不完整' };
  }

  try {
    const webAppUrl = options.webAppUrl || GOOGLE_SHEETS_WEB_APP_URL;
    
    if (!webAppUrl) {
      console.error('❌ 未配置 Google Sheets Web App URL');
      return { success: false, message: '未配置 Web App URL' };
    }
    
    console.log('🔧 開始寫入 Google Sheets，URL:', webAppUrl);

    // 方式 1: 使用 Google Apps Script Web App（推薦）
    if (webAppUrl) {
      return await writeViaWebApp(questionData, webAppUrl);
    }

    // 方式 2: 使用 Google Sheets API（需要配置）
    // 注意：這需要服務帳號或 OAuth，這裡提供一個簡單的實現範例
    console.warn('未配置 Google Apps Script Web App URL，無法寫入 Google Sheets');
    console.log('請配置 GOOGLE_SHEETS_WEB_APP_URL 或使用 Google Apps Script Web App');
    
    if (!options.silent) {
      console.log('提示：要啟用 Google Sheets 寫入功能，請：');
      console.log('1. 創建 Google Apps Script 專案');
      console.log('2. 部署為 Web App');
      console.log('3. 將 Web App URL 配置到 googleSheets.js');
    }

    return { success: false, message: '未配置 Web App URL' };
  } catch (error) {
    console.error('寫入 Google Sheets 失敗:', error);
    
    if (!options.silent) {
      console.error('錯誤詳情:', error.message);
    }

    return {
      success: false,
      message: error.message || '寫入失敗',
      error: error,
    };
  }
}

/**
 * 📤 通過 Google Apps Script Web App 寫入數據
 *
 * @param {Object} questionData - 題目數據
 * @param {string} webAppUrl - Web App URL
 * @returns {Promise<Object>} 寫入結果
 */
async function writeViaWebApp(questionData, webAppUrl) {
  try {
    // 準備要發送的數據
    const payload = {
      timestamp: new Date().toISOString(),
      qtype: questionData.qtype || '',
      level: questionData.level || '',
      question_content: questionData.question_content || '',
      hint: questionData.hint || '',
      target_filename: questionData.target_filename || '',
    };

    console.log('📤 準備寫入 Google Sheets');
    console.log('URL:', webAppUrl);
    console.log('Payload:', payload);

    // 方式 1: 嘗試使用表單數據（更可靠）
    const formData = new FormData();
    formData.append('timestamp', payload.timestamp);
    formData.append('qtype', payload.qtype);
    formData.append('level', payload.level);
    formData.append('question_content', payload.question_content);
    formData.append('hint', payload.hint);
    formData.append('target_filename', payload.target_filename);

    // 發送 POST 請求到 Google Apps Script Web App
    // 使用表單數據而不是 JSON，因為 Google Apps Script 對表單數據處理更可靠
    console.log('🚀 發送請求到:', webAppUrl);
    console.log('📦 表單數據:', {
      timestamp: payload.timestamp,
      qtype: payload.qtype,
      level: payload.level,
      question_content: payload.question_content.substring(0, 50) + '...',
      hint: payload.hint,
      target_filename: payload.target_filename,
    });
    
    let response;
    try {
      // 先嘗試正常模式（可以讀取響應）
      response = await fetch(webAppUrl, {
        method: 'POST',
        body: formData, // 使用 FormData，不設置 Content-Type（讓瀏覽器自動設置）
      });

      console.log('📨 收到響應，狀態:', response.status, response.statusText);
      console.log('📨 響應類型:', response.type);
      console.log('📨 響應 URL:', response.url);
    } catch (fetchError) {
      // 如果正常模式失敗（可能是 CORS），嘗試 no-cors 模式
      console.warn('⚠️ 正常模式失敗，嘗試 no-cors 模式:', fetchError.message);
      try {
        response = await fetch(webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: formData,
        });
        console.log('📨 no-cors 模式響應，狀態:', response.status);
        // no-cors 模式下無法讀取響應，但請求應該已發送
        if (response.type === 'opaque' || response.status === 0) {
          console.log('✅ 請求已發送（no-cors 模式，無法讀取響應）');
          return { success: true, message: '請求已發送（no-cors 模式），請檢查 Google Sheets' };
        }
      } catch (noCorsError) {
        console.error('❌ no-cors 模式也失敗:', noCorsError);
        throw fetchError; // 拋出原始錯誤
      }
    }

    // 嘗試讀取響應文本（可能是 JSON 或純文本）
    let responseText;
    try {
      responseText = await response.text();
      console.log('📄 響應內容:', responseText);
    } catch (e) {
      console.warn('⚠️ 無法讀取響應內容:', e);
      // 如果無法讀取響應，但請求沒有拋出錯誤，假設成功
      if (response.ok || response.status === 0) {
        return { success: true, message: '請求已發送，請檢查 Google Sheets' };
      }
      throw e;
    }

    // 嘗試解析為 JSON
    let result;
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        // 如果不是 JSON，可能是純文本響應
        console.log('響應不是 JSON 格式，視為純文本');
        if (response.ok || response.status === 0) {
          // status 0 通常表示成功（可能是 no-cors 模式）
          result = { success: true, message: responseText || '請求已發送' };
        } else {
          result = { success: false, error: responseText };
        }
      }
    } else {
      // 沒有響應文本，但請求可能已成功（no-cors 模式）
      result = { success: true, message: '請求已發送，請檢查 Google Sheets' };
    }

    if (result.success) {
      console.log('✅ 題目已成功寫入 Google Sheets');
      return { success: true, message: '寫入成功', data: result };
    } else {
      const errorMsg = result.error || '寫入失敗';
      console.error('❌ 寫入失敗:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('❌ 通過 Web App 寫入失敗:', error);
    console.error('錯誤詳情:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    // 如果是 CORS 錯誤，提供更詳細的提示
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.error('💡 CORS 錯誤提示：');
      console.error('1. 確認 Google Apps Script Web App 已正確部署');
      console.error('2. 確認「具有存取權的使用者」設置為「任何人」');
      console.error('3. 確認 Web App URL 正確（應以 /exec 結尾）');
      console.error('4. 嘗試重新部署 Web App（選擇「新增版本」）');
    }
    
    throw error;
  }
}

/**
 * 🔧 使用 Google Sheets API 直接寫入（需要配置服務帳號）
 * 
 * 注意：這個方法需要配置 Google Service Account，較為複雜
 * 建議使用 Google Apps Script Web App 方式
 *
 * @param {Object} _questionData - 題目數據（預留，未實現）
 * @returns {Promise<Object>} 寫入結果
 */
// eslint-disable-next-line no-unused-vars
async function writeViaAPI(_questionData) {
  // 這個方法需要 Google Service Account 配置
  // 實現較為複雜，建議使用 Google Apps Script Web App 方式
  throw new Error('Google Sheets API 方式需要配置服務帳號，請使用 Google Apps Script Web App 方式');
}

/**
 * 📋 獲取 Google Apps Script 範例代碼
 *
 * 返回用於 Google Apps Script 的範例代碼
 *
 * @returns {string} Google Apps Script 代碼
 */
export function getGoogleAppsScriptCode() {
  return `
function doPost(e) {
  try {
    // 打開 Google Sheets（使用 Sheet ID）
    const sheetId = '${GOOGLE_SHEET_ID}';
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    // 解析接收到的數據（支援表單數據和 JSON）
    // 注意：使用 FormData 時，數據在 e.parameter 中
    // 使用 JSON 時，數據在 e.postData.contents 中
    let data;
    
    // 優先檢查表單數據（FormData）
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    } 
    // 如果沒有表單數據，檢查 JSON 數據
    else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        // JSON 解析失敗，使用空對象
        data = {};
      }
    } 
    // 都沒有，使用空對象
    else {
      data = {};
    }
    
    // 如果第一行是空的，添加標題行
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['時間', '題目類型', '難度', '題目內容', '提示', '目標檔案']);
      // 設置標題行格式（可選）
      const headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }
    
    // 添加數據行
    sheet.appendRow([
      data.timestamp ? new Date(data.timestamp) : new Date(),
      data.qtype || '',
      data.level || '',
      data.question_content || '',
      data.hint || '',
      data.target_filename || ''
    ]);
    
    // 自動調整列寬（可選）
    sheet.autoResizeColumns(1, 6);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '數據已成功寫入'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 可選：添加 doGet 用於測試
function doGet(e) {
  return ContentService.createTextOutput('Google Sheets Web App 運行正常')
    .setMimeType(ContentService.MimeType.TEXT);
}
`;
}

/**
 * 📖 讀取 Google Sheets 數據 (Read Google Sheets Data)
 *
 * 從指定的 Google Sheets 讀取所有數據
 * 使用 Google Sheets 的公開 CSV 導出功能
 *
 * @param {Object} [options] - 選項配置
 * @param {string} [options.sheetId] - Google Sheets ID（默認使用 GOOGLE_SHEET_ID）
 * @param {string} [options.gid] - 工作表 GID（默認為 0，即第一個工作表）
 * @returns {Promise<Array<Object>>} 返回數據陣列，每個物件代表一行數據
 *
 * @example
 * // 讀取所有數據
 * const data = await readGoogleSheetsData();
 * console.log('題目數量:', data.length);
 *
 * // 讀取特定工作表
 * const data = await readGoogleSheetsData({ gid: '1234567890' });
 */
export async function readGoogleSheetsData(options = {}) {
  try {
    const sheetId = options.sheetId || GOOGLE_SHEET_ID;
    const gid = options.gid || '0';

    // 使用 Google Sheets 的 CSV 導出 URL
    // 格式：https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    console.log('📥 開始讀取 Google Sheets 數據');
    console.log('URL:', csvUrl);

    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log('📄 收到 CSV 數據，長度:', csvText.length);

    // 使用改進的 CSV 解析函數
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      console.log('⚠️ Google Sheets 為空');
      return [];
    }

    // 第一行是標題
    const headers = rows[0].map((h) => h.trim());
    console.log('📋 標題列:', headers);

    // 解析數據行
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const row = {};
      
      headers.forEach((header, index) => {
        // 保留原始值，不做 trim（除了標題）
        row[header] = values[index] !== undefined ? values[index] : '';
      });
      
      data.push(row);
    }

    console.log('✅ 成功讀取', data.length, '筆數據');
    console.log('📊 數據範例:', data.length > 0 ? data[0] : '無數據');
    return data;
  } catch (error) {
    console.error('❌ 讀取 Google Sheets 失敗:', error);
    throw error;
  }
}

/**
 * 📋 解析完整 CSV 文本 (Parse Full CSV Text)
 *
 * 正確處理包含換行符的多行 CSV 數據
 * 確保引號內的換行符被正確處理
 *
 * @param {string} csvText - 完整的 CSV 文本
 * @returns {Array<Array<string>>} 解析後的數據陣列，每個子陣列代表一行
 */
function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes) {
        if (nextChar === '"') {
          // 雙引號轉義
          currentField += '"';
          i += 2;
          continue;
        } else if (nextChar === ',' || nextChar === '\n' || nextChar === '\r' || nextChar === undefined) {
          // 引號結束
          inQuotes = false;
          i++;
          continue;
        } else {
          currentField += '"';
          i++;
          continue;
        }
      } else {
        // 引號開始
        inQuotes = true;
        i++;
        continue;
      }
    } else if (char === ',' && !inQuotes) {
      // 欄位分隔符
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      // 行結束（不在引號內）
      currentRow.push(currentField);
      if (currentRow.some((field) => field.trim().length > 0)) {
        // 只添加非空行
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      if (char === '\r' && nextChar === '\n') {
        i += 2; // 跳過 \r\n
      } else {
        i++;
      }
      continue;
    } else {
      // 普通字符（包括引號內的換行符）
      currentField += char;
      i++;
    }
  }

  // 添加最後一行
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * 📖 獲取設置說明
 *
 * @returns {string} 設置說明文字
 */
export function getSetupInstructions() {
  return `
📝 Google Sheets 寫入功能設置說明

1. 打開 Google Sheets:
   https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit

2. 創建 Google Apps Script 專案:
   - 在 Google Sheets 中，點擊「擴充功能」>「Apps Script」
   - 或直接訪問: https://script.google.com

3. 複製並貼上提供的範例代碼（使用 getGoogleAppsScriptCode() 函數獲取）

4. 部署為 Web App:
   - 點擊「部署」>「新增部署作業」
   - 選擇類型：「網頁應用程式」
   - 執行身份：選擇「我」
   - 具有存取權的使用者：選擇「任何人」
   - 點擊「部署」

5. 複製 Web App URL:
   - 部署完成後，複製提供的 Web App URL
   - 將 URL 設置到 googleSheets.js 中的 GOOGLE_SHEETS_WEB_APP_URL

6. 測試:
   - 在應用中生成題目，應該會自動寫入到 Google Sheets

注意事項:
- 首次部署時，Google 可能會要求授權，請點擊「允許」
- 如果修改了 Apps Script 代碼，需要重新部署
- Web App URL 在重新部署後可能會改變（如果選擇「新增版本」則不會改變）
`;
}
