# RUNBIRD Corvette C6 Accessory Banner Generation Prompt

## General Instructions

Create beautiful product banners for Corvette C6 accessories in the RUNBIRD premium style. Each banner should showcase the real accessory beautifully while maintaining consistent branding.

## Banner Style Requirements

**Background & Design:**
- Black background (#000000 or near-black)
- Diagonal gold/yellow accent lines on edges (premium aesthetic)
- Dramatic professional lighting
- Luxury automotive photography style
- No text overlays on the image itself
- No logos or category names on the photo

**Product Presentation:**
- Accessory centered in the frame
- Mounted on red Corvette C6 (when contextually relevant)
- Premium materials clearly visible
- High-quality professional automotive product photography
- Realistic details and craftsmanship highlighted

## Standard Sizes to Generate

Always create banners in these three sizes:
1. **750x500** (16:9 horizontal) - horizontal
2. **550x650** (9:16 vertical) - vertical  
3. **1080x720** (16:9 large) - large horizontal

Use aspect ratios:
- 750x500 → `aspect_ratio: 4:3`
- 550x650 → `aspect_ratio: 9:16`
- 1080x720 → `aspect_ratio: 16:9`

## Implementation Steps

### Step 1: Gather Reference Images
- Collect real photos of the accessory variants from the user
- Save images to the workspace assets folder
- Use `reference_image_paths` parameter to incorporate actual product photos

### Step 2: Create Generation Description
Template for each variant:

```
Create a luxurious RUNBIRD style banner ([SIZE] pixels) for Corvette C6 [ACCESSORY_TYPE] [VARIANT_DESCRIPTION]. Show the [ACCESSORY] centered [CONTEXT]. Black background with diagonal gold accent lines, dramatic professional lighting highlighting the premium material and craftsmanship, [MATERIAL_DETAILS] visible, no text overlay on image.
```

**Example:**
```
Create a luxurious RUNBIRD style banner (750x500 pixels) for Corvette C6 shift knob in carbon fiber black with leather stitching. Show the knob centered and mounted in the shifter. Black background with diagonal gold accent lines, dramatic professional lighting highlighting the premium carbon fiber texture and leather detail, no text overlay on image.
```

### Step 3: Generate with Reference Images
Use the GenerateImage tool with:
- `aspect_ratio`: appropriate ratio from list above
- `description`: detailed prompt following template
- `filename`: `runbird_[accessory]_[variant]_[size].png`
- `reference_image_paths`: array of actual product image paths

**Filename Convention:**
```
runbird_[accessory_name]_[variant_number]_[width]x[height].png
```

Examples:
- `runbird_wheel_1_750x500.png`
- `runbird_shiftknob_v2_550x650.png`
- `runbird_handbrake_classic_1080x720.png`
- `runbird_sill_v3_750x500.png`
- `runbird_emblems_hero_750x500.png`

## Key Principles

✓ **Use Real Images**: Always incorporate user-provided product photos via `reference_image_paths`
✓ **Premium Aesthetic**: Black + gold color scheme, dramatic lighting, luxury feel
✓ **Consistency**: Same style across all accessories and variants
✓ **Three Sizes Always**: Generate all three sizes for each variant
✓ **No Text on Images**: Banners contain only the product, no names or descriptions
✓ **Centered Product**: Main accessory is centered and clearly visible
✓ **Professional Quality**: High-end automotive photography style

## Special Cases

### HERO Banners
When creating HERO banners with multiple products:
- Show all variants in one image
- Arrange them aesthetically (symmetrical or balanced)
- Maintain focus on each product
- Keep the RUNBIRD style with black background and gold lines
- Generate in all three sizes

Example request: *"Create one HERO banner featuring all [VARIANTS] arranged beautifully"*

### Different Material Variations
- Carbon fiber: highlight texture and weave
- Leather: show stitching and texture
- Metal/Stainless: highlight polish and reflections
- Rubber: show material texture
- Paint/Color: ensure color is prominently visible

## Typical Workflow

1. User provides category name and reference images
2. Ask for clarification if needed (number of variants, specific materials)
3. Generate 3 sizes × number of variants
4. If user mentions variants are "not real" → regenerate using reference images
5. Confirm final result with user

## Common Accessory Categories

- Steering Wheels
- Shift Knobs (various styles: classic, ball, drift)
- Handbrakes / Parking Brakes
- Door Sill Covers / Sill Plates
- Airbag Covers
- Shift Knob Caps
- Emblems / Badges
- Interior Trim
- Carbon Fiber Panels
- Custom Grips

## Response Format

After generating all banners:

```
Created [NUMBER] banners for [CATEGORY]:

## Variant [NUMBER] - [DESCRIPTION]
- 750x500 ✓
- 550x650 ✓
- 1080x720 ✓

[... repeat for each variant ...]

**Total: [COUNT] banners** - all in RUNBIRD premium style...
```

---

**Last Updated:** August 9, 2026
**Project:** therunbird - Corvette C6 Premium Accessories
**Style:** Black + Gold Luxury Automotive
