import { defineStore } from "pinia"
import { ref, reactive } from "vue";

export const DEFAULT_VALID_URL_PREFIX = [
    'x.com',
    'www.x.com',
    'sotwe.com',
    'www.sotwe.com',
    'twitter.com',
    'www.twitter.com',
    'mobile.twitter.com',
    'xcancel.com',
    'fxtwitter.com',
    'fixupx.com',
    'i.fixupx.com',
    'vxtwitter.com',
    'fixvx.com',
    'twitterviewer.net',
    'xxcancel.com'
]

export const useBulkSettingsStore = defineStore('bulk-settings',()=>{
    let focus_download_orig_img = ref(true);
    let use_v2_process_function = ref(true);
    let max_retry_times_v2 = ref(0);
    let valid_url_prefix = ref([...DEFAULT_VALID_URL_PREFIX]);

    return {
        focus_download_orig_img,
        use_v2_process_function,
        max_retry_times_v2,
        valid_url_prefix
    }
},{
    persist: true,
})
