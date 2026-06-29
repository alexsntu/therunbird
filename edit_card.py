#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
import os

# Путь к оригинальной картинке
original_image_path = r"C:\Users\Алекс\.cursor\projects\c-Users-Documents-Carbon-cursor\assets\c__Users_______AppData_Roaming_Cursor_User_workspaceStorage_6c3cc8450a28d5731a0ee85fe1666fec_images_4-_________-____-cb32114c-1247-4b99-908e-6591b9f9a40a.png"

# Открываем оригинальную картинку
img = Image.open(original_image_path)
img_rgb = img.convert('RGB')
img_copy = img_rgb.copy()
draw = ImageDraw.Draw(img_copy)

print(f"Картинка размер: {img.size}")

# Загружаем шрифт
try:
    font_bold = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 60)
except:
    try:
        font_bold = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 60)
    except:
        font_bold = ImageFont.load_default()

WHITE = (255, 255, 255)

# Используем более продвинутый подход - читаем цвета из разных точек фона
# и создаем плавный градиент или среднее значение

# Точки где точно фон (далеко от текста и элементов)
sample_points = [
    (500, 450),   # середина справа, ниже текста
    (600, 400),   # справа, ниже
    (450, 300),   # справа, в середине высоты
]

colors = []
for point in sample_points:
    try:
        c = img_rgb.getpixel(point)
        colors.append(c)
        print(f"Точка {point}: {c}")
    except:
        pass

# Берем среднее значение цветов
avg_color = tuple(
    int(sum(c[i] for c in colors) / len(colors))
    for i in range(3)
)
print(f"Средний цвет фона: {avg_color}")

# Координаты где находится текст "БЕ'АЛОТХА / ШЛАХ"
# На картинке 1024x682 это примерно:
text_x = 380
text_y = 210

# Размер области для стирания (большой запас)
erase_width = 650
erase_height = 50

# Стираем область - используем черный цвет (это фон позади текста на картинке)
BLACK = (0, 0, 0)
draw.rectangle(
    [text_x - 20, text_y - 10, text_x + erase_width + 20, text_y + erase_height + 10],
    fill=BLACK
)

# Новый текст
new_text = "ХУКАТ / БАЛАК"

# Пишем новый текст белым цветом
draw.text((text_x, text_y), new_text, fill=WHITE, font=font_bold)

# Сохраняем
output_path = r"C:\Users\Алекс\Documents\Carbon-cursor\youtube_intro_card_hukат_balak_final.png"
img_copy.save(output_path, 'PNG')

print(f"Готово! Картинка сохранена: {output_path}")
