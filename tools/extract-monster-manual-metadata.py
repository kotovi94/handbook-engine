from __future__ import annotations

import json
import hashlib
import os
import re
import sys
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher
from pathlib import Path

from pypdf import PdfReader

try:
    import pdfplumber
except ImportError:  # pragma: no cover - optional runtime helper
    pdfplumber = None


PDF_PATH = Path(os.environ.get("MONSTER_MANUAL_PDF", r"D:\D&D - 5.5 - Manual de Monstruos - Ingles.pdf"))
OUTPUT_PATH = Path("src/dungeon/generated/monsterManual2024Catalog.json")
JS_OUTPUT_PATH = Path("src/dungeon/generated/monsterManual2024Catalog.js")
TEXT_SOURCE_ROOT = Path.home() / ".codex" / "attachments"

CREATURE_TYPES = [
    "Aberration",
    "Beast",
    "Celestial",
    "Construct",
    "Dragon",
    "Elemental",
    "Fey",
    "Fiend",
    "Giant",
    "Humanoid",
    "Monstrosity",
    "Ooze",
    "Plant",
    "Undead",
]

SIZES = [
    "Tiny",
    "Small",
    "Medium",
    "Large",
    "Huge",
    "Gargantuan",
    "Medium or Small",
    "Small or Medium",
    "Medium or Large",
    "Large or Huge",
]

TREASURE_TYPES = ["Any", "Arcana", "Armaments", "Implements", "Individual", "None", "Relics"]

XP_BY_CR = {
    "0": 10,
    "1/8": 25,
    "1/4": 50,
    "1/2": 100,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
    "13": 10000,
    "14": 11500,
    "15": 13000,
    "16": 15000,
    "17": 18000,
    "18": 20000,
    "19": 22000,
    "20": 25000,
    "21": 33000,
    "22": 41000,
    "23": 50000,
    "24": 62000,
    "25": 75000,
    "26": 90000,
    "27": 105000,
    "28": 120000,
    "29": 135000,
    "30": 155000,
}

APPENDIX_ANIMAL_METADATA = [
    ("Allosaurus", "Large", "2"),
    ("Ankylosaurus", "Huge", "3"),
    ("Ape", "Medium", "1/2"),
    ("Archelon", "Huge", "4"),
    ("Baboon", "Small", "0"),
    ("Badger", "Tiny", "0"),
    ("Bat", "Tiny", "0"),
    ("Black Bear", "Medium", "1/2"),
    ("Blood Hawk", "Small", "1/8"),
    ("Boar", "Medium", "1/4"),
    ("Brown Bear", "Large", "1"),
    ("Camel", "Large", "1/8"),
    ("Cat", "Tiny", "0"),
    ("Constrictor Snake", "Large", "1/4"),
    ("Crab", "Tiny", "0"),
    ("Crocodile", "Large", "1/2"),
    ("Deer", "Medium", "0"),
    ("Dire Wolf", "Large", "1"),
    ("Draft Horse", "Large", "1/4"),
    ("Eagle", "Small", "0"),
    ("Elephant", "Huge", "4"),
    ("Elk", "Large", "1/4"),
    ("Frog", "Tiny", "0"),
    ("Giant Ape", "Huge", "7"),
    ("Giant Badger", "Medium", "1/4"),
    ("Giant Bat", "Large", "1/4"),
    ("Giant Boar", "Large", "2"),
    ("Giant Centipede", "Small", "1/4"),
    ("Giant Constrictor Snake", "Huge", "2"),
    ("Giant Crab", "Medium", "1/8"),
    ("Giant Crocodile", "Huge", "5"),
    ("Giant Fire Beetle", "Small", "0"),
    ("Giant Frog", "Medium", "1/4"),
    ("Giant Goat", "Large", "1/2"),
    ("Giant Hyena", "Large", "1"),
    ("Giant Lizard", "Large", "1/4"),
    ("Giant Octopus", "Large", "1"),
    ("Giant Rat", "Small", "1/8"),
    ("Giant Seahorse", "Large", "1/2"),
    ("Giant Scorpion", "Large", "3"),
    ("Giant Shark", "Huge", "5"),
    ("Giant Spider", "Large", "1"),
    ("Giant Squid", "Huge", "6"),
    ("Giant Toad", "Large", "1"),
    ("Giant Venomous Snake", "Medium", "1/4"),
    ("Giant Wasp", "Medium", "1/2"),
    ("Giant Weasel", "Medium", "1/8"),
    ("Giant Wolf Spider", "Medium", "1/4"),
    ("Goat", "Medium", "0"),
    ("Hawk", "Tiny", "0"),
    ("Hippopotamus", "Large", "4"),
    ("Hunter Shark", "Large", "2"),
    ("Hyena", "Medium", "0"),
    ("Jackal", "Small", "0"),
    ("Killer Whale", "Huge", "3"),
    ("Lion", "Large", "1"),
    ("Lizard", "Tiny", "0"),
    ("Mammoth", "Huge", "6"),
    ("Mastiff", "Medium", "1/8"),
    ("Mule", "Medium", "1/8"),
    ("Octopus", "Small", "0"),
    ("Owl", "Tiny", "0"),
    ("Panther", "Medium", "1/4"),
    ("Piranha", "Tiny", "0"),
    ("Plesiosaurus", "Large", "2"),
    ("Polar Bear", "Large", "2"),
    ("Pony", "Medium", "1/8"),
    ("Pteranodon", "Medium", "1/4"),
    ("Rat", "Tiny", "0"),
    ("Raven", "Tiny", "0"),
    ("Reef Shark", "Medium", "1/2"),
    ("Rhinoceros", "Large", "2"),
    ("Riding Horse", "Large", "1/4"),
    ("Saber-Toothed Tiger", "Large", "2"),
    ("Scorpion", "Tiny", "0"),
    ("Seahorse", "Tiny", "0"),
    ("Spider", "Tiny", "0"),
    ("Tiger", "Large", "1"),
    ("Triceratops", "Huge", "5"),
    ("Tyrannosaurus Rex", "Huge", "8"),
    ("Venomous Snake", "Tiny", "1/8"),
    ("Vulture", "Medium", "0"),
    ("Warhorse", "Large", "1/2"),
    ("Weasel", "Tiny", "0"),
    ("Wolf", "Medium", "1/4"),
]

