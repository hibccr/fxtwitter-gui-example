<script setup lang="ts">
import axios from 'axios';
import { ref, reactive, computed } from 'vue';
import { flatten } from 'flat';
import { useSettingsStore } from '@/store/settings';
import { storeToRefs } from 'pinia';

let git_commithash = __GIT_COMMIT_ID__;

let res_json;
let mediaObject;

let tableData = reactive([]);
let mediaTableData = reactive([]);

let res_json_text = ref('');

let tweet_url = ref('');

let tweet_username = ref('');
let tweet_statusid = ref('');
let willrequrl = ref('');

// use pinia instead of this
let settingsStore = useSettingsStore()
let {show_res_json,
    show_debug_info,
    show_author,
    show_tweet,
    focus_download_orig_img,
    show_jump_to_author_button,
    jump_to_author_url_prefix} = storeToRefs(settingsStore)

let open_settings_drawer = ref(false);

//Axios Error Message
let is_api_error = ref(false);
let api_error_status = ref(0);
let api_error_msg = ref('');

let apiType = ref('tweet');

let apiTypeInTweet = computed(
    () => {
        if (apiType.value === 'tweet'){
            return true
        }else{
            return false
        }
    }
);

let apiTypeInUser = computed(
    ()=>{
        if (apiType.value === 'user'){
            return true
        }else{
            return false
        }
    }
)


function getOriginImageUrl(obj){
    if (obj?.type === 'photo' && focus_download_orig_img.value){
        return appendOrigParam(obj.url)
    }else{
        return obj.url
    }
}

function getAvatarUrl(){
    if(apiType.value === 'tweet'){
        return res_json?.tweet?.author?.avatar_url
    }else if (apiType.value === 'user'){
        return res_json?.user?.avatar_url
    }else{
        return undefined
    }
}

function getBannerUrl(){
    if(apiType.value === 'tweet'){
        return res_json?.tweet?.author?.banner_url
    }else if (apiType.value === 'user'){
        return res_json?.user?.banner_url
    }else{
        return undefined
    }
}

function getWebsiteUrl(){
    if(apiType.value === 'tweet'){
        return res_json?.tweet?.author?.website?.url
    }else if (apiType.value === 'user'){
        return res_json?.user?.website?.url
    }else{
        return undefined
    }
}

function extractStatusId(url) {
    try {
        const pathSegments = new URL(url).pathname.split('/');
        const statusIndex = pathSegments.indexOf('status') + 1;
        return statusIndex > 0 && statusIndex < pathSegments.length 
               ? pathSegments[statusIndex] 
               : null;
    } catch (e) {
        return null;
    }
}

function extractUsername(url) {
    try {
        // 解析路径并分割为数组
        const pathSegments = new URL(url).pathname.split('/').filter(s => s);
        // 用户名位于域名后的第一个有效路径段（如 "i"）
        return pathSegments.length >= 1 ? pathSegments[0] : null;
    } catch (e) {
        return null;
    }
}

// 示例测试
//console.log(extractUsername('https://x.com/i/status/1901969891890192564/photo/1')); // 输出："i"
//console.log(extractUsername('https://twitter.com/john_doe/status/12345'));        // 输出："john_doe"

function buildApiUrl(username, statusId) {
    // 验证输入参数有效性
    if (!username || !statusId || typeof username !== 'string' || !/^\d+$/.test(statusId)) {
        return null; // 返回 null 或抛出错误（根据需求调整）
    }
    // 使用模板字符串拼接 URL[4,7](@ref)
    return `https://api.fxtwitter.com/${encodeURIComponent(username)}/status/${statusId}`;
}

function generateApiUrl(originalUrl) {
    const username = extractUsername(originalUrl);
    const statusId = extractStatusId(originalUrl);
    return buildApiUrl(username, statusId);
}

