<script setup>
import { computed } from 'vue'
import { formatNumber } from '../utils/helpers'

const props = defineProps({
  charCount: {
    type: Number,
    default: 0
  },
  isSaving: {
    type: Boolean,
    default: false
  },
  isSaved: {
    type: Boolean,
    default: true
  },
  theme: {
    type: String,
    default: 'dark'
  },
  noteTitle: {
    type: String,
    default: 'QuickNote'
  },
  notesCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['toggle-theme', 'toggle-sidebar'])

const formattedCount = computed(() => formatNumber(props.charCount))

const saveStatus = computed(() => {
  if (props.isSaving) return 'saving'
  if (props.isSaved) return 'saved'
  return 'unsaved'
})

const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case 'saving':
      return '保存中...'
    case 'saved':
      return '已保存'
    case 'unsaved':
      return '未保存'
    default:
      return ''
  }
})

// 截断标题显示
const displayTitle = computed(() => {
  const title = props.noteTitle
  if (title.length > 20) {
    return title.substring(0, 20) + '...'
  }
  return title
})
</script>

<template>
  <header class="status-bar">
    <div class="status-left">
      <button class="menu-btn" @click="emit('toggle-sidebar')" aria-label="打开笔记列表">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span v-if="notesCount > 0" class="notes-badge">{{ notesCount }}</span>
      </button>
      <div class="app-title" :title="noteTitle">{{ displayTitle }}</div>
    </div>
    
    <div class="status-center">
      <div class="char-count">
        <span class="count-number">{{ formattedCount }}</span>
        <span class="count-label">字符</span>
      </div>
    </div>
    
    <div class="status-right">
      <!-- Save Status Indicator -->
      <div class="save-status" :class="saveStatus">
        <div class="status-dot" :class="{ pulse: isSaving }"></div>
        <span class="status-text">{{ saveStatusText }}</span>
      </div>
      
      <!-- Theme Toggle -->
      <button 
        class="theme-toggle"
        @click="emit('toggle-theme')"
        :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
      >
        <svg v-if="theme === 'dark'" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-bg-tertiary);
  height: 3.5rem;
  flex-shrink: 0;
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.status-center {
  justify-content: center;
}

.status-right {
  justify-content: flex-end;
}

/* Menu Button */
.menu-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background-color: transparent;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.menu-btn svg {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-text-secondary);
  transition: color var(--transition-base);
}

.menu-btn:hover {
  background-color: var(--color-bg-tertiary);
}

.menu-btn:hover svg {
  color: var(--color-text-primary);
}

.notes-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1rem;
  text-align: center;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  color: white;
  border-radius: var(--radius-full);
}

.app-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.char-count {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
}

.count-number {
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.count-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.save-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-text-tertiary);
  transition: background-color var(--transition-base);
}

.save-status.saved .status-dot {
  background-color: var(--color-success);
}

.save-status.saving .status-dot {
  background-color: var(--color-warning);
}

.save-status.unsaved .status-dot {
  background-color: var(--color-text-tertiary);
}

.status-dot.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.status-text {
  font-weight: 500;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background-color: transparent;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.theme-toggle:hover {
  background-color: var(--color-bg-tertiary);
}

.icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-text-secondary);
  transition: color var(--transition-base);
}

.theme-toggle:hover .icon {
  color: var(--color-text-primary);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .status-bar {
    padding: var(--space-sm) var(--space-md);
    height: 3rem;
  }
  
  .app-title {
    font-size: var(--font-size-sm);
    max-width: 100px;
  }
  
  .status-text {
    display: none;
  }
  
  .char-count {
    font-size: var(--font-size-xs);
  }
}

@media (max-width: 480px) {
  .status-left {
    flex: 0 1 auto;
    gap: var(--space-sm);
  }
  
  .status-center {
    flex: 1;
  }
  
  .app-title {
    display: none;
  }
}
</style>
