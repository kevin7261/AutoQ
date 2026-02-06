<script setup>
/** 儀表板分頁內容。 */
</script>

<template>
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-4">
      <div class="my-bgcolor-gray-100 rounded p-4 text-start">
        <h6 class="my-title-sm-black mb-3">📊 儀表板</h6>
        <div class="d-flex">
          <div class="flex-grow-1 mb-3 me-2">
            <div class="card">
              <div class="card-body">
                <h6 class="card-title my-title-xs-gray">系統統計</h6>
                <div class="my-content-sm-black">
                  <div class="d-flex justify-content-between mb-1">
                    <span>數據點總數：</span>
                    <strong>0</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <span>使用記憶體：</span>
                    <strong>--</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-grow-1 mb-3">
            <div class="card">
              <div class="card-body">
                <h6 class="card-title my-title-xs-gray">分析摘要</h6>
                <div class="my-content-sm-black">
                  <div class="d-flex justify-content-between mb-1">
                    <span>空間參考：</span>
                    <strong>WGS84</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <span>最後更新：</span>
                    <strong>--</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <div class="my-title-xs-gray pb-2">📈 數據品質指標</div>
          <div class="progress mb-2" style="height: 20px">
            <div class="progress-bar bg-success" role="progressbar" style="width: 85%">完整性 85%</div>
          </div>
          <div class="progress mb-2" style="height: 20px">
            <div class="progress-bar bg-info" role="progressbar" style="width: 92%">準確性 92%</div>
          </div>
          <div class="progress mb-3" style="height: 20px">
            <div class="progress-bar bg-warning" role="progressbar" style="width: 78%">時效性 78%</div>
          </div>
        </div>
        <div class="mb-3">
          <div class="my-title-xs-gray pb-1">🔍 快速操作</div>
          <div class="my-content-sm-black pb-1">
            <button class="btn btn-sm btn-outline-primary me-2 mb-1">重新整理</button>
            <button class="btn btn-sm btn-outline-success me-2 mb-1">匯出報告</button>
            <button class="btn btn-sm btn-outline-info mb-1">設定警報</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
