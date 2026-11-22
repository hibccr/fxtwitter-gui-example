import { defineStore } from "pinia"
import { ref, reactive } from "vue";
import type { TimeDisplayFormat } from "@/utils/time";

export const useParserSettingsStore = defineStore('parser-settings',()=>{
    let x_open_link_prefix = ref('https://x.com');
    let enable_video_player = ref('no');
    let show_alt_text = ref(false);
    // Time display settings for the JSON parser page only. They are kept
    // separate from the global settings store on purpose, so changing the
    // parser page does not affect the main page.
    let parser_timezone = ref('UTC');
    // Unknown legacy values fall back to 'twitter' at format time.
    let parser_time_display_format = ref<TimeDisplayFormat>('twitter');

    return {
        x_open_link_prefix,
        enable_video_player,
        show_alt_text,
        parser_timezone,
        parser_time_display_format
    }
},{
    persist: true,
})
