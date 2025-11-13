import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

export interface RealtimeData {
  type: 'realtime'
  device_id: string
  online: boolean
  lastUpdate: string
  pg: number
  pa: number
  pp: number
  pag: number
  ppg: number
  timestamp: string
}

export function useWebSocket() {
  const socket = ref<Socket | null>(null)
  const connected = ref(false)
  const realtimeData = ref<RealtimeData | null>(null)
  const error = ref<string | null>(null)

  /**
   * 連接 WebSocket
   */
  function connect(deviceId: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://72.61.117.219:3000'

    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`)

    socket.value = io(wsUrl, {
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      console.log('✅ WebSocket connected')
      connected.value = true
      error.value = null

      // 加入設備房間
      socket.value?.emit('join_device', deviceId)
      console.log(`📥 Joined device room: ${deviceId}`)
    })

    socket.value.on('disconnect', (reason: string) => {
      console.log(`❌ WebSocket disconnected: ${reason}`)
      connected.value = false
    })

    socket.value.on('realtime_data', (data: RealtimeData) => {
      console.log('📡 Received realtime data:', data)
      realtimeData.value = data
    })

    socket.value.on('device_status', (data: any) => {
      console.log('📢 Device status:', data)
    })

    socket.value.on('error', (err: any) => {
      console.error('⚠️ WebSocket error:', err)
      error.value = err.message || 'WebSocket error'
    })

    socket.value.on('connect_error', (err: Error) => {
      console.error('❌ Connection error:', err)
      error.value = err.message
      connected.value = false
    })

    // 心跳響應
    socket.value.on('ping', () => {
      socket.value?.emit('pong')
    })
  }

  /**
   * 離開設備房間
   */
  function leaveDevice(deviceId: string) {
    if (socket.value) {
      socket.value.emit('leave_device', deviceId)
      console.log(`📤 Left device room: ${deviceId}`)
    }
  }

  /**
   * 切換設備
   */
  function switchDevice(oldDeviceId: string, newDeviceId: string) {
    leaveDevice(oldDeviceId)
    socket.value?.emit('join_device', newDeviceId)
    console.log(`🔄 Switched from ${oldDeviceId} to ${newDeviceId}`)
  }

  /**
   * 斷開連接
   */
  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
      console.log('🔌 WebSocket disconnected')
    }
  }

  // 組件卸載時自動斷開
  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    connected,
    realtimeData,
    error,
    connect,
    leaveDevice,
    switchDevice,
    disconnect
  }
}
