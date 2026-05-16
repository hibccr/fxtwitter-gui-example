import { defineStore } from "pinia"
import { ref, reactive } from "vue"

export const useSharedataDownloaderStore = defineStore('sharedata-downloader',()=>{
    let fxtwitterObjects = reactive([])

    return {
        fxtwitterObjects
    }
}
)
