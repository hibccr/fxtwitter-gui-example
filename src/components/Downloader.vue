<template>
    <div class="downloader-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <el-button 
          type="primary" 
          :disabled="!hasDownloadableItems"
          @click="startDownloads"
          :loading="isDownloading"
        >
          Start Download
        </el-button>
        
        <el-button 
          type="success" 
          :disabled="!hasFailedItems"
          @click="retryFailedDownloads"
          :loading="isRetrying"
        >
          Retry Failed ({{ failedItemsCount }})
        </el-button>
        
        <el-button 
          type="warning" 
          :disabled="!hasDownloadedItems"
          @click="downloadAllAsZip"
          :loading="isZipping"
        >
          Download All as ZIP
        </el-button>
        
        <el-button 
          type="info"
          :disabled="!hasDownloadedItems"
          @click="downloadAllDirectly"
          :loading="isDownloadingAllDirectly"
        >
          Download All Directly
        </el-button>
        
        <el-button 
          @click="clearAll"
        >
          Clear All
        </el-button>
        
        <el-checkbox 
          v-model="downloadAsZipMode" 
          style="margin-left: 20px;"
          :disabled="isDownloading || isZipping || isDownloadingAllDirectly"
        >
          Download as ZIP by default
        </el-checkbox>
        
        <el-alert
          v-if="showDirectDownloadWarning"
          title="Important: Enable bulk download permissions in your browser settings for better experience"
          type="warning"
          :closable="true"
          show-icon
          style="margin-top: 10px; width: 100%;"
        />
      </div>
  
      <!-- Progress and Status -->
      <div class="status-bar">
        <el-progress 
          :percentage="progressPercentage" 
          :color="progressColor"
          :status="isDownloading ? 'success' : undefined"
        />
        <div class="status-text">
          {{ statusText }}
        </div>
      </div>
  
      <!-- Download Queue Table -->
      <el-table 
        :data="tableData" 
        stripe 
        style="width: 100%"
        height="400"
      >
        <el-table-column prop="filename" label="Filename" width="200">
          <template #default="{ row }">
            <span :class="row.status">{{ row.filename }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="mediaId" label="ID" width="150">
          <template #default="{ row }">
            <span :class="row.status">{{ row.mediaId }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="Type" width="100" />
        
        <el-table-column prop="size" label="Size" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="progress" label="Progress" width="150">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.progress" 
              :color="getProgressColor(row.status)"
              :show-text="false"
            />
            <span>{{ Math.round(row.progress) }}%</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="200">
          <template #default="{ row }">
            <el-button 
              size="small" 
              @click="downloadItem(row)"
              :disabled="row.status === 'downloading' || row.status === 'completed'"
            >
              Download
            </el-button>
            
            <el-button 
              size="small" 
              type="success"
              @click="downloadSingleFile(row)"
              :disabled="row.status !== 'completed' || !row.blob"
            >
              Get File
            </el-button>
            
            <el-button 
              size="small" 
              type="danger"
              @click="removeItem(row)"
              :disabled="row.status === 'downloading'"
            >
              Remove
            </el-button>
          </template>
        </el-table-column>
      </el-table>
  
      <!-- Log Panel -->
      <div class="log-panel">
        <div class="log-header">
          <span>Log Output</span>
          <el-button size="small" @click="clearLogs">Clear Logs</el-button>
        </div>
        <div class="log-content">
          <div 
            v-for="(log, index) in logs" 
            :key="index" 
            :class="['log-entry', log.type]"
          >
            [{{ log.timestamp }}] {{ log.message }}
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSharedataDownloaderStore } from '@/store/sharedata-downloader'
import JSZip from 'jszip'
import axios from 'axios'

// Store reference
const store = useSharedataDownloaderStore()

// Reactive state variables
const downloads = ref([])
const logs = ref([])
const isDownloading = ref(false)
const isRetrying = ref(false)
const isZipping = ref(false)
const isDownloadingAllDirectly = ref(false)
const downloadAsZipMode = ref(true)
const lastZipProgress = ref(0) // Track last logged progress
const showDirectDownloadWarning = ref(false)

// Computed properties
const hasDownloadableItems = computed(() => downloads.value.some(item => 
  item.status === 'pending' || item.status === 'failed'
))

const hasFailedItems = computed(() => downloads.value.some(item => 
  item.status === 'failed'
))

const failedItemsCount = computed(() => downloads.value.filter(item => 
  item.status === 'failed'
).length)

const hasDownloadedItems = computed(() => downloads.value.some(item => 
  item.status === 'completed' && item.blob
))

const progressPercentage = computed(() => {
  if (downloads.value.length === 0) return 0
  
  const completed = downloads.value.filter(item => item.status === 'completed').length
  return Math.round((completed / downloads.value.length) * 100)
})

const progressColor = computed(() => {
  if (isDownloading.value) return '#409EFF'
  return '#67C23A'
})

const statusText = computed(() => {
  if (isDownloading.value) return `Downloading... (${downloads.value.filter(item => item.status === 'downloading').length} active)`
  if (isZipping.value) return 'Creating ZIP file...'
  if (isDownloadingAllDirectly.value) return 'Downloading files directly...'
  if (isRetrying.value) return `Retrying failed downloads...`
  
  const completed = downloads.value.filter(item => item.status === 'completed').length
  return `Completed: ${completed}/${downloads.value.length}`
})

const tableData = computed(() => downloads.value)

// Helper functions
const getFilenameFromUrl = (url) => {
  // Extract the filename from the URL path (after the last slash)
  const pathParts = url.split('/')
  const filename = pathParts[pathParts.length - 1].split('?')[0]
  return filename
}

const generateFilename = (item) => {
  return getFilenameFromUrl(item.url)
}

const getStatusTagType = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'downloading': return 'primary'
    case 'failed': return 'danger'
    case 'pending': return 'info'
    default: return 'info'
  }
}

