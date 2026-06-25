import os
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Protocol.KDF import PBKDF2

# Cryptographic Constants
SALT_SIZE = 32
KEY_SIZE = 32  # 32 bytes = 256 bits for AES-256
ITERATIONS = 200_000

def generate_salt() -> bytes:
    """Generates a random 32-byte salt."""
    return os.urandom(SALT_SIZE)

def derive_key(master_password: str, salt: bytes) -> bytes:
    """
    Derives a 256-bit AES key from the master password using PBKDF2.
    This intentionally slows down brute-force attacks.
    """
    return PBKDF2(master_password, salt, dkLen=KEY_SIZE, count=ITERATIONS)

def encrypt_password(plaintext: str, key: bytes) -> tuple[bytes, bytes]:
    """
    Encrypts a string using AES-256-CBC.
    Returns a tuple containing the (ciphertext, initialization_vector).
    """
    iv = os.urandom(16)  # 16 bytes = 128-bit IV required for AES
    cipher = AES.new(key, AES.MODE_CBC, iv)
    
    # AES requires data to be a multiple of its block size (16 bytes)
    padded_data = pad(plaintext.encode('utf-8'), AES.block_size)
    ciphertext = cipher.encrypt(padded_data)
    
    return ciphertext, iv

def decrypt_password(ciphertext: bytes, iv: bytes, key: bytes) -> str:
    """
    Decrypts AES-256-CBC ciphertext back to the original plaintext string.
    """
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_data = cipher.decrypt(ciphertext)
    
    # Remove the padding added during encryption
    plaintext = unpad(padded_data, AES.block_size)
    
    return plaintext.decode('utf-8')

# --- Isolated Testing ---
if __name__ == '__main__':
    print("--- Testing Cryptographic Engine ---")
    test_master = "SuperSecretMaster123!"
    test_secret = "MyBankPassword2026"
    
    print(f"1. Master Password: {test_master}")
    print(f"2. Secret to Hide:  {test_secret}\n")
    
    # Simulate User Registration (creating a salt)
    salt = generate_salt()
    
    # Simulate Vault Unlock (deriving the key)
    key = derive_key(test_master, salt)
    print("3. Key derived successfully.")
    
    # Simulate Adding a Password
    ciphertext, iv = encrypt_password(test_secret, key)
    print(f"4. Encrypted (Hex): {ciphertext.hex()}")
    
    # Simulate Reading a Password
    decrypted = decrypt_password(ciphertext, iv, key)
    print(f"5. Decrypted:       {decrypted}")
    
    assert test_secret == decrypted
    print("\nSuccess: Decrypted text matches the original secret! The math works.")
