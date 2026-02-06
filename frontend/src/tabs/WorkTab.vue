<script setup>
  /**
   * 📄 WorkTab.vue - 工作分頁組件 (Work Tab Component)
   *
   * @component WorkTab
   * @version 1.0.0
   * @author Kevin Cheng
   * @since 1.0.0
   */

  // ==================== 📦 第三方庫引入 (Third-Party Library Imports) ====================
  import { ref, computed, watch, onMounted } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';
  import { writeQuestionToSheets } from '@/utils/googleSheets.js';

  // ==================== 🏪 狀態管理初始化 (State Management Initialization) ====================
  const dataStore = useDataStore();

  const activeLayerTab = ref(null); /** 📑 當前作用中的圖層分頁 */

  const emit = defineEmits(['active-layer-change']);

  // Props
  defineProps({
    containerHeight: {
      type: Number,
      default: 600,
    },
    isPanelDragging: {
      type: Boolean,
      default: false,
    },
    activeMarkers: {
      type: Number,
      default: 0,
    },
  });

  /**
   * 📑 設定作用中圖層分頁 (Set Active Layer Tab)
   * @param {string} layerId - 圖層 ID
   */
  const setActiveLayerTab = (layerId) => {
    activeLayerTab.value = layerId;
    emit('active-layer-change', activeLayerTab.value);
  };

  // 獲取所有開啟且有資料的圖層
  const visibleLayers = computed(() => {
    const allLayers = dataStore.getAllLayers();
    return allLayers.filter((layer) => layer.visible);
  });

  // 記錄上一次的圖層列表用於比較
  const previousLayers = ref([]);

  /**
   * 🧩 當前圖層工作資料 (Current Layer Work Data)
   */
  const currentLayerWorkData = computed(() => {
    if (!activeLayerTab.value) return null;
    const layer = visibleLayers.value.find((l) => l.layerId === activeLayerTab.value);
    return layer ? layer.workData || null : null;
  });

  /**
   * 📊 取得當前選中圖層名稱 (Get Current Selected Layer Name)
   */
  const currentLayerName = computed(() => {
    if (!activeLayerTab.value) return '無開啟圖層';
    const layer = visibleLayers.value.find((l) => l.layerId === activeLayerTab.value);
    return layer ? layer.layerName || '未知圖層' : '無開啟圖層';
  });

  /**
   * 📊 取得圖層完整標題 (包含群組名稱) (Get Layer Full Title with Group Name)
   */
  const getLayerFullTitle = (layer) => {
    if (!layer) return { groupName: null, layerName: '未知圖層' };
    const groupName = dataStore.findGroupNameByLayerId(layer.layerId);
    return {
      groupName: groupName,
      layerName: layer.layerName,
    };
  };

  /**
   * 📊 格式化顯示值 (Format Display Value)
   * 根據值的類型進行適當的格式化處理
   */
  const formatDisplayValue = (value) => {
    if (value === null || value === undefined) {
      return '無資料';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '空陣列';
      }
      const hasObjects = value.some((item) => typeof item === 'object' && item !== null);
      if (hasObjects) {
        return value
          .map((item, index) => {
            if (typeof item === 'object' && item !== null) {
              const keys = Object.keys(item);
              if (keys.length > 0) {
                const mainKey = keys[0];
                return `${index + 1}: ${mainKey}=${item[mainKey]}`;
              }
              return `${index + 1}: 物件`;
            }
            return String(item);
          })
          .join(', ');
      } else {
        return value.join(', ');
      }
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return '空物件';
      }
      if (keys.length <= 3) {
        return keys.map((key) => `${key}: ${value[key]}`).join(', ');
      }
      const previewKeys = keys.slice(0, 2);
      return (
        previewKeys.map((key) => `${key}: ${value[key]}`).join(', ') +
        ` ... (共 ${keys.length} 個屬性)`
      );
    }
    return String(value);
  };

  /**
   * 📊 取得 workData 的條目（用於顯示）
   */
  const workDataEntries = computed(() => {
    if (!currentLayerWorkData.value) return [];
    return Object.entries(currentLayerWorkData.value);
  });

  /**
   * 👀 監聽可見圖層變化，自動切換到新開啟的圖層分頁
   */
  watch(
    () => visibleLayers.value,
    (newLayers) => {
      // 如果沒有可見圖層，清除選中的分頁
      if (newLayers.length === 0) {
        activeLayerTab.value = null;
        previousLayers.value = [];
        return;
      }

      // 找出新增的圖層（比較新舊圖層列表）
      const previousLayerIds = previousLayers.value.map((layer) => layer.layerId);
      const newLayerIds = newLayers.map((layer) => layer.layerId);
      const addedLayerIds = newLayerIds.filter((id) => !previousLayerIds.includes(id));

      // 如果有新增的圖層，自動切換到最新新增的圖層
      if (addedLayerIds.length > 0) {
        const newestAddedLayerId = addedLayerIds[addedLayerIds.length - 1];
        activeLayerTab.value = newestAddedLayerId;
        emit('active-layer-change', activeLayerTab.value);
      }
      // 如果當前沒有選中分頁，或選中的分頁不在可見列表中，選中第一個
      else if (
        !activeLayerTab.value ||
        !newLayers.find((layer) => layer.layerId === activeLayerTab.value)
      ) {
        activeLayerTab.value = newLayers[0].layerId;
        emit('active-layer-change', activeLayerTab.value);
      }

      // 更新記錄的圖層列表
      previousLayers.value = [...newLayers];
    },
    { deep: true, immediate: true }
  );

  /**
   * 🚀 組件掛載事件 (Component Mounted Event)
   */
  onMounted(() => {
    // 初始化第一個可見圖層為作用中分頁
    if (visibleLayers.value.length > 0 && !activeLayerTab.value) {
      activeLayerTab.value = visibleLayers.value[0].layerId;
      emit('active-layer-change', activeLayerTab.value);
    }
  });

  // ==================== 🤖 AI 出題與評分功能 (AI Question Generation & Grading) ====================

  /**
   * 檢查是否為 test_layer (Check if current layer is test_layer)
   */
  const isTestLayer = computed(() => {
    return activeLayerTab.value === 'test_layer';
  });

  // API 基礎 URL (參考 RagView 和 AskView 的設定)
  const API_BASE = ref('https://kevin7261-gisgym.hf.space');

  // 出題功能狀態
  const ragFile = ref(null);
  const qtype = ref('實作題');
  const level = ref('進階');
  const isGenerating = ref(false);
  const currentQuestion = ref(null);
  const questionContent = ref('');
  const questionHint = ref('');
  const questionTargetFile = ref('');

  // 評分功能狀態
  const studentAnswer = ref('');
  const isGrading = ref(false);
  const gradingResult = ref(null);

  /**
   * 處理檔案選擇 (Handle File Selection)
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      ragFile.value = file;
    }
  };

  /**
   * 生成題目 (Generate Question)
   */
  const generateQuestion = async () => {
    isGenerating.value = true;
    currentQuestion.value = null;
    questionContent.value = '';
    questionHint.value = '';
    questionTargetFile.value = '';
    gradingResult.value = null;
    studentAnswer.value = '';

    try {
      const formData = new FormData();
      // 只有當用戶上傳了檔案時才添加到 FormData
      // 如果沒有上傳，後端會自動使用伺服器預設的 rag_db.zip
      if (ragFile.value) {
        formData.append('file', ragFile.value);
      }
      formData.append('qtype', qtype.value);
      formData.append('level', level.value);

      const response = await fetch(`${API_BASE.value}/api/generate_question`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      currentQuestion.value = data;
      questionContent.value = data.question_content || '';
      questionHint.value = data.hint || '';
      questionTargetFile.value = data.target_filename || '';

      // 📝 自動寫入題目到 Google Sheets
      try {
        const result = await writeQuestionToSheets(
          {
            question_content: questionContent.value,
            hint: questionHint.value,
            target_filename: questionTargetFile.value,
            qtype: qtype.value,
            level: level.value,
          },
          { silent: false } // 顯示錯誤提示以便調試
        );
        if (result.success) {
          console.log('✅ 題目已成功寫入 Google Sheets');
        } else {
          console.warn('⚠️ 寫入 Google Sheets 失敗:', result.message);
        }
      } catch (sheetsError) {
        // 寫入 Google Sheets 失敗不影響主要流程，但記錄詳細錯誤
        console.error('❌ 寫入 Google Sheets 發生錯誤:', sheetsError);
        console.error('錯誤詳情:', sheetsError.message);
      }
    } catch (error) {
      console.error('出題失敗:', error);

      // 處理不同類型的錯誤
      let errorMessage = error.message;

      // 若後端回傳 HTML 錯誤頁（例如 404/500 頁面），不直接顯示原始 HTML
      if (
        typeof errorMessage === 'string' &&
        (errorMessage.trim().startsWith('<') || errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html'))
      ) {
        errorMessage =
          `伺服器回傳了錯誤頁面 (${API_BASE.value})\n\n` +
          `請確認：\n` +
          `1. 後端 API 是否已啟動且路徑為 /api/generate_question\n` +
          `2. 是否為正確的 API 伺服器（非一般網頁）\n` +
          `3. 伺服器日誌中是否有錯誤訊息`;
      } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorMessage =
          `無法連接到 API 伺服器 (${API_BASE.value})\n\n` +
          `可能的原因：\n` +
          `1. API 伺服器未啟動（請確認後端服務是否運行在 ${API_BASE.value}）\n` +
          `2. CORS 跨域問題（請檢查後端是否允許來自 ${window.location.origin} 的請求）\n` +
          `3. 網路連接問題\n\n` +
          `提示：如果 API 伺服器運行在不同的地址，請修改 API_BASE 設定。`;
      } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
        errorMessage = `網路錯誤：無法連接到伺服器\n\n請確認：\n1. API 伺服器是否正在運行\n2. 網路連接是否正常`;
      }

      alert(`出題失敗：${errorMessage}`);
    } finally {
      isGenerating.value = false;
    }
  };

  /**
   * 評分提交 (Grade Submission)
   */
  const gradeSubmission = async () => {
    if (!studentAnswer.value.trim()) {
      alert('請輸入答案後再送出！');
      return;
    }

    if (!questionContent.value) {
      alert('請先生成題目！');
      return;
    }

    isGrading.value = true;
    gradingResult.value = null;

    try {
      const formData = new FormData();
      // 只有當用戶上傳了檔案時才添加到 FormData
      // 如果沒有上傳，後端會自動使用伺服器預設的 rag_db.zip
      if (ragFile.value) {
        formData.append('file', ragFile.value);
      }
      formData.append('question_text', questionContent.value);
      formData.append('student_answer', studentAnswer.value);
      formData.append('qtype', qtype.value);

      const response = await fetch(`${API_BASE.value}/api/grade_submission`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      gradingResult.value = data;
    } catch (error) {
      console.error('評分失敗:', error);

      // 處理不同類型的錯誤
      let errorMessage = error.message;

      // 若後端回傳 HTML 錯誤頁，不直接顯示原始 HTML
      if (
        typeof errorMessage === 'string' &&
        (errorMessage.trim().startsWith('<') || errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html'))
      ) {
        errorMessage =
          `伺服器回傳了錯誤頁面 (${API_BASE.value})\n\n` +
          `請確認：\n` +
          `1. 後端 API 是否已啟動且路徑為 /api/grade_submission\n` +
          `2. 是否為正確的 API 伺服器（非一般網頁）\n` +
          `3. 伺服器日誌中是否有錯誤訊息`;
      } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorMessage =
          `無法連接到 API 伺服器 (${API_BASE.value})\n\n` +
          `可能的原因：\n` +
          `1. API 伺服器未啟動（請確認後端服務是否運行在 ${API_BASE.value}）\n` +
          `2. CORS 跨域問題（請檢查後端是否允許來自 ${window.location.origin} 的請求）\n` +
          `3. 網路連接問題\n\n` +
          `提示：如果 API 伺服器運行在不同的地址，請修改 API_BASE 設定。`;
      } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
        errorMessage = `網路錯誤：無法連接到伺服器\n\n請確認：\n1. API 伺服器是否正在運行\n2. 網路連接是否正常`;
      }

      alert(`評分失敗：${errorMessage}`);
    } finally {
      isGrading.value = false;
    }
  };