const getProgressColor = (status) => {
  switch (status) {
    case 'completed': return '#67C23A'
    case 'downloading': return '#409EFF'
    case 'failed': return '#F56C6C'
    default: return '#909399'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

const addLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift({
    timestamp,
    message,
    type
  })
  
  // Limit logs to last 100 entries
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

// Function to download single file from blob
const downloadSingleFile = (item) => {
  if (item.status !== 'completed' || !item.blob) {
    addLog(`Cannot download ${item.filename}: Not completed or no blob available`, 'error')
    return
  }
  
  try {
    const url = window.URL.createObjectURL(item.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = item.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    addLog(`Single file downloaded: ${item.filename}`, 'success')
  } catch (error) {
    addLog(`Error downloading single file ${item.filename}: ${error.message}`, 'error')
  }
}

// Main download logic
const startDownloads = async () => {
  if (downloadAsZipMode.value) {
    await downloadAllAsZip()
  } else {
    await startMultipleDownloads()
  }
}

const startMultipleDownloads = async () => {
  isDownloading.value = true
  addLog(`Starting download of ${downloads.value.length} items`, 'info')

  // Reset progress for all items
  downloads.value.forEach(item => {
    if (item.status !== 'completed') {
      item.status = 'pending'
      item.progress = 0
      item.statusText = 'Pending'
    }
  })

  // Process items concurrently up to max concurrent downloads
  const maxConcurrent = 3
  const queue = [...downloads.value.filter(item => item.status !== 'completed')]
  
  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrent)
    
    await Promise.all(batch.map(async (item) => {
      try {
        await downloadItem(item)
      } catch (error) {
        addLog(`Error downloading ${item.filename}: ${error.message}`, 'error')
      }
    }))
  }

  isDownloading.value = false
  addLog('All downloads completed', 'success')
}

const retryFailedDownloads = async () => {
  isRetrying.value = true
  addLog(`Retrying ${failedItemsCount.value} failed downloads`, 'info')

  const failedItems = downloads.value.filter(item => item.status === 'failed')
  
  for (const item of failedItems) {
    item.status = 'pending'
    item.progress = 0
    item.statusText = 'Pending'
  }

  const maxConcurrent = 3
  const queue = [...failedItems]
  
  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrent)
    
    await Promise.all(batch.map(async (item) => {
      try {
        await downloadItem(item)
      } catch (error) {
        addLog(`Retry failed for ${item.filename}: ${error.message}`, 'error')
      }
    }))
  }

  isRetrying.value = false
  addLog('Retry process completed', 'info')
}

const downloadItem = async (item) => {
  if (item.status === 'downloading') return

  item.status = 'downloading'
  item.statusText = 'Downloading'
  item.progress = 0

  try {
    // For video, directly use the URL provided in the main object
    let downloadUrl = item.original.url

    // Create axios request with progress tracking
    const response = await axios.get(downloadUrl, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          item.progress = progress
        }
      }
    })

    // Update item with blob data
    item.blob = response.data
    item.size = response.data.size
    item.status = 'completed'
    item.statusText = 'Completed'
    
    addLog(`Successfully downloaded: ${item.filename}`, 'success')
  } catch (error) {
    item.status = 'failed'
    item.statusText = 'Failed'
    addLog(`Failed to download ${item.filename}: ${error.message}`, 'error')
    console.error('Download error:', error)
  }
}

