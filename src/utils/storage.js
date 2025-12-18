import { get, set } from 'idb-keyval'

const STORAGE_KEY = 'quicknote-content'
const LAST_SAVED_KEY = 'quicknote-last-saved'

/**
 * 从 IndexedDB 加载笔记内容
 * @returns {Promise<string>} 笔记内容
 */
export async function loadNote() {
    try {
        const content = await get(STORAGE_KEY)
        return content || ''
    } catch (error) {
        console.error('Failed to load note:', error)
        return ''
    }
}

/**
 * 保存笔记内容到 IndexedDB
 * @param {string} content - 笔记内容
 * @returns {Promise<boolean>} 是否保存成功
 */
export async function saveNote(content) {
    try {
        await set(STORAGE_KEY, content)
        await set(LAST_SAVED_KEY, new Date().toISOString())
        return true
    } catch (error) {
        console.error('Failed to save note:', error)
        return false
    }
}

/**
 * 获取最后保存时间
 * @returns {Promise<string|null>} ISO 格式的时间字符串
 */
export async function getLastSavedTime() {
    try {
        return await get(LAST_SAVED_KEY)
    } catch (error) {
        console.error('Failed to get last saved time:', error)
        return null
    }
}

/**
 * 清除所有笔记数据
 * @returns {Promise<boolean>} 是否清除成功
 */
export async function clearNote() {
    try {
        await set(STORAGE_KEY, '')
        await set(LAST_SAVED_KEY, new Date().toISOString())
        return true
    } catch (error) {
        console.error('Failed to clear note:', error)
        return false
    }
}
