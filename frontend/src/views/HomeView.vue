<script>
  /**
   * HomeView - 主頁面：標題 AutoQ、分頁導航、WorkTab / DashboardTab 內容區。
   */
  import { ref } from 'vue';
  import LoadingOverlay from '../components/LoadingOverlay.vue';
  import WorkTab from '../tabs/WorkTab.vue';
  import DashboardTab from '../tabs/DashboardTab.vue';

  export default {
    name: 'HomeView',
    components: { LoadingOverlay, WorkTab, DashboardTab },

    setup() {
      const activeTab = ref('work');
      const switchTab = (tabName) => {
        activeTab.value = tabName;
      };
      return { activeTab, switchTab };
    },
  };
</script>

<template>
  <div class="d-flex flex-column vh-100">
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
      <header class="my-bgcolor-gray-100 p-3 border-bottom">
        <h3 class="my-title-lg-black mb-0">AutoQ</h3>
      </header>

      <nav class="my-bgcolor-white border-bottom">
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
      </nav>

      <main class="flex-grow-1 overflow-hidden">
        <div v-show="activeTab === 'work'" class="h-100">
          <WorkTab />
        </div>
        <div v-show="activeTab === 'dashboard'" class="h-100">
          <DashboardTab />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
  @import '../assets/css/common.css';
</style>
