<script>
  /**
   * LoadingOverlay - 全螢幕載入遮罩。Props: isVisible, loadingText, progress, showProgress, subText。
   */
  export default {
    name: 'LoadingOverlay',
    props: {
      isVisible: { type: Boolean, default: false, required: true },
      loadingText: { type: String, default: '載入中...' },
      progress: {
        type: Number,
        default: -1,
        validator: (v) => v >= -1 && v <= 100,
      },
      showProgress: { type: Boolean, default: false },
      subText: { type: String, default: '' },
    },
  };
</script>

<template>
  <div
    v-if="isVisible"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center my-loading-overlay-backdrop"
  >
    <div class="text-center my-bgcolor-white p-4 rounded shadow my-loading-overlay-panel">
      <div class="spinner-border text-primary mb-3 my-loading-spinner" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <div class="my-title-lg-black">{{ loadingText }}</div>
      <div class="mt-3" v-if="showProgress && progress >= 0">
        <div class="progress my-loading-progress">
          <div
            class="progress-bar bg-primary d-flex align-items-center justify-content-center my-loading-progress-bar"
            role="progressbar"
            :style="{ '--my-loading-progress-pct': progress + '%' }"
            :aria-valuenow="progress"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {{ Math.round(progress) }}%
          </div>
        </div>
      </div>
      <div v-if="subText" class="mt-2">
        <small class="my-content-xs-gray">{{ subText }}</small>
      </div>
    </div>
  </div>
</template>
