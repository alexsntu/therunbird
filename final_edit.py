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

# На основе красного прямоугольника:
# x: от 520 до 1100
# y: от 360 до 420

# Берем цвет фона из области рядом с текстом
bg_color = img.getpixel((450, 390))
print(f"Цвет фона: {bg_color}")

# Стираем область
left = 520
top = 360
right = 1100
bottom = 420

draw.rectangle([left, top, right, bottom], fill=bg_color)

# Загружаем шрифт
try:
    font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 62)
except:
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 62)
    except:
        font = ImageFont.load_default()

WHITE = (255, 255, 255)

# Новый текст
new_text = "ХУКАТ / БАЛАК"

# Пишем текст
text_x = 540
text_y = 370

draw.text((text_x, text_y), new_text, fill=WHITE, font=font)

# Сохраняем
output_path = r"C:\Users\Алекс\Documents\Carbon-cursor\youtube_intro_card_hukат_balak_final.png"
img_copy.save(output_path, 'PNG')

print("Gotovo! Kartinka sohranena")
print(f"Областъ стирания: x=[{left}, {right}], y=[{top}, {bottom}]")
print(f"Doban tekst: {new_text}")
