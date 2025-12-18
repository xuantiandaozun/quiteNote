<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { 
  createNote, 
  getNote, 
  getNotesList, 
  saveNoteContent, 
  deleteNote,
  getCurrentNoteId,
  setCurrentNoteId,
  migrateFromSingleNote,
  searchNotes
} from './utils/notesStorage'
import { initSync, broadcastUpdate, closeSync } from './utils/sync'
import { debounce, copyToClipboard, formatNumber } from './utils/helpers'
import StatusBar from './components/StatusBar.vue'
import Toolbar from './components/Toolbar.vue'
import NotesSidebar from './components/NotesSidebar.vue'

// State
const content = ref('')
const currentNoteId = ref(null)
const notes = ref([])
const filteredNotes = ref([])
const isSaving = ref(false)
const isSaved = ref(true)
const theme = ref('dark')
const charCount = ref(0)
const showClearConfirm = ref(false)
const clearConfirmTimer = ref(null)
const textareaRef = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const sidebarVisible = ref(false)
const isLoading = ref(true)

// 当前笔记标题
const currentNoteTitle = computed(() => {
  const note = notes.value.find(n => n.id === currentNoteId.value)
  return note?.title || 'QuickNote'
})

// Auto-save with debounce
const debouncedSave = debounce(async () => {
  if (!currentNoteId.value) return
  
  isSaving.value = true
  const success = await saveNoteContent(currentNoteId.value, content.value)
  isSaving.value = false
  isSaved.value = success
  
  if (success) {
    // 更新笔记列表
    await refreshNotesList()
    // Broadcast to other tabs
    broadcastUpdate({ noteId: currentNoteId.value, content: content.value })
  }
}, 800)

// Watch content changes
watch(content, (newValue) => {
  charCount.value = newValue.length
  isSaved.value = false
  debouncedSave()
})

// 刷新笔记列表
async function refreshNotesList() {
  notes.value = await getNotesList()
  filteredNotes.value = notes.value
}

// 加载笔记
async function loadNoteById(id) {
  if (!id) return
  
  const note = await getNote(id)
  if (note) {
    content.value = note.content
    charCount.value = note.content.length
    currentNoteId.value = id
    await setCurrentNoteId(id)
    isSaved.value = true
  }
}

// 创建新笔记
async function handleCreateNote() {
  sidebarVisible.value = false
  const note = await createNote('')
  currentNoteId.value = note.id
  content.value = ''
  charCount.value = 0
  isSaved.value = true
  await refreshNotesList()
  
  // 聚焦到文本框
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
  
  showToastMessage('已创建新笔记')
}

// 选择笔记
async function handleSelectNote(noteId) {
  if (noteId === currentNoteId.value) return
  await loadNoteById(noteId)
}

// 删除笔记
async function handleDeleteNote(noteId) {
  const success = await deleteNote(noteId)
  if (success) {
    await refreshNotesList()
    
    // 如果删除的是当前笔记
    if (noteId === currentNoteId.value) {
      if (notes.value.length > 0) {
        await loadNoteById(notes.value[0].id)
      } else {
        // 没有笔记了，创建一个新的
        await handleCreateNote()
      }
    }
    
    showToastMessage('笔记已删除')
  }
}

// 搜索笔记
async function handleSearchNotes(query) {
  filteredNotes.value = await searchNotes(query)
}

// Load initial data
onMounted(async () => {
  isLoading.value = true
  
  // 迁移旧数据
  await migrateFromSingleNote()
  
  // 加载笔记列表
  await refreshNotesList()
  
  // 加载当前笔记或创建新笔记
  let savedNoteId = await getCurrentNoteId()
  
  if (savedNoteId && notes.value.some(n => n.id === savedNoteId)) {
    await loadNoteById(savedNoteId)
  } else if (notes.value.length > 0) {
    await loadNoteById(notes.value[0].id)
  } else {
    // 没有笔记，创建一个
    await handleCreateNote()
  }
  
  isLoading.value = false
  
  // Auto-focus textarea
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
  
  // Initialize multi-tab sync
  initSync((data) => {
    if (data.noteId === currentNoteId.value && data.content !== content.value) {
      content.value = data.content
    }
    // 刷新笔记列表
    refreshNotesList()
  })
  
  // Load theme preference
  const savedTheme = localStorage.getItem('quicknote-theme')
  if (savedTheme) {
    theme.value = savedTheme
    applyTheme(savedTheme)
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
    applyTheme(theme.value)
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('quicknote-theme')) {
      theme.value = e.matches ? 'dark' : 'light'
      applyTheme(theme.value)
    }
  })
})