MANUAL_METADATA_ENTRIES = [
    {
        "name": "Jackalwere",
        "size": "Small",
        "creatureType": "Fiend",
        "cr": "1/2",
        "habitat": ["Desert", "Grassland"],
        "treasure": ["Implements"],
    },
    {
        "name": "Xorn",
        "size": "Medium",
        "creatureType": "Elemental",
        "cr": "5",
        "habitat": ["Underdark", "Planar (Elemental Plane of Earth)"],
        "treasure": ["Any"],
    },
]


@dataclass
class MonsterEntry:
    id: str
    name: str
    cr: str
    xp: int
    creatureType: str
    size: str
    habitat: list[str]
    treasure: list[str]
    sourcePage: int
    extractionConfidence: str
    tags: list[str]
    encounterRole: str


def main() -> int:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else PDF_PATH
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT_PATH

    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 1

    reader = PdfReader(str(pdf_path))
    plumber_pdf = open_pdfplumber(pdf_path)
    index_names_by_pdf_page = extract_index_names_by_pdf_page(reader)
    current_habitat: list[str] = []
    current_treasure: list[str] = []
    monsters: list[MonsterEntry] = []

    try:
        for page_index, page in enumerate(reader.pages, start=1):
            if page_index < 13 or page_index > 376:
                continue

            plumber_page = plumber_pdf.pages[page_index - 1] if plumber_pdf else None
            raw_text = extract_page_text(page, plumber_page)
            text = normalize_ocr_text(raw_text)
            habitat, treasure = extract_habitat_treasure(text)
            if habitat or treasure:
                current_habitat = habitat or current_habitat
                current_treasure = treasure or current_treasure
            elif page_index >= 351:
                current_habitat = []
                current_treasure = ["None"]

            found_entries = extract_statblocks_from_page(text, page_index, current_habitat, current_treasure)
            if page_index >= 351:
                monsters.extend(found_entries)
            else:
                monsters.extend(apply_index_names(found_entries, index_names_by_pdf_page.get(page_index, [])))
    finally:
        if plumber_pdf:
            plumber_pdf.close()

    monsters = [monster for monster in monsters if monster.sourcePage < 351]
    monsters.extend(build_appendix_animal_entries())
    manual_entries = build_manual_metadata_entries()
    monsters.extend(manual_entries)
    clean_text_entries = extract_clean_text_source_entries()
    monsters.extend(clean_text_entries)
    monsters = merge_duplicate_entries(monsters)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema": "handbook-engine-monster-metadata-v1",
        "source": {
            "kind": "local-pdf-ocr",
            "file": str(pdf_path),
            "pages": len(reader.pages),
            "copyrightNote": "Compact metadata extracted for local encounter generation. Stat blocks and descriptive text are intentionally omitted. Clean pasted monster text, when present, is parsed into metadata only.",
        },
        "fields": [
            "id",
            "name",
            "cr",
            "xp",
            "creatureType",
            "size",
            "habitat",
            "treasure",
            "sourcePage",
            "extractionConfidence",
            "tags",
            "encounterRole",
        ],
        "monsters": [asdict(monster) for monster in sorted(monsters, key=lambda item: natural_sort_key(item.name))],
    }
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")
    js_output_path = output_path.with_suffix(".js") if len(sys.argv) > 2 else JS_OUTPUT_PATH
    js_output_path.write_text(
        "export const monsterManual2024Catalog = "
        + json.dumps(payload, indent=2, ensure_ascii=True)
        + ";\n",
        encoding="utf-8",
    )

    print(json.dumps({
        "output": str(output_path),
        "jsOutput": str(js_output_path),
        "monsterCount": len(payload["monsters"]),
        "indexNameCount": sum(len(items) for items in index_names_by_pdf_page.values()),
        "manualMetadataEntryCount": len(manual_entries),
        "cleanTextEntryCount": len(clean_text_entries),
        "pages": len(reader.pages),
        "confidence": count_by_confidence(monsters),
        "sample": payload["monsters"][:8],
    }, indent=2))
    return 0


