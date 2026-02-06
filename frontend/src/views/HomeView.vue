<script>
  /**
   * HomeView - 標題 AutoQ；右上角「工作」「儀表板」按鈕開啟 tab（工作可開多個）；tab 列可切換與個別關閉。
   */
  import { ref, computed } from 'vue';
  import LoadingOverlay from '../components/LoadingOverlay.vue';
  import WorkTab from '../tabs/WorkTab.vue';
  import DashboardTab from '../tabs/DashboardTab.vue';

  const TAB_LABELS = { work: '🔧 工作分頁', dashboard: '📊 儀表板' };
  let tabIdSeq = 0;

  export default {
    name: 'HomeView',
    components: { LoadingOverlay, WorkTab, DashboardTab },

    setup() {
      const tabs = ref([]);
      const activeTabId = ref(null);

      const hasOpenTabs = computed(() => tabs.value.length > 0);

      const openTab = (type) => {
        const id = `tab-${++tabIdSeq}`;
        tabs.value = [...tabs.value, { id, type }];
        activeTabId.value = id;
      };

      const switchTab = (id) => {
        if (tabs.value.some((t) => t.id === id)) activeTabId.value = id;
      };

      const closeTab = (id) => {
        const idx = tabs.value.findIndex((t) => t.id === id);
        if (idx === -1) return;
        tabs.value = tabs.value.filter((t) => t.id !== id);
        if (activeTabId.value === id) {
          const next = tabs.value[idx] ?? tabs.value[idx - 1];
          activeTabId.value = next ? next.id : null;
        }
      };

      const tabLabel = (tab) => TAB_LABELS[tab.type];

      return {
        tabs,
        activeTabId,
        hasOpenTabs,
        openTab,
        switchTab,
        closeTab,
        tabLabel,
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

    <div class="h-100 d-flex flex-column">
      <header class="my-bgcolor-gray-100 p-3 border-bottom d-flex align-items-center justify-content-between">
        <h3 class="my-title-lg-black mb-0">AutoQ</h3>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="openTab('work')">
            工作
          </button>
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="openTab('dashboard')">
            儀表板
          </button>
        </div>
      </header>

      <template v-if="hasOpenTabs">
        <nav class="my-bgcolor-white border-bottom">
          <ul class="nav nav-tabs nav-fill">
            <li v-for="tab in tabs" :key="tab.id" class="nav-item">
              <div
                class="nav-link d-inline-flex align-items-center gap-1 py-2"
                :class="{ active: activeTabId === tab.id }"
                style="cursor: pointer"
              >
                <span @click="switchTab(tab.id)">{{ tabLabel(tab) }}</span>
                <button
                  type="button"
                  class="btn btn-link p-0 border-0 text-muted text-decoration-none"
                  style="font-size: 1rem; line-height: 1"
                  title="關閉此分頁"
                  @click.stop="closeTab(tab.id)"
                >
                  ✕
                </button>
              </div>
            </li>
          </ul>
        </nav>

        <main class="flex-grow-1 overflow-hidden">
          <template v-for="tab in tabs" :key="tab.id">
            <div v-show="activeTabId === tab.id" class="h-100">
              <WorkTab v-if="tab.type === 'work'" />
              <DashboardTab v-else-if="tab.type === 'dashboard'" />
            </div>
          </template>
        </main>
      </template>
    </div>
  </div>
</template>

<style>
  @import '../assets/css/common.css';
</style>
