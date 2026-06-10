---
name: youtube-thematic-card-script
description: Generate YouTube thematic lesson cards using Python script with guaranteed original assets. Always uses original Dmitry Kalashnik photo (MK1_0393-2) and original БНЕЙ НОАХ logo. Use for all thematic Torah lesson intro cards to ensure brand consistency and asset authenticity.
---

# YouTube Thematic Lesson Card Generator Script

## Overview

This skill uses a Python script to generate professional YouTube thematic lesson intro cards. The script **ALWAYS** uses:
- ✅ Original БНЕЙ НОАХ logo (`bnei_noah_logo_processed.png`)
- ✅ Original Dmitry Kalashnik photo (defaults to `MK1_0393-2`)
- ✅ Never generates logos or faces
- ✅ Maintains 100% brand consistency

## 🚨 CRITICAL RULE

**ALWAYS use the Python script for thematic lesson cards. NEVER use GenerateImage.**

## Script Location

```
c:\Users\Алекс\Documents\Carbon-cursor\create_youtube_thematic_card.py
```

## How to Use

### Step 1: Gather Your Content

Before running the script, prepare:

| Element | Example | Notes |
|---------|---------|-------|
| **Main Question** | "Почему важно не вмешиваться в споры?" | Largest text, white color |
| **Subtitle** | "Мусар от Рава Друка" | Medium text, white color |
| **Source** | "Глава Шлах" | Small text, gold color |
| **Output Filename** | "youtube_thematic_lesson_not_interfering.png" | PNG format |

### Step 2: Edit the Script

Open `create_youtube_thematic_card.py` and modify the `if __name__ == "__main__"` section:

```python
if __name__ == "__main__":
    thematic_card = create_youtube_thematic_card(
        main_question="Your main question here\n(can have multiple lines)",
        subtitle="Your subtitle/additional info",
        source="Torah chapter or source",
        output_filename="youtube_thematic_lesson_[topic].png"
    )
    print(f"Generated: {thematic_card}")
```

### Step 3: Run the Script

```bash
python c:\Users\Алекс\Documents\Carbon-cursor\create_youtube_thematic_card.py
```

### Step 4: Output

The script generates a 1920x1080px PNG in:
```
C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor\assets\youtube_thematic_lesson_[topic].png
```

## Script Parameters

### Function: `create_thematic_card()`

```python
create_thematic_card(
    main_question: str,      # Large white text (48-56px)
    subtitle: str,           # Medium white text (32-40px)
    source: str,            # Small gold text (24-28px)
    output_filename: str    # PNG filename for output
) -> str
```

**Returns**: Full path to generated image

## What the Script Does Automatically

### ✅ Assets (GUARANTEED ORIGINAL)
- Loads original logo: `bnei_noah_logo_processed.png` (80-100px)
- Loads original photo: `MK1_0393-2` (library background)
- Places logo TOP LEFT
- Frames photo in gold trapezoid