def open_pdfplumber(pdf_path: Path):
    if pdfplumber is None:
        return None
    try:
        return pdfplumber.open(str(pdf_path))
    except Exception:
        return None


def extract_page_text(pypdf_page, plumber_page=None) -> str:
    if plumber_page is not None:
        column_text = extract_plumber_columns(plumber_page)
        if column_text.strip():
            return column_text
    return pypdf_page.extract_text() or ""


def extract_plumber_columns(page) -> str:
    x0, top, x1, bottom = page.bbox
    middle = x0 + ((x1 - x0) / 2)
    parts: list[str] = []
    for bbox in [(x0, top, middle, bottom), (middle, top, x1, bottom)]:
        try:
            text = page.crop(bbox, strict=False).extract_text(
                x_tolerance=2,
                y_tolerance=3,
                layout=True,
            ) or ""
        except Exception:
            text = ""
        if text.strip():
            parts.append(text)
    return "\n".join(parts)


def extract_index_names_by_pdf_page(reader: PdfReader) -> dict[int, list[str]]:
    text = "\n".join((reader.pages[index].extract_text() or "") for index in [5, 6])
    names_by_pdf_page: dict[int, list[str]] = {}
    for raw_line in text.splitlines():
        line = normalize_ocr_text(raw_line.strip())
        if not line:
            continue

        match = re.search(r"(.+?)(?:\.{2,}|,?\s{2,}|,?\s)?(\d{1,3})$", line)
        if not match:
            continue

        name = clean_index_name(match.group(1))
        page_number = clean_page_number(match.group(2))
        if not name or not page_number:
            continue

        if is_index_noise(name):
            continue

        pdf_page = page_number + 3
        names_by_pdf_page.setdefault(pdf_page, []).append(name)
    return names_by_pdf_page


def build_appendix_animal_entries() -> list[MonsterEntry]:
    entries: list[MonsterEntry] = []
    for name, size, cr in APPENDIX_ANIMAL_METADATA:
        entries.append(MonsterEntry(
            id=slugify(name),
            name=name,
            cr=cr,
            xp=XP_BY_CR[cr],
            creatureType="Beast",
            size=size,
            habitat=[],
            treasure=["None"],
            sourcePage=351,
            extractionConfidence="high",
            tags=build_tags(name, "Beast", []),
            encounterRole=infer_encounter_role(name, "Beast", cr),
        ))
    return entries


def build_manual_metadata_entries() -> list[MonsterEntry]:
    entries: list[MonsterEntry] = []
    for item in MANUAL_METADATA_ENTRIES:
        name = item["name"]
        creature_type = item["creatureType"]
        cr = item["cr"]
        habitat = item.get("habitat", [])
        entries.append(MonsterEntry(
            id=slugify(name),
            name=name,
            cr=cr,
            xp=XP_BY_CR[cr],
            creatureType=creature_type,
            size=item["size"],
            habitat=habitat[:],
            treasure=item.get("treasure", ["None"])[:],
            sourcePage=0,
            extractionConfidence="verified",
            tags=build_tags(name, creature_type, habitat),
            encounterRole=infer_encounter_role(name, creature_type, cr),
        ))
    return entries


def extract_clean_text_source_entries() -> list[MonsterEntry]:
    if not TEXT_SOURCE_ROOT.exists():
        return []

    entries: list[MonsterEntry] = []
    seen_hashes: set[str] = set()
    for path in sorted(TEXT_SOURCE_ROOT.glob("*/pasted-text.txt")):
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        source_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if source_hash in seen_hashes:
            continue
        seen_hashes.add(source_hash)

        if not is_clean_monster_text_source(text):
            continue

        entries.extend(parse_clean_monster_text(text))
    return entries


def is_clean_monster_text_source(text: str) -> bool:
    if re.match(r"\s*Monsters\s+\([A-Z]\)", text):
        return True

    habitat_count = len(re.findall(r"(?m)^Habitat:", text))
    cr_count = len(re.findall(r"(?m)^CR\s+[0-9]+(?:/[0-9]+)?\s*\(", text))
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
    return (
        habitat_count >= 3
        and cr_count >= 3
        and bool(re.match(r"^[A-Z][A-Za-z'() /,\-]+$", first_line))
        and not first_line.lower().startswith(("appendix", "chapter", "introduction"))
    )


