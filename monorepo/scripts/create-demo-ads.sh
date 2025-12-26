#!/bin/bash

# Demo Ads Creation Script
# This script creates demo ads for testing

PSQL="/usr/local/Cellar/postgresql@18/18.1/bin/psql"
DB="thulobazaar"
USER="elw"
IMAGES_DIR="/Users/elw/Documents/Web/thulobazaar/Images"
UPLOADS_DIR="/Users/elw/Documents/Web/thulobazaar/monorepo/apps/web/public/uploads/ads"

# Ensure uploads directory exists
mkdir -p "$UPLOADS_DIR"

# Function to generate slug
generate_slug() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Function to copy and rename image
copy_image() {
    local src="$1"
    local dest_name="$2"
    if [ -f "$src" ]; then
        cp "$src" "$UPLOADS_DIR/$dest_name"
        echo "/uploads/ads/$dest_name"
    fi
}

# Function to create ad and images
create_ad() {
    local user_id="$1"
    local title="$2"
    local description="$3"
    local price="$4"
    local category_id="$5"
    local location_id="$6"
    local condition="$7"
    local folder_name="$8"
    local seller_name="$9"
    local seller_phone="${10}"

    local slug=$(generate_slug "$title")
    local timestamp=$(date +%s%N | cut -c1-13)
    slug="${slug}-${timestamp}"

    # Create the ad (include reviewed_at for approved ads to ensure proper sorting)
    local ad_id=$($PSQL -U $USER -d $DB -t -c "
        INSERT INTO ads (
            user_id, title, description, price, category_id, location_id,
            condition, slug, status, seller_name, seller_phone, created_at, updated_at, reviewed_at
        ) VALUES (
            $user_id,
            '$(echo "$title" | sed "s/'/''/g")',
            '$(echo "$description" | sed "s/'/''/g")',
            $price,
            $category_id,
            $location_id,
            '$condition',
            '$slug',
            'approved',
            '$seller_name',
            '$seller_phone',
            NOW(),
            NOW(),
            NOW()
        ) RETURNING id;
    " | tr -d ' ')

    echo "Created ad #$ad_id: $title"

    # Process images
    local folder_path="$IMAGES_DIR/$folder_name"
    local img_order=1
    local is_primary="true"

    # Find and process main image first
    for main_pattern in "Main Image" "main Image" "Main image" "main image" "Main mage"; do
        for ext in jpg jpeg webp png; do
            local main_file="$folder_path/${main_pattern}.${ext}"
            if [ -f "$main_file" ]; then
                local new_name="${ad_id}_${img_order}_$(date +%s).${ext}"
                local file_path=$(copy_image "$main_file" "$new_name")
                if [ -n "$file_path" ]; then
                    $PSQL -U $USER -d $DB -c "
                        INSERT INTO ad_images (ad_id, filename, file_path, is_primary, created_at, updated_at)
                        VALUES ($ad_id, '$new_name', '$file_path', $is_primary, NOW(), NOW());
                    " > /dev/null
                    echo "  - Added main image: $new_name"
                    is_primary="false"
                    img_order=$((img_order + 1))
                fi
                break 2
            fi
        done
    done

    # Process other images (2nd, 3rd, etc.)
    for num in 2nd 3rd 4th 5th 6th; do
        for pattern in "${num} Image" "${num} image" "${num} mage"; do
            for ext in jpg jpeg webp png; do
                local img_file="$folder_path/${pattern}.${ext}"
                if [ -f "$img_file" ]; then
                    local new_name="${ad_id}_${img_order}_$(date +%s).${ext}"
                    local file_path=$(copy_image "$img_file" "$new_name")
                    if [ -n "$file_path" ]; then
                        $PSQL -U $USER -d $DB -c "
                            INSERT INTO ad_images (ad_id, filename, file_path, is_primary, created_at, updated_at)
                            VALUES ($ad_id, '$new_name', '$file_path', false, NOW(), NOW());
                        " > /dev/null
                        echo "  - Added ${num} image: $new_name"
                        img_order=$((img_order + 1))
                    fi
                    break 2
                fi
            done
        done
    done

    echo ""
}

echo "=========================================="
echo "Creating Demo Ads"
echo "=========================================="
echo ""

# ==========================================
# DIJA FASHION SHOP (ID: 62) - Fashion Items
# ==========================================
echo ">>> Creating Fashion Ads for Dija Fashion Shop (ID: 62)"
echo ""

create_ad 62 \
    "Double-Breasted Trench Coat" \
    "Elegant double-breasted trench coat perfect for autumn and spring. Features classic styling with modern details. High-quality fabric with water-resistant finish. Available in multiple sizes. Perfect for professional and casual occasions." \
    12500 \
    810 \
    71166 \
    "new" \
    "Double-Breasted Trench Coat" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Ramie Shirt with Pockets" \
    "Comfortable ramie shirt featuring convenient front pockets. Breathable natural fabric perfect for warm weather. Relaxed fit with button-down front. Great for casual outings and everyday wear." \
    3500 \
    805 \
    71167 \
    "new" \
    "Ramie Shirt with Pockets" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Shoulder Straps Fitted Top" \
    "Stylish fitted top with elegant shoulder straps. Perfect for parties and evening events. Comfortable stretch fabric that flatters your figure. Available in various colors." \
    2800 \
    805 \
    71168 \
    "new" \
    "Shoulder Straps Fitted Top" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Crossback Halter Dress" \
    "Beautiful crossback halter dress for special occasions. Elegant design with flattering silhouette. Premium quality fabric with smooth finish. Perfect for weddings, parties, and formal events." \
    8500 \
    805 \
    71169 \
    "new" \
    "Crossback Halter Dress" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Foil Spot Mini Dress" \
    "Trendy foil spot mini dress that shines at any party. Eye-catching metallic spots on quality fabric. Comfortable fit with stylish design. Perfect for nightlife and celebrations." \
    6500 \
    805 \
    71170 \
    "new" \
    "Foil spot mini dress" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Sequin Textured Knit A-Line Gown" \
    "Stunning sequin textured knit A-line gown for glamorous events. Beautiful sparkle effect with comfortable knit fabric. Elegant A-line silhouette that flatters all body types. Perfect for galas and formal occasions." \
    15000 \
    805 \
    71171 \
    "new" \
    "Sequin Textured Knit A-Line Gown" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Excursion Hooded Long Sleeve Dress" \
    "Versatile hooded long sleeve dress for active lifestyle. Comfortable fabric with practical hood. Perfect for outdoor activities and casual wear. Functional yet stylish design." \
    5500 \
    805 \
    71172 \
    "new" \
    "Excursion Hooded Long Sleeve Dress" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "High Waist Denim Shorts" \
    "Classic high waist denim shorts for summer style. Flattering high-rise fit with quality denim fabric. Perfect for casual outings and beach days. Versatile piece for any wardrobe." \
    3200 \
    805 \
    71173 \
    "new" \
    "High Waist Denim Shorts" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Octavia V-Waist Sweater Skirt" \
    "Elegant V-waist sweater skirt for cooler days. Soft knit fabric with flattering V-waist design. Perfect for office wear and casual occasions. Comfortable and stylish." \
    4200 \
    805 \
    71174 \
    "new" \
    "Octavia V-Waist Sweater Skirt" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Kate Crystal Embellished Pointed Toe Pump Shoes" \
    "Luxurious crystal embellished pointed toe pump shoes. Elegant design with sparkling crystal details. Perfect for weddings and special occasions. Comfortable heel height for all-day wear." \
    9500 \
    807 \
    71175 \
    "new" \
    "Kate Crystal Embellished Pointed Toe Pump Shoes" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Crystal Embellished Pointed Toe Platform Slide Sandal" \
    "Glamorous crystal embellished platform slide sandals. Eye-catching crystals on comfortable platform base. Perfect for summer events and parties. Stylish and comfortable design." \
    7500 \
    807 \
    71176 \
    "new" \
    "Crystal Embellished Pointed Toe Platform Slide Sandal" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Abstract Print Cotton Blouse" \
    "Artistic abstract print cotton blouse for unique style. Breathable cotton fabric with vibrant print. Perfect for work and casual occasions. Comfortable and fashionable." \
    2900 \
    805 \
    71177 \
    "new" \
    "Abstract Print Cotton Blouse" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Cashmere Tank and Bag Set" \
    "Luxurious cashmere tank top with matching bag. Premium quality cashmere for ultimate comfort. Elegant set perfect for gifting or self-indulgence. Timeless style and quality." \
    11000 \
    805 \
    71178 \
    "new" \
    "Cashmere Tank + Bag Women" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "V-Neck Pure Cotton T-shirt" \
    "Essential V-neck pure cotton T-shirt for everyday comfort. Soft breathable cotton fabric. Classic fit that never goes out of style. Perfect for layering or wearing alone." \
    1800 \
    805 \
    71179 \
    "new" \
    "V-Neck Pure Cotton T-shirt" \
    "Dija Fashion Shop" \
    "9706657812"

create_ad 62 \
    "Washed Denim Men Shirt" \
    "Classic washed denim shirt for men. Soft washed fabric with vintage appeal. Perfect for casual and smart-casual occasions. Durable quality denim construction." \
    3800 \
    702 \
    71180 \
    "new" \
    "Washed Denim Men Shirt" \
    "Dija Fashion Shop" \
    "9706657812"

echo "=========================================="
echo "Fashion ads complete!"
echo "=========================================="
