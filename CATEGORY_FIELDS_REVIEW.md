# Category & Additional-Details Review

Scope: every parent category, every subcategory, every "additional details" field, on web + mobile app + ad-detail rendering.
Status: **proposal only — no files changed.** Verified by executing both resolvers (TypeScript and Dart) against the live category table.

**Correction to the brief:** the live DB has **16 parents / 130 subcategory rows / 126 distinct names**, not 17/127. Four names exist under *both* fashion parents (`Bags & Accessories`, `Footwear`, `Optical & Sunglasses`, `Wholesale - Bulk`) and both config systems key on **name only**, so one config serves both. Every table below lists all 130 rows.

---

## 1. What's broken today

### 1.1 Confirmed live bugs (reproducible now, in prod)

| # | Bug | Where |
|---|---|---|
| B-01 | Web stamps `condition: 'Brand New'` on **every** ad it creates, even where no Condition field exists → rentals, jobs, services, groceries and live animals all wear a green "Brand New" badge | `post-ad/components/types.ts:35`, `usePostAd.ts:656` |
| B-02 | Web **edit** does the same, and contradicts itself 200 lines apart: `:255` deliberately deletes condition ("do NOT invent one"), `:295` recomputes it as `'Brand New'`, `:467` sends it | `hooks/useEditAd.ts:255,295,467` |
| B-03 | `isCodAvailable: false` written into `custom_fields` on **every** ad in **every** category | `usePostAd.ts:661`, `create_ad_screen.dart:1357` |
| B-04 | Spec rows label from the **raw key** — the correct English `label` on every field object is thrown away → "Is Cod Available", "Ram", "Mode Of Teaching", "Land Type: 2BHK" | `SpecificationsSection.tsx:53`, `ad_specifications.dart:221` |
| B-05 | Booleans stringify → `"Parking Sensors: false"`. Blocklist added in `3cdd493` covers only COD/negotiable; store build 1.3.0+24 predates it | `SpecificationsSection.tsx:57`, `ad_specifications.dart:146` |
| B-06 | Mobile spec rows use `spaceBetween` + `TextAlign.end` → value flush-right at a different x on every row (owner's B1) | `ad_specifications.dart:114-156` |
| B-07 | `year` / `registrationYear` `max: 2025` — **a 2026-model vehicle cannot be listed** on either platform | `templates/vehicles.ts:25,76`; `fields/common.ts:97`; `fields/vehicles.ts:14,82`; `form_template_service.dart:237,301` |
| B-08 | Web vehicle forms offer **"Reconditioned"**, then `normalizeCondition` collapses it to `'Used'` and the filter only queries two values → selected value silently destroyed (8 subcategories) | `sharedFields.ts:11`; `apps/web/src/lib/services/ad.service.ts:481`; `apps/api/src/services/ad.service.ts:541` |
| B-09 | **Wrong Nepali options.** Overrides change `options` without `optionsNe`; web's length guard passes when counts match, so Nepali users pick a mislabelled value: Medical Equipment shows construction/agriculture labels; Healthcare + Household show food/baby labels | `subcategories/general.ts:244,282,302` |
| B-10 | Nepali silently discarded (falls back to English) on `furnitureType` ×5, `productType` (Grocery, Baby Products), `languages` (Tuition) | `subcategories/general.ts:38,53,68,82,95,272,292`; `services.ts:38` |
| B-11 | **36 mobile select variants show English options to Nepali users** — Dart factories set `optionsNe: null` whenever options are overridden (all Property Type, all `furnitureType`, all `clothingType`, `animalType`, `ram`, `storage`, `screenResolution`) | `form_template_service.dart` factories |
| B-12 | `ram`, `storage`, `screenResolution`, `batteryHealth`, `smartFeatures`, `seats` have **no `optionsNe` at all** — Nepali missing on both platforms | `fields/electronics.ts`, `fields/vehicles.ts` |
| B-13 | **55 of 113 web subcategory config keys match no DB row.** Three are pure casing typos: `'Apartments for Sale'`, `'Houses for Sale'`, `'Commercial Properties for Sale'` | `subcategories/property.ts:167,169,172` (+52 others) |
| B-14 | **All 8 Jobs subcategories render zero fields on web** — the template gates job fields on `JOB_CATEGORIES`, a list of 61 job *titles*, not subcategory names. Mobile shows 5 fields | `templates/services.ts:73,84,92,100`; `sharedFields.ts:35-51` |
| B-15 | **28 subcategories render no Additional Details at all** (all Jobs, 7/8 Overseas, 4/5 Education, 5 Services, Maintenance and Repair, Other Agriculture, Licences) | resolver output |
| B-16 | `Fitness & Beauty Services` renders zero fields on **both** platforms — three configs keyed `'Gym & Fitness'`/`'Beauty Services'`/`'Body Massage'`, none of which exist | `subcategories/services.ts:188-190`; `form_template_service.dart:2077,2084,2091` |
| B-17 | Mobile makes Condition **required** on `Pet & Animal food` — you cannot list dog food without declaring it "Brand New" | `form_template_service.dart:2044`, `:2358` |
| B-18 | **Web/mobile field sets differ on 53 of 130 subcategories.** Worst: Vehicles > Rentals shares *no* field beyond brand/model; Commercial Properties For Sale = web 5 fields vs mobile 11 | resolver diff |
| B-19 | `monthlyRent` (5 Property rentals) and `salaryRange` (8 Jobs) duplicate the core required Price input — seller types the number twice (owner's B6) | `templates/property.ts:150`; `form_template_service.dart:569,2341` |
| B-20 | Detail-page spec **order is the seller's fill order** (JSON insertion order), so two ads in one subcategory show different orders; web's area-first comparator is non-transitive | `usePostAd.ts:131,657`; `create_ad_screen.dart:86,1355`; `SpecificationsSection.tsx:36-46` |
| B-21 | Mobile dynamic fields are built **unkeyed** — typed text survives a subcategory change while `_attributeValues` is cleared → the ad posts without the value | `dynamic_form_fields.dart:75`; `create_ad_screen.dart:1925` |
| B-22 | Mobile date field allocates a new `TextEditingController` on **every rebuild** (per keystroke elsewhere in the form) | `dynamic_form_fields.dart:238` |
| B-23 | Web draft restore reads `draft.isCodAvailable`, which is never declared or saved → COD always resets to false | `usePostAd.ts:477`; `useAdDraft.ts:18,33` |
| B-24 | `transformDbAdToApi` hardcodes `isNegotiable: false`; a test locks the lie in. Mobile works around it in two places | `packages/types/src/transformers.ts:99`; `ad.dart:122`; `ad_detail_screen.dart:628` |
| B-25 | `price-high` / `price-low` sort has no `nulls: 'last'` (unlike `published_at`, three lines below) — breaks the moment salary becomes optional | `apps/api/src/services/ad.service.ts:517-520` |
| B-26 | **Typesense re-labels missing condition as `'Used'`** and missing price as `0`; nulling the column makes the facet *worse*, not clean | `apps/web/src/lib/search/typesense.ts:73-74,127-128,237` |
| B-27 | JSON-LD emits an unconditional `Offer` with the raw price — a null-salary or price-less ad emits `"price": null` inside a `Product` offer | `apps/web/src/lib/utils/structuredData.ts:46-49` |
| B-28 | `'Home Appliances'` is registered **twice** (electronics + general); `general` wins silently by spread order | `subcategories/electronics.ts:221`; `general.ts:396` |

### 1.2 Design smells (not bugs, but they cause the bugs)

- **Two hand-maintained twins with no shared source and no parity test**: `apps/web/src/config/formTemplates/**` vs `apps/mobile/.../form_template_service.dart` (2,377 lines). This is the root cause of B-13/B-14/B-18.
- **Every `required: true` in both configs is dead.** Both runtimes overwrite it with an allow-list of exactly `{'condition'}` (`useFormTemplate.ts:21,78`; `form_template_service.dart:2358,2373`). ~105 declarations lie about intent.
- **One key, many concepts**: `landType` carries five incompatible option domains (BHK / house style / commercial type / zoning / room type); `storage` means both "256GB" and "Yes"; `bodyType` means both car silhouette and "Truck"; `screenSize` means both 55″ and "Full Frame"; `sportType` means "Treadmill".
- **Three fields, one label**: `serviceLocation` / `physicalServiceLocation` / `massageLocation` all render "Service Location" (last two are dead code).
- **`fieldLookup` is first-wins across modules** → a car's manufacture year gets the generic Nepali label "वर्ष"; Grocery values map through the *pet-accessory* option map.
- **Attributes are stored verbatim, never whitelisted server-side** (`ads.routes.ts:55-79`), so stale keys from a switched category, an old client, or a restored draft persist forever.
- **No moderation surface for attributes** — `grep` over the editor panel returns nothing, so nobody can spot-check the migration.
- **60 select lists have no "Other" escape**, including `farmingToolType` (no power tiller / water pump / thresher) and `suitableFor` on a subcategory literally named "Pet & Animal food" (no livestock option).
- **`googleMapsLink` is the only geo data on a property ad.** `ads.latitude`/`longitude` exist, are indexed, and are never written by either post-ad form.
- **Overseas Jobs is 8 configs that differ only by currency**; Jobs is 8 that differ only by placeholder. Both should be one parent-level fallback.
- **`Auto Services` and `Maintenance and Repair` are field-identical** — they should be one subcategory.
- **`New projects on PropertyGuide`** names a third-party portal that appears nowhere in the codebase.

---

## 2. Global rules — Condition / Negotiable / Cash-on-Delivery

**This section replaces 390 individual decisions with 36 rows.** Keyed on **category slug**, not name (slugs are `@unique`; the four duplicate fashion names resolve to distinct slugs — verified: `footwear`/`footwear-women`, `wholesale-bulk`/`wholesale-bulk-women`, etc.).

Three questions, one each:

- **Negotiable** — *is there a price the two parties will haggle over?* Default **show**.
- **COD** — *could the seller hand this over and take cash, for a sum a courier would carry?* Default **hide**.
- **Condition** — *does this market actually say "new vs used", and is reselling a used one hygienic and legal?* Default **hidden**. Three states: `required` / `optional` / `hidden`.

Two derived rules:

- **R1 — Price implies the flags.** If Price is hidden, Negotiable and COD are hidden by construction.
- **R2 — Condition mode is authoritative.** It controls the post-ad field, whether `ads.condition` is written at all, the badge, the JSON-LD `itemCondition`, and whether the condition search facet is offered. The `ALWAYS_REQUIRED_FIELDS = {'condition'}` kill-switch is **deleted** and replaced by this mode.

### 2.1 Parent defaults (16 rows)

| Parent slug | Negotiable | COD | Condition | Price label |
|---|---|---|---|---|
| `electronics` | show | show | **required** | Price |
| `mobiles` | show | show | **required** | Price |
| `vehicles` | show | **hide** | **required** | Price |
| `mens-fashion-grooming` | show | show | optional | Price |
| `womens-fashion-beauty` | show | show | optional | Price |
| `hobbies-sports-kids` | show | show | optional | Price |
| `home-living` | show | show | optional | Price |
| `business-industry` | show | show | optional | Price |
| `essentials` | show | show | hidden | Price |
| `agriculture` | show | show | hidden | Price |
| `pets-animals` | show | **hide** | hidden | Price |
| `property` | show | **hide** | **hidden** | Price / **Monthly Rent** on rentals |
| `services` | show | **hide** | hidden | **Starting Price** |
| `education` | show | **hide** | hidden | **Fee** |
| `jobs` | **hide** | **hide** | hidden | **Salary — optional** |
| `overseas-jobs` | **hide** | **hide** | hidden | **Salary — optional** |

The `property` row alone satisfies owner-bugs B2, B4 and half of B5.

### 2.2 Exceptions (20 rows, merged over the parent)

| Parent | Subcategory slug | Override | Why |
|---|---|---|---|
| mobiles | `sim-cards` | cod hide, condition hidden | A phone number is not shippable and has no new/used state |
| mobiles | `mobile-phone-services` | cod hide, condition hidden | It's a service |
| vehicles | `auto-parts-accessories` | **cod show** | Brake pads and helmets are couriered |
| vehicles | `rentals` | condition hidden | Renter doesn't buy the vehicle |
| vehicles | `auto-services` | condition hidden | Service |
| vehicles | `maintenance-repair` | condition hidden | Service |
| education | `textbooks` | **cod show, condition optional** | The one physical resold good in Education |
| business-industry | `industry-machinery-tools` | cod hide | Value + installation |
| business-industry | `raw-materials-industrial-supplies` | cod hide, condition hidden | Cement is not "Brand New" |
| business-industry | `licences-titles-tenders` | cod hide, condition hidden | Intangible |
| mens-fashion-grooming | `grooming-bodycare` | condition hidden | Hygiene — used personal care must not be listable |
| mens-fashion-grooming | `wholesale-bulk` | cod hide | Consignment, not a parcel |
| womens-fashion-beauty | `beauty-personal-care` | condition hidden | Hygiene |
| womens-fashion-beauty | `lingerie-sleepwear` | condition hidden | Hygiene + moderation |
| womens-fashion-beauty | `wholesale-bulk-women` | cod hide | Consignment |
| essentials | `baby-products` | **condition optional** | Prams and cots are heavily resold |
| agriculture | `farming-tools-machinery` | cod hide, **condition optional** | Not couriered; used-vs-new drives tractor price |
| pets-animals | `pet-animal-food` | **cod show** | Packaged feed is a parcel |
| pets-animals | `pet-animal-accessories` | **cod show, condition optional** | Cages and aquariums are resold |
| services | `matrimonials` | **price hidden** → R1 hides both flags | No price exists |

### 2.3 Price mode (needed for R1)

Only five groups differ from `Price (NPR), required`:

1. `jobs`, `overseas-jobs` → **Salary (NPR)**, optional.
2. Property rentals (`apartment-rentals`, `house-rentals`, `room-rentals`, `land-rentals`, `commercial-property-rentals`) → **Monthly Rent (NPR)**. This is what makes deleting `monthlyRent` safe.
3. `new-projects-propertyguide` → **Starting Price (NPR)**.
4. All `services` + `education` → **Starting Price / Fee (NPR)**.
5. `matrimonials` → hidden, price sent null.

### 2.4 Decisions I made where the clusters disagreed

- **Negotiable hides for exactly two reasons**: a hiring listing, or no price at all. Zero other exceptions. (Study Abroad and Matrimonials both keep it *by derivation*, not by exception.)
- **Jobs lose "salary negotiable"** per owner rule. Replacement: salary optional; a null salary must render **"Salary negotiable"** on card + detail, not "Rs 0". Required companion change.
- **COD threshold, stated explicitly**: hidden when the deal needs ownership-transfer paperwork (vehicles, property) *or* typically exceeds ~NPR 100,000 / needs installation (industrial + farm machinery, wholesale consignment). Furniture delivered cash-on-delivery is normal in Nepal → Home & Living keeps COD.
- **Condition is `required` in only three parents** — `electronics`, `mobiles`, `vehicles`. This **overrides** the per-cluster asks for `required` on furniture, doors, industrial machinery, medical equipment and farming tools; those still *offer* Condition, they just don't block the post. Removes six exception rows and reduces friction on the only mandatory extra field in the app.

---

## 3. Duplicate & renamed fields

### 3.1 Deleted — duplicates a first-class ad column

| Field | Duplicates | Verdict |
|---|---|---|
| `monthlyRent` (5 Property rentals) | `ads.price` | **Delete.** `price` is `numeric(12,2)`, indexed and filterable; `monthlyRent` is an unindexed JSON string. Core input relabels to "Monthly Rent (NPR)". |
| `salaryRange` (8 Jobs) | `ads.price` | **Delete.** Bucketed select, cannot be range-filtered, and its buckets are monthly-only — wrong for daily-wage trades. |
| `condition` in `custom_fields` | `ads.condition` column | **Mechanism is already correct** (`parseCustomFields` lifts and deletes the key). The bugs are B-01/B-02, not the design. |
| `googleMapsLink` | `ads.latitude` / `longitude` | **Keep for now, flag it.** The two real columns are never written by either form. Parsing the link into lat/long is a separate, worthwhile ticket. |
| `securityDeposit` | — | **Keep** — distinct amount. Change `number` → select of months. |
| `whatsapp_number` | `ads.seller_phone` | **Keep** — genuinely a second number. But it is the *only* snake_case key in the namespace; leave it deliberately, don't "fix" it (4 call sites + shipped app). |

### 3.2 Canonical-name proposals

| Current | Proposed | Call |
|---|---|---|
| `landType` (5 meanings) | `propertyType` (apartments/houses/commercial), `roomType` (rooms), `landType` (land only) | **RENAME.** Existing data is already incoherent — nothing of value is orphaned. Highest payoff. |
| `screenSize` on Cameras | `sensorSize` — **the field already exists and is unused** (`fields/electronics.ts`) | **RENAME.** Fixes a visible wrong label and unblocks making `screenSize` a select for TVs. |
| `sportType` on Fitness & Gym | `equipmentType` | **RENAME.** "Sport Type: Treadmill" today. |
| `bodyType` on Heavy Duty / Rentals / Trucks / Buses / Vans / Motorbikes / Three Wheelers | `vehicleType` (keep `bodyType` for Cars only) | **RENAME.** |
| `brand` on Textbooks | `publisher` | **RENAME.** "Brand: Vidyarthi Pustak Bhandar" today; a label override cannot fix it. |
| `brand` on Music, Books & Movies | `authorPublisher` | **RENAME.** Same reason. |
| `storage` (furniture yes/no in template) | `storageAvailable` (already the canonical name) | **RENAME** — removes a latent collision with electronics capacity. |
| `productWeight` | `packSize` | **SKIP.** Label-only fix; not worth orphaning data. |
| `mileage` | — | **SKIP.** On every vehicle ad. Fix the label to "Kilometers Driven" (South Asian "mileage" means km/l). |
| `totalArea` | — | **SKIP — never rename.** Load-bearing for the `totalArea`+`areaUnit` merge in both spec renderers. |
| `color`, `condition`, `brand`, `model`, `year` | — | **SKIP.** Highest-volume keys; label-map fix only. |
| `whatsapp_number` | `whatsappNumber` | **SKIP.** Needs a dual-read shim for near-zero gain. |
| `experienceRequired` | fold into `experience` | **SKIP for now** — do it during the Jobs port, not as a standalone rename. |

The durable fix for the whole class: extend `FieldTranslation` in `fieldLookup.ts:21` from `{labelNe, optionMap}` to `{label, labelNe, optionMap}` and return `label` for English. See §5.2.

### 3.3 Dead code to delete

- 55 orphan subcategory config keys (`subcategories/*.ts`), incl. all 8 Property, all 6 Pets, 6 Vehicles, 9 Fashion, 8 Jobs/Overseas, 3 Services.
- 5 dead template fields: `experienceRequired`, `salaryRange`, `educationRequired`, `companyName` (job-title gating), `physicalServiceLocation`, `massageLocation`.
- 8 unreferenced canonical exports: `conditionOptional`, `conditionWithRefurbished`, `yearField`, `sensorSizeField` (revive this one), `backupCameraField`, `parkingSensorsField`, `frameSizeField` (revive), `googleMapsLinkField`.
- `apps/web/src/config/formTemplates.ts` — 9-line deprecated shim making the import specifier ambiguous.
- ~105 dead `required: true` flags in both configs.

---

## 4. Per-category field changes

Notation: `remove` = delete the field for this subcategory; `add` = new/ported field; `fix` = keep but change options/label/type. Flags are governed by §2 and are not repeated. **Order shown is the render order; on web it is a subsequence of one canonical per-parent array order** (see §6.2).

### 4.1 Property (10)

Canonical Property field order (each subcategory renders a subsequence):
`propertyType|roomType → totalArea → areaUnit → builtUpArea → bedrooms → bathrooms → floorNumber → totalFloors → furnishing → constructionType → propertyAge → facing → landType → roadAccess → roadWidth → parking → amenities → preferredTenant → securityDeposit → availableFrom → googleMapsLink`

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Apartments For Sale | `condition`, `landType`("Property Type" BHK — duplicates bedrooms) | `totalFloors` (web has it, mobile doesn't) | `areaUnit` +dhur/kattha/bigha; `totalArea`→"Built-up Area"; `parking`→None/Bike/Car/Bike+Car/2+; `amenities`→apartment list (Lift, Power Backup, 24hr Water, Security, Balcony, Modular Kitchen, Gym, Pool, Kids Play, Club House, Visitor Parking); `propertyAge` "Under Construction" first | totalArea → areaUnit → bedrooms → bathrooms → floorNumber → totalFloors → furnishing → propertyAge → facing → parking → amenities → maps |
| Apartment Rentals | `monthlyRent`, `landType`, `propertyAge` | `preferredTenant` (Family/Bachelors/Students/Working/Girls Only/Boys Only/Anyone) | `securityDeposit` number→select (None/1/2/3 months/Negotiable); Price→"Monthly Rent (NPR)"; `areaUnit`, `totalArea`, `parking`, `amenities` as above | totalArea → areaUnit → bedrooms → bathrooms → floorNumber → totalFloors → furnishing → facing → parking → amenities → preferredTenant → securityDeposit → availableFrom → maps |
| Houses For Sale | `condition`, `furnishing` (houses aren't sold furnished) | `propertyType` (Bungalow/Duplex/Semi-detached/Row House/Villa/Traditional), `builtUpArea`, `constructionType` (RCC Pillar/Semi-Pillar/Load Bearing/Wooden), `totalFloors`, `roadAccess`, `roadWidth` | `totalArea`→"Land Area"; `roadWidth`→"Road Width (feet)"; `amenities`→house list (Boring/Well, Overhead Tank, Solar Heater, Inverter, Compound Wall, Garden, Garage, CCTV, Modular Kitchen, Terrace) | propertyType → totalArea → areaUnit → builtUpArea → bedrooms → bathrooms → totalFloors → constructionType → propertyAge → facing → roadAccess → roadWidth → parking → amenities → maps |
| House Rentals | `monthlyRent`, `propertyAge` | `propertyType` (Full House/Flat in House/Half House/Ground Floor/Top Floor), `preferredTenant` | `securityDeposit`→select; Price→"Monthly Rent"; `amenities`→rental list incl. **Separate Electricity Meter** | propertyType → totalArea → areaUnit → bedrooms → bathrooms → furnishing → facing → parking → amenities → preferredTenant → securityDeposit → availableFrom → maps |
| Land For Sale | — (confirm `condition` stays absent) | `facing` (mobile has it, web doesn't) | **`areaUnit` → aana/ropani/dhur/kattha/bigha/sq ft/sq m — Terai land cannot be listed correctly today**; `totalArea`→"Land Area"; `landType` label unified (mobile says "Zoning"); `roadWidth`→"(feet)" | totalArea → areaUnit → landType → roadAccess → roadWidth → facing → maps |
| Land Rentals | `monthlyRent` | `facing`, `availableFrom` (both mobile-only) | Same unit + label fixes; Price→"Monthly Rent"; keep `securityDeposit` OFF | totalArea → areaUnit → landType → roadAccess → roadWidth → facing → availableFrom → maps |
| Commercial Properties For Sale | `condition`, `furnishing` | `propertyType` (Office/Shop/Showroom/Warehouse/Factory/Restaurant/Hotel/Complex), `floorNumber`, `roadAccess`, `roadWidth`, `propertyAge`, `amenities` | `amenities`→commercial list (Lift, Power Backup, Water, Parking, CCTV, AC, Attached Toilet, Loading Access, Separate Entrance, Fire Safety); `parking` +Truck/Loading Bay | propertyType → totalArea → areaUnit → floorNumber → propertyAge → roadAccess → roadWidth → parking → amenities → maps |
| Commercial Property Rentals | `monthlyRent` | `propertyType`, `floorNumber`, `amenities`, `roadAccess`, `furnishing` (label "Fit-out Status") | `securityDeposit`→select incl. 6 months; Price→"Monthly Rent"; commercial amenity + parking lists | propertyType → totalArea → areaUnit → floorNumber → furnishing → roadAccess → parking → amenities → securityDeposit → availableFrom → maps |
| Room Rentals | `monthlyRent`, `bedrooms` (web asks a room lister for bedroom count incl. "Studio"), `totalArea`, `areaUnit` | `roomType` (Single Room/1 Room+Kitchen/2 Rooms+Kitchen/Shared/Master Bedroom/Hostel Bed/Flat), `preferredTenant` | `amenities`→room list on **both** platforms (web shows none today): Attached/Shared Bathroom, Kitchen Access, 24hr Water, Hot Water, WiFi, Separate Meter, Parking, Laundry, Terrace, Furnished Bed; `securityDeposit`→select; Price→"Monthly Rent"; `furnishing`→Furnished/Semi/Unfurnished | roomType → furnishing → preferredTenant → amenities → securityDeposit → availableFrom → maps |
| New projects on PropertyGuide | `totalArea`, `areaUnit` (a multi-unit development has no single area) | `propertyType` (Apartment Complex/Housing Colony/Commercial Complex/Plotted Development/Mixed-use), `projectStatus` (Pre-launch/Under Construction/Nearing Completion/Ready to Move/Handover), `unitTypes` multiselect (Studio/1BHK/…/Shop/Office/Plot) | Price→"Starting Price (NPR)"; **rename the subcategory** — see Q6 | propertyType → projectStatus → unitTypes → amenities → maps |

### 4.2 Jobs (8)

**Implement as ONE parent-level fallback** (mobile already has `_categoryFallbacks['Jobs']`; web needs the mechanism added). Only two subcategories carry a genuine extra field.

Shared Jobs set: `jobPostType` (Hiring / Looking for a Job) → `jobType` → `workLocationType` (On-site/Hybrid/Remote/Field Work) → `companyName` → `experience` → `educationRequired` → `pricePeriod` (Per Month/Day/Hour/Project).

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Accounting & Finance | `salaryRange` | shared set | port all 4 mobile fields to web (web = 0 fields today); `experienceRequired`→"Experience"; `companyName`→"Company / Employer Name" | shared |
| Administrative & Office | `salaryRange` | shared set | as above | shared |
| Construction & Trades | `salaryRange` | shared set + **`tradeSkill`** (Mason/Carpenter/Electrician/Plumber/Painter/Welder/Steel Fixer/Helper/Site Supervisor/Other) | `pricePeriod` defaults matter most here (daily wage); `companyName`→"Company / Contractor Name" | jobPostType → tradeSkill → shared |
| Healthcare & Medical | `salaryRange` | shared set | `companyName`→"Hospital / Clinic / Employer". No NMC-registration field (unverifiable) | shared |
| IT & Technology | `salaryRange` | shared set | `workLocationType` highest value here | shared |
| Other Jobs | `salaryRange` | shared set | — | shared |
| Retail & Sales | `salaryRange` | shared set | — | shared |
| Transportation & Logistics | `salaryRange` | shared set + **`licenseCategory`** multiselect (A Motorcycle / B Car-Jeep / C Truck / D Bus / K Scooter / Heavy Equipment / Not Required) | `pricePeriod` incl. Per Trip | jobPostType → licenseCategory → shared |

### 4.3 Overseas Jobs (8)

**Implement as ONE parent-level fallback + a country→currency lookup.** The eight rows differ *only* by `salaryCurrency` options. All eight render zero fields today.

Shared set: `companyName` ("Recruiting Agency / Employer") → `recruiterLicense` ("Recruitment Licence No. (DoFE)") → `contractDuration` (1/2/3/3+ years) → `genderRequirement` (Male/Female/Both — **not** `gender`, avoids the pets-key collision) → `experience` → `benefits` multiselect (Food / Accommodation / Transport / Medical Insurance / Overtime) → `salaryCurrency` → `serviceCharge` (Free Visa Free Ticket / As per Government Rule / Contact for Details).

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Bulgaria | — | shared set | `salaryCurrency` = NPR, EUR, USD | shared |
| Croatia | — | shared set | NPR, EUR, USD | shared |
| Malaysia | — | shared set | **MYR**, NPR, USD | shared |
| Qatar | — | shared set | **QAR**, NPR, USD | shared |
| Saudi Arabia | — | shared set | **SAR**, NPR, USD | shared |
| Serbia | — | shared set | NPR, EUR, USD | shared |
| Singapore | — | shared set | **SGD**, NPR, USD | shared |
| UAE | delete the empty `uaeJobs` config (`services.ts:176`) + 3 sibling dead configs | shared set | **AED**, NPR, USD | shared |

### 4.4 Education (5)

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Tuition | — | `pricePeriod` (Per Hour/Month/Subject/Course) | **`languages` is wrong** — it lists English/Hindi/Chinese/Japanese/Korean/Arabic and drops **Nepali**; → "Language of Instruction": Nepali/English/Hindi/Newari/Other +`optionsNe`; `modeOfTeaching`→"Class Mode"; `availability`→Morning/Day/Evening/Weekend/Flexible | subjects → gradeLevel → modeOfTeaching → languages → experience → availability → pricePeriod |
| Courses | `subjects` (school-subject list copied from Tuition), `gradeLevel` (school grades — a driving course has none) | `courseType` (IELTS-TOEFL-PTE / Language / Computer-IT / Accounting-Tally / Driving / Cooking / Beauty-Tailoring / Music-Dance-Art / Bridge-Entrance / Professional Cert / Other), `courseDuration`, `pricePeriod` | port `modeOfTeaching`, `experience`, `availability` to web (web = 0 fields today) | courseType → courseDuration → modeOfTeaching → availability → experience → pricePeriod |
| Textbooks | — | `bookLevel` (School 1-10 / +2 / Bachelor / Master / Entrance / Loksewa / Other) | `condition` **keep but optional**, binary only (anything else is collapsed to "Used" by `normalizeCondition`); `brand`→**rename key `publisher`**; port both to web | bookLevel → publisher → condition |
| Study Abroad | — | `destinationCountry` multiselect (Australia/USA/UK/Canada/Japan/Korea/Germany/NZ/Ireland/China/India/UAE/Poland/Other), `studyLevel`, `serviceType` (Counselling/Test Prep/Documentation/Visa/Scholarship) | — | destinationCountry → studyLevel → serviceType |
| Other Education | — | — | **(no change)** — deliberate catch-all, zero fields is correct | — |

### 4.5 Services (9)

`serviceType` is ONE shared key with per-subcategory option overrides — not eight bespoke names.

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Building maintenance | `serviceLocation` (always "at customer property") | `serviceType` (Plumbing/Electrical/Painting/Masonry-Tiling/Carpentry/Cleaning/Pest Control/Waterproofing/Welding-Grill/House Shifting/Other), `pricePeriod` (Per Hour/Visit/Day/Project/Free Inspection) | port `availability`, `experience` to web (web = 0 fields) | serviceType → availability → experience → pricePeriod |
| Domestic & Daycare Services | — | `serviceType` (House Maid/Cook/Nanny/Elderly Care/Daycare Centre/Housekeeping/Domestic Driver/Other), `serviceLocation` (At Customer Home / At Daycare Centre), `pricePeriod` | `availability` → Full Day/Half Day/**Live-in**/Weekdays/Weekends/On-Call (live-in vs live-out is the key attribute; a select avoids a boolean) | serviceType → serviceLocation → availability → experience → languages → pricePeriod |
| Fitness & Beauty Services | delete `physicalServiceLocation`, `massageLocation` and the 3 dead configs `Gym & Fitness`/`Beauty Services`/`Body Massage` on **both** platforms | `serviceType` (Gym-Trainer/Yoga/Zumba-Dance/Salon-Parlour/Bridal Makeup/Hair-Spa/Massage-Therapy/Nutrition/Other), `genderServed` (Male/Female/Unisex), `pricePeriod` | revive `serviceLocation` under the **correct DB key** with merged options (At Customer Location / At Gym-Studio / At Salon-Parlour), optional; revive `experience`, `availability` | serviceType → serviceLocation → genderServed → availability → experience → pricePeriod |
| IT Services | `languages` (near-zero value, renders as a tall checkbox block) | `serviceType` (Web Dev/Mobile App/Software/Graphic Design/Digital Marketing-SEO/Networking/Computer Repair/Data Entry/Hosting/Other), `pricePeriod` (Per Hour/Project/Month) | drop the redundant `serviceLocation` options override on both platforms — on mobile it nulls `optionsNe` and loses Nepali | serviceType → serviceLocation → availability → experience → pricePeriod |
| Matrimonials | — | `lookingFor` (Bride/Groom), `ageRange` (18-24…50+, **not** `age` — pets owns that key), `maritalStatus` (Never Married/Divorced/Widowed). **Deliberately no caste, religion, complexion or horoscope fields.** | **hide the core Price input**, send null (today every matrimonial ad carries a fake mandatory number) | lookingFor → ageRange → maritalStatus |
| Media & Event Management Services | — | `serviceType` (Photography/Videography/Wedding Planning/Decoration/Catering/Sound-DJ/Tent House/MC/Printing/Other), `pricePeriod` (Per Event/Day/Hour/Package) | port `experience`, `availability` to web (web = 0 fields); narrow availability to Weekdays/Weekends/Peak Season (Wedding)/Flexible | serviceType → availability → experience → pricePeriod |
| Professional Services | — | `serviceType` (Legal/Accounting-Tax/Audit/Architecture/Engineering/Translation/Business Consulting/Insurance/Photography/Other), `pricePeriod` incl. **Free Consultation** | keep `languages` here (translation, legal drafting turn on it) | serviceType → serviceLocation → availability → experience → languages → pricePeriod |
| Servicing & Repair | — | `serviceType` (Mobile-Laptop/TV-Electronics/AC-Fridge/Washing Machine/Plumbing/Electrical/Furniture/Vehicle/Watch/Other), `pricePeriod` (Per Hour/Visit/Job/Free Inspection) | keep `serviceLocation`, `availability`, `experience` as-is | serviceType → serviceLocation → availability → experience → pricePeriod |
| Tours & Travels | — | `serviceType` (Trekking/Tour Package/Air Ticketing/Hotel Booking/Vehicle Hire/Visa-Documentation/Pilgrimage/Adventure/Other), `tripDuration`, `pricePeriod` (**Per Person / Per Package / Per Vehicle / Per Day** — a "Rs 45,000" trek is per person, a jeep hire is per vehicle) | — | serviceType → tripDuration → pricePeriod |

### 4.6 Vehicles (13)

`year`/`registrationYear` max → `currentYear + 1` everywhere (B-07). `condition` → 3 options (Brand New / Reconditioned / Used) on all motorized — **and B-08 must be fixed first or the value is destroyed on save**. `mileage` label → "Kilometers Driven" everywhere.

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Cars | `parkingSensors`, `backupCamera` (dead booleans that would render "false") | `plateType` (Private/Public-Commercial/Government/Corporation/Tourist) | `fuelType` drop LPG; `registrationLocation` text→**select of 7 provinces**, label "Registration Zone" | condition → brand → model → year → bodyType → seats → fuelType → transmission → engineCapacity → mileage → owners → registrationYear → registrationLocation → plateType → color |
| Motorbikes | — | `vehicleType` (Scooter/Commuter/Sports/Cruiser/Off-road/Moped/Electric — **there is no Scooters subcategory**), `plateType`, `registrationLocation` (mobile gap) | **`fuelType` → ['Petrol','Electric']** on both (mobile forces Petrol-only, excluding NIU/Yatri/Yadea; web offers CNG/LPG/Hybrid bikes that don't exist); adopt mobile's cc placeholder on web | condition → vehicleType → brand → model → year → engineCapacity → fuelType → mileage → owners → registrationYear → registrationLocation → plateType → color |
| Bicycles | `color` | `frameSize` (revive the dead field, as select: Kids/XS 13-14"/S 15-16"/M 17-18"/L 19-20"/XL 21"+), `gears` | `bicycleType` +Gravel-Touring, BMX, Folding; `condition` stays 2-option | condition → bicycleType → brand → frameSize → gears |
| Three Wheelers | `color`, `engineCapacity` (meaningless for e-rickshaw/Safa tempo) | `vehicleType` (Auto Rickshaw/E-Rickshaw/Safa Tempo/Passenger Tempo/Loader-Cargo), `plateType`, `mileage`, `owners`, `registrationYear` (web gaps) | `fuelType` → Electric **first** | condition → vehicleType → brand → model → year → fuelType → mileage → owners → registrationYear → plateType |
| Trucks | `color`, `transmission` (~100% manual), `engineCapacity` (priced by tonnage), `fuelType` (mobile forces Diesel-only; web offers petrol trucks) | `vehicleType` (Mini Truck-Pickup/Tipper/Tanker/Container/Flatbed/Trailer/Mixer/Crane/Other), **`payloadCapacity`** ("Load Capacity (tons)"), `plateType`, `registrationLocation` (mobile gap) | `registrationLocation` → province select | condition → vehicleType → brand → model → year → payloadCapacity → mileage → owners → registrationYear → registrationLocation → plateType |
| Buses | `color`, `transmission`, `engineCapacity`, `seats` (caps at "8+") | `vehicleType` (Micro/Mini/Deluxe-Tourist/Local/School/Sleeper), **`passengerCapacity`** number, **`routePermit`** text (a bus *with* a permit is worth multiples), `plateType`, `registrationLocation` | `fuelType` → Diesel/Electric/CNG on both | condition → vehicleType → brand → model → year → passengerCapacity → fuelType → mileage → owners → registrationYear → registrationLocation → plateType → routePermit |
| Vans | `color`, `engineCapacity` | `vehicleType` (Passenger/Cargo-Delivery/School/Micro-Hiace/Ambulance), `plateType`, `seats` (mobile gap), `registrationLocation` (mobile gap) | `seats` → 2/4/5/7/9/11/14+ (car-shaped list caps too low); `fuelType` → Diesel/Petrol/Electric/CNG | condition → vehicleType → brand → model → year → seats → fuelType → transmission → mileage → owners → registrationYear → registrationLocation → plateType |
| Heavy Duty | `bodyType` (its options are literally other subcategory names), `color`, `fuelType`, `mileage` | `vehicleType` (Excavator/Backhoe/Wheel Loader/Bulldozer/Crane/Roller/Grader/Tractor/Forklift/Mixer/Drilling Rig/Other), **`operatingHours`**, `owners` + `registrationYear` (web gaps) | `brand` placeholder → JCB, Komatsu, Hyundai, CAT, Tata Hitachi | condition → vehicleType → brand → model → year → operatingHours → owners → registrationYear |
| Water Transport | `color` | `boatType` (Wooden/Fiber/Motor/Pedal/Raft/Kayak/Ferry/Other), `passengerCapacity` | `condition` stays **2-option** here (no reconditioned-boat market); `brand` placeholder "e.g. Yamaha (engine), locally built" | condition → boatType → passengerCapacity → brand → model → year |
| Auto Parts & Accessories | — | `partType` (Engine-Transmission/Brakes-Suspension/Tyres-Wheels/Battery/Lights-Electricals/Body/Interior/Mirrors-Glass/Audio/Filters-Fluids/Helmets/Car Care/Other), **`compatibleVehicle`** text ("the only question every parts buyer asks"), `warranty` | `condition` 2-option, stays required | condition → partType → brand → compatibleVehicle → warranty |
| Rentals | `condition`, `year`, `color` (web-only), `fuelType` (mobile-only), `bodyType` (mislabelled) | `vehicleType`, **`rentalPeriod`** (Per Hour/Day/Week/Month/Trip — the price is unreadable without it), **`withDriver`** (With Driver/Self-Drive/Both), `seats` | keep `transmission` (self-drive) | vehicleType → rentalPeriod → withDriver → seats → transmission → brand → model |
| Auto Services | `brand`, `model`, `year`, `color` — **all four describe a vehicle the workshop doesn't own** | `serviceType` (Servicing-Oil/Denting-Painting/Mechanical/Electrical/AC/Tyre-Alignment/Battery/Car Wash/Insurance/Bluebook/Towing/Other), `vehicleTypesServiced` multiselect, `serviceOptions` multiselect (Pickup-Drop/On-site/24hr/Warranty/Genuine Parts) | multiselect, **not** checkboxes (booleans leak "false") | serviceType → vehicleTypesServiced → serviceOptions |
| Maintenance and Repair | — (0 fields today) | identical set to Auto Services | **merge candidate** — see Q7 | serviceType → vehicleTypesServiced → serviceOptions |

### 4.7 Electronics (13) + Mobiles (5)

Cluster rule: order becomes `condition → type classifier → brand → model → specs → warranty last` (warranty currently sits at index 3, splitting identity from specs). `condition` gains "Like New" everywhere and "For Parts / Not Working" on phones, laptops, desktops, tablets, TVs, cameras, consoles. Every new yes/no field is a **select**, never a checkbox.

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Mobiles > Mobile Phones | — | `boxAndBill` (Both/Box Only/Bill Only/Neither — "box bill cha?") | `ram` trim to 2-16GB (32/64GB don't exist on phones); `brand` text→**select**; condition 4-option | condition → brand → model → storage → ram → batteryHealth → boxAndBill → warranty |
| Mobiles > Mobile Phone Accessories | — | `accessoryType` (Case/Screen Protector/Charger-Cable/Power Bank/Earphones/Speaker/Selfie Stick/Memory Card/Mount/Other) | condition 3-option | condition → accessoryType → brand → warranty |
| Mobiles > Mobile Phone Services | `condition`, `brand`, `model`, `warranty` (all template fall-through; a repair shop is not a brand) | `serviceType` (Screen/Battery/Software-Flashing/Water Damage/Unlocking-IMEI/Data Recovery/Buy-Back/Other), `serviceLocation` + `experience` (reuse existing services fields) | — | serviceType → serviceLocation → experience |
| Mobiles > SIM Cards | `condition`, `brand`, `model`, `warranty` (web asks a SIM seller for warranty today) | `networkOperator` (NTC/Ncell/Smart Cell/Hello Nepal/Other), `numberType` (Normal / **VIP - Golden Number**), `simType` (Prepaid/Postpaid/Data Only) | mobile currently shows **nothing** here | networkOperator → numberType → simType |
| Mobiles > Wearables | — | **`wearableType`** (Smartwatch/Fitness Band/Smart Ring/Kids GPS Watch/Earbuds-Wearable/Other), `compatibility` (Android/iOS/Both) | condition 3-option; warranty last | condition → wearableType → brand → model → compatibility → warranty |
| Tablets & Accessories | `ram` (not a Nepali purchase driver, absurd for cases/styluses) | `connectivity` (WiFi only / WiFi + Cellular) | condition 4-option | condition → brand → model → storage → connectivity → batteryHealth → warranty |
| Laptops | `screenResolution` (sellers don't know it; the shared list has "Retina") | `screenSize` select 11.6"–17.3" | `ram` trim to 4-64GB; `storage` +"SSD + HDD (Dual)"; `brand` text→select; drop dead `required` on `processor` | condition → brand → model → processor → ram → storage → graphics → screenSize → batteryHealth → warranty |
| Desktop Computers | `screenResolution` (a tower has no screen) | `monitorIncluded` (Yes - Full Setup / No - CPU Only) | `ram` trim; `storage` +Dual | condition → brand → model → processor → ram → storage → graphics → monitorIncluded → warranty |
| TVs | — | — | `screenSize` text→**select** 24"–85"+ (free text gives 55inch/55 Inches/55"); `screenResolution`→HD Ready/Full HD/4K UHD/8K (currently shows a laptop panel spec + "Retina"); `smartFeatures` drop "4K", add Tizen + Built-in WiFi; `brand`→select **incl. CG, Yasuda, Himstar, Colors, Hisense** | condition → brand → model → screenSize → screenResolution → smartFeatures → warranty |
| TV & Video Accessories | — | `accessoryType` (Set-Top Box/Streaming/Soundbar/Wall Mount/Remote/Projector/DVD/Cables/Other) | brand placeholder → Dish Home, WorldLink, Xiaomi, JBL | condition → accessoryType → brand → model → warranty |
| Cameras, Camcorders & Accessories | `screenSize` — **live bug: sensor size is stored under the screen-size key** | `sensorSize` (the field already exists, unused; as select: Full Frame/APS-C/M4/3/1"/Medium Format/Action-Compact/N-A), `cameraType` (DSLR/Mirrorless/Point-Shoot/Action/Camcorder/Drone/Lens/Tripod-Gimbal/Lighting/Other) | `megapixels` placeholder "leave blank for lenses & accessories" | condition → cameraType → brand → model → sensorSize → megapixels → warranty |
| Laptop & Computer Accessories | — | `accessoryType` (Monitor/Keyboard-Mouse/Printer-Scanner/Storage/RAM-Components/GPU/Router/UPS/Laptop Bag/Cooling Pad/Webcam/Other) | **rekey the web config from `'Computer Accessories'`** — it currently falls through and shows an iPhone placeholder; keep `model` on both | condition → accessoryType → brand → model → warranty |
| Audio & Sound Systems | — | `audioType` (Headphones/Earbuds TWS/BT Speaker/Home Theatre/Soundbar/Amplifier/DJ-PA/Microphone/Studio Monitor/Other) | **rekey the web config from `'Audio Equipment'`** — an audio seller is currently prompted "e.g. iPhone 15 Pro" | condition → audioType → brand → model → warranty |
| Video Game Consoles & Accessories | — | `gamingItemType` (Console/Game/Controller/VR Headset/Accessory/Other) | `storage` → 256GB/500GB/512GB/825GB/1TB/2TB (phone list is wrong); warranty last | condition → gamingItemType → brand → model → storage → warranty |
| ACs & Home Electronics | — | `applianceType` (Split/Window/Portable/Cassette-Ducted AC, Air Cooler, Purifier, Geyser, Heater, Fan, Other), `capacity` ("Capacity (Ton)": 0.75/1/1.5/2/2.5/3+/N-A) | `brand`→select incl. **CG, Yasuda, Himstar, Gree, Midea, Hisense** (current list is Voltas/Daikin — marginal in Nepal) | condition → applianceType → brand → model → capacity → warranty |
| Home Appliances | — | `applianceType` (Fridge/Washing Machine/Microwave/Rice Cooker/Induction/Gas Stove/Purifier/Geyser/Blender/Vacuum/Iron/Fan/Heater/Other), `model`, `warranty` (the only Electronics subcategory missing both) | **fork the shared config object first** — it is re-exported into both electronics and general trees (B-28); brand +CG, Baltra, Yasuda, Himstar | condition → applianceType → brand → model → warranty |
| Photocopiers | — | `machineType` (Inkjet Printer/Laser Printer/All-in-One/Photocopier/Scanner/Plotter/Other — **new key**, not `machineryType`) | brand +Epson, Brother; **rename the subcategory to "Printers & Photocopiers"** (see Q6) | condition → machineType → brand → model → warranty |
| Other Electronics | — | — | condition 4-option; warranty last. **Deliberately no classifier** — a catch-all filling up is a signal to add a subcategory, not a field | condition → brand → model → warranty |

### 4.8 Men's Fashion & Grooming (11) + Women's Fashion & Beauty (10)

Web asks **no brand** on ~12 fashion subcategories (its configs are keyed to non-DB names and the template has no brand field). Mobile does. Port brand to web across the board. The four dual-parent names share one config — gendered options are impossible without a DB split.

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| M > Shirts & T-Shirts | `color` from its slot between size and clothingType | `brand` (web gap) | `clothingType` → Shirt/T-Shirt/Polo/Tank Top +`optionsNe` (web shows Saree/Kurta today) | condition → brand → clothingType → size → fitType → sleeveType → color |
| M > Pants | — | `brand` | `size` letter→**waist inches** 28-44 + Free Size; `clothingType` → Jeans/Chinos/Formal/Track/Shorts; drop the phantom 'Jeans' entry from `CLOTHING_WITH_JEANS` | condition → brand → clothingType → size → fitType → color |
| M > Jacket & Coat | `sleeveType` (jackets are full-sleeve) | `brand` | `clothingType` → Jacket/Coat/Blazer/Hoodie/Windbreaker | condition → brand → clothingType → size → fitType → color |
| M > Traditional Clothing | `fitType`, `sleeveType` (meaningless for daura suruwal) | **`fabric`** (Cotton/Silk/Dhaka/Wool-Pashmina/Linen/Synthetic/Mixed), `brand` | `clothingType` → Daura Suruwal/Dhaka Topi/Topi/Dhoti/Kurta/Sherwani/Other +`optionsNe` | condition → brand → clothingType → size → fabric → color |
| M > Footwear | — | `brand` | `shoeSize` → "Shoe Size (EU)" min 30 max 50 on **both** (web 32-45 vs mobile 32-50); shared list +Wedges, Pumps; delete the orphan `womensFootwear` override | condition → brand → footwearType → shoeSize → color |
| M > Watches | — | `brand` | `watchType` +Automatic/Mechanical; `strapMaterial` +Silicone | condition → brand → watchType → strapMaterial → color |
| M > Bags & Accessories *(shared with W)* | — | `accessoryType` (Backpack/Handbag/Sling/Wallet/Belt/Luggage/Laptop Bag/Cap/Scarf/Other), `material` (Leather/PU/Canvas/Nylon/Fabric/Other), `brand` | one config keyed `'Bags & Accessories'`; delete orphans `'Bags & Luggage'` + `"Men's Accessories"` | condition → brand → accessoryType → material → color |
| M > Optical & Sunglasses *(shared with W)* | — | `eyewearType` (Sunglasses/Frames/Prescription/Reading/Contact Lenses/Other), `brand` | — | condition → brand → eyewearType → color |
| M > Grooming & Bodycare | confirm `condition` stays absent (hygiene) | `productWeight` ("Weight / Volume"), `expiryDate` | **stop writing the hardcoded `condition:'Brand New'`** | brand → productWeight → expiryDate |
| M > Wholesale - Bulk | — | `minOrderQuantity`, `quantity` | Price reads as a total — state "per piece" in the helper | condition → brand → minOrderQuantity → quantity |
| M > Baby Boy's Fashion | — | **`ageGroup`** (0-3m/3-6m/6-12m/1-2y/2-4y/4-6y/6-10y), `condition` optional | do **not** add XS-XXXL sizing; ageGroup replaces it | condition → brand → ageGroup → color |
| W > Baby Girl's Fashion | — | `ageGroup`, `condition` optional | keep symmetric with Baby Boy's | condition → brand → ageGroup → color |
| W > Western Wear | `sleeveType` | `brand` | `clothingType` → Dress/Top/Jeans/Skirt/Leggings/Jacket/Coat; delete orphan `womensClothing` | condition → brand → clothingType → size → fitType → color |
| W > Traditional Wear | `fitType`, `sleeveType` | **`fabric`** (Cotton/Silk/Georgette/Chiffon/Banarasi/Dhaka/Wool-Pashmina/Synthetic/Mixed — for a saree, fabric *is* the price), `brand` | `clothingType` → Saree/Kurta/Kurtha Suruwal/Lehenga/Gunyo Cholo/Sherwani/Dhoti/Topi/Other | condition → brand → clothingType → size → fabric → color |
| W > Winter Wear | `sleeveType`, `fitType` | `clothingType` (Jacket/Coat/Sweater/Hoodie/Shawl-Pashmina/Thermal/Gloves/Cap/Muffler/Other — mobile asks **nothing** about what the item is), `brand` | — | condition → brand → clothingType → size → color |
| W > Footwear *(shared with M)* | — | `brand` | same shoeSize unification | condition → brand → footwearType → shoeSize → color |
| W > Jewellery & Watches | — | **`jewelleryMaterial`** (Gold/Silver/Platinum/Diamond/Gemstone/Pearl/Imitation/Other — metal is the entire basis of price), `brand` | revert the `color`→"Metal/Color" override (the detail page ignores it anyway); delete orphans `'Jewelry'`, `"Women's Watches"`. **Split candidate** — see Q7 | condition → brand → jewelleryMaterial → watchType → strapMaterial → color |
| W > Beauty & Personal Care | `manufacturingDate` (two date pickers is friction), confirm `condition` absent | — | stop writing hardcoded condition | brand → productWeight → expiryDate |
| W > Lingerie & Sleepwear | confirm `condition` absent (hygiene + moderation) | **`size`**, `brand` — this subcategory currently asks **only for colour** | stop writing hardcoded condition | brand → size → color |
| W > Bags & Accessories *(shared with M)* | — | as M | one shared config | condition → brand → accessoryType → material → color |
| W > Optical & Sunglasses *(shared with M)* | — | as M | one shared config | condition → brand → eyewearType → color |
| W > Wholesale - Bulk *(shared with M)* | — | `minOrderQuantity`, `quantity` | condition optional (garment stocklot is a real segment) | condition → brand → minOrderQuantity → quantity |

### 4.9 Hobbies, Sports & Kids (6)

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Sports | — | — | `sportType` text→**select** (Cricket/Football/Futsal/Badminton/Basketball/Volleyball/Table Tennis/Cycling/Swimming/Trekking/Martial Arts/Other) | condition → brand → sportType |
| Fitness & Gym | `sportType` **as a key** (stores treadmills under "Sport Type") | **`equipmentType`** select (Treadmill/Exercise Bike/Elliptical/Dumbbells/Home Gym/Bench/Yoga-Mats/Supplements/Other) | brand placeholder → Decathlon, Kobo, Domyos | condition → brand → equipmentType |
| Musical Instruments | — | — | `instrumentType` text→select **incl. Madal, Tabla, Sarangi, Harmonium, Bansuri** | condition → brand → instrumentType |
| Children's Items | — | `itemType` (Toys/Stroller/Car Seat/Carrier/Crib/High Chair/Walker/School Bag/Ride-on/Books/Other), `ageGroup` (same list as baby fashion) | brand placeholder → Chicco, Fisher-Price, Mothercare. Overlaps Essentials > Baby Products | condition → brand → itemType → ageGroup |
| Music, Books & Movies | — | `mediaType` (Book/Textbook/Magazine/Comics/Music CD-Vinyl/Movie DVD/Other), `language` (Nepali/English/Hindi/Other) | `brand` → **rename key `authorPublisher`** (renders as "Brand" today). Overlaps Education > Textbooks | condition → mediaType → authorPublisher → language |
| Other Hobby, Sport & Kids items | — | — | **(no field change)** — catch-all. Note the DB name contains a comma; both keys already match — do not "clean it up" | condition → brand |

### 4.10 Home & Living (9)

Cluster-wide: drop `style` (7 synonyms, zero filter value) and `assemblyRequired` (flat-pack is rare in Nepal) from furniture; `material` gets a Nepal-relevant list (Wood Sal/Teak/Sisau, Plywood, MDF, Metal, Plastic, Glass, Cane/Bamboo, Rexine, Mixed); `dimensions` placeholder switches to feet.

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Bedroom Furniture | `style`, `assemblyRequired`, `storageAvailable`, `color` | — | `furnitureType` +Dressing Table/Bunk Bed/Mattress only/Bed+Mattress Set/Other; material list; dimensions in feet; brand last | condition → furnitureType → material → dimensions → brand |
| Living Room Furniture | `style`, `assemblyRequired`, `color` | — | `furnitureType` +Sofa Set/Center Table/Shoe Rack/Cabinet/Divan; `seatingCapacity`→"Seater" 1/2/3/5/7+; material +Rexine | condition → furnitureType → seatingCapacity → material → dimensions → brand |
| Kitchen & Dining Furniture | `assemblyRequired`, `color` | — | `furnitureType` +Dining Set/Kitchen Cabinet/Crockery Unit/Rack; `seatingCapacity`→2/4/6/8+ Seater | condition → furnitureType → seatingCapacity → material → dimensions → brand |
| Office & Shop Furniture | `assemblyRequired`, `color` | `quantity` (bought in lots) | `furnitureType` is office-only despite "& Shop" — +Display Rack/Shop Counter/Cash Counter/Workstation/Safe-Locker | condition → furnitureType → material → dimensions → quantity → brand |
| Children's Furniture | `assemblyRequired`, `color` | — | `furnitureType` +Bunk Bed/Study Chair/Play Pen | condition → furnitureType → material → dimensions → brand |
| Home Textiles & Decoration | `style` | `productType` (Bedsheet/Curtain/Blanket/Cushion/Carpet-Rug/Doormat/Towel/Table Cover/Wall Decor/Artificial Plants/Other) | `material` → Cotton/Silk/Wool/Polyester/Jute/Velvet/Synthetic/Mixed (shows Wood/Metal/Glass today); keep `color` | condition → productType → material → color → brand |
| Bathroom Products | — | `productType` (Sanitary Ware/Taps-Fittings/Shower/Geyser/Cabinet-Mirror/Bathtub/Accessories/Other), `material` (web gap) | **add a web config** — web has none and shows only Condition+Brand; `material` → Ceramic/Steel/Brass/PVC/Glass/Marble/Other | condition → productType → material → brand |
| Household Items | — | `productType` (Cookware/Crockery/Storage/Water Tank/Cleaning Tools/Lighting/Plastic Ware/Other) | `material` → Steel/Aluminium/Plastic/Glass/Ceramic/Copper-Brass/Non-stick/Wood/Mixed. **Scope to DURABLES** vs Essentials > Household = consumables | condition → productType → material → brand |
| Doors | — | `productType` ("Door Type": Main/Room/Bathroom/Sliding/Flush/Panel-Carved/Safety-Grill/Window/Frame Chaukath/Other), `quantity` | `material` → Wood/Plywood-Flush/MDF/Steel/Aluminium/uPVC/Glass/Fiber; `dimensions`→"Size (H × W)" e.g. **7ft × 3ft** | condition → productType → material → dimensions → quantity → brand |

### 4.11 Business & Industry (7)

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Industry Machinery & Tools | — | `year`, `warranty` | `machineryType` currently offers "Office Equipment" and "Medical Equipment" — *its own sibling subcategories*. Replace: Construction/Manufacturing/Food Processing/Woodworking/Metalworking-Welding/Printing/Generator/Power Tools/Water Pump/Other. `powerSource` +Electric (3 Phase), Solar | condition → machineryType → powerSource → year → warranty → brand |
| Medical Equipment & Supplies | — | `warranty` | `machineryType`→"Equipment Type" +Mobility-Rehab/Hospital Furniture/Dental/Oxygen-Respiratory/Consumables. **Fix the wrong Nepali options (B-09)** | condition → machineryType → warranty → brand |
| Office Supplies & Stationary | — | `productType` (Paper-Notebooks/Pens/Files/Printer Consumables/Office Machines/Whiteboard/Desk/School Supplies/Other), `quantity` | **rekey the web config from `'Office Equipment'`** | condition → productType → quantity → brand |
| Other Business & Industry Items | — | — | add an explicit web config so it can't drift; brand placeholder generic (web shows "IKEA, Nike, Canon") | condition → brand |
| Raw Materials & Industrial Supplies | `condition` (cement and rebar are not "Brand New") | `productType` ("Material Type": Metal-Steel/Cement-Aggregates/Timber/Plastic/Chemicals/Textile-Yarn/Paper/Rubber/Glass/Electrical/Other), `priceUnit` | **rekey from `'Raw Materials'`**; add `quantity` to web; **keep brand** — Shivam/Hetauda/Panchakanya are real buying decisions | productType → brand → priceUnit → quantity |
| Safety & Security | — | `productType` (CCTV/Alarms/Fire Safety/Safety Gear/Locks-Safes/Access Control/Security Doors/Other), `warranty` | add an explicit web config | condition → productType → warranty → brand |
| Licences, Titles & Tenders | — | `productType` ("Listing Type": Business Licence/Permit-Quota/Tender Notice/Company Registration/Franchise/Trademark/Other), `expiryDate` ("Valid Until") | 0 fields on both platforms today | productType → expiryDate |

### 4.12 Essentials (7)

One new shared `priceUnit` select fixes "Quantity Available: 500" of what.

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Grocery | — | `priceUnit` (per Kg/Gram/Litre/Piece/Packet/Dozen/Sack Bora/Carton) | `productType` → Rice-Flour/Pulses/Oil-Ghee/Spices/Dairy/Snacks/Beverage/Instant/Other; **stop writing hardcoded condition** (grocery ads carry a "Brand New" badge today) | productType → brand → priceUnit → quantity → expiryDate |
| Healthcare | — | `productWeight` ("Pack Size" — the field exists in both codebases, wired to nothing) | `productType` +Mobility Aids/Ayurvedic-Herbal; **fix wrong Nepali options (B-09)**; prescription resale is a moderation rule, not a field | productType → brand → productWeight → quantity → expiryDate |
| Baby Products | — | `condition` **optional** (prams/cots are heavily resold; unstatable today), `ageGroup`, `expiryDate` | `productType` +Stroller-Carrier/Cot-Crib/Bath/Toys. Overlaps Fashion baby + Children's Furniture | productType → ageGroup → condition → brand → quantity → expiryDate |
| Household | `condition` (consumables; it is the one mandatory field today) | `productWeight` ("Pack Size") | `productType` → Cleaning/Laundry-Detergent/Toiletries/Pest Control/Storage/Kitchen Consumables/Other; **fix wrong Nepali options (B-09)**; **scope to CONSUMABLES** | productType → brand → productWeight → quantity |
| Fruits & Vegetables | — | `priceUnit` (per Kg/Gram/Dozen/Piece/Crate/Sack Bora/Muri), `organic` (Organic/Conventional — a real 1.5-2× premium) | render `quantity` adjacent to `priceUnit` | priceUnit → quantity → organic |
| Meat & Seafood | `expiryDate` (fresh meat has no printed expiry) | `productType` ("Meat Type": Chicken/Mutton-Khasi/Buff/Pork/Fish/Prawn-Seafood/Eggs/Frozen-Processed/Other — load-bearing for dietary and religious reasons), `priceUnit` | — | productType → priceUnit → quantity |
| Other Essentials | — | `priceUnit` | stop writing hardcoded condition | priceUnit → quantity |

### 4.13 Agriculture (3)

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Crops, Seeds & Plants | — | `productType` ("Item Type": Seeds/Saplings/Harvested Grain/Bulk Vegetables/Fruit Trees/Flowers/Mushroom-Spawn/Other), `priceUnit` (per Kg/**Quintal/Muri/Pathi**/Packet/Sapling/Sack Bora) | `cropType` → "Crop / Plant Name", keep free text, drop dead `required` | productType → cropType → priceUnit → quantity |
| Farming Tools & Machinery | — | `year` | `farmingToolType` misses the highest-volume real listings — +Power Tiller/Water Pump/Thresher/Chaff Cutter/Grass Cutter/Milking Machine/Rotavator/Pipes-Irrigation/Other; `powerSource` +Solar, Electric (3 Phase) | condition → farmingToolType → powerSource → year → brand |
| Other Agriculture | — | `productType` (Fertilizer-Pesticide/Animal Feed/Veterinary/Irrigation/Greenhouse-Nets/Farm Produce/Beekeeping/Other), `priceUnit`, `quantity` | 0 fields on both today. Both codebases carry complete, unreachable configs for `'Fertilizers & Pesticides'` and `'Livestock Feed'` — real Nepal demand with no DB subcategory (see Q6) | productType → priceUnit → quantity |

### 4.14 Pets & Animals (5)

All five work only by web template fall-through; the six web configs are orphans. Rekey to the 5 real names.

| Subcategory | Remove | Add | Fix | Order |
|---|---|---|---|---|
| Pets | `weight` (nobody buys a puppy by the kilo) | — | `animalType` — web offers Cow/Buffalo/Goat/Chicken/Duck here; narrow to Dog/Cat/Bird/Fish/Rabbit/Hamster/Guinea Pig/Turtle/Other +`optionsNe`; `papers`→"Pedigree / Papers"; `friendlyWith`→Children/Other Pets/Strangers; `color`→"Color / Coat". **Stop writing hardcoded condition — live-animal ads carry a "Brand New" badge today** | animalType → breed → age → gender → color → vaccination → papers → trained → friendlyWith |
| Farm Animals | `color` (web-only) | `priceUnit` (Per Animal / **Per Kg live weight**), **`milkYield`** ("Milk Yield litres/day" — the decisive spec on any cow or buffalo) | `animalType` → farm list (Cow/Buffalo/Goat/Sheep/Pig/Yak-Chauri/Horse/Chicken/Duck/Turkey/Pigeon/Rabbit/Other) +`optionsNe`; `weight`→"Weight (kg)" | animalType → breed → age → gender → weight → priceUnit → milkYield → vaccination |
| Other Pets & Animals | — | `color` (web gap) | `breed`→"Breed / Species"; add an explicit web config | animalType → breed → age → gender → color |
| Pet & Animal food | `condition` (**B-17: required on mobile — dog food must be declared "Brand New"**) | `brand` (web gap), `productWeight` ("Pack Size"), `expiryDate` | `suitableFor` covers only pets on a subcategory named "Pet & **Animal** food" — +Rabbits, Cattle, Goats, Poultry | suitableFor → brand → productWeight → expiryDate |
| Pet & Animal Accessories | — | `condition` **optional** (web gap; mobile forces it required), `brand` (web gap) | `productType` drop "Food", +Cage-Kennel/Aquarium/Leash/Bedding/Bowls/Grooming/Toys/Pet Clothing/Veterinary/Livestock Equipment/Other; `suitableFor` expanded as above | productType → suitableFor → condition → brand |

---

## 5. Presentation fixes

### 5.1 Spec-row alignment (owner's B1)

**Mobile** — replace the `ListView.separated` at `ad_specifications.dart:101-158` with a single `Table`. `Table` measures all rows together, so the value column starts at one x for every row; nothing else in Flutter guarantees that.

```dart
Table(
  columnWidths: const {0: FlexColumnWidth(38), 1: FlexColumnWidth(62)},
  defaultVerticalAlignment: TableCellVerticalAlignment.top,
  children: [ /* one TableRow per spec, bottom-border decoration as the separator */ ],
)
```
Delete `mainAxisAlignment: spaceBetween`, the `SizedBox(width:16)`, the `Flexible`, and **both** `textAlign: TextAlign.end` (lines 134, 147). On a 360dp phone this gives a 112dp label track — every current English and Nepali label fits, and long values wrap left-aligned inside the 62% cell. Optional guard: stack label-over-value when `textScaler.scale(14) >= 21` or width < 330.

**Web** — `SpecificationsSection.tsx:103-124` is a stacked label-over-value card grid; it has never had a right-aligned value, so the two platforms simply look nothing alike. Replace with a definition list using the **same 38% label track**:

```tsx
<dl className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
  <div className="grid grid-cols-[minmax(7rem,38%)_1fr] gap-x-4 py-2.5 border-b border-gray-100">
    <dt className="text-sm text-gray-600 break-words">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 min-w-0 break-words">{value}</dd>
```
Load-bearing: the fixed first track (`minmax(7rem,38%)`) and `min-w-0` on `<dd>` (without it a pasted maps URL blows out the column). **Delete the `capitalize` class** on the label — once real labels land it turns "Mode of Teaching" into "Mode Of Teaching". The gray cards disappear; that is intentional.

### 5.2 Label map — whitelist, don't prettify (owner's B4)

Extend `FieldTranslation` in `fieldLookup.ts:21` to `{label, labelNe, optionMap}` and return `label` for English. Then **drop any spec key that is not in the field config.**

Justification: `custom_fields` is stored verbatim and unvalidated (`ads.routes.ts:55-79`), so an unknown key is by construction a client bug, a stale attribute from a switched category, a legacy key, or arbitrary client text. None of those should be shown to buyers — prettifying makes the leak look intentional. The whitelist also retires the blocklist automatically (`isNegotiable`, `isCodAvailable`, `whatsapp_number` aren't in the configs); only `condition` and `amenities` stay excluded, because they render elsewhere.

Coverage is already effectively total: `fields/*.ts` defines 95 field names; the templates use those plus exactly two missing ones (`physicalServiceLocation`, `massageLocation`, both being deleted anyway).

**Mobile must not hand-maintain a second map.** `_keyMapNe` (83 entries) already lags — `landType`, `salaryRange`, `serviceLocation`, `bodyType`, `frameSize`, `manufacturingDate`, `gender`, `breed`, `age`, `weight` are all missing. Add `scripts/gen-spec-labels.mjs` emitting `spec_labels.g.dart` (label pairs + **per-field** option maps) from the same TS source, with `--check` in CI. Per-field option maps also fix a real bug: `_valueMapNe` is keyed by the value string alone, so two fields sharing a literal translate identically whether or not that's right.

Three `fieldLookup` first-wins collisions become visible and need an explicit call: `year` (common beats vehicles → a car's manufacture year shows as "वर्ष"), `color` (common beats pets), `productType` (pets beats general → **Grocery values map through the pet option map**). Cheapest fix: reverse the module order so domain modules win.

### 5.3 Value rendering (owner's B4, second half)

Identical rules both platforms:

| Input | Render |
|---|---|
| null / undefined / `''` / `[]` | **omit the row** |
| `false` or `"false"` | **omit the row** |
| `true` or `"true"` | localized "Yes" / "छ" |
| array or legacy comma string | option-map each element, join `", "` |
| number in `RAW_NUMBER_KEYS` (year, registrationYear, floorNumber, totalFloors, shoeSize, megapixels, bedrooms, bathrooms, seatingCapacity) | as-is, **no separators** — years must not become `2,020` |
| number with a unit rule | `Rs 25,000` (monthlyRent, securityDeposit), `12 ft` (roadWidth), `45,000 km` (mileage), `150 cc` (engineCapacity) |
| date field | `d MMM yyyy` |
| else | option-map lookup, else trimmed string |

`false → omit` rather than `→ "No"`: these are opt-in feature flags, and it matches how COD/negotiable badges already work. Note today mobile renders arrays as `"[Gym, Garden]"` **with literal brackets** and an empty array as a literal `"[]"` row.

`parkingSensors` and `backupCamera` are the remaining boolean leaks (`fields/vehicles.ts:122,131`) — they are being deleted, but the typed formatter is what stops the *next* one.

### 5.4 Post-ad ordering (owner's B3)

Order is declaration order on both platforms, from **two independently authored sources**. Fix: one canonical order per parent in the web config (see §4.1 for Property), mirrored into Dart, plus a CI parity test that dumps `{subcategory: [fieldName...]}` from both resolvers and diffs them across all 130 rows. That comparison runs in under a second.

**Ad-detail order must stop trusting JSON order** (B-20): sort display entries by the field's index in the resolved template for the ad's subcategory, unknown keys last (they're dropped anyway). Delete web's non-transitive area-first comparator. Both platforms have the subcategory name in hand. One change, both platforms agree by construction.

**Pre-flight**: five mobile keys carry internal commas (`'Cameras, Camcorders & Accessories'`, `'Music, Books & Movies'`, `'Other Hobby, Sport & Kids items'`, `'Licences, Titles & Tenders'`, `'Crops, Seeds & Plants'`). Verified present in the DB — **do not "clean up" the commas**; both resolvers are exact-match.

### 5.5 Desktop grid + mobile block parity

Web already renders a 2-column grid (`DynamicFormFields.tsx:223`). The problems are structural:

1. Row-major fill with no pairing metadata — one leading odd field shifts every pair after it, so on Houses For Sale "Area Unit" lands alone at the start of row 2, divorced from the number it modifies.
2. `multiselect` is a stacked checkbox list → a ~350px-tall grid cell whose neighbour floats at the top of a huge void (mobile renders the same field as chips in 3 short rows).
3. Only 2 columns on a 1440px screen of short selects.

Fixes:
- Add two optional props to `BaseField`: `fullWidth?: boolean` and `pairKey?: string`. Set `fullWidth` on every multiselect/checkbox plus `googleMapsLink` and `dimensions`; set `pairKey: 'area'` on `totalArea` + `areaUnit`.
- Grid → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`; `fullWidth` cells get `col-span-full`; paired fields render in **one** cell as an internal `grid-cols-[2fr_1fr]`. Adjacency then cannot be broken by field count.
- `multiselect` → wrapped chips, matching mobile.
- 2-option selects (`condition`) → segmented control, not a dropdown with a "Select…" placeholder.
- `post-ad/page.tsx:406` — a `grid grid-cols-2` wrapper containing a **single** child leaves a permanently empty half-row beside the required Price input. Remove it.
- Mobile: `_inputDecoration` padding 12/12 → **16/16** and label 13/w500 → **14/w600** to match the rest of the form; card padding `all(16)` inside the page's `all(20)` puts these fields **36px** from the edge vs 20px everywhere else — reduce to 12; add the subcategory name + helper text to the header and route it through `.tr()`; localize placeholders (`_buildInput` uses the raw English label under a Nepali label today).
- **Before any reorder ships**, add `key: ValueKey(field.name)` to `_buildField` (B-21) and hoist the date-picker controller (B-22).

---

## 6. Implementation plan

### 6.1 Single source of truth — the decision

**Policy flags** (§2): one TypeScript file, `packages/types/src/commerceFlags.ts`, exporting `resolvePolicy(parentSlug, subSlug)` over a 16-row parent map + 20-row override map + `SAFE_DEFAULT`. `packages/types` is already a dependency of both `apps/web` and `apps/api`, so five of the seven consumers import the *same object*. It is **not** placed under `config/formTemplates/` because the API cannot import from there — and **the server is the enforcement point**.

Mobile gets the resolved policy attached to each node of `GET /api/categories` (the Dart `Category` model already carries `slug` and `parentId`), plus a **generated** `commerce_flags.g.dart` fallback for cold start/offline. Server value always wins. This is the only option that reaches the shipped app (1.3.0+24) without a store release. Keys are **slugs, not names** — names are what produced the 55 orphan configs.

**Field configs**: `apps/web/src/config/formTemplates/` is canonical.

**Property specifically — resolving the contradiction in the working notes:** **delete `subcategories/property.ts` entirely** and keep `templates/property.ts` as the single web source. Per-subcategory option lists (`propertyType` for apartments vs houses vs commercial, `roomType` for rooms) are expressed by declaring the field **more than once in the template array with disjoint `appliesTo` sets** — the filter guarantees only one instance survives per subcategory, so no type-system change is needed. Per-subcategory *order* is a subsequence of the one canonical array order in §4.1. Add a CI assertion that no two surviving fields in a resolved list share a `name`.

**Mobile field config**: Stage 1 hand-mirror + parity test; Stage 2 (Phase 6) generate `form_template_service.g.dart` from the web resolver so drift becomes impossible.

### 6.2 Phases

| # | Phase | Files | Effort |
|---|---|---|---|
| **1** | **Stop the bleeding.** Delete the hardcoded `condition:'Brand New'` writes. Fix the four Nepali option overrides. `year` max → `currentYear+1`. Remove "Reconditioned" (or teach `normalizeCondition` + filter about it). | `usePostAd.ts:656`, `useEditAd.ts:295,467`, `subcategories/general.ts:244,282,302`, `services.ts:38`, `templates/vehicles.ts`, `fields/common.ts`, `fields/vehicles.ts`, `form_template_service.dart` | **1 day** |
| **2** | **Server-side policy gate.** `commerceFlags.ts` + strip on write in both ad services. **Three blockers must be fixed or the gate is a no-op:** (a) `apps/api/src/services/ad.service.ts:1132` discards an empty `customFields` and restores the old blob — exactly the case the strip produces; (b) `:1131` and (c) `ads.routes.ts:598` both do `|| existingAd.condition`, so condition **cannot be cleared to null** on the Express update path. Also relax the two web price gates (`app/api/ads/route.ts:124` rejects a missing price; `useEditAd.ts:419` requires `> 0`). Attach `flags` + `categorySlug`/`subcategorySlug` to the categories and ad-detail responses. | `packages/types/src/commerceFlags.ts` (new), `apps/api/src/services/ad.service.ts`, `apps/api/src/routes/ads.routes.ts`, `apps/web/src/lib/services/ad.service.ts`, `apps/web/src/app/api/ads/route.ts`, `categories.routes.ts` | **3 days** |
| **3** | **Presentation.** Label whitelist + `label` in `FieldTranslation`, typed value formatter, spec-row alignment, template-index ordering, `spec_labels.g.dart` generator + CI check. | `SpecificationsSection.tsx`, `fieldLookup.ts`, `ad_specifications.dart`, `scripts/gen-spec-labels.mjs` (new) | **2 days** |
| **4** | **Field surgery — Property, Jobs, Overseas, Services, Education.** Deletes (`condition`, `monthlyRent`, `salaryRange`), renames (`propertyType`/`roomType`), the two new parent-level fallbacks, `pricePeriod`/`serviceType`/`priceUnit` shared fields, price labels. Mirror into Dart. Parity test. | `templates/property.ts`, `templates/services.ts`, `subcategories/*.ts` (delete orphans), `form_template_service.dart`, `post-ad/page.tsx`, `create_ad_screen.dart` | **4 days** |
| **5** | **Field surgery — Vehicles, Electronics, Fashion, General, Pets.** Rekey the orphan configs to DB names, new classifiers, option-list fixes, `optionsNe` everywhere + a build-time assertion that an `options` override must carry `optionsNe`. | same set | **4 days** |
| **6** | **Layout metadata + codegen.** `fullWidth`/`pairKey`, chips, segmented condition, mobile block parity, `ValueKey` fix, date-controller fix. Then generate `form_template_service.g.dart`. | `DynamicFormFields.tsx`, `dynamic_form_fields.dart`, `types.ts`, generator | **3 days** |
| **7** | **Migration + reindex.** See 6.3. | SQL + Typesense | **1 day** |

**Total ≈ 18 working days**, shippable in the order above (each phase is independently safe).

### 6.3 Back-compat for existing ads and drafts

**Display gates (implement regardless of any backfill):**

- `isCodAvailable: true` on a `cod: hide` category → **suppress the badge.** Showing "Cash on Delivery" on a house is a claim a buyer may act on.
- `isNegotiable: true` on Jobs → suppress.
- Either key as a spec row → already gone under the §5.2 whitelist.
- `ads.condition` on a `condition: hidden` category → suppress the badge.
- Legacy `monthlyRent` spec row → **suppress only after the check below**; legacy `salaryRange` → **keep rendering** (informative on old job ads).

**JSON-LD**: `AdJsonLd.tsx:25-39` already returns `undefined` for a null condition, so **nulling the column fixes structured data for free** — no extra gate. The real gap is `structuredData.ts:46-49`, which emits an unconditional `Offer` with the raw price; gate the `Offer` on a non-null price or every null-salary Jobs page emits invalid structured data.

**Backfill — one narrow migration, warranted for one reason.** `ads.condition` is a real indexed column consumed by the search filter, and web has stamped `'Brand New'` on every ad it created. The "Brand New" facet today returns rentals, jobs, services and live animals. A display gate hides the badge but does **not** clean the filter.

```sql
-- pg_dump FIRST (project hard rule). Run AFTER phase 2 is deployed,
-- or old clients immediately re-poison the rows.
UPDATE ads SET condition = NULL
 WHERE condition IS NOT NULL
   AND category_id IN (SELECT id FROM categories WHERE slug IN (:condition_hidden_slugs));

UPDATE ads SET custom_fields = custom_fields - 'isCodAvailable'
 WHERE jsonb_typeof(custom_fields) = 'object'
   AND category_id IN (SELECT id FROM categories WHERE slug IN (:cod_hidden_slugs));

UPDATE ads SET custom_fields = custom_fields - 'isNegotiable'
 WHERE jsonb_typeof(custom_fields) = 'object'
   AND category_id IN (SELECT id FROM categories WHERE slug IN (:negotiable_hidden_slugs));
```
`monthlyRent` and `salaryRange` values are **not** deleted — real seller data, and the display gate handles them. The `jsonb_typeof` guard is required: some rows store `custom_fields` as JSON scalar `null` and `jsonb_object_keys` errors on them.

**Typesense is not optional** (B-26). `typesense.ts:74` indexes `ad.condition || 'Used'` into a non-nullable faceted field, so the backfill would relabel every affected ad as **"Used"** — strictly worse than today's "Brand New" pollution. Make `condition` optional in the schema (or index a sentinel the facet excludes), do the same for `price` (`|| '0'` currently floors null-salary jobs at 0, which then wins every ascending price sort), and **run a full reindex after the SQL** — raw `UPDATE`s never call `indexAd`.

**Drafts silently resurrect deleted fields.** `create_ad_screen.dart:518` dumps the entire saved blob into `_attributeValues` and `:1352` spreads it wholesale into the submit payload. A draft saved today for Apartment Rentals carries `monthlyRent`, `landType` and `condition`; restored after the change none of them render, the seller can't edit them, and they post anyway. **Prune restored drafts against the resolved template on both platforms.** (Web has the mirror bug: `usePostAd.ts:477` reads a `draft.isCodAvailable` that `useAdDraft.ts:18,33` never declares or saves.)

**Search filters:**
- Condition facet must become category-aware — hide it where `condition: hidden` (`AdsFilter.tsx:288`, `FilterCarousel.tsx`, `MobileFilterDrawer.tsx`, `search_filter_modal.dart:1426`).
- Add `nulls: 'last'` to both price sorts (`apps/api/src/services/ad.service.ts:517-520`).
- Delete the dead `SearchFilters.isNegotiable` and mobile's `is_negotiable` param; populate `transformDbAdToApi.isNegotiable` from `custom_fields` and remove mobile's two workarounds.
- **Do not add a COD filter** — a JSONB key can't back a facet at this scale.

**AI autofill:** stop returning a `priceEstimate` (or suppress the 0.1×/10× price warning) for any category whose price label isn't "Price" — for Jobs the AI estimates an item resale price from photos while the field now means monthly salary, so the warning will fire on plausible salaries (`usePostAd.ts:586`, `create_ad_screen.dart:1272`). Neither client applies AI condition today, so removing Condition doesn't fight the AI.

---

## 7. Open questions for the owner

Each has my recommended default — "yes to all" is a valid answer.

1. **Condition required only in Electronics, Mobiles and Vehicles?** This downgrades it to *optional* on furniture, doors, industrial machinery, medical equipment and farming tools, contradicting the per-category analysis, in exchange for less friction on the only mandatory extra field in the app. → **Recommend: yes, three parents only.**
2. **Jobs lose the "negotiable" badge entirely** (your rule B5). Replacement: salary becomes optional and a null salary renders **"Salary negotiable"** on cards and detail. → **Recommend: yes.**
3. **Home & Living furniture keeps Cash-on-Delivery** — a sofa delivered with cash is normal for Nepali furniture shops, while vehicles, property and industrial machinery hide it. Correct read of the market? → **Recommend: yes, keep COD on furniture.**
4. **Matrimonials: hide the Price field entirely** and send null (today every matrimonial ad carries a fake mandatory number). → **Recommend: yes.**
5. **Run this on prod before I suppress legacy "Monthly Rent" spec rows** — if any rental ads put the real rent in `monthlyRent` and left `price` at 0, suppressing the row hides both numbers:
   `SELECT count(*) FROM ads WHERE custom_fields ? 'monthlyRent' AND (price IS NULL OR price = 0);`
   → **Recommend: if 0, suppress; if not, migrate those values into `price` first.**
6. **Three taxonomy renames**, all currently costing listings: `New projects on PropertyGuide` → **"New Projects (Under Construction)"** (names a third-party portal that exists nowhere in the code); `Photocopiers` → **"Printers & Photocopiers"** (printers outnumber copiers and currently scatter into Other Electronics); and add **"Fertilizers & Pesticides"** + **"Livestock Feed"** subcategories under Agriculture (both codebases already carry complete, unreachable configs for them). → **Recommend: yes to all three.**
7. **Two merges/splits**, each needing a DB change: merge `Vehicles > Auto Services` and `Maintenance and Repair` (field-identical after this pass); split `Jewellery & Watches` into two subcategories (jewellery buyers and watch buyers share zero fields). → **Recommend: merge Auto Services, defer the jewellery split** — the split is the bigger win but also the bigger disruption to existing listings.
8. **Delete the `isNegotiable` search filter and mobile's `is_negotiable` param** (both dead — no route reads them, no UI sets them), rather than implementing them properly. → **Recommend: yes, delete.**
