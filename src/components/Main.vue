<script setup lang="ts">
import axios from 'axios';
import { ref, reactive, computed, onMounted } from 'vue';
import { flatten } from 'flat';
import { useSettingsStore } from '@/store/settings';
import { storeToRefs } from 'pinia';
import useClipboard from 'vue-clipboard3';
import { ElMessage } from 'element-plus';
import { readClipboard } from '@/utils/clipboard-read';

const { toClipboard } = useClipboard();

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

let timezone_input = ref('');

// use pinia instead of this
let settingsStore = useSettingsStore()
let {show_res_json,
    show_debug_info,
    show_author,
    show_tweet,
    focus_download_orig_img,
    show_jump_to_author_button,
    jump_to_author_url_prefix,
    set_timezone } = storeToRefs(settingsStore)

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

onMounted(() => {
    timezone_input.value = set_timezone.value
})


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
        // Parse the path and split it into an array
        const pathSegments = new URL(url).pathname.split('/').filter(s => s);
        // The username is located in the first valid path segment after the domain (e.g., "i")
        return pathSegments.length >= 1 ? pathSegments[0] : null;
    } catch (e) {
        return null;
    }
}

// Example
//console.log(extractUsername('https://x.com/i/status/1901969891890192564/photo/1')); // Output："i"
//console.log(extractUsername('https://twitter.com/john_doe/status/12345'));        // Output："john_doe"

function buildApiUrl(username, statusId) {
    // Validate input parameters
    if (!username || !statusId || typeof username !== 'string' || !/^\d+$/.test(statusId)) {
        return null; // Return null or throw error (adjust depending on requirements)
    }
    // Build URL using template string
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
    res_json = response.data;
    res_json_text.value = JSON.stringify(res_json);
    console.log('Data Saved:', res_json);
    is_api_error.value = false;
  } catch (error) {
    is_api_error.value = true;
    api_error_msg.value = error.message;
    api_error_status.value = error.status;
    res_json = error?.response?.data;
    console.error('Request Error:', error);
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
    // Validate username format
    if (!username || typeof username !== 'string') {
        return null; // Return null or throw custom error
    }

    // Encode username for URL safety
    const encodedUsername = encodeURIComponent(username);
    
    // Dynamically construct URL segments
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
        return null; // url invaild
    }
}

async function buttonClicked(){
tableData.length = 0; //clear tableData and keep Reactive
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

async function copyResJsonToClipboard(){
    try{
        await toClipboard(res_json_text.value)
        ElMessage({
            message: 'Copied!',
            type: 'success'
        })
        console.log('Copied! res_json')
    } catch (e) {
        ElMessage({
            message: 'Copy failed!',
            type: 'error'
        })
        console.error(e)
    }
}

function pasteButtonClicked(){
    readClipboard()
        .then((clipboardData)=>{
            if(clipboardData){
                tweet_url.value = clipboardData
            }else{
                ElMessage({
                    message: 'Clipboard is empty or no permission.',
                    type: 'error'
                })
            }
        })
        .catch((error)=>{
            ElMessage({
                message: 'Error: when use clipboard.',
                type: 'error'
            })
        })
}

function timeStampProcess(timestamp){
    if (timestamp == undefined || timestamp == null || timestamp == ''){
        return ''
    }

    let dateObject = new Date(timestamp)
    let formatOptions = {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: set_timezone.value,
        hour12: false,
        timeZoneName: 'short',
        year: 'numeric'
    }

    let result = ''
    try{
        result = new Intl.DateTimeFormat('en-US', formatOptions).format(dateObject)
    }catch (error){
        set_timezone.value = 'UTC'
        ElMessage({
            message: 'timezone is invaild.',
            type: 'error'
        })
    }
    return result
}

function timeZoneAssert(timezone){
    let dateObject = new Date('2020-01-01T00:00:00Z')
    try {
        new Intl.DateTimeFormat('en-US', {
            timeZone: timezone
        }).format(dateObject)
    } catch(error) {
        return false
    }
    return true
}

function timeZoneElInputBlurHandle(){
    if (timeZoneAssert(timezone_input.value)){
        set_timezone.value = timezone_input.value
    }else{
        set_timezone.value = 'UTC'
        ElMessage({
            message: 'timezone is invaild.',
            type: 'error'
        })
    }
}
</script>

<template>
<div>
    <p>URL: 
        <el-input v-model="tweet_url"
                    style="width: 240px;"
                    />
        <el-button @click="buttonClicked">Click</el-button>
        <el-button @click="pasteButtonClicked">Paste</el-button>
        <el-button @click="reverseOpenSettingsDrawer">
            Open Settings
        </el-button>
        <span style="color:red;"
              v-if="is_api_error">
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
        <el-button
        @click="copyResJsonToClipboard">
            Copy
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
            <span class="gray-text">Joined at</span> {{ timeStampProcess(res_json?.tweet?.author?.joined) }} <span class="gray-text">Followers:</span> {{ res_json?.tweet?.author?.followers }} <span class="gray-text">Following:</span> {{ res_json?.tweet?.author?.following }} <span class="gray-text">Tweets:</span> {{ res_json?.tweet?.author?.tweets }}
        </p>
        <p v-if="apiTypeInUser">
            <span class="gray-text">User:</span> {{ res_json?.user?.name }} (@{{ res_json?.user?.screen_name }}) [ID:{{ res_json?.user?.id }}] <a :href="getJumpLink()" target="_blank" v-if="show_jump_to_author_button && !(is_api_error)">Jump</a><span v-if="show_jump_to_author_button && !(is_api_error)">&nbsp;</span><span class="gray-text" v-if="getWebsiteUrl() != undefined && getWebsiteUrl() != ''">Website:</span> {{ getWebsiteUrl() }}
            <br>
            <span class="gray-text">Description:</span> {{ res_json?.user?.description }}
            <br>
            <span class="gray-text">Joined at</span> {{ timeStampProcess(res_json?.user?.joined) }} <span class="gray-text">Followers:</span> {{ res_json?.user?.followers }} <span class="gray-text">Following:</span> {{ res_json?.user?.following }} <span class="gray-text">Tweets:</span> {{ res_json?.user?.tweets }}
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
                Time: {{ timeStampProcess(res_json?.tweet?.created_at) }}
                &nbsp;
                From: {{ res_json?.tweet?.source }}
            </p>
        </div>
    </div>
    <div class="media-div">
        <el-table :data="mediaTableData" style="width: 100%">
            <!-- Media Type -->
            <el-table-column prop="type" label="Media Type" width="120" />
    
            <!-- Preview -->
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
    
            <!-- Resource Address -->
            <el-table-column label="Resource Address">
              <template #default="{ row }">
                <a :href="getOriginImageUrl(row)" target="_blank" class="media-url" rel="noreferrer">
                  {{ getOriginImageUrl(row) }}
                </a>
              </template>
            </el-table-column>
    
            <!-- Size -->
            <el-table-column label="Size" width="150">
              <template #default="{ row }">
                {{ row.width }} × {{ row.height }}
              </template>
            </el-table-column>
    
            <!-- Description (altText) -->
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
            <!-- Attribute -->
            <el-table-column prop="attribute" label="Attr." width="180" />
    
            <!-- Content -->
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
                    <br>
                    Show res_json:
                    <el-switch
                        v-model="show_res_json"
                        />
                    <br>
                    Show debugInfo:
                    <el-switch
                        v-model="show_debug_info"
                        />
                    <br>
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
                    Timezone:
                    <el-input
                        style="width: 200px;"
                        v-model="timezone_input"
                        @blur="timeZoneElInputBlurHandle"
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