def parse_clean_monster_text(text: str) -> list[MonsterEntry]:
    entries: list[MonsterEntry] = []
    text = normalize_ocr_text(strip_markdown_links(text.replace("\ufeff", "")))
    lines = [line.strip() for line in text.splitlines()]
    current_habitat: list[str] = []
    current_treasure: list[str] = []

    for index, line in enumerate(lines):
        if not line:
            continue

        if line.lower().startswith("habitat:"):
            habitat, treasure = extract_habitat_treasure(line)
            current_habitat = habitat or current_habitat
            current_treasure = treasure or current_treasure
            continue

        detail = parse_clean_statblock_detail_line(line)
        if not detail:
            continue

        name = find_previous_statblock_name(lines, index)
        if not name:
            continue

        cr, xp = find_clean_text_cr_xp(lines, index)
        if not cr:
            continue

        size, creature_type = detail
        clean_name = clean_monster_name(name)
        entries.append(MonsterEntry(
            id=slugify(clean_name),
            name=clean_name,
            cr=cr,
            xp=xp,
            creatureType=creature_type,
            size=size,
            habitat=current_habitat[:],
            treasure=current_treasure[:] if current_treasure else ["None"],
            sourcePage=0,
            extractionConfidence="verified",
            tags=build_tags(clean_name, creature_type, current_habitat),
            encounterRole=infer_encounter_role(clean_name, creature_type, cr),
        ))
    return entries


def strip_markdown_links(text: str) -> str:
    return re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)


def parse_clean_statblock_detail_line(line: str) -> tuple[str, str] | None:
    type_pattern = "|".join(CREATURE_TYPES)
    size_pattern = "|".join(re.escape(size) for size in sorted(SIZES, key=len, reverse=True))
    swarm_match = re.match(
        rf"^(?P<size>{size_pattern})\s+Swarm\s+of\s+(?:{size_pattern})\s+"
        rf"(?P<type>(?:[A-Za-z]+\s+)*?(?:{type_pattern}|Monstrosities|Oozes|Fiends|Undead)(?:\s*\([^)]+\))?)"
        rf"(?:,|$)",
        line,
        re.I,
    )
    if swarm_match:
        return clean_size(swarm_match.group("size")), clean_creature_type(swarm_match.group("type"))

    match = re.match(
        rf"^(?P<size>{size_pattern})\s+"
        rf"(?P<type>(?:[A-Za-z]+\s+)*?(?:{type_pattern})(?:\s*\([^)]+\))?)"
        rf"(?:,|$)",
        line,
        re.I,
    )
    if not match:
        return None
    return clean_size(match.group("size")), clean_creature_type(match.group("type"))


def find_previous_statblock_name(lines: list[str], detail_index: int) -> str | None:
    for index in range(detail_index - 1, -1, -1):
        line = lines[index].strip()
        if not line:
            continue
        if is_clean_text_statblock_name(line):
            return line
        return None
    return None


def is_clean_text_statblock_name(line: str) -> bool:
    if len(line) < 3 or len(line) > 80:
        return False
    if "." in line or ":" in line or "\t" in line:
        return False
    if re.search(r"\b(?:Actions|Traits|Reactions|Languages|Senses|Skills|Speed|Ability|Score|Mod|Save)\b", line, re.I):
        return False
    return bool(re.match(r"^[A-Z][A-Za-z0-9'() /,\-]+$", line))


def find_clean_text_cr_xp(lines: list[str], detail_index: int) -> tuple[str | None, int]:
    for line in lines[detail_index + 1:detail_index + 90]:
        match = re.search(
            r"\bCR\s+(?P<cr>[0-9]+(?:/[0-9]+)?)\s*"
            r"\((?:XP\s*)?(?P<xp>[0-9,]+)(?:\s*XP)?",
            line,
            re.I,
        )
        if not match:
            continue

        cr = clean_cr(match.group("cr"))
        xp = clean_xp(match.group("xp"), cr)
        return cr, xp
    return None, 0


def apply_index_names(entries: list[MonsterEntry], index_names: list[str]) -> list[MonsterEntry]:
    if not entries or not index_names:
        return entries

    result: list[MonsterEntry] = []
    used: set[int] = set()
    for entry in entries:
        best_index = None
        best_score = 0.0
        for index, name in enumerate(index_names):
            if index in used:
                continue
            score = name_similarity(entry.name, name)
            if score > best_score:
                best_score = score
                best_index = index

        if best_index is not None and (best_score >= 0.22 or entry.extractionConfidence != "high"):
            clean_name = index_names[best_index]
            used.add(best_index)
            entry.name = clean_name
            entry.id = slugify(clean_name)
            entry.extractionConfidence = "high" if best_score >= 0.4 else "medium"
            entry.tags = build_tags(entry.name, entry.creatureType, entry.habitat)
            entry.encounterRole = infer_encounter_role(entry.name, entry.creatureType, entry.cr)
        result.append(entry)
    return result


