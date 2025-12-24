import { defineStore } from "pinia"
import { ref, reactive } from "vue";

export const useSettingsStore = defineStore('settings',()=>{
    let show_res_json = ref(true);
    let show_debug_info = ref(true);
    let show_author = ref(true);
    let show_tweet = ref(true);
    let focus_download_orig_img = ref(true);
    let show_jump_to_author_button = ref(true);
    let jump_to_author_url_prefix = ref('https://twitter.com/');

    return {show_res_json,
        show_debug_info,
        show_author,
        show_tweet,
        focus_download_orig_img,
        show_jump_to_author_button,
        jump_to_author_url_prefix
    }
},{
    persist: true,
})
