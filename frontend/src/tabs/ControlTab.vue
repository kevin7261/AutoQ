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
        <!-- test_layer：此功能已停用 -->
        <div v-if="layer.layerId === 'test_layer'" class="p-4 text-center">
          <div class="my-title-md-gray">此功能已停用</div>
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

</style>
