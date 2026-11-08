from __future__ import annotations

import datetime
from typing import Any, Dict, List, Tuple


class ValidationError(ValueError):
    """Raised when a Fibber puzzle payload fails schema or rule validation."""
    pass


MAX_HEADLINE_LENGTH = 110
REQUIRED_ROUNDS_COUNT = 3
REQUIRED_ITEMS_PER_ROUND = 4
REQUIRED_FAKES_PER_ROUND = 1
FAKE_SOURCE_TEXT = "Invented for this puzzle."


def validate_puzzle(data: Any) -> Tuple[bool, List[str]]:
    """
    Validate a complete Fibber puzzle payload against strict output specifications.

    Returns:
        (is_valid, errors): True with empty list if valid, False with error descriptions otherwise.
    """
    errors: List[str] = []

    if not isinstance(data, dict):
        return False, ["Root payload must be a JSON object (dict)."]

    # 1. Date validation
    date_val = data.get("date")
    if not isinstance(date_val, str):
        errors.append("Field 'date' is required and must be a string (YYYY-MM-DD).")
    else:
        try:
            parsed_date = datetime.date.fromisoformat(date_val)
            if parsed_date.strftime("%Y-%m-%d") != date_val:
                errors.append(f"Field 'date' '{date_val}' is not in valid YYYY-MM-DD format.")
        except ValueError:
            errors.append(f"Field 'date' '{date_val}' is not a valid ISO calendar date.")

    # 2. Rounds validation
    rounds = data.get("rounds")
    if not isinstance(rounds, list):
        errors.append("Field 'rounds' is required and must be a list of 3 rounds.")
        return False, errors

    if len(rounds) != REQUIRED_ROUNDS_COUNT:
        errors.append(
            f"Expected exactly {REQUIRED_ROUNDS_COUNT} rounds, found {len(rounds)}."
        )

    for round_idx, round_items in enumerate(rounds):
        round_num = round_idx + 1
        if not isinstance(round_items, list):
            errors.append(f"Round {round_num} must be a list of {REQUIRED_ITEMS_PER_ROUND} items.")
            continue

        if len(round_items) != REQUIRED_ITEMS_PER_ROUND:
            errors.append(
                f"Round {round_num} must have exactly {REQUIRED_ITEMS_PER_ROUND} items, found {len(round_items)}."
            )

        fake_count = 0
        headlines_seen = set()

        for item_idx, item in enumerate(round_items):
            item_num = item_idx + 1
            loc = f"Round {round_num}, Item {item_num}"

            if not isinstance(item, dict):
                errors.append(f"{loc} must be an object.")
                continue

            # Check expected keys
            keys = set(item.keys())
            expected_keys = {"t", "real", "s"}
            if keys != expected_keys:
                missing = expected_keys - keys
                unexpected = keys - expected_keys
                if missing:
                    errors.append(f"{loc} missing required fields: {sorted(missing)}.")
                if unexpected:
                    errors.append(f"{loc} contains unexpected extra fields: {sorted(unexpected)}.")

            # Validate 't' (headline)
            t = item.get("t")
            if not isinstance(t, str):
                errors.append(f"{loc} field 't' must be a string.")
            else:
                t_clean = t.strip()
                if not t_clean:
                    errors.append(f"{loc} field 't' cannot be empty or whitespace only.")
                if len(t) > MAX_HEADLINE_LENGTH:
                    errors.append(
                        f"{loc} headline exceeds maximum length of {MAX_HEADLINE_LENGTH} characters "
                        f"(current: {len(t)} chars): '{t}'"
                    )
                if t_clean in headlines_seen:
                    errors.append(f"{loc} duplicate headline in round: '{t_clean}'")
                headlines_seen.add(t_clean)

            # Validate 'real' (bool)
            real = item.get("real")
            if not isinstance(real, bool):
                errors.append(f"{loc} field 'real' must be a boolean (True or False).")
            else:
                if real is False:
                    fake_count += 1
                    s = item.get("s")
                    if isinstance(s, str) and s.strip() != FAKE_SOURCE_TEXT:
                        errors.append(
                            f"{loc} is a fake story (real=False), so field 's' must be "
                            f"'{FAKE_SOURCE_TEXT}', found '{s}'."
                        )

            # Validate 's' (source)
            s = item.get("s")
            if not isinstance(s, str):
                errors.append(f"{loc} field 's' must be a string.")
            elif not s.strip():
                errors.append(f"{loc} field 's' cannot be empty.")

        if fake_count != REQUIRED_FAKES_PER_ROUND:
            errors.append(
                f"Round {round_num} must contain exactly {REQUIRED_FAKES_PER_ROUND} fake story "
                f"(real=False), found {fake_count}."
            )

    return len(errors) == 0, errors


def assert_valid_puzzle(data: Any) -> None:
    """Validate puzzle and raise ValidationError if invalid."""
    is_valid, errors = validate_puzzle(data)
    if not is_valid:
        msg = "Fibber puzzle validation failed with errors:\n  - " + "\n  - ".join(errors)
        raise ValidationError(msg)
