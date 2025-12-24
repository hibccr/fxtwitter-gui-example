<template>
    <div>
      <div class="input-header">
        <p>
          Input:
          <el-button @click="inputButtonClicked">Click</el-button>
          <el-button @click="clearButtonClicked">Clear</el-button>
          <el-button @click="settingsButtonClicked">Settings</el-button>
          <el-input v-model="ref_input" style="width: 100%;" :rows="5" type="textarea" />
        </p>
      </div>
        <div class="twitter-table-container">
          <el-table
            :data="tableData"
            style="width: 100%"
            :row-class-name="tableRowClassName"
          >
            <!-- 用户信息列 -->
            <el-table-column label="User Info" width="400">
              <template #default="{ row }">
                <div class="user-info">
                  <div class="user-header">
                    <el-avatar
                      :size="48"
                      :src="row.user?.avatar_url || row.tweet?.author?.avatar_url"
                      @error="() => true"
                    >
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <div class="user-details">
                      <div class="user-name-row">
                        <span class="display-name">
                          {{ row.user?.name || row.tweet?.author?.name || '未知用户' }}
                        </span>
                        <el-tag
                          v-if="row.user?.verification?.verified || row.tweet?.author?.verification?.verified"
                          size="small"
                          type="primary"
                          class="verification-badge"
                        >
                          <el-icon><Check /></el-icon>
                        </el-tag>
                      </div>
                      <span class="screen-name">
                        @{{ row.user?.screen_name || row.tweet?.author?.screen_name || 'unknown' }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="user-stats">
                    <span class="stat-item">
                      <strong>{{ formatNumber(row.user?.following || row.tweet?.author?.following || 0) }}</strong>
                      <span class="stat-label">Following</span>
                    </span>
                    <span class="stat-item">
                      <strong>{{ formatNumber(row.user?.followers || row.tweet?.author?.followers || 0) }}</strong>
                      <span class="stat-label">Follower</span>
                    </span>
                    <span class="stat-item">
                      <strong>{{ formatNumber(row.user?.tweets || row.tweet?.author?.tweets || 0) }}</strong>
                      <span class="stat-label">Post</span>
                    </span>
                  </div>
      
                  <div v-if="row.user?.description || row.tweet?.author?.description" class="user-bio">
                    {{ row.user?.description || row.tweet?.author?.description }}
                  </div>
      
                  <div v-if="row.user?.location || row.tweet?.author?.location" class="user-location">
                    <el-icon><Location /></el-icon>
                    {{ row.user?.location || row.tweet?.author?.location }}
                  </div>
                </div>
              </template>
            </el-table-column>
      
            <!-- 推文内容列 -->
            <el-table-column label="Content" min-width="300">
              <template #default="{ row }">
                <div v-if="row.tweet" class="tweet-content">
                  <div class="tweet-text">
                    {{ row.tweet.text }}
                  </div>
                  
                  <div v-if="row.tweet.media?.photos?.length" class="tweet-media">
                    <el-image
                      v-for="(photo, index) in row.tweet.media.photos.slice(0, 4)"
                      :key="index"
                      :src="photo.url"
                      :preview-src-list="row.tweet.media.photos.map(p => p.url)"
                      :preview-teleported="true"
                      fit="cover"
                      class="tweet-image"
                      :style="{ width: getImageWidth(row.tweet.media.photos.length), height: '150px' }"
                    />
                    <div v-if="show_alt_text" class="tweet-media-alttext">
                      {{ processAltText(row) }}
                    </div>
                  </div>

                  <div v-if="row.tweet.media?.videos?.length" class="tweet-media">
                    <video v-if="enable_video_player === 'video_element'"
                           v-for="(video, index) in row.tweet.media?.videos?.slice(0,4)"
                           preload="none"
                           controls
                           :poster="video.thumbnail_url"
                           width="100%">
                           <source :src="video.url" :type="video.format"/>
                    </video>
                    <a
                      v-for="(video, index) in row.tweet.media?.videos?.slice(0,4)"
                      :href="video.url"
                      rel="noreferrer"
                      target="_blank"
                    >
                      {{ video.url }}
                    </a>
                  </div>
      
                  <div class="tweet-actions">
                    <span class="action-item">
                      <el-icon><ChatDotRound /></el-icon>
                      {{ formatNumber(row.tweet.replies || 0) }}
                    </span>
                    <span class="action-item">
                      <el-icon><Refresh /></el-icon>
                      {{ formatNumber(row.tweet.retweets || 0) }}
                    </span>
                    <span class="action-item">
                      <el-icon><Star /></el-icon>
                      {{ formatNumber(row.tweet.likes || 0) }}
                    </span>
                    <span class="action-item">
                      <el-icon><Notebook /></el-icon>
                      {{ formatNumber(row.tweet.bookmarks || 0) }}
                    </span>
                  </div>
                </div>
                <div v-else class="no-tweet">
                  <el-icon><Document /></el-icon>
                  <span>No Content</span>
                </div>
              </template>
            </el-table-column>
      
            <!-- 时间列 -->
            <el-table-column label="Time" width="180">
              <template #default="{ row }">
                <div class="time-info">
                  <div v-if="row.user?.joined" class="join-time">
                    <el-icon><Calendar /></el-icon>
                    Join at：{{ formatDate(row.user.joined) }}
                  </div>
                  <div v-if="row.tweet?.created_at" class="tweet-time">
                    <el-icon><Clock /></el-icon>
                    Publish at：{{ formatDate(row.tweet.created_at) }}
                  </div>
                  <div v-if="row.tweet?.views" class="tweet-views">
                    <el-icon><View /></el-icon>
                    View：{{ formatNumber(row.tweet.views) }}
                  </div>
                </div>
              </template>
            </el-table-column>
      
            <!-- 操作列 -->
            <el-table-column label="Action" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.user?.url || row.tweet?.url"
                  type="primary"
                  size="small"
                  @click="openLink(row)"
                >
                  Open
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-drawer
            v-model="settingsDrawerFlag"
            title="Settings"
            direction="rtl">
            <template #default>
                <div>
                    X(Twitter) post open link prefix:
                    <el-input
                      v-model="x_open_link_prefix" />
                    <br>
                    Enable Video Player:
                    <el-select
                      v-model="enable_video_player">
                      <el-option
                        v-for="item in enable_video_player_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value" />
                    </el-select>
                    <br>
                    Show Alt Text:
                    <el-switch v-model="show_alt_text" />
                </div>
            </template>
        </el-drawer>
    </div>
</template>
  
<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Check,
  Location,
  ChatDotRound,
  Refresh,
  Star,
  Notebook,
  Document,
  Calendar,
  Clock,
  View
} from '@element-plus/icons-vue'
import { useParserSettingsStore } from '@/store/parser-settings'
import { storeToRefs } from 'pinia'

