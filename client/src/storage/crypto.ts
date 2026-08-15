/**
 * 精密工作台风格契约：密钥在 IndexedDB 中加密持久化；该保护不宣称能够抵抗已被攻陷的设备或页面代码。
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  version: 1;
}

const toBase64 = (bytes: ArrayBuffer) => {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]);
  return btoa(binary);
};
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export async function encryptSecret(secret: string, key: CryptoKey): Promise<EncryptedSecret> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(secret));
  return { ciphertext: toBase64(ciphertext), iv: toBase64(iv.buffer), version: 1 };
}

export async function decryptSecret(payload: EncryptedSecret, key: CryptoKey): Promise<string> {
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(payload.iv) }, key, fromBase64(payload.ciphertext));
  return decoder.decode(plaintext);
}

export async function createMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
