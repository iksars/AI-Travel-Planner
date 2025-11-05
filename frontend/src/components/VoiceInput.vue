<template>
  <div class="voice-input-container">
    <button
      class="voice-btn"
      @click="toggleVoiceInput"
      :disabled="disabled"
      type="button"
      aria-label="语音输入开关"
    >
      <el-icon><Microphone v-if="!isRecording" /><Mute v-else /></el-icon>
    </button>
    <span class="voice-tip">{{ isRecording ? '正在录音...' : '点击开始录音' }}</span>
    <span v-if="voiceError" class="voice-error">{{ voiceError }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Microphone, Mute } from '@element-plus/icons-vue'
import apiClient from '@/api/client'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'recognized', data: { text?: string; plan?: any }): void
}>()

const voiceError = ref('')
const isRecording = ref(false)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let audioStream: MediaStream | null = null

// --- 定义具名事件处理函数 ---
const handleDataAvailable = (event: BlobEvent) => {
  if (event.data.size > 0) {
    audioChunks.push(event.data)
  }
}

const handleStop = async () => {
  isRecording.value = false
  if (audioChunks.length === 0) {
    voiceError.value = '未录制到有效音频'
    return
  }

  const mimeType = mediaRecorder?.mimeType || 'audio/webm'
  const audioBlob = new Blob(audioChunks, { type: mimeType })
  audioChunks = []

  voiceError.value = '正在识别...'

  try {
    const res = await apiClient.post('/ai/speech-to-text', audioBlob, {
      headers: {
        'Content-Type': mimeType,
      },
      timeout: 600000,
    })
    const { text, plan, error } = res.data
    voiceError.value = ''

    if (error) {
      voiceError.value = error
      return
    }

    emit('recognized', { text, plan })
  } catch (err: any) {
    voiceError.value = err?.response?.data?.error || err?.message || '语音识别失败'
  }
}

const handleStart = () => {
  audioChunks = []
  isRecording.value = true
  voiceError.value = ''
}

const handleError = (event: Event) => {
  const error = (event as any).error || new Error('未知录音错误')
  voiceError.value = `录音错误: ${error.message}`
  isRecording.value = false
}

// 初始化 MediaRecorder
const initMediaRecorder = async () => {
  voiceError.value = ''
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    voiceError.value = '当前浏览器不支持录音功能'
    return false
  }

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : 'audio/webm'
    mediaRecorder = new MediaRecorder(audioStream, { mimeType })

    mediaRecorder.addEventListener('dataavailable', handleDataAvailable)
    mediaRecorder.addEventListener('stop', handleStop)
    mediaRecorder.addEventListener('start', handleStart)
    mediaRecorder.addEventListener('error', handleError)

    return true
  } catch (err) {
    voiceError.value = '无法获取麦克风权限，请检查设置'
    return false
  }
}

const toggleVoiceInput = async () => {
  if (!mediaRecorder) {
    const success = await initMediaRecorder()
    if (!success) return
  }

  if (mediaRecorder) {
    if (mediaRecorder.state === 'inactive') {
      mediaRecorder.start()
    } else if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop())
  }
  if (mediaRecorder) {
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    mediaRecorder.removeEventListener('dataavailable', handleDataAvailable)
    mediaRecorder.removeEventListener('stop', handleStop)
    mediaRecorder.removeEventListener('start', handleStart)
    mediaRecorder.removeEventListener('error', handleError)
  }
  mediaRecorder = null
  audioStream = null
})
</script>

<style scoped>
.voice-input-container {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  z-index: 2;
}

.voice-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;
  font-size: 22px;
  outline: none;
}

.voice-btn:active {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-tip {
  color: #888;
  font-size: 14px;
  margin-left: 8px;
  white-space: nowrap;
}

.voice-error {
  color: red;
  font-size: 14px;
  margin-left: 8px;
  white-space: nowrap;
}
</style>
