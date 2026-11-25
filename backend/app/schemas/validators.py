import re

PHONE_PATTERN = re.compile(r"^\+?[\d\s\-()]{7,20}$")


def validate_phone_number(value: str | None) -> str | None:
    """
    Validate and normalize an optional phone number string, rejecting alphabetic characters.

    @param value: Raw phone number input.
    @return: Trimmed phone number or None if empty.
    """
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if not PHONE_PATTERN.match(cleaned):
        raise ValueError("Phone number may only contain digits, spaces, '+', '-', or parentheses (7-20 characters)")
    digits_only = re.sub(r"\D", "", cleaned)
    if len(digits_only) < 7 or len(digits_only) > 15:
        raise ValueError("Phone number must contain between 7 and 15 digits")
    return cleaned
