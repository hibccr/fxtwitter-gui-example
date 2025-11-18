<script setup lang="ts">
import { buildUrlDataObject } from '@/utils/extract-id'
import { ref, reactive } from 'vue'
import axios from 'axios'
import { readClipboard } from '@/utils/clipboard-read'
import { ElMessage } from 'element-plus'
import { copyStringToClipboard } from '@/utils/clipboard-write'
import { useBulkSettingsStore } from '@/store/bulk-settings'
import { storeToRefs } from 'pinia'
import { getOriginImageUrl } from '@/utils/url-processing'

let ref_input = ref('')
let ref_output = ref('')
let processMessage = ref('')
let settingsDrawerFlag = ref(false)

let urlDataObjectArray = reactive([])
let mediaListData = reactive([])

let bulkSettingsStore = useBulkSettingsStore()
let { focus_download_orig_img } = storeToRefs(bulkSettingsStore)

function removeHashComments(text) {
    // 1. Delete a entity line
    let result = text.replace(/^#.*\n?/gm, '');
    
    // 2. Delete line's tail
    result = result.replace(/#[^\n]*$/gm, '');
    
    // 3. Clear empty line
    result = result.replace(/\n{2,}/g, '\n');
    return result.endsWith('\n') ? result : result + '\n';
}

function isValidURL(str) {
  try {
    new URL(str); // Returns true if parsing succeeds
    return true;
  } catch (e) {
    return false; // Returns false if parsing fails
  }
}

function splitString(str) {
    return str.split('\n')
}

function stringStartsWithAt(str) {
    return str.startsWith('@')
}

function replaceUsernamesSafely(text) {
  return text.replace(/@([a-zA-Z0-9_]+)/g, 'https://x.com/$1');
}

function getDomain(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname; // Parse the URL and return the domain name (e.g., "www.example.com")
  } catch (error) {
    console.error("URL error:", error);
    return null;
  }
}

function generateRequest(url_array){
    urlDataObjectArray.length = 0
    url_array.map((element) => {
        urlDataObjectArray.push(buildUrlDataObject(element))
    })
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function axiosRequest(urlDataObjectArray){
    for(const element of urlDataObjectArray){
        processMessage.value = 'Waiting... ' + element.url 
        try{
            const response = await axios.get(element.apiUrl)
            element.axiosResponse = response
        }catch (error){
            element.axiosError = error
        }
    await sleep(1000) //avoid of api limit
    }
    processMessage.value = ''
}

function outputToBox(){
    urlDataObjectArray.map((element) =>{
        //console.log(element)
        if(element.axiosResponse == null || element.axiosResponse == undefined){
            if(element.axiosError == null || element.axiosError == undefined){
                ref_output.value = ref_output.value + 'Error: Empty Result, url=' + element.apiUrl + '\n'
            }else{
                ref_output.value = ref_output.value + 'Error: Axios: ' + element.axiosError.message + ' (' + element.axiosError.status + '), url=' + element.apiUrl + ', body=' + JSON.stringify(element.axiosError?.response?.data) + '\n'
            }
        }else{
            outputToMediaList(element)
            ref_output.value = ref_output.value + JSON.stringify(element.axiosResponse?.data) + '\n'
        }
    })
}

function outputToMediaList(obj){
    if(obj.userOrTweet == 'user'){
        return
    }
    if(obj.axiosResponse.data.tweet?.media?.all){
        obj.axiosResponse.data.tweet?.media?.all.map((element) => {
            mediaListData.push(element)
        })
    }
}

function clearButtonClicked(){
    ref_input.value = ''
    ref_output.value = ''
    urlDataObjectArray.length = 0
    mediaListData.length = 0
}

function pasteButtonClicked(){
    readClipboard()
        .then((clipboardData)=>{
            if(clipboardData){
                ref_input.value = clipboardData
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

function copyButtonClicked(){
    copyStringToClipboard(ref_output.value)
}

function openSettingsDrawerButtonClicked(){
    if(settingsDrawerFlag.value === false){
        settingsDrawerFlag.value = true
    }else{
        settingsDrawerFlag.value = false
    }
}

async function bulkButtonClicked(){
    let removeHashCommentsResult,
        splitStringResult,
        //formattedURLResult,
        formattedURLResult2,
        formattedURLResult3,
        formattedURLResult4;
    
    let validUrlPrefix = [
        'x.com',
        'www.x.com',
        'sotwe.com',
        'www.sotwe.com',
        'twitter.com',
        'www.twitter.com',
        'xcancel.com',
        'fxtwitter.com',
        'fixupx.com',
        'vxtwitter.com'
    ]
    
    console.log('System Begin at ' + new Date())
    console.log('1. removeHashComments')
    removeHashCommentsResult = removeHashComments(ref_input.value)
    console.log(removeHashCommentsResult)
    console.log('2. splitString')
    splitStringResult = splitString(removeHashCommentsResult)
    console.log(splitStringResult)
    console.log('3. formattedURL')
    // formattedURLResult = splitStringResult
    formattedURLResult2 = splitStringResult.map((element) => {
        console.log('Now element:' + element)
        console.log('3-1. isValidURL')
        console.log(isValidURL(element))
        if(isValidURL(element)){
            return element
        }else{
            console.log('3-1-1. replace @ to full URL')
            console.log('Begin with @ ?:' + stringStartsWithAt(element))
            if(stringStartsWithAt(element)){
                element = replaceUsernamesSafely(element)
                console.log('3-1-1 Result:' + element)
                return element
            }else{
                element = ''
                console.log('3-1-1 Result: (Clear Invaild Input)')
                return element
            }
        }
    });
    console.log('3-1 Finished, Result:')
    console.log(formattedURLResult2)
    console.log('3-2. Clear Empty Element in Array')
    formattedURLResult3 = formattedURLResult2.filter(Boolean)
    console.log(formattedURLResult3)
    //clear data to release RAM.
    console.log('Clearing used data.')
    removeHashCommentsResult = undefined
    splitStringResult = undefined
    formattedURLResult2 = undefined
    console.log('3-3. judge Domain is X, Twitter or Sotwe')
    formattedURLResult4 = formattedURLResult3.map((element) => {
        console.log('Now Element:' + element)
        let domain = getDomain(element)
        console.log('DomainToLowerCase:'+ domain.toLowerCase())
        if(validUrlPrefix.includes(domain.toLowerCase())){
            console.log('judge Statement: true')
            return element
        }else{
            console.log('judge Statement: false')
            return ''
        }
    })
    console.log('3-3 Finish. Result:')
    console.log(formattedURLResult4)
    formattedURLResult4 = formattedURLResult4.filter(Boolean)
    console.log('3 Finish. prepare to next step.')
    console.log(formattedURLResult4)
    formattedURLResult3 = undefined
    console.log('4. Prepare urlDataObjectArray')
    generateRequest(formattedURLResult4)
    formattedURLResult4 = undefined
    console.log('4 Finish. Result:')
    console.log(urlDataObjectArray)
    console.log('5. Send Request to FxEmbed')
    await axiosRequest(urlDataObjectArray)
    console.log(urlDataObjectArray)
    console.log('6. Output')
    outputToBox()
}
</script>

<template>
    <div>
        <p>
            Input:
            <el-button @click="bulkButtonClicked">Click</el-button>
            <el-button @click="pasteButtonClicked">Paste</el-button>
            <el-button @click="clearButtonClicked">Clear</el-button>
            <el-button @click="openSettingsDrawerButtonClicked">Settings</el-button>
            <span>
                {{ processMessage }}
            </span>
        </p>
        <el-input v-model="ref_input" style="width: 100%;" :rows="5" type="textarea" />
        <p>
            Output:
            <el-button @click="copyButtonClicked">Copy</el-button>
        </p>
        <el-input v-model="ref_output" style="width: 100%;" :rows="5" type="textarea" />
        <p>
            Media List:
        </p>
        <div class="media-div">
            <el-table :data="mediaListData" style="width: 100%">
                <!-- Url -->
                <!-- <el-table-column prop="url" label="url" width="240" /> -->
                <!-- Media Type -->
                <el-table-column prop="type" label="Media Type" width="120" />

                <!-- Preview -->
                <el-table-column label="Preview" width="180">
                    <template #default="{ row }">
                        <img v-if="row.type === 'photo'" :src="row.url" class="media-preview" :alt="row.altText">
                        <img v-else-if="row.type === 'video'" :src="row.thumbnail_url" class="media-preview">
                        <img v-else-if="row.type === 'gif'" :src="row.thumbnail_url" class="media-preview">
                        <span v-else>Not Support</span>
                    </template>
                </el-table-column>

                <!-- Resource Address -->
                <el-table-column label="Resource Address">
                    <template #default="{ row }">
                        <a :href="getOriginImageUrl(row, focus_download_orig_img)" target="_blank" class="media-url">
                            {{ getOriginImageUrl(row, focus_download_orig_img) }}
                        </a>
                    </template>
                </el-table-column>

                <!-- Size -->
                <el-table-column label="Size" width="150">
                    <template #default="{ row }">
                        {{ row.width }} × {{ row.height }}
                    </template>
                </el-table-column>

                <!-- Alt Text (Description) -->
                <el-table-column prop="altText" label="Description" />
            </el-table>
        </div>
        <el-drawer
            v-model="settingsDrawerFlag"
            title="Settings"
            direction="rtl">
            <template #default>
                <div>
                    Focus Download Original Image:
                    <el-switch
                        v-model="focus_download_orig_img"
                    />
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<style lang="css" scoped>
.media-preview {
  max-width: 160px;
  max-height: 120px;
  border-radius: 4px;
  object-fit: contain;
}
</style>