onUnmounted(() => {
  closeSync()
  if (clearConfirmTimer.value) {
    clearTimeout(clearConfirmTimer.value)
  }
})

// Theme toggle
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(theme.value)
  localStorage.setItem('quicknote-theme', theme.value)
}

function applyTheme(newTheme) {
  document.documentElement.setAttribute('data-theme', newTheme)
}

// Toggle sidebar
function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

// Copy to clipboard
async function handleCopy() {
  if (!content.value) {
    showToastMessage('没有内容可复制')
    return
  }
  
  const success = await copyToClipboard(content.value)
  if (success) {
    showToastMessage('已复制到剪贴板')
  } else {
    showToastMessage('复制失败')
  }
}

// Clear content
async function handleClear() {
  if (!showClearConfirm.value) {
    showClearConfirm.value = true
    clearConfirmTimer.value = setTimeout(() => {
      showClearConfirm.value = false
    }, 3000)
  } else {
    // Confirmed clear
    content.value = ''
    if (currentNoteId.value) {
      await saveNoteContent(currentNoteId.value, '')
      await refreshNotesList()
    }
    showClearConfirm.value = false
    if (clearConfirmTimer.value) {
      clearTimeout(clearConfirmTimer.value)
    }
    showToastMessage('已清除内容')
    
    // Re-focus textarea
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus()
      }
    })
  }
}

// Toast notification
function showToastMessage(message) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// Handle paste - strip formatting
function handlePaste(event) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  
  // Insert at cursor position
  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = content.value.substring(0, start)
  const after = content.value.substring(end)
  
  content.value = before + text + after
  
  // Restore cursor position
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length
  })
}
</script>

<template>
  <div class="app-container" :class="{ loading: isLoading }">
    <!-- Loading Overlay -->
    <Transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </Transition>
    
    <!-- Notes Sidebar -->
    <NotesSidebar
      :notes="filteredNotes"
      :current-note-id="currentNoteId"
      :is-visible="sidebarVisible"
      @select-note="handleSelectNote"
      @create-note="handleCreateNote"
      @delete-note="handleDeleteNote"
      @search="handleSearchNotes"
      @close="sidebarVisible = false"
    />
    
    <!-- Status Bar -->
    <StatusBar 
      :char-count="charCount"
      :is-saving="isSaving"
      :is-saved="isSaved"
      :theme="theme"
      :note-title="currentNoteTitle"
      :notes-count="notes.length"
      @toggle-theme="toggleTheme"
      @toggle-sidebar="toggleSidebar"
    />
    
    <!-- Main Editor -->
    <main class="editor-container">
      <textarea
        ref="textareaRef"
        v-model="content"
        class="editor-textarea"
        placeholder="开始记录..."
        spellcheck="false"
        @paste="handlePaste"
      ></textarea>
    </main>
    
    <!-- Toolbar -->
    <Toolbar 
      :show-clear-confirm="showClearConfirm"
      @copy="handleCopy"
      @clear="handleClear"
      @new-note="handleCreateNote"
    />
    
    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="showToast" class="toast">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.app-container.loading {
  pointer-events: none;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-bg-tertiary);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.editor-container {
  flex: 1;
  display: flex;
  padding: var(--space-md);
  overflow: hidden;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  padding: var(--space-lg);
  font-family: var(--font-family);
  font-size: var(--font-size-lg);
  line-height: 1.8;
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;
}

.editor-textarea::placeholder {
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-md) var(--space-xl);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-base);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* Mobile optimization */
@media (max-width: 768px) {
  .editor-container {
    padding: var(--space-sm);
  }
  
  .editor-textarea {
    padding: var(--space-md);
    font-size: var(--font-size-base);
    /* Prevent zoom on iOS */
    font-size: max(16px, var(--font-size-base));
  }
  
  .toast {
    bottom: 4rem;
  }
}
</style>
