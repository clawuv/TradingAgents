import hashlib
import hmac
import secrets


def hash_password(password: str, salt: str | None = None) -> str:
    salt_value = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_value.encode("utf-8"),
        100_000,
    ).hex()
    return f"{salt_value}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_value, digest = stored_hash.split("$", 1)
    except ValueError:
        return False
    expected = hash_password(password, salt=salt_value).split("$", 1)[1]
    return hmac.compare_digest(digest, expected)


def generate_access_token() -> str:
    return secrets.token_urlsafe(32)
