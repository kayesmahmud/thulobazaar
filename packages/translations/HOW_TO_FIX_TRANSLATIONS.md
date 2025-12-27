# How to Fix Translation Mistakes

## Quick Reference

```
1. Edit: packages/translations/ne.json
2. Fix: Change the wrong text
3. Build: npm run build
4. Refresh: Browser auto-reloads
5. Done! ✅
```

---

## Example 1: Fix Spelling Mistake

### Scenario
Button shows: "खोजनुहोस्" (missing anusvara)
Should be: "खोज्नुहोस्" (correct)

### Steps

#### 1. Open File
```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo/packages/translations
code ne.json
```

#### 2. Find the Line
Search for "खोजनुहोस्" or find "search" key:

```json
{
  "common": {
    "search": "खोजनुहोस्"    ← Line 4
  }
}
```

#### 3. Fix It
Change to:
```json
{
  "common": {
    "search": "खोज्नुहोस्"   ← Fixed!
  }
}
```

#### 4. Save
- VS Code: `Ctrl+S` or `Cmd+S`
- Nano: `Ctrl+O`, then `Enter`, then `Ctrl+X`
- Vim: `:wq`

#### 5. Rebuild
```bash
npm run build
```

#### 6. See Changes
- Web: Refresh browser (auto-reloads)
- Mobile: Restart app

---

## Example 2: Wrong Translation

### Scenario
Button says: "बातचीतयोग्य" (negotiable - too formal)
Should be: "मोलमोलाई" (how people actually say it)

### Fix

```json
// BEFORE ❌
{
  "ads": {
    "negotiable": "बातचीतयोग्य"
  }
}

// AFTER ✅
{
  "ads": {
    "negotiable": "मोलमोलाई"
  }
}
```

Save → Build → Done!

---

## Example 3: Wrong Plural Form

### Scenario
Shows: "मेरो विज्ञापन" (my ad - singular)
Should be: "मेरा विज्ञापनहरू" (my ads - plural)

### Fix

```json
// BEFORE ❌
{
  "ads": {
    "myAds": "मेरो विज्ञापन"
  }
}

// AFTER ✅
{
  "ads": {
    "myAds": "मेरा विज्ञापनहरू"
  }
}
```

---

## Example 4: Better Natural Phrasing

### Scenario
Current: "पोस्ट विज्ञापन" (literal translation)
Better: "विज्ञापन पोस्ट गर्नुहोस्" (natural phrasing)

### Fix

```json
// BEFORE ❌
{
  "ads": {
    "postAd": "पोस्ट विज्ञापन"
  }
}

// AFTER ✅
{
  "ads": {
    "postAd": "विज्ञापन पोस्ट गर्नुहोस्"
  }
}
```

---

## Common Mistakes to Check

### 1. Missing Anusvara (ं)
```
❌ गरनुहोस्  →  ✅ गर्नुहोस्
❌ किननुहोस्  →  ✅ किन्नुहोस्
❌ बेचनुहोस्  →  ✅ बेच्नुहोस्
```

### 2. Wrong Chandra-bindu (ँ) vs Anusvara (ं)
```
❌ हुदैछ    →  ✅ हुँदैछ
❌ छन      →  ✅ छन्
```

### 3. Spacing Issues
```
❌ बिक्री को लागी  →  ✅ बिक्रीको लागि
❌ मेरो नाम       →  ✅ मेरोनाम
```

### 4. Halanta (्) Mistakes
```
❌ खोजनुहोस्     →  ✅ खोज्नुहोस्
❌ सुरक्षितगर्नुहोस् →  ✅ सुरक्षित गर्नुहोस्
```

---

## File Structure

```
packages/translations/
├── en.json          ← English (rarely needs fixing)
├── ne.json          ← Nepali (you'll edit this most)
└── src/index.ts     ← Don't touch this
```

---

## Quick Edit Commands

### Using VS Code
```bash
cd packages/translations
code ne.json
# Edit → Ctrl+S → Done
npm run build
```

### Using Nano (Terminal)
```bash
cd packages/translations
nano ne.json
# Edit → Ctrl+O → Enter → Ctrl+X
npm run build
```

### Using Vim (Terminal)
```bash
cd packages/translations
vim ne.json
# Press 'i' to edit
# Make changes
# Press 'Esc' then ':wq' to save
npm run build
```

---

## Testing Your Changes

### Web App
```bash
# Changes auto-reload in dev mode
# Just refresh: http://localhost:3333/ne
```

### Mobile App
```bash
# Restart the app
npm run dev:mobile
# Or reload in Expo
```

---

## Where Each Translation is Used

| Key | Used In | Example |
|-----|---------|---------|
| `common.search` | Search bar, buttons | "खोज्नुहोस्" |
| `ads.postAd` | Post ad button | "विज्ञापन पोस्ट गर्नुहोस्" |
| `auth.login` | Login button | "लगइन" |
| `home.title` | Homepage hero | "सबै किन्नुहोस् र बेच्नुहोस्" |

---

## Workflow Summary

```
┌──────────────────────────────────────┐
│ 1. Notice mistake in app             │
│    "खोजनुहोस्" looks wrong           │
└────────────┬─────────────────────────┘
             ▼
┌──────────────────────────────────────┐
│ 2. Open ne.json                      │
│    code ne.json                      │
└────────────┬─────────────────────────┘
             ▼
┌──────────────────────────────────────┐
│ 3. Find and fix                      │
│    "search": "खोज्नुहोस्"            │
└────────────┬─────────────────────────┘
             ▼
┌──────────────────────────────────────┐
│ 4. Save file                         │
│    Ctrl+S                            │
└────────────┬─────────────────────────┘
             ▼
┌──────────────────────────────────────┐
│ 5. Rebuild                           │
│    npm run build                     │
└────────────┬─────────────────────────┘
             ▼
┌──────────────────────────────────────┐
│ 6. Refresh browser                   │
│    See the fix! ✅                   │
└──────────────────────────────────────┘
```

---

## Pro Tips

### 1. Search by English
If you know the English but can't find the Nepali:
```bash
# Find where "Search" is in English
grep -n "Search" en.json
# Then look at same line in ne.json
```

### 2. Batch Find & Replace
```bash
# Replace all occurrences of a mistake
# Using VS Code: Ctrl+H (Find and Replace)
# Or using sed:
sed -i '' 's/खोजनुहोस्/खोज्नुहोस्/g' ne.json
npm run build
```

### 3. Preview Before Committing
```bash
# See what changed
git diff ne.json

# Commit only when you're sure
git add ne.json
git commit -m "Fix: Correct spelling of 'search' in Nepali"
```

---

## Get Help

### If Unsure About Spelling
1. Ask a native Nepali speaker
2. Check official Nepali dictionary
3. Look at how other Nepali apps phrase it
4. Test with your target users

### Common Resources
- Google Nepali Input: https://www.google.com/inputtools/try/
- Nepali Dictionary: http://nepdict.com/
- Unicode Nepali: https://unicode.org/charts/PDF/U0900.pdf

---

## Remember

✅ **DO:**
- Fix mistakes as you find them
- Test after every change
- Ask native speakers if unsure
- Keep translations natural and conversational

❌ **DON'T:**
- Use auto-translation tools
- Copy literal translations
- Use overly formal language
- Forget to rebuild after editing

---

**Need to fix something? Just edit ne.json, save, rebuild, done!** 🎉
