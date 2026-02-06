/**
 * Pinia store，預留擴充用。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDataStore = defineStore(
  'data',
  () => {
    const _placeholder = ref(null);
    return { _placeholder };
  },
  { persist: true }
);
