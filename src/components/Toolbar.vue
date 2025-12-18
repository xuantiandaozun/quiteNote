<script setup>
const props = defineProps({
  showClearConfirm: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['copy', 'clear', 'new-note'])
</script>

<template>
  <footer class="toolbar">
    <div class="toolbar-content">
      <!-- New Note Button -->
      <button 
        class="toolbar-btn new-btn"
        @click="emit('new-note')"
        aria-label="新建笔记"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <span class="btn-text">新建</span>
      </button>
      
      <!-- Copy Button -->
      <button 
        class="toolbar-btn"
        @click="emit('copy')"
        aria-label="复制全文"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="btn-text">复制</span>
      </button>
      
      <!-- Clear Button -->
      <button 
        class="toolbar-btn"
        :class="{ 'danger': showClearConfirm }"
        @click="emit('clear')"
        aria-label="清除内容"
      >
        <svg v-if="!showClearConfirm" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="btn-text">{{ showClearConfirm ? '确认清除？' : '清除' }}</span>
      </button>
    </div>
  </footer>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md) var(--space-lg);
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-bg-tertiary);
  height: 4rem;
  flex-shrink: 0;
}

.toolbar-content {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  min-width: 5.5rem;
  justify-content: center;
}

.toolbar-btn:hover {
  background-color: var(--color-bg-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.toolbar-btn:active {
  transform: translateY(0);
}

/* New Button Style */
.toolbar-btn.new-btn {
  background: var(--color-accent);
  color: white;
}

.toolbar-btn.new-btn:hover {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-lg);
}

.toolbar-btn.danger {
  background-color: var(--color-danger);
  color: white;
  animation: shake 0.3s ease-in-out;
}

.toolbar-btn.danger:hover {
  background-color: #dc2626;
}

.icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.btn-text {
  white-space: nowrap;
}

/* Shake animation for confirm state */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .toolbar {
    padding: var(--space-sm) var(--space-md);
    height: 3.5rem;
  }
  
  .toolbar-content {
    gap: var(--space-sm);
    width: 100%;
    justify-content: center;
  }
  
  .toolbar-btn {
    flex: 1;
    max-width: 7rem;
    min-width: 4rem;
    padding: var(--space-sm) var(--space-md);
  }
}

@media (max-width: 480px) {
  .btn-text {
    font-size: var(--font-size-xs);
  }
  
  .toolbar-btn {
    min-width: 3.5rem;
    padding: var(--space-sm);
  }
}

/* Sticky toolbar on mobile when keyboard is open */
@media (max-width: 768px) {
  .toolbar {
    position: sticky;
    bottom: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
    background-color: rgba(var(--color-bg-secondary-rgb), 0.95);
  }
}
</style>
