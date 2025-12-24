import { defineStore } from "pinia"
import { ref, reactive } from "vue";

export const useParserSettingsStore = defineStore('parser-settings',()=>{
    let x_open_link_prefix = ref('https://x.com');
    let enable_video_player = ref('no');
    let show_alt_text = ref(false);

    return {
        x_open_link_prefix,
        enable_video_player,
        show_alt_text
    }
},{
    persist: true,
})
