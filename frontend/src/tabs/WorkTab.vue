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
      <!-- 🧰 圖層工作資料 -->
      <div>
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
      <div class="text-center p-5">
        <div class="my-title-md-gray mb-4">沒有開啟的圖層</div>
        
        <!-- 說明內容 -->
        <div class="my-bgcolor-gray-100 rounded p-4 text-start">
          <h6 class="my-title-sm-black mb-3">🔧 工作分頁</h6>
          
          <div class="mb-3">
            <div class="my-title-xs-gray pb-1">當前工作狀態</div>
            <div class="my-content-sm-black pb-1">準備中 - 等待圖層數據載入</div>
          </div>
          
          <div class="mb-3">
            <div class="my-title-xs-gray pb-1">支援的文件格式</div>
            <div class="my-content-sm-black pb-1">GeoJSON, Shapefile, KML, CSV</div>
          </div>
          
          <div class="mb-3">
            <div class="my-title-xs-gray pb-1">工作區功能</div>
            <div class="my-content-sm-black pb-1">
              - 數據處理與分析<br>
              - 圖層管理與編輯<br>
              - 屬性查詢與篩選<br>
              - 地理計算工具
            </div>
          </div>
          
          <div class="mb-3">
            <div class="my-title-xs-gray pb-1">快速操作</div>
            <div class="my-content-sm-black pb-1">
              <button class="btn btn-sm btn-outline-primary me-2 mb-1">載入資料</button>
              <button class="btn btn-sm btn-outline-success me-2 mb-1">執行分析</button>
              <button class="btn btn-sm btn-outline-info mb-1">匯出結果</button>
            </div>
          </div>
          
          <div class="my-title-xs-gray">
            💡 提示：載入圖層後，此區域將顯示圖層的工作資料和詳細資訊
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