### ✅ Layout (PROFESSIONAL STYLING)
- 1920x1080px canvas
- Dark navy blue background (#1a3a7a)
- Horizontal gold separator lines (2-3px)
- Text hierarchy with proper sizing
- Professional spacing and margins

### ✅ Text Styling
- "◆ ТЕМАТИЧЕСКИЙ УРОК ◆" - Gold, 24-28px (automatic)
- Main question - White, 48-56px (extra bold)
- Subtitle - White, 32-40px (bold)
- Source - Gold, 24-28px
- "🪶 Дмитрий Калашник" - White, 32-36px (bottom)

### ✅ Quality Checks
- Verifies original files exist before starting
- Auto-wraps text to fit layout
- Maintains aspect ratios
- Outputs print confirmation with file paths

## Example Usage

### Example 1: Disputes & Lodging

```python
create_thematic_card(
    main_question="Почему важно не вмешиваться\nв споры? Спорить = ночевать?",
    subtitle="Мусар от Рава Друка",
    source="Глава Шлах",
    output_filename="youtube_thematic_lesson_not_interfering_in_disputes.png"
)
```

### Example 2: Prophecy & Authority

```python
create_thematic_card(
    main_question="Как посмел Егошуа затыкать рот\nпророкам Эльдаду и Мейдаду?",
    subtitle="Разные пророчества?",
    source="Глава Бэаалотха",
    output_filename="youtube_thematic_lesson_prophecy_eldad_medrad.png"
)
```

### Example 3: Spiritual Inheritance

```python
create_thematic_card(
    main_question="Почему Авраам выбрал Йицхака,\nа не Ишмаэля?",
    subtitle="Духовное наследство?",
    source="Книга Бытия, Парша Токдот",
    output_filename="youtube_thematic_lesson_spiritual_inheritance.png"
)
```

## Design Details

### Color Palette (Fixed)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark Navy Blue | #1a3a7a |
| White Text | White | #ffffff |
| Gold Text & Lines | Gold | #d4af37 |
| Frame Color | Gold | #d4af37 |

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ 🔵 LOGO (80-100px)    БНЕЙ НОАХ               │
│                       ТОРА ОНЛАЙН (gold)      │
├────────────────────────────────────────────────│
│                                                │
│ ┌──────────┐  ◆ ТЕМАТИЧЕСКИЙ УРОК ◆          │
│ │          │  ─────────────────────────       │
│ │  ФОТО    │  Почему важно не вмешиваться   │
│ │  В РАМЕ  │  в споры? Спорить = ночевать?  │
│ │          │  ─────────────────────────       │
│ │ ДМИТРИЙ  │  Мусар от Рава Друка            │
│ │ в раме   │  ─────────────────────────       │
│ └──────────┘  ▫ Глава Шлах ▫                 │
│                                                │
│              🪶 Дмитрий Калашник              │
│                                                │
└─────────────────────────────────────────────────┘
```

## Quality Checklist

Before using generated card:

- [ ] Logo is clearly the original БНЕЙ НОАХ logo
- [ ] Photo is clearly Dmitry in light blue shirt with books
- [ ] All text is readable and properly positioned
- [ ] Main question is largest and most prominent
- [ ] Gold lines are consistent thickness (2-3px)
- [ ] Dimensions are 1920x1080px
- [ ] File format is PNG
- [ ] Professional appearance with no overlapping text
- [ ] Colors match specifications (#1a3a7a background, #d4af37 gold, #ffffff white)

## Troubleshooting

### Issue: "FileNotFoundError: Logo not found"

**Solution**: Verify files exist:
```
C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor\assets\bnei_noah_logo_processed.png
```

### Issue: "FileNotFoundError: Photo not found"

**Solution**: Verify MK1_0393-2 photo exists in assets folder

### Issue: Text appears cut off

**Solution**: Reduce main_question length or use newline (`\n`) to break into multiple lines

### Issue: Photo doesn't look right

**Solution**: The script uses `MK1_0393-2` by default. To use a different original photo, edit the `PHOTO_FILE` variable at the top of the script.

## Important Notes

### About the Assets

**Logo**: `bnei_noah_logo_processed.png`
- Original processed version with blue glow
- ~80-100px on cards
- Never modified or regenerated

**Photo**: `MK1_0393-2` (default) or any of:
- `MK1_0393` - Standard pose with books
- `MK1_0398` - At computer desk
- `MK1_0390` - With open book
- `MK1_0384` - Reading at desk

All originals preserved as-is, script only scales/positions them.

### Script Philosophy

The Python script exists to:
1. **Guarantee** original assets are used
2. **Prevent** accidental AI-generated variations
3. **Ensure** consistent styling across all cards
4. **Automate** layout and text positioning
5. **Simplify** card generation workflow

## When to Use This Script

✅ Creating thematic Torah lesson intro cards
✅ Any video featuring Dmitry Kalashnik as instructor
✅ Special topic deep-dive lessons
✅ Standalone Q&A format lessons
✅ When you need professional YouTube-ready graphics

## When NOT to Use This Script

❌ Weekly parsha (Shabbat lesson) cards - use different template
❌ Corvette product banners - use corvette skill
❌ General social media graphics - may need different layout

## Related Skills & Rules

- **Rule**: `youtube-originals-only.mdc` - Core asset guidelines
- **Template**: `youtube-thematic-lesson-template.md` - Design specifications
- **Script**: `create_youtube_thematic_card.py` - Automated generation
- **Logo**: `bnei_noah_logo_processed.png` - Original asset
- **Photo**: `MK1_0393-2` - Original asset

## Summary

✅ Use the Python script
✅ It handles all original assets automatically
✅ Just provide text content
✅ Get professional 1920x1080px PNG output
✅ Guaranteed brand consistency
✅ Never worry about asset violations

**GOLDEN RULE**: When creating thematic lesson cards, use the Python script. Always.