async function fetchData(apiUrl) {
  try {
    const response = await axios.get(apiUrl);
    res_json = response.data; // 直接通过 await 获取响应体[6](@ref)
    res_json_text.value = JSON.stringify(res_json);
    console.log('数据已保存:', res_json);
    is_api_error.value = false;
  } catch (error) {
    is_api_error.value = true;
    api_error_msg.value = error.message;
    api_error_status.value = error.status;
    res_json = error?.response?.data;
    console.error('请求失败:', error);
  }
}
//fetchData();
function reverseShowResJson(){
    if (show_res_json.value === true){
        show_res_json.value = false;
    }else{
        show_res_json.value = true;
    }
}

function reverseShowDebugInfo(){
    if (show_debug_info.value === true){
        show_debug_info.value = false;
    }else{
        show_debug_info.value = true;
    }
}

function reverseOpenSettingsDrawer(){
    if (open_settings_drawer.value === true){
        open_settings_drawer.value = false
    }else{
        open_settings_drawer.value = true
    }
}

function buildApiUrlv2(username, statusId) {
    // 验证 username 有效性
    if (!username || typeof username !== 'string') {
        return null; // 或抛出错误
    }

    // 对 username 进行编码
    const encodedUsername = encodeURIComponent(username);
    
    // 动态拼接 URL
    const baseUrl = `https://api.fxtwitter.com/${encodedUsername}`;
    const statusPath = (statusId && /^\d+$/.test(statusId)) ? `/status/${statusId}` : '';
    
    return `${baseUrl}${statusPath}`;
}

function appendOrigParam(url) {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('name', 'orig');
        return urlObj.toString();
    } catch (e) {
        return null; // 处理无效URL的情况
    }
}

async function buttonClicked(){
tableData.length = 0; //Reactive响应式只能这么清数组
mediaTableData.length = 0;

res_json_text.value = '';
res_json = {};

tweet_username.value = extractUsername(tweet_url.value)
tweet_statusid.value = extractStatusId(tweet_url.value)

if(tweet_statusid.value === '' || tweet_statusid.value === null){
    if(tweet_username.value != '' && tweet_username.value != null){
        apiType.value = 'user'
    }else{
        apiType.value = 'tweet'
    }
}else{
    apiType.value = 'tweet'
}

if(apiType.value === 'tweet'){
    willrequrl.value = buildApiUrl(tweet_username.value, tweet_statusid.value)
}else if(apiType.value === 'user'){
    willrequrl.value = buildApiUrlv2(tweet_username.value, null)
}

await fetchData(willrequrl.value)

let flatedJson = flatten(res_json)
console.log('flatedJson:' , flatedJson)
let tableData_temp = Object.entries(flatedJson).map(([attribute, content]) => ({ attribute, content }))
//Object.assign(tableData,Object.entries(flatedJson).map(([attribute, content]) => ({ attribute, content })))
console.log('temp:',tableData_temp)
Object.assign(tableData,tableData_temp)
console.log('tableData:', tableData)

mediaObject = res_json?.tweet?.media?.all
if (mediaObject != undefined && mediaObject != null){
    Object.assign(mediaTableData, mediaObject)
}
}

function getJumpLink(){
    let jumpUrl;

    if (is_api_error.value == true || res_json === undefined){
        return 'javascript:;'
    }
    if (apiType.value == 'tweet'){
        jumpUrl = jump_to_author_url_prefix.value + res_json?.tweet?.author?.screen_name
    }else if (apiType.value == 'user'){
        jumpUrl = jump_to_author_url_prefix.value + res_json?.user?.screen_name
    }else{
        jumpUrl = 'javascript:;'
    }
    return jumpUrl
}
</script>

