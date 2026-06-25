import CryptoJS from 'crypto-js';

/**
 * Derives a strong 256-bit encryption key from the user's master password.
 * Uses PBKDF2 with 100,000 iterations (Industry standard).
 */
export const deriveKey = (password, username) => {
    // We use the username as the salt
    const salt = CryptoJS.enc.Utf8.parse(username);
    
    // Create the secure derived key
    const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32, // 256-bit key
        iterations: 100000,
        hasher: CryptoJS.algo.SHA256
    });
    
    // Return as a string so it can be stored in sessionStorage safely
    return key.toString(CryptoJS.enc.Base64);
};

export const encryptData = (text, derivedKeyStr) => {
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    const key = CryptoJS.enc.Base64.parse(derivedKeyStr);
    
    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return {
        ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64)
    };
};

export const decryptData = (ciphertext, iv, derivedKeyStr) => {
    try {
        const key = CryptoJS.enc.Base64.parse(derivedKeyStr);
        const ivParsed = CryptoJS.enc.Base64.parse(iv);
        
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: CryptoJS.enc.Base64.parse(ciphertext) },
            key,
            { iv: ivParsed, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );

        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Decryption failed", error);
        return "";
    }
};