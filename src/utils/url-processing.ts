export function getOriginImageUrl(obj, enable_flag = true){
    if (obj?.type === 'photo' && enable_flag){
        return appendOrigParam(obj.url)
    }else{
        return obj.url
    }
}

export function appendOrigParam(url) {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('name', 'orig');
        return urlObj.toString();
    } catch (e) {
        return null;
    }
}