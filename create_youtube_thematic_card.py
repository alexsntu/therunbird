#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube Thematic Lesson Card Generator

This script ALWAYS uses ORIGINAL assets only:
- Original Dmitry Kalashnik photo
- Original БНЕЙ НОАХ logo
- Never generates faces or logos

MANDATORY RULES:
1. Logo file: Original logo path
2. Photo file: One of the original MK1_* files in the assets folder
3. NO AI-generated faces or logos
4. NO filters on originals
5. Composition and layout are original work
"""

from PIL import Image, ImageDraw, ImageFont
import os
from pathlib import Path

# Asset paths (ORIGINAL ONLY)
ASSETS_DIR = r"C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor\assets"
LOGO_FILE = os.path.join(ASSETS_DIR, "bnei_noah_logo_processed.png")
PHOTO_FILE = os.path.join(ASSETS_DIR, "c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_cbbb5115f1f052b82ffc2da929f98d82_images_MK1_0393-2-e4b02614-90c7-4790-ad41-d7c103a59f84.png")

# Card dimensions
CARD_WIDTH = 1920
CARD_HEIGHT = 1080

# Colors
DARK_NAVY = (26, 58, 122)  # #1a3a7a
GOLD = (212, 175, 55)  # #d4af37
WHITE = (255, 255, 255)  # #ffffff

def create_thematic_card(
    main_question: str,
    subtitle: str,
    source: str,
    output_filename: str
) -> str:
    """
    Create a YouTube thematic lesson card with ORIGINAL assets.
    
    Args:
        main_question: Main question text (large, white)
        subtitle: Supporting subtitle (medium, white)
        source: Source/reference (small, gold)
        output_filename: Output PNG filename
    
    Returns:
        Path to generated image
    
    RULES:
    - Logo: ALWAYS original bnei_noah_logo_processed.png
    - Photo: ALWAYS original MK1_0393-2 (or other approved originals)
    - NO generated faces or logos
    - NO modifications to originals beyond scaling/positioning
    """
    
    # Verify original assets exist
    if not os.path.exists(LOGO_FILE):
        raise FileNotFoundError(f"Logo not found: {LOGO_FILE}")
    if not os.path.exists(PHOTO_FILE):
        raise FileNotFoundError(f"Photo not found: {PHOTO_FILE}")
    
    # Create base image with dark blue background
    card = Image.new('RGB', (CARD_WIDTH, CARD_HEIGHT), DARK_NAVY)
    draw = ImageDraw.Draw(card)
    
    # Load and place ORIGINAL logo (TOP LEFT)
    logo = Image.open(LOGO_FILE)
    logo_size = 90  # Miniature size
    logo.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
    card.paste(logo, (30, 30), logo if logo.mode == 'RGBA' else None)
    
    # Add logo text
    try:
        # Try to load font, fall back to default if not available
        font_large = ImageFont.truetype("arial.ttf", 20)
        font_medium = ImageFont.truetype("arial.ttf", 16)
        font_main = ImageFont.truetype("arial.ttf", 52)
        font_subtitle = ImageFont.truetype("arial.ttf", 36)
        font_source = ImageFont.truetype("arial.ttf", 26)
        font_label = ImageFont.truetype("arial.ttf", 24)
    except:
        # Fallback to default font
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_main = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_source = ImageFont.load_default()
        font_label = ImageFont.load_default()
    
    # Logo text
    draw.text((135, 35), "БНЕЙ НОАХ", fill=WHITE, font=font_large)
    draw.text((135, 60), "ТОРА ОНЛАЙН", fill=GOLD, font=font_medium)
    
    # Horizontal gold line under logo
    draw.line([(30, 120), (1900, 120)], fill=GOLD, width=3)
    
    # Load and place ORIGINAL photo (LEFT SIDE with geometric frame)
    photo = Image.open(PHOTO_FILE)
    photo_height = 700
    photo_width = int(photo_height * photo.width / photo.height)
    photo.thumbnail((photo_width, photo_height), Image.Resampling.LANCZOS)
    photo_x = 20
    photo_y = 180
    card.paste(photo, (photo_x, photo_y), photo if photo.mode == 'RGBA' else None)
    
    # Draw gold geometric frame around photo (trapezoid shape)
    frame_margin = 3
    trapezoid_points = [
        (photo_x - frame_margin, photo_y - frame_margin),  # top-left
        (photo_x + photo_width + frame_margin, photo_y - frame_margin),  # top-right
        (photo_x + photo_width + frame_margin + 20, photo_y + photo_height + frame_margin),  # bottom-right
        (photo_x - frame_margin - 20, photo_y + photo_height + frame_margin),  # bottom-left
    ]
    draw.polygon(trapezoid_points, outline=GOLD, width=4)
    
    # TEXT SECTION (RIGHT SIDE)
    text_start_x = 550
    text_width = 1350
    text_start_y = 160
    
    # 1. "ТЕМАТИЧЕСКИЙ УРОК" label
    label_text = "◆ ТЕМАТИЧЕСКИЙ УРОК ◆"
    draw.text((text_start_x, text_start_y), label_text, fill=GOLD, font=font_label)
    
    # Gold line
    draw.line([(text_start_x, text_start_y + 40), (text_start_x + 900, text_start_y + 40)], fill=GOLD, width=2)
    
    # 2. Main question (largest, white)
    question_y = text_start_y + 70
    lines = wrap_text(main_question, 35)
    for i, line in enumerate(lines):
        draw.text((text_start_x, question_y + i * 60), line, fill=WHITE, font=font_main)
    
    # Gold line after question
    question_end_y = question_y + len(lines) * 60 + 20
    draw.line([(text_start_x, question_end_y), (text_start_x + 900, question_end_y)], fill=GOLD, width=2)
    
    # 3. Subtitle (white)
    subtitle_y = question_end_y + 30
    draw.text((text_start_x, subtitle_y), subtitle, fill=WHITE, font=font_subtitle)
    
    # Gold line after subtitle
    draw.line([(text_start_x, subtitle_y + 50), (text_start_x + 900, subtitle_y + 50)], fill=GOLD, width=2)
    
    # 4. Source (gold)
    source_text = f"▫ {source} ▫"
    source_y = subtitle_y + 80
    draw.text((text_start_x, source_y), source_text, fill=GOLD, font=font_label)
    
    # 5. Name (white, bottom)
    name_text = "🪶 Дмитрий Калашник"
    name_y = CARD_HEIGHT - 100
    draw.text((text_start_x, name_y), name_text, fill=WHITE, font=font_subtitle)
    
    # Save image
    output_path = os.path.join(ASSETS_DIR, output_filename)
    card.save(output_path, 'PNG')
    
    print("Card created:", output_path)
    print("Using ORIGINAL logo:", LOGO_FILE)
    print("Using ORIGINAL photo:", PHOTO_FILE)
    
    return output_path


def wrap_text(text: str, char_width: int = 35) -> list:
    """Wrap text to fit within character width."""
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        if len(' '.join(current_line)) >= char_width:
            lines.append(' '.join(current_line[:-1]))
            current_line = [word]
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines


if __name__ == "__main__":
    thematic_card = create_thematic_card(
        main_question="Современная нейробиология\nи секрет Красной Коровы!",
        subtitle="Рав Йонатан Сакс",
        source="Недельная глава Хукат",
        output_filename="youtube_thematic_lesson_neurobiology_red_cow.png"
    )
    print("Generated:", thematic_card)
