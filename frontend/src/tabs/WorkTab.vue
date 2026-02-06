<script setup>
  /**
   * 📄 WorkTab.vue - 工作分頁組件
   * @component WorkTab
   * @version 2.0.0
   */
</script>

<template>
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-4">
      <div class="my-bgcolor-gray-100 rounded p-4 text-start">
        <h6 class="my-title-sm-black mb-3">🔧 工作分頁</h6>

        <div class="mb-3">
          <div class="my-title-xs-gray pb-1">當前工作狀態</div>
          <div class="my-content-sm-black pb-1">準備中</div>
        </div>

        <div class="mb-3">
          <div class="my-title-xs-gray pb-1">支援的文件格式</div>
          <div class="my-content-sm-black pb-1">GeoJSON, Shapefile, KML, CSV</div>
        </div>

        <div class="mb-3">
          <div class="my-title-xs-gray pb-1">工作區功能</div>
          <div class="my-content-sm-black pb-1">
            - 數據處理與分析<br />
            - 屬性查詢與篩選<br />
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
      </div>
    </div>
  </div>
</template>

<style scoped></style>
