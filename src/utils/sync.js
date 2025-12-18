const CHANNEL_NAME = 'quicknote-sync'

let broadcastChannel = null

/**
 * 初始化 BroadcastChannel
 * @param {Function} onMessage - 接收到消息时的回调函数
 */
export function initSync(onMessage) {
    if (typeof BroadcastChannel === 'undefined') {
        console.warn('BroadcastChannel is not supported in this browser')
        return
    }

    broadcastChannel = new BroadcastChannel(CHANNEL_NAME)

    broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'content-update') {
            // 支持多笔记同步，传递完整的数据对象
            onMessage(event.data.data || event.data.content)
        } else if (event.data && event.data.type === 'notes-update') {
            // 笔记列表更新通知
            onMessage(event.data.data)
        }
    }
}

/**
 * 广播内容更新到其他标签页
 * @param {object|string} data - 更新的数据 { noteId, content } 或内容字符串
 */
export function broadcastUpdate(data) {
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'content-update',
            data: typeof data === 'string' ? { content: data } : data,
            timestamp: Date.now()
        })
    }
}

/**
 * 广播笔记列表更新
 */
export function broadcastNotesListUpdate() {
    if (broadcastChannel) {
        broadcastChannel.postMessage({
            type: 'notes-update',
            data: { refresh: true },
            timestamp: Date.now()
        })
    }
}

/**
 * 关闭 BroadcastChannel
 */
export function closeSync() {
    if (broadcastChannel) {
        broadcastChannel.close()
        broadcastChannel = null
    }
}
