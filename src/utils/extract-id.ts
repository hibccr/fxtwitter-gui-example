export function extractUsername(url){
    try {
        // 解析路径并分割为数组
        const pathSegments = new URL(url).pathname.split('/').filter(s => s);
        // 用户名位于域名后的第一个有效路径段（如 "i"）
        return pathSegments.length >= 1 ? pathSegments[0] : null;
    } catch (e) {
        return null;
    }
}

export function extractStatusId(url){
    try {
        const pathSegments = new URL(url).pathname.split('/');
        const statusIndex = pathSegments.indexOf('status') + 1;
        return statusIndex > 0 && statusIndex < pathSegments.length 
               ? pathSegments[statusIndex] 
               : null;
    } catch (e) {
        return null;
    }
}

export function judgeUserOrTweet(username, statusId){
    //console.log('username=' + username + ',statusId=' + statusId)
    if(statusId === '' || statusId === null){
        if(username != '' && username != null){
            return 'user'
        }else{
            return ''
        }
    }else{
        return 'tweet'
    }
}

export function buildApiUrlv2(username, statusId) {
    // 验证 username 有效性
    if (!username || typeof username !== 'string') {
        return null; // 或抛出错误
    }

    // 对 username 进行编码
    const encodedUsername = encodeURIComponent(username);
    
    // 动态拼接 URL
    const baseUrl = `https://api.fxtwitter.com/${encodedUsername}`;
    const statusPath = (statusId && /^\d+$/.test(statusId)) ? `/status/${statusId}` : '';
    
    return `${baseUrl}${statusPath}`;
}

export function buildUrlDataObject(url){
    let username,
        statusId,
        userOrTweet,
        apiUrl;
    
    username = extractUsername(url)
    statusId = extractStatusId(url)
    userOrTweet = judgeUserOrTweet(username, statusId)
    apiUrl = buildApiUrlv2(username, statusId)

    return {
        url: url,
        userOrTweet: userOrTweet,
        apiUrl: apiUrl
    }
}