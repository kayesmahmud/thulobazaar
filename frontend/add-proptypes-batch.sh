#!/bin/bash

# Script to add PropTypes to all remaining React components
# This script will add proper PropTypes validation to components

COMPONENTS_DIR="/Users/elw/Documents/Web/thulobazaar/frontend/src/components"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Adding PropTypes to remaining components..."

# Profile components
echo -e "${YELLOW}Processing Profile components...${NC}"

# ProfileEditForm
FILE="$COMPONENTS_DIR/profile/ProfileEditForm.jsx"
if ! grep -q "ProfileEditForm.propTypes" "$FILE"; then
    cat >> "$FILE" << 'EOF'

ProfileEditForm.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string,
    bio: PropTypes.string,
    phone: PropTypes.string,
    locationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  locations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  })).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  unsavedChanges: PropTypes.bool
};
EOF
    echo -e "${GREEN}✓ Added PropTypes to ProfileEditForm.jsx${NC}"
else
    echo -e "  Skipping ProfileEditForm.jsx (already has PropTypes)"
fi

# ImageCropperModal
FILE="$COMPONENTS_DIR/profile/ImageCropperModal.jsx"
if ! grep -q "import PropTypes from 'prop-types'" "$FILE"; then
    sed -i.bak "2i\\
import PropTypes from 'prop-types';\\
" "$FILE" && rm -f "$FILE.bak"
fi
if ! grep -q "ImageCropperModal.propTypes" "$FILE"; then
    sed -i.bak '/^export default ImageCropperModal;/i\
\
ImageCropperModal.propTypes = {\
  isOpen: PropTypes.bool.isRequired,\
  imageSrc: PropTypes.string.isRequired,\
  type: PropTypes.oneOf(['"'"'avatar'"'"', '"'"'cover'"'"']).isRequired,\
  onCropComplete: PropTypes.func.isRequired,\
  onCancel: PropTypes.func.isRequired\
};\
' "$FILE" && rm -f "$FILE.bak"
    echo -e "${GREEN}✓ Added PropTypes to ImageCropperModal.jsx${NC}"
else
    echo -e "  Skipping ImageCropperModal.jsx (already has PropTypes)"
fi

echo -e "${GREEN}✓ Profile components completed${NC}\n"

# Dashboard components
echo -e "${YELLOW}Processing Dashboard components...${NC}"

for comp in DashboardStats DashboardAdCard DashboardFilters; do
    FILE="$COMPONENTS_DIR/dashboard/${comp}.jsx"
    if [ -f "$FILE" ]; then
        if ! grep -q "import PropTypes from 'prop-types'" "$FILE"; then
            sed -i.bak "2i\\
import PropTypes from 'prop-types';\\
" "$FILE" && rm -f "$FILE.bak"
            echo -e "${GREEN}✓ Added PropTypes import to ${comp}.jsx${NC}"
        fi
    fi
done

echo -e "${GREEN}✓ Dashboard components processed${NC}\n"

# Search components
echo -e "${YELLOW}Processing Search components...${NC}"

for comp in SearchFiltersPanel SearchResultCard SearchResultsGrid SearchPagination; do
    FILE="$COMPONENTS_DIR/search/${comp}.jsx"
    if [ -f "$FILE" ]; then
        if ! grep -q "import PropTypes from 'prop-types'" "$FILE"; then
            sed -i.bak "2i\\
import PropTypes from 'prop-types';\\
" "$FILE" && rm -f "$FILE.bak"
            echo -e "${GREEN}✓ Added PropTypes import to ${comp}.jsx${NC}"
        fi
    fi
done

echo -e "${GREEN}✓ Search components processed${NC}\n"

# Editor components
echo -e "${YELLOW}Processing Editor components...${NC}"

for comp in EditorStats EditorFilters AdManagementTable UserManagementTable BusinessVerificationTable ActivityLogPanel; do
    FILE="$COMPONENTS_DIR/editor/${comp}.jsx"
    if [ -f "$FILE" ]; then
        if ! grep -q "import PropTypes from 'prop-types'" "$FILE"; then
            sed -i.bak "2i\\
import PropTypes from 'prop-types';\\
" "$FILE" && rm -f "$FILE.bak"
            echo -e "${GREEN}✓ Added PropTypes import to ${comp}.jsx${NC}"
        fi
    fi
done

echo -e "${GREEN}✓ Editor components processed${NC}\n"

# Admin components
echo -e "${YELLOW}Processing Admin components...${NC}"

for comp in AdminStats AdminAdCard AdminUserCard AdminFilters AdminSettings; do
    FILE="$COMPONENTS_DIR/admin/${comp}.jsx"
    if [ -f "$FILE" ]; then
        if ! grep -q "import PropTypes from 'prop-types'" "$FILE"; then
            sed -i.bak "2i\\
import PropTypes from 'prop-types';\\
" "$FILE" && rm -f "$FILE.bak"
            echo -e "${GREEN}✓ Added PropTypes import to ${comp}.jsx${NC}"
        fi
    fi
done

echo -e "${GREEN}✓ Admin components processed${NC}\n"

# Edit-ad, Post-ad, All-ads, Common components
echo -e "${YELLOW}Processing remaining components...${NC}"

for dir in edit-ad post-ad all-ads common; do
    if [ -d "$COMPONENTS_DIR/$dir" ]; then
        for file in "$COMPONENTS_DIR/$dir"/*.jsx; do
            if [ -f "$file" ] && ! grep -q "import PropTypes from 'prop-types'" "$file"; then
                sed -i.bak "2i\\
import PropTypes from 'prop-types';\\
" "$file" && rm -f "$file.bak"
                echo -e "${GREEN}✓ Added PropTypes import to $(basename $file)${NC}"
            fi
        done
    fi
done

echo -e "\n${GREEN}✓✓✓ PropTypes import added to all components!${NC}"
echo -e "${YELLOW}Note: You still need to add the actual propTypes definitions to each component.${NC}"
echo -e "${YELLOW}The imports have been added, but you need to define the specific prop shapes.${NC}"
