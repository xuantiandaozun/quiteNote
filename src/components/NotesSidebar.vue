<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  currentNoteId: {
    type: String,
    default: null
  },
  isVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'select-note',
  'create-note',
  'delete-note',
  'close',
  'search'
])

const searchQuery = ref('')
const showDeleteConfirm = ref(null)

// 格式化日期
function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

// 搜索处理
watch(searchQuery, (value) => {
  emit('search', value)
})

// 选择笔记
function selectNote(note) {
  emit('select-note', note.id)
  emit('close')
}

// 删除笔记确认
function confirmDelete(noteId, event) {
  event.stopPropagation()
  if (showDeleteConfirm.value === noteId) {
    emit('delete-note', noteId)
    showDeleteConfirm.value = null
  } else {
    showDeleteConfirm.value = noteId
    // 3秒后自动取消确认状态
    setTimeout(() => {
      if (showDeleteConfirm.value === noteId) {
        showDeleteConfirm.value = null
      }
    }, 3000)
  }
}
</script>

<template>
  <Transition name="sidebar">
    <aside v-if="isVisible" class="notes-sidebar">
      <div class="sidebar-overlay" @click="emit('close')"></div>
      
      <div class="sidebar-content">
        <!-- Header -->
        <header class="sidebar-header">
          <h2 class="sidebar-title">我的笔记</h2>
          <button class="close-btn" @click="emit('close')" aria-label="关闭侧边栏">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>
        
        <!-- Search -->
        <div class="search-container">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              v-model="searchQuery"
              type="text" 
              class="search-input" 
              placeholder="搜索笔记..."
            >
          </div>
        </div>
        
        <!-- New Note Button -->
        <button class="new-note-btn" @click="emit('create-note')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>新建笔记</span>
        </button>
        
        <!-- Notes List -->
        <div class="notes-list">
          <div v-if="notes.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p>{{ searchQuery ? '未找到匹配的笔记' : '还没有笔记' }}</p>
            <button v-if="!searchQuery" class="create-first-btn" @click="emit('create-note')">
              创建第一个笔记
            </button>
          </div>
          
          <div 
            v-for="note in notes" 
            :key="note.id"
            class="note-item"
            :class="{ active: note.id === currentNoteId }"
            @click="selectNote(note)"
          >
            <div class="note-info">
              <h3 class="note-title">{{ note.title }}</h3>
              <p class="note-preview">{{ note.preview || '空笔记' }}</p>
              <time class="note-time">{{ formatDate(note.updatedAt) }}</time>
            </div>
            <button 
              class="delete-btn"
              :class="{ confirm: showDeleteConfirm === note.id }"
              @click="confirmDelete(note.id, $event)"
              :aria-label="showDeleteConfirm === note.id ? '确认删除' : '删除笔记'"
            >
              <svg v-if="showDeleteConfirm !== note.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Footer -->
        <footer class="sidebar-footer">
          <span class="notes-count">共 {{ notes.length }} 个笔记</span>
        </footer>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.notes-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
}

.sidebar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.sidebar-content {
  position: relative;
  width: 320px;
  max-width: 85vw;
  height: 100%;
  background-color: var(--color-bg-secondary);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-bg-tertiary);
}

.sidebar-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background-color: transparent;
  border-radius: var(--radius-md);
}

.close-btn svg {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-secondary);
}

.close-btn:hover {
  background-color: var(--color-bg-tertiary);
}

.close-btn:hover svg {
  color: var(--color-text-primary);
}

/* Search */
.search-container {
  padding: var(--space-md) var(--space-lg);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--space-md);
  width: 1rem;
  height: 1rem;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md) var(--space-sm) 2.5rem;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-base);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-input:focus {
  border-color: var(--color-accent);
  background-color: var(--color-bg-primary);
}

/* New Note Button */
.new-note-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin: 0 var(--space-lg) var(--space-md);
  padding: var(--space-md);
  font-weight: 500;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  color: white;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.new-note-btn svg {
  width: 1rem;
  height: 1rem;
}

.new-note-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Notes List */
.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-md);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-lg);
  text-align: center;
  color: var(--color-text-tertiary);
}

.empty-state svg {
  width: 3rem;
  height: 3rem;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-state p {
  margin-bottom: var(--space-md);
  font-size: var(--font-size-sm);
}

.create-first-btn {
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-sm);
  background-color: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
}

/* Note Item */
.note-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1px solid transparent;
}

.note-item:hover {
  background-color: var(--color-bg-tertiary);
}

.note-item.active {
  border-color: var(--color-accent);
  background-color: rgba(99, 102, 241, 0.1);
}

.note-info {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-preview {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.note-time {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
}

/* Delete Button */
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  flex-shrink: 0;
  background-color: transparent;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all var(--transition-base);
}

.note-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn svg {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-text-secondary);
}

.delete-btn:hover {
  background-color: var(--color-bg-tertiary);
}

.delete-btn:hover svg {
  color: var(--color-danger);
}

.delete-btn.confirm {
  opacity: 1;
  background-color: var(--color-danger);
  animation: shake 0.3s ease-in-out;
}

.delete-btn.confirm svg {
  color: white;
}

/* Footer */
.sidebar-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--color-bg-tertiary);
  text-align: center;
}

.notes-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* Animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

/* Sidebar Transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all var(--transition-base);
}

.sidebar-enter-active .sidebar-overlay,
.sidebar-leave-active .sidebar-overlay {
  transition: opacity var(--transition-base);
}

.sidebar-enter-active .sidebar-content,
.sidebar-leave-active .sidebar-content {
  transition: transform var(--transition-base);
}

.sidebar-enter-from .sidebar-overlay,
.sidebar-leave-to .sidebar-overlay {
  opacity: 0;
}

.sidebar-enter-from .sidebar-content,
.sidebar-leave-to .sidebar-content {
  transform: translateX(-100%);
}

/* Mobile */
@media (max-width: 480px) {
  .sidebar-content {
    width: 100%;
    max-width: none;
  }
}
</style>
