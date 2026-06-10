---
name: youtube-banner-generator
description: Create professional YouTube video banners for Torah lessons. Generates 2560x1440px banners with consistent styling, featuring a library background image with elegant Hebrew and Cyrillic text overlays. Use when creating promotional graphics for YouTube videos, lesson thumbnails, or channel artwork. Include lesson title, author/rabbi name, and any relevant Torah chapter information.
---

# YouTube Banner Generator for Torah Lessons

## Overview

This skill helps create professional, consistent YouTube banners for Torah lesson videos. All banners use the same template styling with your library background image and customizable text.

## Banner Template Specifications

**Dimensions**: 2560x1440 pixels (YouTube banner standard)

**Design Elements**:
- Library background image (Dmitry Kalashnik with books and Torah scroll)
- Curved white and gold border on the left side
- Gold decorative ornaments (Crown, floral patterns, dividers)
- Semi-transparent overlay for text readability
- Gold text for lesson titles
- White text for subtitles and author information
- "ДМИТРИЙ КАЛАШНИК" name plate at the bottom

## ⚠️ КРИТИЧНЫЕ ПРАВИЛА

### 1️⃣ ЛОГОТИП КАНАЛА - ТОЛЬКО ОРИГИНАЛЬНЫЙ!

**ОБЯЗАТЕЛЬНОЕ ПРАВИЛО**: На всех баннерах ДОЛЖЕН быть только оригинальный логотип канала БНЕЙ НОАХ!

**Оригинальный логотип**:
- Путь: `C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_Screenshot1-b89ff80f-9fce-4c13-968f-f20380b3a2ec.png`
- Описание: Круглое лого с Звездой Давида, символом בני נח, синяя и кремовая цветовая схема, черный контур
- Дизайн: בני נח символ в центре, Звезда Давида на фоне, профессиональный стиль

**Требования**:
- ✅ Использовать ТОЛЬКО оригинальный логотип
- ✅ НЕ создавать новые логотипы
- ✅ НЕ использовать сгенерированные логотипы
- ✅ Сохранять оригинальные цвета и дизайн
- ✅ Не применять фильтры к логотипу

### 2️⃣ ФОТО ДМИТРИЯ КАЛАШНИКА

**ОБЯЗАТЕЛЬНОЕ ПРАВИЛО**: На всех баннерах ДОЛЖНО быть только оригинальное фото Дмитрия Калашника!

**Доступные фото оригинала**:
- `C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_MK1_0393-ec88ed56-6a76-4d56-8f8b-2bcb3848f879.png`
- `C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_MK1_0393-2-e4b02614-90c7-4790-ad41-d7c103a59f84.png` (с красивым фоном библиотеки)
- `C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_MK1_0398-b0ca2c64-f658-4a10-adbe-b2e67b9986eb.png`
- `C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_MK1_0390-3d57f498-0a88-47dd-86f2-94b6ad46cac8.png`
- `C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor/assets/c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_MK1_0384-a46294ff-308c-42f9-8d3c-467232a4f36c.png`

**Требования**:
- ✅ Использовать ТОЛЬКО эти реальные фото
- ✅ НЕ создавать портреты из описания
- ✅ НЕ использовать сгенерированные изображения лиц
- ✅ Сохранять оригинальное качество и тон
- ✅ Не применять фильтры или эффекты
- ✅ Не менять размеры непропорционально

## Creating a Banner

### Essential Information to Gather

Before generating a banner, collect:

1. **Main lesson title** - The primary question or topic (usually 1-2 lines)
2. **Subtitle/Source** - Author name, rabbi name, or Torah chapter reference
3. **Optional elements** - Author name, source attribution

### Generation Process

When the user requests a banner:

1. **Identify all text elements** needed for the banner
2. **Use the GenerateImage tool** with these parameters:
   - Description: Include all text elements, styling preferences, and the library background reference
   - Include reference to the original image file
   - Filename: Use descriptive naming (e.g., `youtube_banner_kalashnik_[topic].png`)

### Text Positioning Guide

| Position | Content | Style |
|----------|---------|-------|
| Top | Main lesson title | Large, elegant serif font, gold color |
| Middle | Subtitle/question | Smaller, white text |
| Bottom | Name plate | "ДМИТРИЙ КАЛАШНИК" in dark box with white text |

### Design Consistency

**Always maintain**:
- The library background with the same man and setting
- White/gold curved border on the left
- Gold decorative ornaments between text sections
- Dark semi-transparent overlay behind text
- Professional, scholarly atmosphere
- Hebrew/Jewish theme elements

## Example Requests

**Example 1**: Lesson about children and spiritual fire
- Title: "Как отсутствие детей приводит к зажиганию чуждого огня?"
- Subtitle: "Рав Йоханан Цвейг - Недельная глава Бемидбар"

**Example 2**: Lesson about Chassidic practices
- Title: "Зачем гурские хасиды заправляют брюки в носки?"
- Subtitle: "Уроки главы Бемидбар"

**Example 3**: Lesson about banners/signs
- Title: "Почему hаШем дал знамена еврейскому народу, а не народам мира?"
- Subtitle: "Зера Шимшон, Бемидбар"

## Output Format

Generated banners are saved as PNG files and should be immediately ready for YouTube upload. File naming convention: `youtube_banner_kalashnik_[descriptive_topic].png`

## Quality Checklist

- [ ] All text is readable against the background
- [ ] Library background is clearly visible
- [ ] Name plate shows "ДМИТРИЙ КАЛАШНИК"
- [ ] Gold decorative elements are visible
- [ ] Dimensions are 2560x1440
- [ ] File format is PNG
- [ ] Professional, consistent styling matches previous banners
