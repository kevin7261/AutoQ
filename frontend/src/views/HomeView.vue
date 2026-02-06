<script>
  /**
   * HomeView - 標題 AutoQ；右上角「工作」「儀表板」按鈕開啟 tab，X 關閉；tab 列可切換與個別關閉。
   */
  import { ref, computed } from 'vue';
  import LoadingOverlay from '../components/LoadingOverlay.vue';
  import WorkTab from '../tabs/WorkTab.vue';
  import DashboardTab from '../tabs/DashboardTab.vue';

  const TAB_LABELS = { work: '🔧 工作分頁', dashboard: '📊 儀表板' };

  export default {
    name: 'HomeView',
    components: { LoadingOverlay, WorkTab, DashboardTab },

    setup() {
      const openTabs = ref([]);
      const activeTab = ref(null);

      const hasOpenTabs = computed(() => openTabs.value.length > 0);

      const openTab = (name) => {
        if (!openTabs.value.includes(name)) {
          openTabs.value = [...openTabs.value, name];
        }
        activeTab.value = name;
      };

      const switchTab = (name) => {
        if (openTabs.value.includes(name)) activeTab.value = name;
      };

      const closeTab = (name) => {
        openTabs.value = openTabs.value.filter((t) => t !== name);
        if (activeTab.value === name) {
          activeTab.value = openTabs.value.length ? openTabs.value[openTabs.value.length - 1] : null;
        }
      };

      const closeTabBar = () => {
        openTabs.value = [];
        activeTab.value = null;
      };

      return {
        TAB_LABELS,
        openTabs,
        activeTab,
        hasOpenTabs,
        openTab,
        switchTab,
        closeTab,
        closeTabBar,
      };
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
      <header class="my-bgcolor-gray-100 p-3 border-bottom d-flex align-items-center justify-content-between">
        <h3 class="my-title-lg-black mb-0">AutoQ</h3>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="openTab('work')">
            工作
          </button>
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="openTab('dashboard')">
            儀表板
          </button>
          <button
            v-if="hasOpenTabs"
            class="btn btn-sm btn-outline-danger"
            type="button"
            title="關閉"
            @click="closeTabBar"
          >
            ✕
          </button>
        </div>
      </header>

      <template v-if="hasOpenTabs">
        <nav class="my-bgcolor-white border-bottom">
          <ul class="nav nav-tabs nav-fill">
            <li v-for="name in openTabs" :key="name" class="nav-item">
              <div
                class="nav-link d-inline-flex align-items-center gap-1 py-2"
                :class="{ active: activeTab === name }"
                style="cursor: pointer"
              >
                <span @click="switchTab(name)">{{ TAB_LABELS[name] }}</span>
                <button
                  type="button"
                  class="btn btn-link p-0 border-0 text-muted text-decoration-none"
                  style="font-size: 1rem; line-height: 1"
                  title="關閉此分頁"
                  @click.stop="closeTab(name)"
                >
                  ✕
                </button>
              </div>
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
      </template>
    </div>
  </div>
</template>

<style>
  @import '../assets/css/common.css';
</style>