</script>

<template>
  <!-- 🧰 多圖層工作視圖組件 -->
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <!-- 📑 圖層分頁導航 -->
    <div v-if="visibleLayers.length > 0" class="">
      <ul class="nav nav-tabs nav-fill">
        <li
          v-for="layer in visibleLayers"
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
            <span>
              <span v-if="getLayerFullTitle(layer).groupName" class="my-title-xs-gray"
                >{{ getLayerFullTitle(layer).groupName }} -
              </span>
              <span class="my-title-sm-black">{{ getLayerFullTitle(layer).layerName }}</span>
            </span>
          </div>
          <div class="w-100" :class="`my-bgcolor-${layer.colorName}`" style="min-height: 4px"></div>
        </li>
      </ul>
    </div>

    <!-- 有開啟圖層時的內容 -->
    <div v-if="visibleLayers.length > 0" class="flex-grow-1 overflow-auto my-bgcolor-white p-3">
      <!-- 🤖 test_layer 專用：AI 出題與評分功能 -->
      <div v-if="isTestLayer" class="ai-assistant-container">
        <h5 class="my-title-md-black mb-4">🎓 AI 空間分析助教 (RAG 版)</h5>

        <!-- 1. 上傳 RAG 資料庫與設定 -->
        <div class="ai-section mb-4 p-3 border rounded">
          <h6 class="my-title-sm-black mb-3">1. 上傳 RAG 資料庫與設定</h6>

          <div class="mb-3">
            <label class="form-label my-title-xs-gray"
              >請選擇您的 rag.zip 或 原始講義.zip（選填，不選擇則使用伺服器預設講義）</label
            >
            <input type="file" class="form-control" accept=".zip" @change="handleFileSelect" />
            <small v-if="ragFile" class="text-muted">已選擇: {{ ragFile.name }}</small>
            <small v-else class="text-muted">未選擇檔案，將使用伺服器預設的 rag_db.zip</small>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label my-title-xs-gray">題型 (Qtype)</label>
              <select v-model="qtype" class="form-select">
                <option value="實作題">實作題 (R Code)</option>
                <option value="觀念簡答題">觀念簡答題</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label my-title-xs-gray">難度 (Level)</label>
              <select v-model="level" class="form-select">
                <option value="入門">入門</option>
                <option value="進階">進階</option>
              </select>
            </div>
          </div>

          <button
            class="btn btn-primary w-100"
            @click="generateQuestion"
            :disabled="isGenerating"
          >
            <span
              v-if="isGenerating"
              class="spinner-border spinner-border-sm me-2"
              role="status"
            ></span>
            {{ isGenerating ? '🧠 AI 正在讀取 Zip 並出題中... (約需 10-20 秒)' : '🚀 生成題目' }}
          </button>
        </div>

        <!-- 2. 題目與作答 -->
        <div v-if="currentQuestion" class="ai-section mb-4 p-3 border rounded">
          <h6 class="my-title-sm-black mb-3">2. 題目與作答</h6>

          <div class="result-box p-3 mb-3 bg-light rounded">
            <h6 class="my-title-xs-black mb-2">📝 題目：</h6>
            <div class="question-content mb-3">{{ questionContent }}</div>
            <hr />
            <p class="mb-1">
              <strong>💡 提示：</strong>
              <span>{{ questionHint }}</span>
            </p>
            <p class="mb-0">
              <strong>📂 建議使用檔案：</strong>
              <code>{{ questionTargetFile }}</code>
            </p>
          </div>

          <div class="mb-3">
            <label class="form-label my-title-xs-gray">請在此輸入您的回答 (程式碼或文字)：</label>
            <textarea
              v-model="studentAnswer"
              class="form-control"
              rows="8"
              placeholder="例如：library(sf); st_read(...)"
            ></textarea>
          </div>

          <button
            class="btn btn-success w-100"
            @click="gradeSubmission"
            :disabled="!studentAnswer.trim() || isGrading"
          >
            <span
              v-if="isGrading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
            ></span>
            {{ isGrading ? '👀 AI 正在對照講義進行評分...' : '📝 送出並評分' }}
          </button>
        </div>

        <!-- 3. 評分報告 -->
        <div v-if="gradingResult" class="ai-section mb-4 p-3 border rounded">
          <h6 class="my-title-sm-black mb-3">3. 評分報告</h6>

          <div class="result-box p-3 bg-light rounded">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                分數：<span class="score-badge">{{ gradingResult.score }}</span> / 10
              </div>
              <div class="level-badge">等級：{{ gradingResult.level }}</div>
            </div>
            <hr />

            <div v-if="gradingResult.strengths && gradingResult.strengths.length > 0" class="mb-3">
              <h6 class="my-title-xs-black mb-2">👍 優點：</h6>
              <ul class="mb-0">
                <li
                  v-for="(strength, index) in gradingResult.strengths"
                  :key="index"
                  class="text-success"
                >
                  {{ strength }}
                </li>
              </ul>
            </div>

            <div
              v-if="gradingResult.weaknesses && gradingResult.weaknesses.length > 0"
              class="mb-3"
            >
              <h6 class="my-title-xs-black mb-2">⚠️ 待改進：</h6>
              <ul class="mb-0">
                <li
                  v-for="(weakness, index) in gradingResult.weaknesses"
                  :key="index"
                  class="text-warning"
                >
                  {{ weakness }}
                </li>
              </ul>
            </div>

            <div
              v-if="gradingResult.action_items && gradingResult.action_items.length > 0"
              class="mb-3"
            >
              <h6 class="my-title-xs-black mb-2">📋 建議事項：</h6>
              <ul class="mb-0">
                <li v-for="(item, index) in gradingResult.action_items" :key="index">
                  {{ item }}
                </li>
              </ul>
            </div>

            <div v-if="gradingResult.rubric && gradingResult.rubric.length > 0" class="mb-0">
              <h6 class="my-title-xs-black mb-2">📊 評分標準：</h6>
              <ul class="mb-0">
                <li v-for="(item, index) in gradingResult.rubric" :key="index">
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 🧰 其他圖層：顯示圖層工作資料 -->
      <div v-else>
        <!-- 🧰 當前圖層資訊 -->
        <div class="mb-4">
          <h5 class="my-title-md-black">{{ currentLayerName }}</h5>
        </div>

        <!-- 🧰 圖層工作資料 -->
        <div v-if="currentLayerWorkData && workDataEntries.length > 0">
          <div v-for="[key, value] in workDataEntries" :key="key" class="mb-3">
            <div class="my-title-xs-gray pb-1">{{ key }}</div>
            <div class="my-content-sm-black pb-1">
              {{ formatDisplayValue(value) }}
            </div>
          </div>
        </div>
        <div v-else-if="!currentLayerWorkData" class="text-center py-5">
          <div class="my-title-md-gray">此圖層沒有可用的工作資料</div>
        </div>
      </div>
    </div>

    <!-- 沒有開啟圖層時的空狀態 -->
    <div v-else class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="my-title-md-gray p-3">沒有開啟的圖層</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* AI 助教功能樣式 */
  .ai-assistant-container {
    max-width: 100%;
  }

  .ai-section {
    background: #fff;
    border-left: 4px solid #3498db;
  }

  .result-box {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
  }

  .question-content {
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.6;
  }

  .score-badge {
    font-size: 2em;
    font-weight: bold;
    color: #3498db;
  }

  .level-badge {
    font-size: 1.2em;
    color: #7f8c8d;
  }

  .form-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }
</style>
