<script setup>
/** 工作分頁內容。每個分頁有唯一 tabId，內容來自 dataStore.workTabs。 */
import { computed } from 'vue';
import { useDataStore } from '../stores/dataStore.js';

const props = defineProps({
  tabId: { type: String, required: true },
});

const dataStore = useDataStore();
const workTab = computed(() => dataStore.getWorkTab(props.tabId));
</script>

<template>
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-4">
      <div class="my-bgcolor-gray-100 rounded p-4 text-start">
        <h6 class="my-title-sm-black mb-3">🔧 工作分頁 <span class="my-content-sm-black">(ID: {{ tabId }})</span></h6>
        <div v-if="workTab" class="mb-3">
          <div class="my-title-xs-gray pb-1">當前工作狀態</div>
          <div class="my-content-sm-black pb-1">{{ workTab.state }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
