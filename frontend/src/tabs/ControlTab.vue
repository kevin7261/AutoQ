/**
 * 🎮 操作控制分頁組件 (Control Tab Component)
 *
 * 功能說明 (Features):
 * 1. 🚀 執行下一步：提供圖層處理流程的執行按鈕
 * 2. 📊 圖層選擇：顯示當前可操作的圖層
 * 3. 🔄 狀態管理：追蹤執行狀態和圖層資訊
 * 4. 📱 響應式設計：適配不同螢幕尺寸的顯示需求
 *
 * 技術特點 (Technical Features):
 * - 使用 Vue 3 Composition API 進行狀態管理
 * - 整合 Pinia 狀態管理系統
 * - 支援多圖層切換和操作
 *
 * @file ControlTab.vue
 * @version 1.0.0
 * @author Kevin Cheng
 * @since 1.0.0
 */
<script setup>
  // ==================== 📦 第三方庫引入 (Third-Party Library Imports) ====================

  /**
   * Vue 3 Composition API 核心功能引入
   * 提供響應式數據管理、計算屬性、生命週期鉤子等現代化 Vue 開發功能
   */
  import { ref, computed, watch, nextTick } from 'vue';

  /**
   * Pinia 狀態管理庫引入
   * 提供集中式狀態管理和跨組件數據共享能力
   */
  import { useDataStore } from '@/stores/dataStore.js';


  // ==================== 🏪 狀態管理初始化 (State Management Initialization) ====================

  /**
   * 獲取 Pinia 數據存儲實例
   * 用於訪問全域狀態和圖層數據
   */
  const dataStore = useDataStore();

  // ==================== 📊 響應式狀態定義 (Reactive State Definition) ====================

  /**
   * 📑 當前作用中的圖層分頁 (Active Layer Tab)
   * 追蹤使用者當前選中的圖層分頁
   */
  const activeLayerTab = ref(null);

  // ==================== ❓ RAG 問答狀態 (RAG Q&A State) ====================

  /**
   * RAG API 網址
   */
  const RAG_API_URL = 'https://kevin7261-gisgym.hf.space/ask_with_zip';

  const ragFileInput = ref(null);
  const ragSelectedFile = ref(null);
  const ragQuestionText = ref('');
  const ragIsProcessing = ref(false);
  const ragStatusMessage = ref('');
  const ragStatusType = ref(''); // 'success', 'error', 'info'
  const ragIsDragOver = ref(false);
  const ragResultQuestion = ref('');
  const ragResultAnswer = ref('');
  const ragResultSources = ref([]);

  // ==================== 📊 計算屬性定義 (Computed Properties Definition) ====================

  /**
   * 獲取所有可見且有資料的圖層 (Get All Visible Layers with Data)
   * 從全域狀態中篩選出可見且已載入資料的圖層
   */
  const visibleLayers = computed(() => {
    const allLayers = dataStore.getAllLayers();
    return allLayers.filter((layer) => layer && layer.visible);
  });

  /**
   * 獲取所有有效的可見圖層（確保每個圖層都有有效的 layerId）
   * 用於模板中的 v-for，避免渲染無效圖層
   */
  const validVisibleLayers = computed(() => {
    return visibleLayers.value.filter((layer) => layer && layer.layerId);
  });

  /**
   * 當前選中的圖層 (Current Selected Layer)
   * 根據 activeLayerTab 獲取當前選中的圖層物件
   */
  const currentLayer = computed(() => {
    if (!activeLayerTab.value || !visibleLayers.value || visibleLayers.value.length === 0) {
      return null;
    }
    return (
      visibleLayers.value.find((layer) => layer && layer.layerId === activeLayerTab.value) || null
    );
  });

  /**
   * 取得圖層完整標題 (包含群組名稱) (Get Layer Full Title with Group Name)
   * 組合群組名稱和圖層名稱，形成完整的圖層標題
   */
  const getLayerFullTitle = (layer) => {
    if (!layer) return { groupName: null, layerName: '未知圖層' };
    const groupName = dataStore.findGroupNameByLayerId(layer.layerId);
    return {
      groupName: groupName,
      layerName: layer.layerName,
    };
  };

  // ==================== 🔧 核心功能函數定義 (Core Function Definitions) ====================

  /**
   * 📑 設定作用中圖層分頁 (Set Active Layer Tab)
   * 切換當前選中的圖層分頁
   */
  const setActiveLayerTab = (layerId) => {
    activeLayerTab.value = layerId;
  };

  // ==================== ❓ RAG 問答計算屬性與方法 ====================

  const ragUploadText = computed(() => {
    return ragIsDragOver.value ? '放開以上傳檔案' : '點擊或拖曳 ZIP 檔案至此';
  });

  const ragButtonText = computed(() => {
    return ragIsProcessing.value ? '雲端運算中...' : '上傳並提問';
  });

  const ragStatusClass = computed(() => {
    return `rag-status-${ragStatusType.value}`;
  });

  const ragClearResult = () => {
    ragResultQuestion.value = '';
    ragResultAnswer.value = '';
    ragResultSources.value = [];
    ragStatusMessage.value = '';
  };

  const handleRagFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      ragSelectedFile.value = files[0];
      ragClearResult();
    }
  };

  const handleRagDragOver = () => {
    ragIsDragOver.value = true;
  };

  const handleRagDragLeave = () => {
    ragIsDragOver.value = false;
  };

  const handleRagDrop = (event) => {
    ragIsDragOver.value = false;
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      ragSelectedFile.value = files[0];
      ragClearResult();
    }
  };

  const submitRagQuestion = async () => {
    if (!ragSelectedFile.value) {
      alert('請先選擇一個 rag_db.zip 檔案！');
      return;
    }

    if (!ragQuestionText.value) {
      alert('請輸入問題內容！');
      return;
    }

    const file = ragSelectedFile.value;
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      alert('錯誤：僅支援 .zip 格式的壓縮檔');
      return;
    }

    ragClearResult();
    ragIsProcessing.value = true;
    ragStatusType.value = 'info';
    ragStatusMessage.value = '🚀 正在上傳資料庫並提問...這可能需要一點時間，請勿關閉視窗。';

    try {
      const formData = new FormData();
      formData.append('file', ragSelectedFile.value);
      formData.append('question', ragQuestionText.value);

      const response = await fetch(RAG_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`伺服器錯誤: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      ragResultQuestion.value = data.question || ragQuestionText.value;
      ragResultAnswer.value = data.answer || '';
      ragResultSources.value = Array.isArray(data.sources) ? data.sources : [];

      ragStatusType.value = 'success';
      ragStatusMessage.value = '✅ 成功！已取得 AI 回答。';
    } catch (error) {
      ragStatusType.value = 'error';
      ragStatusMessage.value = `❌ 發生錯誤: ${error.message}`;
    } finally {
      ragIsProcessing.value = false;
    }
  };

  // ==================== 👀 響應式監聽器 (Reactive Watchers) ====================

  /**
   * 記錄上一次的圖層列表用於比較變化
   * 用於偵測新增的圖層並自動切換到最新圖層
   */
  const previousLayers = ref([]);

  /**
   * 👀 監聽可見圖層變化，自動切換到新開啟的圖層分頁
   */
  watch(
    () => visibleLayers.value,
    (newLayers) => {
      // 確保 newLayers 是有效的陣列
      if (!Array.isArray(newLayers)) {
        activeLayerTab.value = null;
        previousLayers.value = [];
        return;
      }

      // 如果沒有可見圖層，清除選中的分頁
      if (newLayers.length === 0) {
        activeLayerTab.value = null;
        previousLayers.value = [];
        return;
      }

      // 確保所有圖層都有有效的 layerId
      const validLayers = newLayers.filter((layer) => layer && layer.layerId);

      // 如果沒有有效圖層，清除選中的分頁
      if (validLayers.length === 0) {
        activeLayerTab.value = null;
        previousLayers.value = [];
        return;
      }

      // 使用 nextTick 確保在 DOM 更新後再進行狀態更新
      nextTick(() => {
        // 找出新增的圖層（比較新舊圖層列表）
        const previousLayerIds = (previousLayers.value || [])
          .filter((layer) => layer && layer.layerId)
          .map((layer) => layer.layerId);
        const newLayerIds = validLayers.map((layer) => layer.layerId);
        const addedLayerIds = newLayerIds.filter((id) => !previousLayerIds.includes(id));

        // 如果有新增的圖層，自動切換到最新新增的圖層
        if (addedLayerIds.length > 0) {
          const newestAddedLayerId = addedLayerIds[addedLayerIds.length - 1];
          if (validLayers.find((layer) => layer.layerId === newestAddedLayerId)) {
            activeLayerTab.value = newestAddedLayerId;
          }
        }
        // 如果當前沒有選中分頁，或選中的分頁不在可見列表中，選中第一個
        else if (
          !activeLayerTab.value ||
          !validLayers.find((layer) => layer.layerId === activeLayerTab.value)
        ) {
          if (validLayers[0] && validLayers[0].layerId) {
            activeLayerTab.value = validLayers[0].layerId;
          }
        }

        // 更新記錄的圖層列表（只記錄有效的圖層）
        previousLayers.value = [...validLayers];
      });
    },
    { deep: false, immediate: true }
  );
</script>

<template>
  <!-- 🎮 操作控制分頁組件 -->
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <!-- 📑 圖層分頁導航 -->
    <div v-if="visibleLayers.length > 0" class="">
      <ul class="nav nav-tabs nav-fill">
        <li
          v-for="layer in validVisibleLayers"
          :key="layer.layerId"
          class="nav-item d-flex flex-column align-items-center"
        >
          <!-- tab按鈕 -->
          <div
            class="btn nav-link rounded-0 border-0 position-relative d-flex align-items-center justify-content-center my-bgcolor-gray-200"
            :class="{
              active: activeLayerTab === layer.layerId,
            }"
            @click="setActiveLayerTab(layer.layerId)"
          >
            <span class="my-title-sm-black">
              <span v-if="getLayerFullTitle(layer).groupName" class="my-title-xs-gray"
                >{{ getLayerFullTitle(layer).groupName }} -
              </span>
              <span>{{ getLayerFullTitle(layer).layerName }}</span>
            </span>
          </div>
          <div class="w-100" :class="`my-bgcolor-${layer.colorName}`" style="min-height: 4px"></div>
        </li>
      </ul>
    </div>

    <!-- 📋 圖層操作內容區域 -->
    <div v-if="visibleLayers.length > 0" class="flex-grow-1 overflow-auto p-3 my-bgcolor-white">
      <div
        v-for="layer in validVisibleLayers"
        :key="layer.layerId"
        v-show="activeLayerTab === layer.layerId"
      >
        <div v-if="layer.layerId === 'test_layer'" class="rag-card">
          <h3 class="rag-title">❓ 上傳 RAG 資料庫問問題</h3>
          <p class="rag-description">
            請上傳剛剛下載的 <strong>rag_db.zip</strong>，並輸入您的問題，系統會回傳 AI 回答與來源檔案。
          </p>

          <div class="rag-tip">
            💡 <strong>提示：</strong>請上傳 <strong>rag_db.zip</strong>（不要傳原始 PDF），問題可輸入如「這份文件的結論是什麼？」。
          </div>

          <div
            class="rag-upload-area"
            @click="ragFileInput && ragFileInput.click()"
            @dragover.prevent="handleRagDragOver"
            @dragleave.prevent="handleRagDragLeave"
            @drop.prevent="handleRagDrop"
            :class="{ 'rag-drag-over': ragIsDragOver }"
          >
            <input
              ref="ragFileInput"
              type="file"
              accept=".zip"
              @change="handleRagFileSelect"
              style="display: none;"
            />
            <span>{{ ragUploadText }}</span>
          </div>

          <div v-if="ragSelectedFile" class="rag-file-info">
            📦 已選擇: {{ ragSelectedFile.name }}
          </div>

          <div class="rag-question-area">
            <label class="rag-question-label" for="rag-question-input">問題</label>
            <textarea
              id="rag-question-input"
              class="rag-question-input"
              rows="4"
              placeholder="例如：這份文件的結論是什麼？"
              v-model.trim="ragQuestionText"
              @input="ragClearResult"
            ></textarea>
          </div>

          <button
            class="rag-submit-btn"
            @click="submitRagQuestion"
            :disabled="!ragSelectedFile || !ragQuestionText || ragIsProcessing"
          >
            <span v-if="ragIsProcessing" class="rag-loader"></span>
            <span>{{ ragButtonText }}</span>
          </button>

          <div v-if="ragStatusMessage" class="rag-status" :class="ragStatusClass">
            {{ ragStatusMessage }}
          </div>

          <div v-if="ragResultAnswer" class="rag-result">
            <div class="rag-result-section">
              <div class="rag-result-title">問題</div>
              <div class="rag-result-content">{{ ragResultQuestion }}</div>
            </div>
            <div class="rag-result-section">
              <div class="rag-result-title">回答</div>
              <div class="rag-result-content">{{ ragResultAnswer }}</div>
            </div>
            <div v-if="ragResultSources.length" class="rag-result-section">
              <div class="rag-result-title">來源</div>
              <ul class="rag-result-sources">
                <li v-for="source in ragResultSources" :key="source">{{ source }}</li>
              </ul>
            </div>
          </div>

          <div class="rag-note">
            ⚠️ <strong>注意：</strong><br />
            1. 檔案大小請勿過大，以免連線逾時。<br />
            2. 若 Hugging Face 主機休眠中，首次執行可能需等待 1-3 分鐘喚醒。
          </div>
        </div>

        <!-- 沒有功能的提示 -->
        <div v-else-if="currentLayer" class="pb-3 mb-3">
          <div class="my-title-md-gray text-center p-3">此圖層目前沒有可用的操作</div>
        </div>
      </div>
    </div>

    <!-- 沒有開啟的圖層 -->
    <div v-else class="d-flex align-items-center justify-content-center h-100">
      <div class="my-title-md-gray text-center p-3">沒有開啟的圖層</div>
    </div>
  </div>
</template>

<style scoped>
  /* 🎨 開關樣式：同 LeftView 的 LayersTab toggle（input + label） */
  .layer-toggle input[type='checkbox'] {
    height: 0;
    width: 0;
    visibility: hidden;
  }

  .layer-toggle label {
    cursor: pointer;
    width: 28px;
    height: 16px;
    background: var(--my-color-gray-300);
    display: block;
    border-radius: 16px;
    position: relative;
    transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .layer-toggle label:after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    background: var(--my-color-white);
    border-radius: 12px;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .layer-toggle input:checked + label {
    background: var(--my-color-green);
  }

  .layer-toggle input:checked + label:after {
    transform: translateX(12px);
  }

  .layer-toggle input:disabled + label {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .rag-chunks {
    margin: 0.5rem 0 0;
    padding: 0.5rem;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 10pt;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .rag-card {
    background-color: #ffffff;
    padding: 1.25rem;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }

  .rag-title {
    margin: 0 0 0.75rem;
    color: #4f46e5;
    font-size: 1.1rem;
    text-align: center;
  }

  .rag-description {
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .rag-tip {
    font-size: 0.85rem;
    color: #047857;
    background-color: #d1fae5;
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 12px;
    text-align: left;
    line-height: 1.5;
  }

  .rag-upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0 0.75rem;
    transition: all 0.3s;
    cursor: pointer;
    background-color: transparent;
    text-align: center;
  }

  .rag-upload-area:hover,
  .rag-upload-area.rag-drag-over {
    border-color: #4f46e5;
    background-color: #f9fafb;
  }

  .rag-file-info {
    margin-top: 6px;
    margin-bottom: 8px;
    font-weight: 600;
    color: #4f46e5;
    font-size: 0.85rem;
    word-break: break-all;
  }

  .rag-question-area {
    text-align: left;
    margin-bottom: 0.75rem;
  }

  .rag-question-label {
    display: block;
    font-size: 0.85rem;
    color: #374151;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .rag-question-input {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.9rem;
    line-height: 1.4;
    resize: vertical;
    font-family: inherit;
  }

  .rag-question-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }

  .rag-submit-btn {
    background-color: #4f46e5;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    border-radius: 6px;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.2s;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .rag-submit-btn:hover:not(:disabled) {
    background-color: #4338ca;
  }

  .rag-submit-btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  .rag-loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #4f46e5;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    animation: rag-spin 1s linear infinite;
  }

  @keyframes rag-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .rag-status {
    margin-top: 0.75rem;
    font-size: 0.85rem;
    white-space: pre-line;
    min-height: 1.2em;
    padding: 0.6rem;
    border-radius: 6px;
  }

  .rag-status-info {
    background-color: #eff6ff;
    color: #1e40af;
  }

  .rag-status-success {
    background-color: #f0fdf4;
    color: #15803d;
  }

  .rag-status-error {
    background-color: #fef2f2;
    color: #dc2626;
  }

  .rag-result {
    margin-top: 0.75rem;
    text-align: left;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.75rem;
    background-color: #f9fafb;
  }

  .rag-result-section + .rag-result-section {
    margin-top: 0.75rem;
  }

  .rag-result-title {
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
  }

  .rag-result-content {
    color: #374151;
    line-height: 1.5;
    white-space: pre-line;
  }

  .rag-result-sources {
    padding-left: 18px;
    margin: 0;
    color: #374151;
  }

  .rag-note {
    font-size: 0.8rem;
    color: #dc2626;
    margin-top: 12px;
    background: #fef2f2;
    padding: 10px;
    border-radius: 6px;
    line-height: 1.5;
    text-align: left;
  }
</style>
