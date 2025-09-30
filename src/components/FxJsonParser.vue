<template>
    <div>
      <div class="input-header">
        <p>
          Input:
          <el-button @click="inputButtonClicked">Click</el-button>
          <el-button @click="clearButtonClicked">Clear</el-button>
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
                  </div>

                  <div v-if="row.tweet.media?.videos?.length" class="tweet-media">
                    <a
                      v-for="(video, index) in row.tweet.media?.videos?.slice(0,4)"
                      :href="video.url"
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
  const rawData = ref([
  // {"code":200,"message":"OK","tweet":{"url":"https://x.com/amXFreeze/status/1972284213232861204","id":"1972284213232861204","text":"Grok Code leads with 57.6% of coding traffic on OpenRouter, more than every other AI code generator combined\n\nGrok Code Fast 1 ranks #1\nGrok 4 Fast is at #4","raw_text":{"text":"Grok Code leads with 57.6% of coding traffic on OpenRouter, more than every other AI code generator combined\n\nGrok Code Fast 1 ranks #1\nGrok 4 Fast is at #4 https://t.co/GffMzz1jD2","facets":[{"type":"media","indices":[157,180],"id":"1972282313170886656","display":"pic.x.com/GffMzz1jD2","original":"https://t.co/GffMzz1jD2","replacement":"https://x.com/amXFreeze/status/1972284213232861204/photo/1"}]},"author":{"id":"1818311005698678784","name":"X Freeze","screen_name":"amXFreeze","avatar_url":"https://pbs.twimg.com/profile_images/1876785200010539008/2_HFJjq9_200x200.jpg","banner_url":"https://pbs.twimg.com/profile_banners/1818311005698678784/1757091277","description":"Tech updates, strategy, and bold takes. I am the coolest villain, don't forget","location":"Antarctica ","url":"https://x.com/amXFreeze","followers":35792,"following":1185,"joined":"Tue Jul 30 15:42:27 +0000 2024","likes":28340,"media_count":2793,"protected":false,"website":{"url":"http://buymeacoffee.com/xfreeze","display_url":"buymeacoffee.com/xfreeze"},"tweets":20902,"avatar_color":null},"replies":253,"retweets":229,"likes":1194,"bookmarks":247,"created_at":"Sun Sep 28 12:56:14 +0000 2025","created_timestamp":1759064174,"possibly_sensitive":false,"views":20406530,"is_note_tweet":false,"community_note":null,"lang":"en","replying_to":null,"replying_to_status":null,"media":{"all":[{"type":"photo","url":"https://pbs.twimg.com/media/G170UHFWIAAVoHO.jpg?name=orig","width":1285,"height":834}],"photos":[{"type":"photo","url":"https://pbs.twimg.com/media/G170UHFWIAAVoHO.jpg?name=orig","width":1285,"height":834}]},"source":"Twitter Web App","twitter_card":"summary_large_image","color":null,"provider":"twitter"}},
  // {"code":200,"message":"OK","tweet":{"url":"https://x.com/kiryucco/status/1972518817797669282","id":"1972518817797669282","text":"this is by far one of the most beautiful character demos hoyoverse has ever made.","raw_text":{"text":"this is by far one of the most beautiful character demos hoyoverse has ever made. https://t.co/zLlRxH9qad","facets":[{"type":"media","indices":[82,105],"id":"1972518114202923009","display":"pic.x.com/zLlRxH9qad","original":"https://t.co/zLlRxH9qad","replacement":"https://x.com/kiryucco/status/1972518817797669282/photo/1"},{"type":"media","indices":[82,105],"id":"1972518255508992000","display":"pic.x.com/zLlRxH9qad","original":"https://t.co/zLlRxH9qad","replacement":"https://x.com/kiryucco/status/1972518817797669282/photo/1"},{"type":"media","indices":[82,105],"id":"1972518434454786048","display":"pic.x.com/zLlRxH9qad","original":"https://t.co/zLlRxH9qad","replacement":"https://x.com/kiryucco/status/1972518817797669282/photo/1"}]},"author":{"id":"1234564789470420994","name":"kiryu ✦ exploring nod-krai!","screen_name":"kiryucco","avatar_url":"https://pbs.twimg.com/profile_images/1757113882944905216/eCzlmu98_200x200.jpg","banner_url":"https://pbs.twimg.com/profile_banners/1234564789470420994/1707762062","description":"📚 ✦ lore content creator!\n🎨 ✦ official hoyocreator.\n📹 ✦ videos:\n💼 ✦ business email: kiryucco@gmail.com","location":"in the sea of flowers.","url":"https://x.com/kiryucco","followers":31641,"following":218,"joined":"Mon Mar 02 19:42:52 +0000 2020","likes":30690,"media_count":3869,"protected":false,"website":{"url":"https://twitch.tv/kiryuco","display_url":"twitch.tv/kiryuco"},"tweets":25415,"avatar_color":null},"replies":10,"retweets":331,"likes":2954,"bookmarks":139,"created_at":"Mon Sep 29 04:28:28 +0000 2025","created_timestamp":1759120108,"possibly_sensitive":false,"views":36390,"is_note_tweet":false,"community_note":null,"lang":"en","replying_to":null,"replying_to_status":null,"media":{"all":[{"type":"photo","url":"https://pbs.twimg.com/media/G1_KxiYWsAE_rog.jpg?name=orig","width":2869,"height":1717},{"type":"photo","url":"https://pbs.twimg.com/media/G1_K5wyWMAAHQFF.jpg?name=orig","width":2641,"height":1704},{"type":"photo","url":"https://pbs.twimg.com/media/G1_LELaWUAAG-74.jpg?name=orig","width":2129,"height":1693}],"photos":[{"type":"photo","url":"https://pbs.twimg.com/media/G1_KxiYWsAE_rog.jpg?name=orig","width":2869,"height":1717},{"type":"photo","url":"https://pbs.twimg.com/media/G1_K5wyWMAAHQFF.jpg?name=orig","width":2641,"height":1704},{"type":"photo","url":"https://pbs.twimg.com/media/G1_LELaWUAAG-74.jpg?name=orig","width":2129,"height":1693}],"mosaic":{"type":"mosaic_photo","formats":{"jpeg":"https://mosaic.fxtwitter.com/jpeg/1972518817797669282/G1_KxiYWsAE_rog/G1_K5wyWMAAHQFF/G1_LELaWUAAG-74","webp":"https://mosaic.fxtwitter.com/webp/1972518817797669282/G1_KxiYWsAE_rog/G1_K5wyWMAAHQFF/G1_LELaWUAAG-74"}}},"quote":{"url":"https://x.com/GenshinImpact/status/1972511906687590482","id":"1972511906687590482","text":"Character Trailer - \"Flins: Nocturne Sentinel\" | Genshin Impact\n#GenshinImpact #Flins \n\nhttps://youtu.be/bxya0iOjQMk\n\nA \"flame\" in the graveyard brings no warmth. If anything, it only deepens the chill.\nOne may tremble while celebrating their narrow escape. Not that there's any need to go hunting for the source of this fortune.","raw_text":{"text":"Character Trailer - \"Flins: Nocturne Sentinel\" | Genshin Impact\n#GenshinImpact #Flins \n\nhttps://t.co/eOMKnISidN\n\nA \"flame\" in the graveyard brings no warmth. If anything, it only deepens the chill.\nOne may tremble while celebrating their narrow escape. Not that there's any need to go hunting for the source of this fortune.","facets":[{"type":"hashtag","indices":[64,78],"original":"GenshinImpact"},{"type":"hashtag","indices":[79,85],"original":"Flins"},{"type":"url","indices":[88,111],"original":"https://t.co/eOMKnISidN","replacement":"https://youtu.be/bxya0iOjQMk","display":"youtu.be/bxya0iOjQMk"}]},"author":{"id":"1072404907230060544","name":"Genshin Impact","screen_name":"GenshinImpact","avatar_url":"https://pbs.twimg.com/profile_images/1965603294421909504/w9dkGvXf_200x200.jpg","banner_url":"https://pbs.twimg.com/profile_banners/1072404907230060544/1757471321","description":"In the world of Teyvat — where all kinds of elemental powers constantly surge — epic adventures await, fearless Travelers! #GenshinImpact","location":"","url":"https://x.com/GenshinImpact","followers":5617258,"following":18,"joined":"Tue Dec 11 08:17:08 +0000 2018","likes":365,"media_count":4305,"protected":false,"website":{"url":"https://hoyo.link/0jhgFBAL","display_url":"hoyo.link/0jhgFBAL"},"tweets":6420,"avatar_color":null},"replies":181,"retweets":2240,"likes":8798,"bookmarks":405,"created_at":"Mon Sep 29 04:01:00 +0000 2025","created_timestamp":1759118460,"possibly_sensitive":false,"views":534210,"is_note_tweet":true,"community_note":null,"lang":"en","replying_to":null,"replying_to_status":null,"media":{"external":{"type":"video","url":"https://www.youtube.com/embed/bxya0iOjQMk","width":1280,"height":720,"thumbnail_url":"https://img.youtube.com/vi/bxya0iOjQMk/maxresdefault.jpg"}},"source":"Sprinklr","twitter_card":"player","color":null,"provider":"twitter"},"source":"Twitter Web App","twitter_card":"summary_large_image","color":null,"provider":"twitter"}},
  // {"code":200,"message":"OK","user":{"screen_name":"elonmusk","url":"https://x.com/elonmusk","id":"44196397","followers":226854873,"following":1215,"likes":174473,"media_count":4157,"tweets":86573,"name":"Elon Musk","description":"","location":"","banner_url":"https://pbs.twimg.com/profile_banners/44196397/1739948056","avatar_url":"https://pbs.twimg.com/profile_images/1936002956333080576/kqqe2iWO_normal.jpg","joined":"Tue Jun 02 20:12:29 +0000 2009","protected":false,"website":null,"verification":{"verified":true,"type":"individual"}}}
  ])

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
      // return date.toLocaleDateString('zh-CN', {
      //   year: 'numeric',
      //   month: 'short',
      //   day: 'numeric'
      // })
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
    // if (url) {
    //   window.open(url, '_blank')
    // } else {
    //   ElMessage.warning('链接不存在')
    // }
    if(data?.tweet?.url){
      window.open(data?.tweet?.url, '_blank')
    }else if (data?.user?.url){
      window.open(data?.user?.url)
    }else{
      ElMessage.warning('the url is null.')
    }
  }
  
  // 表格行样式
  const tableRowClassName = ({ row }) => {
    return row.tweet ? 'tweet-row' : 'user-row'
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
  </style>
  