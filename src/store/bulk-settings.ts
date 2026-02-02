import { defineStore } from "pinia"
import { ref, reactive } from "vue";

export const useBulkSettingsStore = defineStore('bulk-settings',()=>{
    let focus_download_orig_img = ref(true);
    let use_v2_process_function = ref(true);
    let max_retry_times_v2 = ref(0);

    return {
        focus_download_orig_img,
        use_v2_process_function,
        max_retry_times_v2
    }
},{
    persist: true,
})
