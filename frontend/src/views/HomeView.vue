<script>
  /**
   * 🏠 HomeView.vue - AutoQ系統主頁面 (簡化版)
   *
   * 功能說明：
   * 1. 📊 提供 WorkTab 和 DashboardTab 的主要介面
   * 2. 🔄 管理分頁切換和狀態同步
   * 3. 📑 顯示當前 layer tab 的標題
   * 4. ⏳ 統一管理載入狀態和進度顯示
   *
   * @component HomeView
   * @version 3.0.0 (簡化版)
   */

  // 🔧 Vue Composition API 核心功能引入
  import { ref, computed, onMounted } from 'vue';

  // 📦 Pinia 狀態管理引入
  import { useDataStore } from '@/stores/dataStore';

  // 🧩 子組件引入 (Subcomponent Imports)
  import LoadingOverlay from '../components/LoadingOverlay.vue'; // ⏳ 載入覆蓋層組件
  import WorkTab from '../tabs/WorkTab.vue'; // 🔧 工作分頁組件
  import DashboardTab from '../tabs/DashboardTab.vue'; // 📊 儀表板分頁組件

  export default {
    name: 'HomeView',

    /**
     * 🧩 組件註冊 (Component Registration)
     * 註冊首頁使用的所有子組件
     */
    components: {
      LoadingOverlay, // 載入覆蓋層組件
      WorkTab, // 工作分頁組件
      DashboardTab, // 儀表板分頁組件
    },

    /**
     * 🔧 組件設定函數 (Component Setup)
     * 使用 Composition API 設定組件邏輯和狀態管理
     */
    setup() {
      // 📦 取得 Pinia 數據存儲實例
      const dataStore = useDataStore();

      // 📑 分頁狀態 (Tab States)
      /** 📊 主要分頁狀態（工作/儀表板） */
      const activeTab = ref('work'); // 預設開啟工作分頁

      // 📊 當前分頁標題 (Current Tab Title)
      const currentTabTitle = computed(() => {
        switch (activeTab.value) {
          case 'work':
            return '工作分頁';
          case 'dashboard':
            return '儀表板';
          default:
            return 'AutoQ 系統';
        }
      });

      // 📊 當前圖層標題 (Current Layer Title)
      const currentLayerTitle = computed(() => {
        // 從 dataStore 獲取當前活躍的圖層
        const visibleLayers = dataStore.getAllLayers().filter(layer => layer.visible);
        if (visibleLayers.length === 0) {
          return '無開啟圖層';
        }
        // 取第一個可見圖層作為標題
        return visibleLayers[0].layerName || '未知圖層';
      });

      // ⏳ 載入狀態 (Loading States)
      // 由 Pinia store 驅動的載入狀態管理
      /** 📝 載入文字提示 */
      const loadingText = ref('載入中...');
      /** 📊 載入進度百分比 */
      const loadingProgress = ref(0);
      /** 📊 是否顯示進度條 */
      const showLoadingProgress = ref(false);
      /** 📝 載入子文字說明 */
      const loadingSubText = ref('');

      /** ⏳ 是否有任何圖層正在載入 */
      const isAnyLayerLoading = computed(() =>
        dataStore.getAllLayers().some((layer) => layer.isLoading)
      );

      // 📑 分頁切換函數 (Tab Switch Functions)
      
      /**
       * 📑 切換分頁 (Switch Tab)
       * @param {string} tabName - 分頁名稱 ('work' 或 'dashboard')
       */
      const switchTab = (tabName) => {
        activeTab.value = tabName;
      };


      /**
       * 🚀 組件掛載事件 (Component Mounted Event)
       * 初始化組件
       */
      onMounted(() => {
        // 基本初始化，無需複雜的事件監聽
      });


      // 📤 返回響應式數據和函數給模板使用 (Return Reactive Data and Functions)
      return {
        // 📑 分頁狀態
        activeTab, // 當前活躍分頁
        
        // 📊 標題
        currentTabTitle, // 當前分頁標題
        currentLayerTitle, // 當前圖層標題

        // ⏳ 載入狀態
        isAnyLayerLoading, // 是否有圖層正在載入
        loadingText, // 載入文字
        loadingProgress, // 載入進度
        showLoadingProgress, // 是否顯示進度條
        loadingSubText, // 載入子文字

        // 🔧 功能函數
        switchTab, // 切換分頁
      };
    },
  };
</script>

<template>
  <!-- 🏠 HomeView.vue - 首頁視圖組件 (簡化版) -->
  <!-- 只包含 WorkTab 和 DashboardTab 的簡潔界面 -->
  <div id="app" class="d-flex flex-column vh-100">
    <!-- 📥 載入覆蓋層 (Loading Overlay) -->
    <LoadingOverlay
      :isVisible="isAnyLayerLoading"
      :loadingText="loadingText"
      :progress="loadingProgress"
      :showProgress="showLoadingProgress"
      :subText="loadingSubText"
    />

    <!-- 🚀 路由視圖區域 (Router View Area) -->
    <div v-if="$route.path !== '/'" class="h-100">
      <router-view />
    </div>

    <!-- 🏠 首頁內容區域 (Home Page Content Area) -->
    <div v-if="$route.path === '/'" class="h-100 d-flex flex-column">
      <!-- 📊 標題區域 (Header Area) -->
      <div class="my-bgcolor-gray-100 p-3 border-bottom">
        <div class="d-flex align-items-center justify-content-between">
          <h3 class="my-title-lg-black mb-0">{{ currentTabTitle }}</h3>
          <div class="my-title-sm-gray">
            目前圖層：{{ currentLayerTitle }}
          </div>
        </div>
      </div>

      <!-- 📑 分頁導航 (Tab Navigation) -->
      <div class="my-bgcolor-white border-bottom">
        <ul class="nav nav-tabs nav-fill">
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'work' }"
              @click="switchTab('work')"
              type="button"
            >
              🔧 工作分頁
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'dashboard' }"
              @click="switchTab('dashboard')"
              type="button"
            >
              📊 儀表板
            </button>
          </li>
        </ul>
      </div>

      <!-- 📊 內容區域 (Content Area) -->
      <div class="flex-grow-1 overflow-hidden">
        <!-- 🔧 工作分頁內容 -->
        <div v-if="activeTab === 'work'" class="h-100">
          <WorkTab />
        </div>

        <!-- 📊 儀表板分頁內容 -->
        <div v-if="activeTab === 'dashboard'" class="h-100">
          <DashboardTab />
        </div>
      </div>

      <!-- 🦶 頁腳區域 (Footer Area) -->
      <footer class="my-bgcolor-gray-800 my-title-sm-white p-2 d-flex justify-content-between">
        <small>臺灣大學地理環境資源學系</small>
        <small>2025</small>
      </footer>
    </div>
  </div>
</template>

<style>
  /**
 * 🎨 應用程式全域樣式 (Application Global Styles)
 *
 * 引入共用 CSS 並定義全域樣式，主要使用 Bootstrap 佈局系統
 */
  @import '../assets/css/common.css';

  /* 📱 HomeView 專用樣式 (HomeView Specific Styles) */
  /* 其他通用樣式已移至 common.css 中統一管理 */
</style>
