import { defineStore } from "pinia"
import { ref,reactive } from "vue";

export const useParserSettingsStore = defineStore('parser-settings',()=>{
    let x_open_link_prefix = ref('https://x.com');
    let enable_video_player = ref('no');

    return {
        x_open_link_prefix,
        enable_video_player
    }
},{
    persist: true,
})