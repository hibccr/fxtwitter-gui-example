import useClipboard from 'vue-clipboard3';
import { ElMessage } from 'element-plus';

const { toClipboard } = useClipboard()

export async function copyStringToClipboard(str){
    try{
        await toClipboard(str)
        ElMessage({
            message: 'Copied!',
            type: 'success'
        })
        console.log('Copied! res_json')
    } catch (e) {
        ElMessage({
            message: 'Copy failed!',
            type: 'error'
        })
        console.error(e)
    }
}

