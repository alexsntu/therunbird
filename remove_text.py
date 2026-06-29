#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw
import os

# Путь к оригинальной картинке
original_image_path = r"C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor\assets\c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_6c3cc8450a28d5731a0ee85fe1666fec_images_4-_________-____-6f8cd7ea-e44b-4d6a-b31e-bda6a6e061c1.png"

# Открываем картинку
img = Image.open(original_image_path)
print(f"Размер: {img.size}")

img_copy = img.copy()
draw = ImageDraw.Draw(img_copy)

# Берем цвет фона
bg_color = img.getpixel((900, 390))
print(f"Цвет фона: {bg_color}")

# ТОЛЬКО текст "БЕ'АЛОТХА / ШЛАХ" - это вторая большая белая строка
# Примерные координаты (более узкие):
# y: примерно 375-410 (только одна строка текста)
# x: примерно 680-1050

# Очень узкая область - только для одной строки
draw.rectangle(
    [(650, 375), (1100, 410)],  # очень узкий прямоугольник
    fill=bg_color
)

# Сохраняем
output_path = r"C:\Users\Алекс\Documents\Carbon-cursor\youtube_intro_card_no_chapters.png"
img_copy.save(output_path, 'PNG')

print(f"Картинка сохранена: {output_path}")
