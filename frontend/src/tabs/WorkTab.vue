<script setup>
/** 工作分頁內容。每個分頁有唯一 tabId。 */
defineProps({
  tabId: { type: String, required: true },
});
</script>

<template>
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-4">
      <div class="my-bgcolor-gray-100 rounded p-4 text-start">
        <h6 class="my-title-sm-black mb-3">🔧 工作分頁 <span class="my-content-sm-black">(ID: {{ tabId }})</span></h6>

      </div>
    </div>
  </div>
</template>
