/**
 * 📦 數據存儲模組 (Data Store Module) - Pinia Store
 *
 * 簡化版：僅保留基本 store 結構，供日後擴充使用。
 *
 * @file dataStore.js
 * @version 4.0.0
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDataStore = defineStore(
  'data',
  () => {
    // 預留給日後擴充的狀態
    const _placeholder = ref(null);

    return {
      _placeholder,
    };
  },
  {
    persist: true,
  }
);
