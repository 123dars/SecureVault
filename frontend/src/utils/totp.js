import CryptoJS from 'crypto-js';

// Convert Secret Key to Bytes
function base32ToWordArray(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i].toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const words = [];
  for (let i = 0; i < bits.length; i += 32) {
    words.push(parseInt(bits.slice(i, i + 32).padEnd(32, '0'), 2));
  }
  return CryptoJS.lib.WordArray.create(words, Math.floor(bits.length / 8));
}

export function generateTOTP(secret) {
  try {
    const key = base32ToWordArray(secret.replace(/\s+/g, '').toUpperCase());
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30);
    const timeHex = timeStep.toString(16).padStart(16, '0');
    const timeWords = CryptoJS.enc.Hex.parse(timeHex);
    
    // Calculate HMAC-SHA1
    const hmac = CryptoJS.HmacSHA1(timeWords, key);
    const hmacHex = CryptoJS.enc.Hex.stringify(hmac);
    
    // Extract the 6-digit code
    const offset = parseInt(hmacHex.slice(-1), 16) * 2;
    const codeStr = hmacHex.slice(offset, offset + 8);
    const codeNum = parseInt(codeStr, 16) & 0x7FFFFFFF;
    
    return (codeNum % 1000000).toString().padStart(6, '0');
  } catch (err) {
    return "INVALID";
  }
}

export function getTotpTimeLeft() {
  const epoch = Math.floor(Date.now() / 1000);
  return 30 - (epoch % 30);
}
