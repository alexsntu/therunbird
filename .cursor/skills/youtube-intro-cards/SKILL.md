---
name: youtube-intro-cards
description: Create professional YouTube intro title cards (заставки) for Torah lessons. Generates 1920x1080px cards with consistent styling, featuring Dmitry Kalashnik's photo, channel logo, and elegant Hebrew/Cyrillic text overlays. Use when creating intro cards, title cards, or opening graphics for YouTube videos about Torah lessons.
---

# YouTube Intro Title Cards for Torah Lessons

## Overview

This skill helps create professional, consistent YouTube intro title cards (заставки) for Torah lesson videos. All cards use the same template styling with the channel logo and text customized per lesson.

## ⚠️ CRITICAL REQUIREMENTS

### 🚨 USE PYTHON SCRIPT - NEVER USE GenerateImage!

**MANDATORY**: For all thematic lesson cards, use the Python script, NOT GenerateImage tool!

**Script Location**:
```
c:\Users\Алекс\Documents\Carbon-cursor\create_youtube_thematic_card.py
```

**Why**: The script ALWAYS uses original assets. GenerateImage creates new images, which violates the rules.

**How to use**:
```bash
python create_youtube_thematic_card.py
```

---

### 1️⃣ CHANNEL LOGO - ONLY ORIGINAL!

**MANDATORY RULE**: All intro cards MUST feature ONLY the original БНЕЙ НОАХ channel logo!

**Original Logo File** (THE ONLY ONE TO USE):
- Path: `C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/bnei_noah_logo_processed.png`
- This is the processed version with blue glow effect
- Size on card: MINIATURE (80-100px)
- Position: TOP LEFT (FIXED)

**Requirements**:
- ✅ Use ONLY `bnei_noah_logo_processed.png`
- ✅ DO NOT generate new logos
- ✅ DO NOT use AI-generated logos
- ✅ Preserve original colors and design
- ✅ Do NOT apply filters to logo
- ✅ Always place TOP LEFT

### 2️⃣ DMITRY KALASHNIK'S PHOTOS - ONLY ORIGINALS!

**MANDATORY RULE**: All intro cards MUST feature ONLY the original Dmitry Kalashnik photos!

**Available Original Photos** (Use ONE of these):
1. `MK1_0393` - Standard pose with books
2. `MK1_0393-2` - With beautiful library background (RECOMMENDED)
3. `MK1_0398` - At computer desk
4. `MK1_0390` - With open book
5. `MK1_0384` - Reading at desk

**Full path pattern**:
```
C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_MK1_[NUMBER]-[UUID].png
```

**Requirements**:
- ✅ Use ONLY these real photos of Dmitry Kalashnik
- ✅ DO NOT generate or create portraits
- ✅ DO NOT use AI-generated faces
- ✅ Preserve original quality and tone
- ✅ Do NOT apply filters or effects
- ✅ Do NOT resize disproportionately
- ✅ Python script handles sizing automatically

## Intro Card Template Specifications

**Dimensions**: 1920x1080 pixels (16:9 aspect ratio for YouTube)

### ✅ STANDARD LOGO PLACEMENT (ALWAYS USE THIS)

**Logo Position**: TOP LEFT (FIXED STANDARD)
- Logo size: MINIATURE (80-100px)
- Position: Top left corner
- "БНЕЙ НОАХ" text: White, 20px, positioned to the RIGHT of logo
- "ТОРА ОНЛАЙН" text: Gold (#d4af37), 16px, positioned below "БНЕЙ НОАХ"
- All three elements in one horizontal row at top
- Horizontal gold line directly below entire logo/text block
- This layout is MANDATORY for all future intro cards

**Design Elements**:
- Small processed БНЕЙ НОАХ logo (top left with name)
- Photo of Dmitry Kalashnik (right side, ~35-40% width, in geometric gold frame)
- Text hierarchy on left side (below logo block)
- Dark navy blue background (#1a3a7a)
- Decorative gold elements and dividing lines
- Hebrew text watermark on background
- Professional, scholarly appearance

## Creating an Intro Card

### Essential Information to Gather

Before generating an intro card, collect:

1. **Torah chapters** - Names of the weekly portions (e.g., БЕ'АЛОТХА / ШЛАХ)
2. **Theme/Topic** - Lesson theme (usually "ПАРАШАТ А-ШАВУА" for weekly lessons)
3. **Year** - Hebrew and Gregorian year (e.g., 5786/2026)
4. **Author** - Always "Дмитрий Калашник" for these lessons

### Text Positioning & Hierarchy

| Position | Content | Style | Size | Color |
|----------|---------|-------|------|-------|
| Top center | Channel logo | Logo | - | - |
| Below logo | Channel name | Gold text | - | Gold |
| Right side top | "НЕДЕЛЬНЫЕ ГЛАВЫ ТОРЫ" | Regular | 28-32px | Gold |
| Right side upper | Torah chapters | Bold | 60-70px | White |
| Right side middle | Theme | Extra bold | 70-80px | White |
| Right side middle-lower | Year | Bold | 32-36px | Gold |
| Right side lower | "Парашат а-шавуа" | Regular | 20-24px | Gold |
| Right side bottom | "Дмитрий Калашник" | Bold | 36-40px | White |

### Generation Process

When the user requests an intro card:

1. **Identify all text elements** needed for the card
2. **Select one of the four available photos** of Dmitry Kalashnik
3. **Use the GenerateImage tool** with these parameters:
   - Include ALL text elements with their styling
   - Reference the channel logo design
   - Specify the warm golden-orange gradient background
   - Include decorative elements
   - Filename: `youtube_intro_card_[descriptive_name].png`

### Design Consistency

**Always maintain**:
- The professional photo of Dmitry Kalashnik (one of the four originals)
- The БНЕЙ НОАХ channel logo at the top
- White and gold color scheme
- Gold decorative ornaments
- Warm golden-orange gradient background
- Professional, scholarly atmosphere
- High contrast for text readability
- Hebrew/Jewish theme elements

## Example Requests

**Example 1**: Weekly lesson - Be'alotcha / Shlach
- Chapters: "БЕ'АЛОТХА / ШЛАХ"
- Theme: "ПАРАШАТ А-ШАВУА"
- Year: "5786/2026"

**Example 2**: Weekly lesson - Nassaw / Numbers
- Chapters: "НАСО"
- Theme: "ПАРАШАТ А-ШАВУА"
- Year: "5786/2026"

## Output Format

Generated intro cards are saved as PNG files and should be immediately ready for YouTube upload. File naming convention: `youtube_intro_card_[descriptive_name].png`

## Quality Checklist

Before using the generated card:

- [ ] Photo is clearly one of the four original Dmitry Kalashnik photos
- [ ] Channel logo is centered at top
- [ ] All text is readable and properly positioned
- [ ] Menorah is visible on right side
- [ ] Torah scroll visible at bottom right
- [ ] Star of David at bottom left
- [ ] Colors match (gold, white, warm background)
- [ ] Dimensions are 1920x1080px
- [ ] File format is PNG
- [ ] Professional, consistent styling
- [ ] No overlapping or misaligned elements