def normalize_ocr_text(text: str) -> str:
    replacements = {
        "\u2019": "'",
        "\u2018": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "La rge": "Large",
        "H uge": "Huge",
        "M edium": "Medium",
        "S mall": "Small",
        "M o nstrosity": "Monstrosity",
        "M onstrosity": "Monstrosity",
        "U ndead": "Undead",
        "C onstruct": "Construct",
        "H umanoid": "Humanoid",
        "F iend": "Fiend",
        "D ragon": "Dragon",
        "B east": "Beast",
        "F ey": "Fey",
        "O oze": "Ooze",
        "P lant": "Plant",
        "A berration": "Aberration",
        "E lemental": "Elemental",
        "C elestial": "Celestial",
        "Ciant": "Giant",
        "Coblin": "Goblin",
        "Dra9on": "Dragon",
        "DnecoN": "Dragon",
        "DnecoNs": "Dragons",
        "Wvnurruc": "Wyrmling",
        "WvnuLrNG": "Wyrmling",
        "WYnULtNG": "Wyrmling",
        "WynurrNc": "Wyrmling",
        "WvnuLrNc": "Wyrmling",
        "Habitau": "Habitat",
        "HabitaU": "Habitat",
        "Habital": "Habitat",
        "Hesrrer": "Habitat",
        "U nderdark": "Underdark",
        "U Nderdark": "Underdark",
        "Treasu re": "Treasure",
        "lndividual": "Individual",
        "lnd": "Ind",
        "lnitiative": "Initiative",
        "lmmunities": "Immunities",
        "lnt": "Int",
        "I n": "In",
        "CR l/": "CR 1/",
        "CR l ": "CR 1 ",
        "CR I/": "CR 1/",
        "CR I ": "CR 1 ",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def extract_habitat_treasure(text: str) -> tuple[list[str], list[str]]:
    compact = re.sub(r"\s+", " ", text)
    match = re.search(r"Habitat:?\s+([^;]{2,120});\s*Treasure:?\s+([A-Za-z, ]{2,80})", compact)
    if not match:
        return [], []

    habitat = clean_list(match.group(1), stop_words=["Treasure"])
    treasure_text = match.group(2)
    compact_treasure = re.sub(r"[^a-z]", "", treasure_text.lower())
    treasure = []
    for item in TREASURE_TYPES:
        compact_item = re.sub(r"[^a-z]", "", item.lower())
        if re.search(rf"\b{re.escape(item)}\b", treasure_text, re.I) or compact_item in compact_treasure:
            treasure.append(item)
    return habitat, treasure or clean_list(treasure_text)


def extract_statblocks_from_page(text: str, page_index: int, habitat: list[str], treasure: list[str]) -> list[MonsterEntry]:
    entries: list[MonsterEntry] = []
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    joined = "\n".join(lines)
    type_pattern = "|".join(CREATURE_TYPES)
    size_pattern = "|".join(re.escape(size) for size in sorted(SIZES, key=len, reverse=True))
    header_pattern = re.compile(
        rf"(?P<name>[A-Z][A-Za-z0-9'() /,.\-]{{2,70}}?)\s+"
        rf"(?P<size>{size_pattern})\s+"
        rf"(?P<type>(?:[A-Za-z]+\s+)*?(?:{type_pattern})(?:\s*\([^)]+\))?)"
        rf"(?P<tail>[^\n]{{0,90}})",
        re.I,
    )

    for header in header_pattern.finditer(joined):
        start = header.end()
        window = joined[start:start + 1700]
        cr_match = re.search(
            r"CR\s+(?P<cr>[0-9Il/]{1,4})\s*\((?:(?:XP\s*)?(?P<xp1>[0-9Il.,]+)\s*XP|XP\s*(?P<xp2>[0-9Il.,]+))",
            window,
            re.I,
        )
        if not cr_match:
            continue

        name = clean_monster_name(header.group("name"))
        creature_type = clean_creature_type(header.group("type"))
        size = clean_size(header.group("size"))
        cr = clean_cr(cr_match.group("cr"))
        xp = clean_xp(cr_match.group("xp1") or cr_match.group("xp2") or "", cr)

        if not should_keep_entry(name, creature_type, cr):
            continue

        confidence = "high"
        if has_noisy_name(name) or not habitat:
            confidence = "medium"
        if len(name) < 3 or xp == 0:
            confidence = "low"

        entries.append(MonsterEntry(
            id=slugify(name),
            name=name,
            cr=cr,
            xp=xp,
            creatureType=creature_type,
            size=size,
            habitat=habitat[:],
            treasure=treasure[:] if treasure else ["None"],
            sourcePage=page_index,
            extractionConfidence=confidence,
            tags=build_tags(name, creature_type, habitat),
            encounterRole=infer_encounter_role(name, creature_type, cr),
        ))

    return entries


def clean_list(value: str, stop_words: list[str] | None = None) -> list[str]:
    stop_words = stop_words or []
    for word in stop_words:
        value = value.split(word)[0]
    value = re.sub(r"[^A-Za-z(), /-]", " ", value)
    parts = re.split(r",|\bor\b", value)
    return [normalize_catalog_term(clean_title(part)) for part in parts if clean_title(part)]


def normalize_catalog_term(value: str) -> str:
    compact = re.sub(r"[^a-z]", "", value.lower())
    known_terms = {
        "any": "Any",
        "arcana": "Arcana",
        "arctic": "Arctic",
        "armaments": "Armaments",
        "coastal": "Coastal",
        "desert": "Desert",
        "forest": "Forest",
        "grassland": "Grassland",
        "hill": "Hill",
        "implements": "Implements",
        "individual": "Individual",
        "mountain": "Mountain",
        "none": "None",
        "relics": "Relics",
        "swamp": "Swamp",
        "underdark": "Underdark",
        "underwater": "Underwater",
        "urban": "Urban",
    }
    return known_terms.get(compact, value)


def clean_monster_name(value: str) -> str:
    value = re.sub(r"\b(?:Actions|Traits|Skills|Senses|Languages|Gear|Speed|HP|AC|Initiative)\b.*", "", value, flags=re.I)
    value = re.sub(r"^[^A-Za-z]+", "", value)
    value = re.sub(r"[^A-Za-z0-9'() /,\-]", " ", value)
    value = re.sub(r"\s+", " ", value).strip(" ,-/")
    value = re.sub(r"\bDnecoN\b", "Dragon", value, flags=re.I)
    value = re.sub(r"\bCiant\b", "Giant", value, flags=re.I)
    value = re.sub(r"\bCoblin\b", "Goblin", value, flags=re.I)
    value = fix_name_ocr(value)
    return apply_known_name_corrections(clean_title(value))


def clean_index_name(value: str) -> str:
    value = re.sub(r"[.,]+", " ", value)
    value = re.sub(r"[-_]{2,}", " ", value)
    value = re.sub(r"\s+", " ", value).strip(" .,:;-/")
    replacements = {
        "Abo1eth": "Aboleth",
        "Dra9on": "Dragon",
        "Dragon Wyrm1in9": "Dragon Wyrmling",
        "S1aad": "Slaad",
        "Devi1": "Devil",
        "Na9a": "Naga",
        "Craw1er": "Crawler",
        "C1aw": "Claw",
        "Crocodi1e": "Crocodile",
        "Cu1tist": "Cultist",
        "Orac1e": "Oracle",
        "Do9": "Dog",
        "Ske1eton": "Skeleton",
        "Demi1ich": "Demilich",
        "Doppe19an9er": "Doppelganger",
        "E1ementa1": "Elemental",
        "Fun9us": "Fungus",
        "Sta1ker": "Stalker",
        "8u1ette": "Bulette",
        "8oar": "Boar",
        "8ear": "Bear",
        "81ight": "Blight",
        "Infi 1trator": "Infiltrator",
        "4co1yte": "Acolyte",
        "4pprentice": "Apprentice",
        "4spirant": "Aspirant",
        "2ombie": "Zombie",
        "Me22o1oth": "Mezzoloth",
        "Remorha 2": "Remorhaz",
        "OwI": "Owl",
        "Po1tergeist": "Poltergeist",
        "Fami1iar": "Familiar",
        "U1tro1oth": "Ultroloth",
        "Hu1k": "Hulk",
        "Wease1": "Weasel",
        "Kobo1d": "Kobold",
    }
    for source, target in replacements.items():
        value = re.sub(re.escape(source), target, value, flags=re.I)
    value = re.sub(r"\b(\d+)$", "", value).strip()
    return apply_known_name_corrections(clean_title(fix_name_ocr(value)))


KNOWN_NAME_CORRECTIONS = {
    "Air Flempntel": "Air Elemental",
    "Ancn MAG E": "Archmage",
    "AncneloN": "Archelon",
    "Aps": "Ape",
    "Awarerued Shrub": "Awakened Shrub",
    "Ar-r-osauRus": "Allosaurus",
    "Couat1": "Couatl",
    "Coumoner": "Commoner",
    "Cxuur": "Chuul",
    "Dnvlo": "Dryad",
    "Dnuro": "Druid",
    "Dusr Mepnrr": "Dust Mephit",
    "Enrruves": "Erinyes",
    "ER AP": "Ettercap",
    "Errrru": "Ettin",
    "Frne Grlrur": "Fire Giant",
    "Fuueskull": "Flameskull",
    "Giant Ow1": "Giant Owl",
    "Githzerai 2erth": "Githzerai Zerth",
    "Gneeu Dnlcor T Wyrmling": "Green Dragon Wyrmling",
    "Githzerai Zerth": "Githzerai Zerth",
    "GLnenszu": "Glabrezu",
    "Gnerru": "Green Hag",
    "Gntrror,t": "Griffon",
    "Gonrsrno": "Goristro",
    "Gre11": "Grell",
    "Grgernrng Mourher": "Gibbering Mouther",
    "Grnxr CousrnrcroR Snake": "Giant Constrictor Snake",
    "Grruzenlr PsroN": "Githzerai Psion",
    "Grruzrnnr MoN K": "Githzerai Monk",
    "Grrxvaukr Dracomancer": "Githyanki Dracomancer",
    "Honrued Devrl": "Horned Devil",
    "Hoor Honnon": "Hook Horror",
    "Houunculus": "Homunculus",
    "I-p": "Imp",
    "Jackal": "Jackal",
    "Lacedon Ghoul": "Lacedon Ghoul",
    "Lacedon Ghou1": "Lacedon Ghoul",
    "Lrzlrorolk Geomancer": "Lizardfolk Geomancer",
    "Mlce AppRerurrce": "Mage Apprentice",
    "Mlnrrrx": "Marilith",
    "Moonoru Tnrororue": "Modron Tridrone",
    "Mlrurrcone": "Manticore",
    "Penronuer Legend": "Performer Legend",
    "Planetar": "Planetar",
    "Pirate Admiral": "Pirate Admiral",
    "Prxrr Wouoenbrtnger": "Pixie Wonderbringer",
    "R Rd Sovereign": "Myconid Sovereign",
    "Rc Gneeru Dnncou": "Young Green Dragon",
    "Rc Wxrre Dnacou": "Young White Dragon",
    "Remorhaz": "Remorhaz",
    "Swanu of Rats": "Swarm of Rats",
    "Swlnu of Venomous Sttlxss": "Swarm of Venomous Snakes",
    "Sxnublrng Moutto": "Shambling Mound",
    "Tnnr-xneen Marauder": "Thri-kreen Marauder",
    "Vnuptnr Spnwn": "Vampire Spawn",
    "Wttt ED KOBOLD": "Winged Kobold",
    "Wxrrr Dnncoru Wyrmling": "White Dragon Wyrmling",
    "Yerr": "Yeti",
    "Yocx Lor": "Yochlol",
    "Your Rc Gneeru Dnncou": "Young Green Dragon",
    "Your Rc Wxrre Dnacou": "Young White Dragon",
}


def apply_known_name_corrections(name: str) -> str:
    correction_by_key = {normalize_correction_key(key): value for key, value in KNOWN_NAME_CORRECTIONS.items()}
    return correction_by_key.get(normalize_correction_key(name), name)


def normalize_correction_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def fix_name_ocr(value: str) -> str:
    value = value.replace("0", "O")
    value = re.sub(r"\b8(?=[A-Za-z])", "B", value)
    value = re.sub(r"(?<=[A-Za-z])8(?=[A-Za-z])", "b", value)
    value = re.sub(r"(?<=[A-Za-z])11(?=[A-Za-z])", "ll", value)
    value = re.sub(r"(?<=[A-Za-z])1(?=[A-Za-z])", "l", value)
    value = re.sub(r"(?<=[A-Za-z])2(?=[A-Za-z])", "z", value)
    value = re.sub(r"(?<=[A-Za-z])5(?=[A-Za-z])", "s", value)
    value = re.sub(r"(?<=[A-Za-z])9(?=[A-Za-z])", "g", value)
    return value


def clean_page_number(value: str) -> int | None:
    digits = re.sub(r"[^0-9]", "", value)
    if not digits:
        return None
    page_number = int(digits)
    if page_number < 10 or page_number > 373:
        return None
    return page_number


def is_index_noise(name: str) -> bool:
    noise = [
        "Contents",
        "How to Use",
        "Stat Block",
        "Parts of",
        "Running A Monster",
        "Monster Entries",
        "Monsters By",
        "Monster Conversions",
        "Index of",
        "Lists of",
        "App A",
        "Creature Type",
        "Challenge Rating",
    ]
    return any(item.lower() in name.lower() for item in noise)


def clean_title(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip(" .,:;-/")
    small_words = {"of", "the", "and", "or", "to"}
    words = []
    for index, word in enumerate(value.split()):
        lower = word.lower()
        if index and lower in small_words:
            words.append(lower)
        else:
            words.append(word[:1].upper() + word[1:])
    return " ".join(words)


def clean_creature_type(value: str) -> str:
    for creature_type in CREATURE_TYPES:
        plural = creature_type if creature_type in {"Fey", "Undead"} else f"{creature_type}s"
        if creature_type.endswith("y"):
            plural = f"{creature_type[:-1]}ies"
        if re.search(rf"\b(?:{creature_type}|{plural})\b", value, re.I):
            return creature_type
    return clean_title(value)


def clean_size(value: str) -> str:
    value = clean_title(value)
    for size in SIZES:
        if value.lower() == size.lower():
            return size
    return value


def clean_cr(value: str) -> str:
    value = value.strip().replace("I", "1").replace("l", "1")
    value = value.replace("\\", "/")
    value = value.replace("118", "1/8").replace("114", "1/4").replace("112", "1/2")
    return value


def clean_xp(value: str, cr: str) -> int:
    value = value.replace("I", "1").replace("l", "1").replace(".", ",")
    digits = re.sub(r"[^0-9]", "", value)
    if digits:
        return int(digits)
    return XP_BY_CR.get(cr, 0)


def should_keep_entry(name: str, creature_type: str, cr: str) -> bool:
    if creature_type not in CREATURE_TYPES:
        return False
    if cr not in XP_BY_CR:
        return False
    reject = [
        "Attack Roll",
        "Saving Throw",
        "Passive Perception",
        "Failure",
        "Success",
        "Hit Points",
        "Monster Entries",
        "Stat Block",
        "Mod Save",
        "App A",
        "Their Dragon Masters",
    ]
    if any(term.lower() in name.lower() for term in reject):
        return False
    if re.search(r"\b(?:Str|Dex|Con|Int|Wis|Cha|Cxr|Lrr)\b\s*[-+]?\d", name, re.I):
        return False
    if name.isupper() and len(name) <= 4:
        return False
    return True


def has_noisy_name(name: str) -> bool:
    return bool(re.search(r"\b(?:Acr|Tnn|Rrr|Mod|Save|Roll|Dc)\b", name, re.I)) or len(name.split()) > 6


def name_similarity(first: str, second: str) -> float:
    first_tokens = token_set(first)
    second_tokens = token_set(second)
    token_score = 0.0
    if first_tokens and second_tokens:
        overlap = len(first_tokens & second_tokens)
        union = len(first_tokens | second_tokens)
        token_score = overlap / union
    char_score = SequenceMatcher(None, normalize_name(first), normalize_name(second)).ratio()
    prefix_score = 1.0 if normalize_name(first)[:4] == normalize_name(second)[:4] else 0.0
    return max(token_score * 0.65 + prefix_score * 0.15 + char_score * 0.2, char_score * 0.9)


def token_set(value: str) -> set[str]:
    return {token for token in re.split(r"[^a-z0-9]+", normalize_name(value)) if token}


def normalize_name(value: str) -> str:
    value = value.lower()
    return re.sub(r"[^a-z0-9]+", "", value)


def build_tags(name: str, creature_type: str, habitat: list[str]) -> list[str]:
    tags = {creature_type.lower()}
    tags.update(slugify(item) for item in habitat)
    lower = name.lower()
    if "dragon" in lower:
        tags.add("dragon")
    if "wyrmling" in lower:
        tags.add("young")
    if "swarm" in lower:
        tags.add("swarm")
    if "skeleton" in lower or "zombie" in lower or creature_type == "Undead":
        tags.add("undead")
    if "giant" in lower:
        tags.add("giant")
    if "mage" in lower or "cultist" in lower or "priest" in lower:
        tags.add("caster")
    return sorted(tag for tag in tags if tag)


def infer_encounter_role(name: str, creature_type: str, cr: str) -> str:
    cr_value = cr_to_float(cr)
    lower = name.lower()
    if cr_value >= 10 or any(word in lower for word in ["ancient", "adult", "lord", "queen", "king", "tyrant"]):
        return "boss"
    if any(word in lower for word in ["captain", "commander", "chief", "priest", "mage", "oracle", "hierophant"]):
        return "leader"
    if any(word in lower for word in ["swarm", "skeleton", "zombie", "warrior", "guard", "commoner"]):
        return "minion"
    if creature_type in {"Beast", "Monstrosity"}:
        return "brute"
    return "standard"


def cr_to_float(cr: str) -> float:
    if "/" in cr:
        top, bottom = cr.split("/", 1)
        return float(top) / float(bottom)
    return float(cr)


def merge_duplicate_entries(entries: list[MonsterEntry]) -> list[MonsterEntry]:
    merged: dict[str, MonsterEntry] = {}
    for entry in entries:
        existing = merged.get(entry.id)
        if not existing:
            merged[entry.id] = entry
            continue

        if confidence_rank(entry.extractionConfidence) > confidence_rank(existing.extractionConfidence):
            merged[entry.id] = entry
            existing = entry
        elif (
            confidence_rank(entry.extractionConfidence) == confidence_rank(existing.extractionConfidence)
            and cr_to_float(entry.cr) > cr_to_float(existing.cr)
        ):
            merged[entry.id] = entry
            existing = entry

        existing.habitat = sorted(set(existing.habitat) | set(entry.habitat))
        existing.treasure = sorted(set(existing.treasure) | set(entry.treasure))
        existing.tags = sorted(set(existing.tags) | set(entry.tags))
    return list(merged.values())


def confidence_rank(value: str) -> int:
    return {"low": 0, "medium": 1, "high": 2, "verified": 3}.get(value, 0)


def count_by_confidence(entries: list[MonsterEntry]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for entry in entries:
        counts[entry.extractionConfidence] = counts.get(entry.extractionConfidence, 0) + 1
    return counts


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def natural_sort_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


if __name__ == "__main__":
    raise SystemExit(main())