let settingsDrawerFlag = ref(false)

let parserSettingsStore = useParserSettingsStore()
let { x_open_link_prefix,
      enable_video_player,
      show_alt_text } = storeToRefs(parserSettingsStore)

const enable_video_player_options = [
  {
    value: 'no',
    label: 'no'
  },
  {
    value: 'video_element',
    label: '<video> element (Vanilla JS)'
  }
]

function settingsButtonClicked(){
    if(settingsDrawerFlag.value === false){
        settingsDrawerFlag.value = true
    }else{
        settingsDrawerFlag.value = false
    }
}
  
function inputButtonClicked(){
  let isError = false
  rawData.value.length = 0
  let ref_input_array = ref_input.value.split('\n').filter(Boolean)
  for (let i=0; i < ref_input_array.length; i++){
    try{
      rawData.value.push(JSON.parse(ref_input_array[i]))
    }catch (e){
      isError = true
    }
  }
  if(isError){
    window.alert('Some errors happen in parser.')
  }
}

function clearButtonClicked(){
  rawData.value.length = 0
  ref_input.value = ''
}

// 示例数据
const rawData = ref([])

let ref_input = ref('')
  
// 处理表格数据
const tableData = computed(() => {
  return rawData.value.map(item => ({
    ...item,
    // 统一用户信息访问路径
    user: item.user || item.tweet?.author
  }))
})
  
// 格式化数字
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
  
// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US')
  } catch {
    return dateStr
  }
}
  
// 获取图片宽度
const getImageWidth = (count) => {
  if (count === 1) return '100%'
  if (count === 2) return '48%'
  return '31%'
}
  
// 打开链接
const openLink = (data) => {
  if(data?.tweet?.url){
    let urlObject = new URL(data?.tweet?.url)
    window.open(x_open_link_prefix.value + urlObject.pathname, '_blank')
  }else if (data?.user?.url){
    let urlObject = new URL(data?.user?.url)
    window.open(x_open_link_prefix.value + urlObject.pathname, '_blank')
  }else{
    ElMessage.warning('the url is null.')
  }
}
  
// 表格行样式
const tableRowClassName = ({ row }) => {
  return row.tweet ? 'tweet-row' : 'user-row'
}

function processAltText(obj) {
  // 检查对象结构是否存在
  if (!obj || !obj.tweet || !obj.tweet.media || !obj.tweet.media.photos) {
    return '';
  }

  const photos = obj.tweet.media.photos;

  // 如果没有照片，返回空字符串
  if (photos.length === 0) {
    return '';
  }

  // 处理每个照片的altText
  const results = photos.map((photo, index) => {
    const altText = photo.altText || '';
    return `${index + 1}:${altText}`;
  });

  // 用换行符连接所有结果
  return results.join('\n');
}
</script>
  
<style scoped>
.twitter-table-container {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-info {
  padding: 12px 0;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-details {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.display-name {
  font-weight: 600;
  font-size: 16px;
  color: #0f1419;
}

.screen-name {
  color: #536471;
  font-size: 14px;
}

.verification-badge {
  background: #1d9bf0 !important;
  color: white !important;
  border: none;
}

.user-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-item strong {
  font-weight: 600;
  color: #0f1419;
}

.stat-label {
  color: #536471;
  font-size: 13px;
}

.user-bio {
  color: #0f1419;
  line-height: 1.4;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.user-location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #536471;
  font-size: 14px;
}

.tweet-content {
  padding: 12px 0;
}

.tweet-text {
  color: #0f1419;
  line-height: 1.5;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.tweet-media {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tweet-image {
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.tweet-image:hover {
  transform: scale(1.02);
}

.tweet-actions {
  display: flex;
  gap: 20px;
  color: #536471;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-item:hover {
  color: #1d9bf0;
}

.no-tweet {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #536471;
  padding: 20px;
  justify-content: center;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.join-time, .tweet-time, .tweet-views {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #536471;
}

/* 表格行样式 */
:deep(.user-row) {
  background-color: #f8f9fa;
}

:deep(.tweet-row) {
  background-color: white;
}

:deep(.el-table__row) {
  border-bottom: 1px solid #e1e8ed;
}

:deep(.el-table__row:hover) {
  background-color: #f7f9fa !important;
}

:deep(.el-table__header) {
  background-color: #ffffff;
}

:deep(.el-table__header th) {
  background-color: #ffffff;
  color: #0f1419;
  font-weight: 600;
  border-bottom: 2px solid #e1e8ed;
}

.tweet-media-alttext {
  color: #5f5b5b;
}
</style>