const downloadAllAsZip = async () => {
  isZipping.value = true
  addLog(`Starting ZIP download of ${downloads.value.length} items`, 'info')
  lastZipProgress.value = 0 // Reset progress tracker

  try {
    const zip = new JSZip()
    
    // First ensure all items are downloaded
    const itemsToDownload = downloads.value.filter(item => 
      item.status !== 'completed' || !item.blob
    )
    
    for (const item of itemsToDownload) {
      if (item.status !== 'completed') {
        await downloadItem(item)
      }
    }

    // Add all completed items to zip
    for (const item of downloads.value) {
      if (item.status === 'completed' && item.blob) {
        zip.file(item.filename, item.blob)
      }
    }

    // Generate and download the zip
    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      // Update progress during zip generation (only log every 5% or when reaching 100%)
      const progress = Math.round(metadata.percent)
      
      // Only log if progress increased by at least 5% or if it's exactly 100%
      if (progress >= lastZipProgress.value + 5 || (progress === 100 && lastZipProgress.value !== 100)) {
        lastZipProgress.value = progress
        addLog(`ZIP creation progress: ${progress}%`, 'info')
      }
    })

    // Create download link
    const url = window.URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `media_download_${new Date().toISOString().slice(0, 10)}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
    
    addLog(`ZIP file created and downloaded successfully`, 'success')
  } catch (error) {
    addLog(`Error creating ZIP: ${error.message}`, 'error')
    console.error('ZIP error:', error)
  } finally {
    isZipping.value = false
    lastZipProgress.value = 0 // Reset progress tracker
  }
}

// Function to download all files directly (not in a zip)
const downloadAllDirectly = async () => {
  showDirectDownloadWarning.value = true;
  isDownloadingAllDirectly.value = true
  addLog(`Starting direct download of ${downloads.value.length} items`, 'info')

  // First ensure all items are downloaded
  for (const item of downloads.value) {
    if (item.status !== 'completed') {
      await downloadItem(item)
    }
  }

  // Now download each file individually
  for (const item of downloads.value) {
    if (item.status === 'completed' && item.blob) {
      try {
        const url = window.URL.createObjectURL(item.blob)
        const link = document.createElement('a')
        link.href = url
        link.download = item.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        addLog(`Directly downloaded: ${item.filename}`, 'success')
      } catch (error) {
        addLog(`Error directly downloading ${item.filename}: ${error.message}`, 'error')
      }
    }
  }

  isDownloadingAllDirectly.value = false
  addLog('All files downloaded directly', 'success')
}

const removeItem = (item) => {
  const index = downloads.value.indexOf(item)
  if (index !== -1) {
    downloads.value.splice(index, 1)
    addLog(`Removed item: ${item.filename}`, 'info')
  }
}

const clearAll = () => {
  downloads.value = []
  addLog('All items cleared', 'info')
}

const clearLogs = () => {
  logs.value = []
  addLog('Logs cleared', 'info')
}

// Watch for changes in the store
watch(() => store.mediaObjects, (newObjects) => {
  if (newObjects && Array.isArray(newObjects)) {
    // Convert store objects to download items
    const newItems = newObjects.map(obj => ({
      id: obj.id, // This is the unique internal ID for tracking
      mediaId: obj.id, // This is the media ID shown in the table
      filename: generateFilename(obj),
      type: obj.type,
      original: obj,
      status: 'pending',
      statusText: 'Pending',
      progress: 0,
      blob: null,
      size: 0
    }))
    
    // Add new items to downloads (avoid duplicates)
    for (const newItem of newItems) {
      const existingIndex = downloads.value.findIndex(item => item.id === newItem.id)
      if (existingIndex === -1) {
        downloads.value.push(newItem)
      } else {
        // Update existing item
        downloads.value[existingIndex] = newItem
      }
    }
    
    addLog(`Added ${newItems.length} items to download queue`, 'info')
  }
}, { deep: true })

// Initialize with any existing store data
onMounted(() => {
  if (store.mediaObjects && store.mediaObjects.length > 0) {
    const initialItems = store.mediaObjects.map(obj => ({
      id: obj.id, // This is the unique internal ID for tracking
      mediaId: obj.id, // This is the media ID shown in the table
      filename: generateFilename(obj),
      type: obj.type,
      original: obj,
      status: 'pending',
      statusText: 'Pending',
      progress: 0,
      blob: null,
      size: 0
    }))
    
    downloads.value = initialItems
    addLog(`Initialized with ${initialItems.length} items from store`, 'info')
  }
})
</script>

<style scoped>
.downloader-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  /* flex-direction: column; */
  gap: 10px;
  margin-bottom: 20px;
  align-items: flex-start;
}

/* .toolbar > div {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
} */

.status-bar {
  margin-bottom: 20px;
}

.status-text {
  text-align: center;
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.log-panel {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.log-header {
  background-color: #f5f7fa;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.log-content {
  height: 200px;
  overflow-y: auto;
  padding: 10px;
  background-color: #2d2d2d;
  color: #f8f8f2;
  font-family: monospace;
  font-size: 12px;
}

.log-entry {
  padding: 2px 0;
  line-height: 1.4;
}

.log-entry.info {
  color: #f8f8f2;
}

.log-entry.success {
  color: #a6e22e;
}

.log-entry.warning {
  color: #fd971f;
}

.log-entry.error {
  color: #f92672;
}

.completed {
  color: #67c23a;
}

.downloading {
  color: #409eff;
}

.failed {
  color: #f56c6c;
}

.pending {
  color: #909399;
}
</style>