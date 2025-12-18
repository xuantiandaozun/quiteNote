import { get, set, keys, del } from 'idb-keyval'

const NOTES_LIST_KEY = 'quicknote-notes-list'
const NOTE_PREFIX = 'quicknote-note-'
const CURRENT_NOTE_KEY = 'quicknote-current-note'

/**
 * 生成唯一 ID
 * @returns {string}
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 从内容中提取标题（取第一行或前30个字符）
 * @param {string} content 
 * @returns {string}
 */
export function extractTitle(content) {
    if (!content || content.trim() === '') {
        return '无标题笔记'
    }
    // 获取第一行
    const firstLine = content.split('\n')[0].trim()
    // 移除 Markdown 标题符号
    const cleanLine = firstLine.replace(/^#+\s*/, '')
    // 截取前30个字符
    return cleanLine.substring(0, 30) || '无标题笔记'
}

/**
 * 创建新笔记
 * @param {string} content 初始内容
 * @returns {Promise<Object>} 新笔记对象
 */
export async function createNote(content = '') {
    const id = generateId()
    const now = new Date().toISOString()
    
    const note = {
        id,
        title: extractTitle(content),
        content,
        createdAt: now,
        updatedAt: now
    }
    
    try {
        // 保存笔记内容
        await set(`${NOTE_PREFIX}${id}`, note)
        
        // 更新笔记列表
        const list = await getNotesList()
        list.unshift({
            id,
            title: note.title,
            createdAt: now,
            updatedAt: now,
            preview: content.substring(0, 100)
        })
        await set(NOTES_LIST_KEY, list)
        
        // 设置为当前笔记
        await setCurrentNoteId(id)
        
        return note
    } catch (error) {
        console.error('Failed to create note:', error)
        throw error
    }
}

/**
 * 获取笔记列表（包含摘要信息）
 * @returns {Promise<Array>}
 */
export async function getNotesList() {
    try {
        const list = await get(NOTES_LIST_KEY)
        return list || []
    } catch (error) {
        console.error('Failed to get notes list:', error)
        return []
    }
}

/**
 * 获取单个笔记
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export async function getNote(id) {
    try {
        const note = await get(`${NOTE_PREFIX}${id}`)
        return note || null
    } catch (error) {
        console.error('Failed to get note:', error)
        return null
    }
}

/**
 * 保存笔记
 * @param {string} id 
 * @param {string} content 
 * @returns {Promise<boolean>}
 */
export async function saveNoteContent(id, content) {
    try {
        const note = await getNote(id)
        if (!note) {
            console.error('Note not found:', id)
            return false
        }
        
        const now = new Date().toISOString()
        const newTitle = extractTitle(content)
        
        // 更新笔记
        note.content = content
        note.title = newTitle
        note.updatedAt = now
        await set(`${NOTE_PREFIX}${id}`, note)
        
        // 更新列表中的摘要信息
        const list = await getNotesList()
        const index = list.findIndex(n => n.id === id)
        if (index !== -1) {
            list[index].title = newTitle
            list[index].updatedAt = now
            list[index].preview = content.substring(0, 100)
            await set(NOTES_LIST_KEY, list)
        }
        
        return true
    } catch (error) {
        console.error('Failed to save note:', error)
        return false
    }
}

/**
 * 删除笔记
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function deleteNote(id) {
    try {
        // 删除笔记内容
        await del(`${NOTE_PREFIX}${id}`)
        
        // 从列表中移除
        const list = await getNotesList()
        const newList = list.filter(n => n.id !== id)
        await set(NOTES_LIST_KEY, newList)
        
        // 如果删除的是当前笔记，切换到第一个笔记或清空
        const currentId = await getCurrentNoteId()
        if (currentId === id) {
            if (newList.length > 0) {
                await setCurrentNoteId(newList[0].id)
            } else {
                await setCurrentNoteId(null)
            }
        }
        
        return true
    } catch (error) {
        console.error('Failed to delete note:', error)
        return false
    }
}

/**
 * 获取当前笔记 ID
 * @returns {Promise<string|null>}
 */
export async function getCurrentNoteId() {
    try {
        return await get(CURRENT_NOTE_KEY)
    } catch (error) {
        console.error('Failed to get current note id:', error)
        return null
    }
}

/**
 * 设置当前笔记 ID
 * @param {string|null} id 
 * @returns {Promise<boolean>}
 */
export async function setCurrentNoteId(id) {
    try {
        await set(CURRENT_NOTE_KEY, id)
        return true
    } catch (error) {
        console.error('Failed to set current note id:', error)
        return false
    }
}

/**
 * 迁移旧的单笔记数据到多笔记系统
 * @returns {Promise<void>}
 */
export async function migrateFromSingleNote() {
    try {
        // 检查是否已经迁移过
        const list = await getNotesList()
        if (list.length > 0) {
            return // 已有笔记，无需迁移
        }
        
        // 检查旧数据
        const oldContent = await get('quicknote-content')
        if (oldContent && oldContent.trim() !== '') {
            // 创建新笔记
            await createNote(oldContent)
            console.log('Migrated single note to multi-note system')
        }
    } catch (error) {
        console.error('Failed to migrate from single note:', error)
    }
}

/**
 * 搜索笔记
 * @param {string} query 
 * @returns {Promise<Array>}
 */
export async function searchNotes(query) {
    if (!query || query.trim() === '') {
        return await getNotesList()
    }
    
    const list = await getNotesList()
    const lowerQuery = query.toLowerCase()
    
    // 在标题和预览中搜索
    return list.filter(note => 
        note.title.toLowerCase().includes(lowerQuery) ||
        (note.preview && note.preview.toLowerCase().includes(lowerQuery))
    )
}