<template>
<div>
    <p>URL: 
        <el-input v-model="tweet_url"
                    style="width: 240px;"
                    />
        <el-button @click="buttonClicked">Click</el-button>
        <el-button @click="reverseOpenSettingsDrawer">
            Open Settings
        </el-button>
        <span style="color:red;" v-if="is_api_error">
            {{ api_error_status }} : {{ api_error_msg }}
        </span>
    </p>
    <p>
        username:
        <el-input v-model="tweet_username"
        style="width: 240px;"
        />
        &nbsp;
        status_id:
        <el-input v-model="tweet_statusid"
        style="width: 240px;"
        />
    </p>
    <p>
        willReqUrl:
        <el-input v-model="willrequrl"
        style="width: 240px;"
        />
        &nbsp;
        apiType:
        <el-input v-model="apiType"
        style="width: 100px;"
        />
    </p>
    <p>
        res_json:
        <el-button
        @click="reverseShowResJson">
            {{ show_res_json ? 'Hide' : 'Show' }}
        </el-button>
        <el-input v-model="res_json_text"
        type="textarea"
        v-if="show_res_json"
        />
    </p>
    <div v-show="show_author">
        <p v-if="apiTypeInTweet">
            <span class="gray-text">Author:</span> {{ res_json?.tweet?.author?.name }} (@{{ res_json?.tweet?.author?.screen_name }}) [ID:{{ res_json?.tweet?.author?.id }}] <a :href="getJumpLink()" target="_blank" v-if="show_jump_to_author_button && !(is_api_error)">Jump</a><span v-if="show_jump_to_author_button && !(is_api_error)">&nbsp;</span><span class="gray-text" v-if="getWebsiteUrl() != undefined && getWebsiteUrl() != ''">Website:</span> {{ getWebsiteUrl() }}
            <br>
            <span class="gray-text">Description:</span> {{ res_json?.tweet?.author?.description }}
            <br>
            <span class="gray-text">Joined at</span> {{ res_json?.tweet?.author?.joined }} <span class="gray-text">Followers:</span> {{ res_json?.tweet?.author?.followers }} <span class="gray-text">Following:</span> {{ res_json?.tweet?.author?.following }} <span class="gray-text">Tweets:</span> {{ res_json?.tweet?.author?.tweets }}
        </p>
        <p v-if="apiTypeInUser">
            <span class="gray-text">User:</span> {{ res_json?.user?.name }} (@{{ res_json?.user?.screen_name }}) [ID:{{ res_json?.user?.id }}] <a :href="getJumpLink()" target="_blank" v-if="show_jump_to_author_button && !(is_api_error)">Jump</a><span v-if="show_jump_to_author_button && !(is_api_error)">&nbsp;</span><span class="gray-text" v-if="getWebsiteUrl() != undefined && getWebsiteUrl() != ''">Website:</span> {{ getWebsiteUrl() }}
            <br>
            <span class="gray-text">Description:</span> {{ res_json?.user?.description }}
            <br>
            <span class="gray-text">Joined at</span> {{ res_json?.user?.joined }} <span class="gray-text">Followers:</span> {{ res_json?.user?.followers }} <span class="gray-text">Following:</span> {{ res_json?.user?.following }} <span class="gray-text">Tweets:</span> {{ res_json?.user?.tweets }}
        </p>
    </div>
    <p v-show="show_author">
        <el-avatar shape="square" :size="50" :src="getAvatarUrl()"></el-avatar>
        &nbsp;
        <img style="width: 150px; height: 50px;" :src="getBannerUrl()"/>
    </p>
    <div class="tweet-div" v-show="show_tweet">
        <div v-if="apiTypeInTweet">
            <p>
                Tweet: {{ res_json?.tweet?.text }}
                <br>
                Replies: {{ res_json?.tweet?.replies }}
                &nbsp;
                Retweets: {{ res_json?.tweet?.retweets }}
                &nbsp;
                Likes: {{ res_json?.tweet?.likes }}
                &nbsp;
                Views: {{ res_json?.tweet?.views }}
                <br>
                Time: {{ res_json?.tweet?.created_at }}
                &nbsp;
                From: {{ res_json?.tweet?.source }}
            </p>
        </div>
    </div>
    <div class="media-div">
        <el-table :data="mediaTableData" style="width: 100%">
    <!-- 类型列 -->
    <el-table-column prop="type" label="Media Type" width="120" />
    
    <!-- 图片预览列 -->
    <el-table-column label="Preview" width="180">
      <template #default="{ row }">
        <img 
          v-if="row.type === 'photo'"
          :src="row.url" 
          class="media-preview"
          :alt="row.altText"
        >
        <!-- <video 
            v-else-if="row.type === 'video'"
            controls
            :poster="row.thumbnail_url"
            class="media-preview"
        >
            <source :src="row.url">
        </video> -->
        <img 
          v-else-if="row.type === 'video'"
          :src="row.thumbnail_url" 
          class="media-preview"
        >
        <img 
          v-else-if="row.type === 'gif'"
          :src="row.thumbnail_url" 
          class="media-preview"
        >
        <span v-else>Not Support</span>
      </template>
    </el-table-column>
    
    <!-- 原始URL列 -->
    <el-table-column label="Resource Address">
      <template #default="{ row }">
        <a :href="getOriginImageUrl(row)" target="_blank" class="media-url">
          {{ getOriginImageUrl(row) }}
        </a>
      </template>
    </el-table-column>
    
    <!-- 尺寸列 -->
    <el-table-column label="Size" width="150">
      <template #default="{ row }">
        {{ row.width }} × {{ row.height }}
      </template>
    </el-table-column>
    
    <!-- 替代文本列 -->
    <el-table-column prop="altText" label="Description" />
  </el-table>
    </div>

    <div v-if="show_tweet === true && apiType === 'tweet'">
        <span v-if="res_json?.tweet?.replying_to != undefined">
            Reply-To: {{ res_json?.tweet?.replying_to }}
        </span>
        &nbsp;
        <span v-if="res_json?.tweet?.replying_to_status != undefined">
            Reply-To-Status: {{ res_json?.tweet?.replying_to_status }}
        </span>
    </div>

    <p style="font-size: 12px;">
        code:{{ res_json?.code }}
        &nbsp;
        message:{{ res_json?.message }}
        <el-button
            @click="reverseShowDebugInfo">
            {{ show_debug_info ? 'Hide' : 'Show' }}
        </el-button>
    </p>
    <p>
        <el-table :data="tableData" border style="width: 100%"
        v-if="show_debug_info">
            <!-- Attribute 列 -->
            <el-table-column prop="attribute" label="Attr." width="180" />
    
            <!-- Content 列 -->
            <el-table-column prop="content" label="Content" />
        </el-table>
    </p>
    <el-drawer
        v-model="open_settings_drawer"
        title="Settings"
        direction="rtl">
        <template #default>
            <div>
                <p>
                    Show Author:
                    <el-switch
                        v-model="show_author"
                        />
                </p>
                <p>
                    Show res_json:
                    <el-switch
                        v-model="show_res_json"
                        />
                </p>
                <p>
                    Show debugInfo:
                    <el-switch
                        v-model="show_debug_info"
                        />
                </p>
                <p>
                    Show Tweet:
                    <el-switch
                        v-model="show_tweet"
                    />
                </p>
                <p>
                    Focus Download Original Image:
                    <el-switch
                        v-model="focus_download_orig_img"
                        />
                </p>
                <p>
                    Show Jump To Author Link:
                    <el-switch
                        v-model="show_jump_to_author_button"
                        />
                    <br>
                    Jump Link Prefix:
                    <el-input
                        v-model="jump_to_author_url_prefix"
                        style="width: 200px;"
                        />
                </p>
                <p>
                    Git_CommitHash: {{ git_commithash }}
                </p>
            </div>
        </template>
    </el-drawer>
</div>
</template>

<style lang="css" scoped>
.gray-text {
    color: #001aff;
}
.media-preview {
  max-width: 160px;
  max-height: 120px;
  border-radius: 4px;
  object-fit: contain;
}

.media-url {
  color: #409eff;
  text-decoration: none;
  word-break: break-all;
}

.media-url:hover {
  text-decoration: underline;
}
</style>