import { defineStore } from "pinia"
import { ref,reactive } from "vue";

export const useBulkSettingsStore = defineStore('bulk-settings',()=>{
    let focus_download_orig_img = ref(true);

    return {
        focus_download_orig_img
    }
},{
    persist: true,
})