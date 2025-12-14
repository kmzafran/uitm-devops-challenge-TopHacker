import re
from typing import List, Tuple

ALLOWED_PROPERTY_TYPES = {
    "property", "condo", "apartment", "house", "townhouse", "villa", "penthouse"
}

ALLOWED_REGIONS = {
    "johor", "kedah", "kelantan", "melaka", "negeri-sembilan", "pahang",
    "perak", "perlis", "penang", "sabah", "sarawak", "selangor",
    "terengganu", "kuala-lumpur", "putrajaya", "labuan",
}


def slugify(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-{2,}", "-", s).strip("-")


def slugify_region_path(s: str) -> str:
    # allow nested subpaths like "penang/barat-daya-southwest-penang"
    s = (s or "").strip().lower().replace("\\", "/")
    s = re.sub(r"[^a-z0-9/]+", "-", s)
    s = re.sub(r"-{2,}", "-", s)
    s = re.sub(r"/{2,}", "/", s)
    return s.strip("/")


def normalize_property_type(pt: str | None) -> str:
    if not pt:
        return "penthouse"
    # allow passing with "-for-rent" suffix
    pt = slugify(pt)
    pt = pt.replace("-for-rent", "")
    return pt


def validate_property_type(pt: str) -> None:
    if pt not in ALLOWED_PROPERTY_TYPES:
        raise ValueError(
            f"Invalid property_type='{pt}'. "
            f"Allowed: {sorted(ALLOWED_PROPERTY_TYPES)}"
        )


def normalize_regions(region_arg: str | None) -> List[str]:
    """
    Accepts comma-separated regions. Each entry can be:
      - a top-level region slug (e.g., 'penang')
      - a nested path 'penang/barat-daya-southwest-penang'
    """
    if not region_arg:
        return []
    raw = [r for r in region_arg.split(",") if r and r.strip()]
    return [slugify_region_path(r) for r in raw]


def validate_regions(regions: List[str]) -> Tuple[bool, List[str]]:
    invalid = []
    for r in regions:
        # Nested path must start with a valid top-level region
        top = r.split("/", 1)[0]
        if top not in ALLOWED_REGIONS:
            invalid.append(r)
        else:
            # Entire path must be slug-like
            if not re.fullmatch(r"[a-z0-9]+(?:[-/][a-z0-9]+)*", r):
                invalid.append(r)
    return (len(invalid) == 0, invalid)


def build_start_urls(region_arg: str | None, property_type_arg: str | None) -> List[str]:
    pt = normalize_property_type(property_type_arg)
    validate_property_type(pt)

    regions = normalize_regions(region_arg)
    ok, invalid = validate_regions(regions) if regions else (True, [])
    if not ok:
        raise ValueError(
            f"Invalid region value(s): {invalid}. "
            f"Allowed top-level regions: {sorted(ALLOWED_REGIONS)}; "
            f"nested paths like 'penang/barat-daya-southwest-penang' are supported."
        )

    base_type = f"{pt}-for-rent" if pt != "property" else "property-for-rent"
    base = f"https://www.fazwaz.my/{base_type}/malaysia"

    if regions:
        return [f"{base}/{r}" for r in regions]
    # Default region if only property_type provided (or none)
    return [f"{base}/penang"]
