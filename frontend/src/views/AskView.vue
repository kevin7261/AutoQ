<template>
  <div class="ask-container">
    <div class="ask-card">
      <h1 class="title">❓ 上傳 RAG 資料庫問問題</h1>
      <p class="description">
        請上傳剛剛下載的 <strong>rag_db.zip</strong>，並輸入您的問題，系統會回傳 AI 回答與來源檔案。
      </p>

      <!-- 提示框 -->
      <div class="tip">
        💡 <strong>提示：</strong>請上傳 <strong>rag_db.zip</strong>（不要傳原始 PDF），問題可輸入如「這份文件的結論是什麼？」。
      </div>

      <!-- 上傳區域 -->
      <div
        class="upload-area"
        @click="$refs.fileInput.click()"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="{ 'drag-over': isDragOver }"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".zip"
          @change="handleFileSelect"
          style="display: none;"
        />
        <span>{{ uploadText }}</span>
      </div>

      <!-- 檔案名稱顯示 -->
      <div v-if="selectedFile" class="file-info">
        📦 已選擇: {{ selectedFile.name }}
      </div>

      <!-- 問題輸入 -->
      <div class="question-area">
        <label class="question-label" for="question-input">問題</label>
        <textarea
          id="question-input"
          class="question-input"
          rows="4"
          placeholder="例如：這份文件的結論是什麼？"
          v-model.trim="questionText"
          @input="clearResult"
        ></textarea>
      </div>

      <!-- 提交按鈕 -->
      <button
        class="submit-btn"
        @click="submitQuestion"
        :disabled="!selectedFile || !questionText || isProcessing"
      >
        <span v-if="isProcessing" class="loader"></span>
        <span>{{ buttonText }}</span>
      </button>

      <!-- 狀態訊息 -->
      <div v-if="statusMessage" class="status" :class="statusClass">
        {{ statusMessage }}
      </div>

      <!-- 回答結果 -->
      <div v-if="resultAnswer" class="result">
        <div class="result-section">
          <div class="result-title">問題</div>
          <div class="result-content">{{ resultQuestion }}</div>
        </div>
        <div class="result-section">
          <div class="result-title">回答</div>
          <div class="result-content">{{ resultAnswer }}</div>
        </div>
        <div v-if="resultSources.length" class="result-section">
          <div class="result-title">來源</div>
          <ul class="result-sources">
            <li v-for="source in resultSources" :key="source">{{ source }}</li>
          </ul>
        </div>
      </div>

      <!-- 注意事項 -->
      <div class="note">
        ⚠️ <strong>注意：</strong><br>
        1. 檔案大小請勿過大，以免連線逾時。<br>
        2. 若 Hugging Face 主機休眠中，首次執行可能需等待 1-3 分鐘喚醒。
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'AskView',

  setup() {
    // API 網址
    const API_URL = 'https://kevin7261-gisgym.hf.space/ask_with_zip';

    // 狀態變數
    const selectedFile = ref(null);
    const questionText = ref('');
    const isProcessing = ref(false);
    const statusMessage = ref('');
    const statusType = ref(''); // 'success', 'error', 'info'
    const isDragOver = ref(false);
    const resultQuestion = ref('');
    const resultAnswer = ref('');
    const resultSources = ref([]);

    // 計算屬性
    const uploadText = computed(() => {
      return isDragOver.value ? '放開以上傳檔案' : '點擊或拖曳 ZIP 檔案至此';
    });

    const buttonText = computed(() => {
      return isProcessing.value ? '雲端運算中...' : '上傳並提問';
    });

    const statusClass = computed(() => {
      return `status-${statusType.value}`;
    });

    const clearResult = () => {
      resultQuestion.value = '';
      resultAnswer.value = '';
      resultSources.value = [];
      statusMessage.value = '';
    };

    // 檔案選擇處理
    const handleFileSelect = (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        selectedFile.value = files[0];
        clearResult();
      }
    };

    // 拖曳處理
    const handleDragOver = () => {
      isDragOver.value = true;
    };

    const handleDragLeave = () => {
      isDragOver.value = false;
    };

    const handleDrop = (event) => {
      isDragOver.value = false;
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        selectedFile.value = files[0];
        clearResult();
      }
    };

    // 提問處理
    const submitQuestion = async () => {
      if (!selectedFile.value) {
        alert('請先選擇一個 rag_db.zip 檔案！');
        return;
      }

      if (!questionText.value) {
        alert('請輸入問題內容！');
        return;
      }

      // 簡單的前端檢查
      const file = selectedFile.value;
      if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
        alert('錯誤：僅支援 .zip 格式的壓縮檔');
        return;
      }

      // 重置狀態
      clearResult();
      isProcessing.value = true;
      statusType.value = 'info';
      statusMessage.value = '🚀 正在上傳資料庫並提問...這可能需要一點時間，請勿關閉視窗。';

      try {
        const formData = new FormData();
        formData.append('file', selectedFile.value);
        formData.append('question', questionText.value);

        // 發送 POST 請求
        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`伺服器錯誤: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        resultQuestion.value = data.question || questionText.value;
        resultAnswer.value = data.answer || '';
        resultSources.value = Array.isArray(data.sources) ? data.sources : [];

        statusType.value = 'success';
        statusMessage.value = '✅ 成功！已取得 AI 回答。';
      } catch (error) {
        statusType.value = 'error';
        statusMessage.value = `❌ 發生錯誤: ${error.message}`;
      } finally {
        isProcessing.value = false;
      }
    };

    return {
      selectedFile,
      questionText,
      isProcessing,
      statusMessage,
      statusClass,
      isDragOver,
      uploadText,
      buttonText,
      resultQuestion,
      resultAnswer,
      resultSources,
      handleFileSelect,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      submitQuestion,
      clearResult
    };
  }
};
</script>

<style scoped>
:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --bg-color: #f3f4f6;
  --card-bg: #ffffff;
  --text-color: #1f2937;
}

.ask-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.ask-card {
  background-color: var(--card-bg);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.title {
  margin-top: 0;
  color: var(--primary-color);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.description {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.tip {
  font-size: 0.85rem;
  color: #047857;
  background-color: #d1fae5;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: left;
  line-height: 1.5;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  margin: 1.5rem 0 1rem;
  transition: all 0.3s;
  cursor: pointer;
  background-color: transparent;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--primary-color);
  background-color: #f9fafb;
}

.file-info {
  margin-top: 10px;
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.9rem;
  word-break: break-all;
}

.question-area {
  text-align: left;
  margin-bottom: 1rem;
}

.question-label {
  display: block;
  font-size: 0.85rem;
  color: #374151;
  margin-bottom: 6px;
  font-weight: 600;
}

.question-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.95rem;
  line-height: 1.4;
  resize: vertical;
  font-family: inherit;
}

.question-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
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

.submit-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.submit-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status {
  margin-top: 1rem;
  font-size: 0.9rem;
  white-space: pre-line;
  min-height: 1.2em;
  padding: 0.75rem;
  border-radius: 6px;
}

.status-info {
  background-color: #eff6ff;
  color: #1e40af;
}

.status-success {
  background-color: #f0fdf4;
  color: #15803d;
}

.status-error {
  background-color: #fef2f2;
  color: #dc2626;
}

.result {
  margin-top: 1rem;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f9fafb;
}

.result-section + .result-section {
  margin-top: 1rem;
}

.result-title {
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.result-content {
  color: #374151;
  line-height: 1.5;
  white-space: pre-line;
}

.result-sources {
  padding-left: 18px;
  margin: 0;
  color: #374151;
}

.note {
  font-size: 0.8rem;
  color: #dc2626;
  margin-top: 15px;
  background: #fef2f2;
  padding: 10px;
  border-radius: 6px;
  line-height: 1.5;
  text-align: left;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .ask-card {
    padding: 1.5rem;
  }

  .title {
    font-size: 1.25rem;
  }

  .description {
    font-size: 0.875rem;
  }

  .upload-area {
    padding: 1.5rem;
  }
}
</style>
