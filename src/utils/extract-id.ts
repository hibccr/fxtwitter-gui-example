export function extractUsername(url){
    try {
        const pathSegments = new URL(url).pathname.split('/').filter(s => s);
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
    
    if (!username || typeof username !== 'string') {
        return null;
    }

    const encodedUsername = encodeURIComponent(username);
    
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
