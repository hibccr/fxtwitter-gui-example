export function readClipboard() {
    return navigator.permissions.query({
        name: 'clipboard-read'
    })
    .then(result => {
        if(result.state == 'prompt' || result.state == 'granted'){
            return navigator.clipboard.readText().then(
                data => {
                    console.log('read clipboard success. ' + data);
                    return data;
                }
            );
        } else {
            return undefined;
        }
    });
}
