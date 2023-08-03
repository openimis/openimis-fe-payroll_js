export function isBase64Encoded(str) {
    // Base64 encoded strings can only contain characters from [A-Za-z0-9+/=]
    const base64RegExp = /^[A-Za-z0-9+/=]+$/;
    return base64RegExp.test(str);
}

export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}
