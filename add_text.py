#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
import os

# Путь к оригинальной картинке
original_image_path = r"C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor\assets\c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_6c3cc8450a28d5731a0ee85fe1666fec_images_4-_________-____-6f8cd7ea-e44b-4d6a-b31e-bda6a6e061c1.png"

# Открываем картинку
img = Image.open(original_image_path)
print(f"Размер: {img.size}")

img_copy = img.copy()
draw = ImageDraw.Draw(img_copy)

# Загружаем шрифт (большой, жирный)
try:
    font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 62)
except:
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 62)
    except:
        font = ImageFont.load_default()

WHITE = (255, 255, 255)

# Новый текст который нужно написать
new_text = "ХУКАТ / БАЛАК"

# Позиция текста (примерно где был старый)
text_x = 440
text_y = 380

# Рисуем новый текст
draw.text((text_x, text_y), new_text, fill=WHITE, font=font)

# Сохраняем
output_path = r"C:\Users\Алекс\Documents\Carbon-cursor\youtube_intro_card_hukат_balak.png"
img_copy.save(output_path, 'PNG')

print(f"Картинка сохранена: {output_path}")
print(f"Добавлен текст: {new_text}")
