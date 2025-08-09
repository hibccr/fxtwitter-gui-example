<script setup lang="ts">
import { ref, reactive } from 'vue';

let ref_input = ref('')
let ref_output = ref('')
let hasErrorFlag = false
let photoListData = reactive([])

function normalizeTwitterImageUrl(originalUrl) {
  try {
    const urlObj = new URL(originalUrl);
    const pathname = urlObj.pathname; // get full path
    
    // extract media ID
    const mediaIdWithExt = pathname.split('/').pop(); // "Gxu1RhgawAEMVWa.png"
    const mediaId = mediaIdWithExt.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
    
    // 提取格式：优先级 1. 查询参数 > 2. 路径后缀 > 3. 默认 jpg
    // Format extraction priority: 1. Query parameters > 2. Path suffix > 3. Default jpg
    const formatFromQuery = urlObj.searchParams.get('format');
    // 直接从媒体ID部分提取后缀（而非上一级目录）
    // Directly extract the suffix from the media ID segment (as opposed to the parent directory).
    const formatFromPath = mediaIdWithExt.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1];
    const format = (formatFromQuery || formatFromPath || 'jpg').toLowerCase();

    // 重组URL
    // Normalize URL
    urlObj.pathname = `/media/${mediaId}`;
    urlObj.searchParams.set('format', format);
    urlObj.searchParams.set('name', 'orig');
    
    return urlObj.toString();
  } catch (e) {
    console.error('URL parse error:', e);
    //ref_output.value = ref_output.value + '\n'
    hasErrorFlag = true
    return '';
  }
}

function inputButtonClicked(){
    ref_output.value = ref_output.value + new Date().toString() + '\n'
    hasErrorFlag = false
    let inputUrlArrary = ref_input.value.split('\n').filter(Boolean)
    let processedUrlArray = inputUrlArrary.map((element) => {
        try{
            element = normalizeTwitterImageUrl(element)
            ref_output.value = ref_output.value + element + '\n'
            return element
        }catch(e){
            console.error(e)
            element = ''
            //ref_output.value = ref_output.value + '\n'
            hasErrorFlag = true
        }
    })

    Object.assign(photoListData, processedUrlArray.filter(Boolean))

    if(hasErrorFlag){
        window.alert("Occured Error when processing url.")
    }
}

function clearButtonClicked(){
    ref_input.value = ''
    ref_output.value = ''
    photoListData.length = 0
}
</script>

<template>
    <div>
        <p>
            Input Twitter/X image link, then append orig parameter in it.
        </p>
        <p>
            Input:
            <el-button @click="inputButtonClicked">Click</el-button>
            <el-button @click="clearButtonClicked">Clear</el-button>
        </p>
        <el-input v-model="ref_input" style="width: 100%;" :rows="5" type="textarea" />
        <p>
            Output:
        </p>
        <el-input v-model="ref_output" style="width: 100%;" :rows="5" type="textarea" />
        <p>
            Photo List:
        </p>
        <div class="media-div">
            <el-table :data="photoListData" style="width: 100%">
                <!-- Preview -->
                <el-table-column label="Preview" width="180">
                    <template #default="{row}">
                        <img :src="row" class="media-preview">
                    </template>
                </el-table-column>

                <!-- Resource Address -->
                <el-table-column label="Resource Address">
                    <template #default="{row}">
                        <a :href="row" target="_blank" class="media-url">
                            {{ row }}
                        </a>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<style lang="css" scoped>
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