<script>
  /**
   * 🏠 HomeView.vue - AutoQ 系統主頁面 (簡化版)
   *
   * 功能說明：
   * 1. 📊 提供 WorkTab 和 DashboardTab 的主要介面
   * 2. 🔄 管理分頁切換
   * 3. 📑 顯示當前分頁標題
   *
   * @component HomeView
   * @version 4.0.0
   */

  import { ref, computed, onMounted } from 'vue';
  import LoadingOverlay from '../components/LoadingOverlay.vue';
  import WorkTab from '../tabs/WorkTab.vue';
  import DashboardTab from '../tabs/DashboardTab.vue';

  export default {
    name: 'HomeView',
    components: {
      LoadingOverlay,
      WorkTab,
      DashboardTab,
    },

    setup() {
      const activeTab = ref('work');

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

      const switchTab = (tabName) => {
        activeTab.value = tabName;
      };

      onMounted(() => {});

      return {
        activeTab,
        currentTabTitle,
        switchTab,
      };
    },
  };
</script>

<template>
  <div id="app" class="d-flex flex-column vh-100">
    <LoadingOverlay
      :isVisible="false"
      loadingText="載入中..."
      :progress="0"
      :showProgress="false"
      subText=""
    />

    <div v-if="$route.path !== '/'" class="h-100">
      <router-view />
    </div>

    <div v-if="$route.path === '/'" class="h-100 d-flex flex-column">
      <div class="my-bgcolor-gray-100 p-3 border-bottom">
        <h3 class="my-title-lg-black mb-0">{{ currentTabTitle }}</h3>
      </div>

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

      <div class="flex-grow-1 overflow-hidden">
        <div v-if="activeTab === 'work'" class="h-100">
          <WorkTab />
        </div>
        <div v-if="activeTab === 'dashboard'" class="h-100">
          <DashboardTab />
        </div>
      </div>

      <footer class="my-bgcolor-gray-800 my-title-sm-white p-2 d-flex justify-content-between">
        <small>臺灣大學地理環境資源學系</small>
        <small>2026</small>
      </footer>
    </div>
  </div>
</template>

<style>
  @import '../assets/css/common.css';
</style>
