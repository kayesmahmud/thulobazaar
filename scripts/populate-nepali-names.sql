-- ============================================
-- POPULATE NEPALI NAMES FOR CATEGORIES
-- ============================================

-- Main Categories (16)
UPDATE categories SET name_ne = 'मोबाइल' WHERE slug = 'mobiles';
UPDATE categories SET name_ne = 'इलेक्ट्रोनिक्स' WHERE slug = 'electronics';
UPDATE categories SET name_ne = 'सवारी साधन' WHERE slug = 'vehicles';
UPDATE categories SET name_ne = 'घर जग्गा' WHERE slug = 'property';
UPDATE categories SET name_ne = 'घर तथा जीवनशैली' WHERE slug = 'home-living';
UPDATE categories SET name_ne = 'पुरुष फेसन तथा सिंगार' WHERE slug = 'mens-fashion-grooming';
UPDATE categories SET name_ne = 'महिला फेसन तथा सौन्दर्य' WHERE slug = 'womens-fashion-beauty';
UPDATE categories SET name_ne = 'शौक, खेलकुद तथा बालबालिका' WHERE slug = 'hobbies-sports-kids';
UPDATE categories SET name_ne = 'आवश्यक सामान' WHERE slug = 'essentials';
UPDATE categories SET name_ne = 'रोजगार' WHERE slug = 'jobs';
UPDATE categories SET name_ne = 'विदेशी रोजगार' WHERE slug = 'overseas-jobs';
UPDATE categories SET name_ne = 'पशुपन्छी' WHERE slug = 'pets-animals';
UPDATE categories SET name_ne = 'सेवाहरू' WHERE slug = 'services';
UPDATE categories SET name_ne = 'शिक्षा' WHERE slug = 'education';
UPDATE categories SET name_ne = 'व्यापार तथा उद्योग' WHERE slug = 'business-industry';
UPDATE categories SET name_ne = 'कृषि' WHERE slug = 'agriculture';

-- Mobiles Subcategories
UPDATE categories SET name_ne = 'मोबाइल फोन' WHERE slug = 'mobile-phones';
UPDATE categories SET name_ne = 'मोबाइल फोन सामान' WHERE slug = 'mobile-phone-accessories';
UPDATE categories SET name_ne = 'स्मार्ट घडी' WHERE slug = 'wearables';

-- Electronics Subcategories
UPDATE categories SET name_ne = 'ल्यापटप' WHERE slug = 'laptops';
UPDATE categories SET name_ne = 'ल्यापटप तथा कम्प्युटर सामान' WHERE slug = 'laptop-computer-accessories';
UPDATE categories SET name_ne = 'डेस्कटप कम्प्युटर' WHERE slug = 'desktop-computers';
UPDATE categories SET name_ne = 'घरायसी सामग्री' WHERE slug = 'home-appliances';
UPDATE categories SET name_ne = 'एसी तथा घरेलु इलेक्ट्रोनिक्स' WHERE slug = 'acs-home-electronics';
UPDATE categories SET name_ne = 'अडियो तथा साउन्ड सिस्टम' WHERE slug = 'audio-sound-systems';
UPDATE categories SET name_ne = 'टिभी' WHERE slug = 'tvs';
UPDATE categories SET name_ne = 'क्यामरा तथा सामान' WHERE slug = 'cameras-camcorders-accessories';
UPDATE categories SET name_ne = 'ट्याब्लेट तथा सामान' WHERE slug = 'tablets-accessories';
UPDATE categories SET name_ne = 'टिभी तथा भिडियो सामान' WHERE slug = 'tv-video-accessories';
UPDATE categories SET name_ne = 'अन्य इलेक्ट्रोनिक्स' WHERE slug = 'other-electronics';
UPDATE categories SET name_ne = 'भिडियो गेम कन्सोल तथा सामान' WHERE slug = 'video-game-consoles-accessories';
UPDATE categories SET name_ne = 'फोटोकपि मेसिन' WHERE slug = 'photocopiers';

-- Vehicles Subcategories
UPDATE categories SET name_ne = 'कार' WHERE slug = 'cars';
UPDATE categories SET name_ne = 'मोटरसाइकल' WHERE slug = 'motorbikes';
UPDATE categories SET name_ne = 'साइकल' WHERE slug = 'bicycles';
UPDATE categories SET name_ne = 'गाडीका पार्ट्स तथा सामान' WHERE slug = 'auto-parts-accessories';
UPDATE categories SET name_ne = 'भाडामा' WHERE slug = 'rentals';
UPDATE categories SET name_ne = 'तीन पाङ्ग्रे' WHERE slug = 'three-wheelers';
UPDATE categories SET name_ne = 'ट्रक' WHERE slug = 'trucks';
UPDATE categories SET name_ne = 'भ्यान' WHERE slug = 'vans';
UPDATE categories SET name_ne = 'भारी सवारी' WHERE slug = 'heavy-duty';
UPDATE categories SET name_ne = 'जल यातायात' WHERE slug = 'water-transport';
UPDATE categories SET name_ne = 'बस' WHERE slug = 'buses';
UPDATE categories SET name_ne = 'अटो सेवा' WHERE slug = 'auto-services';
UPDATE categories SET name_ne = 'मर्मत तथा सम्भार' WHERE slug = 'maintenance-repair';

-- Home & Living Subcategories
UPDATE categories SET name_ne = 'बेडरुम फर्निचर' WHERE slug = 'bedroom-furniture';
UPDATE categories SET name_ne = 'बैठक कोठा फर्निचर' WHERE slug = 'living-room-furniture';
UPDATE categories SET name_ne = 'कार्यालय तथा पसल फर्निचर' WHERE slug = 'office-shop-furniture';
UPDATE categories SET name_ne = 'घरेलु कपडा तथा सजावट' WHERE slug = 'home-textiles-decoration';
UPDATE categories SET name_ne = 'घरेलु सामान' WHERE slug = 'household-items';
UPDATE categories SET name_ne = 'भान्सा तथा खाना कोठा फर्निचर' WHERE slug = 'kitchen-dining-furniture';
UPDATE categories SET name_ne = 'बालबालिका फर्निचर' WHERE slug = 'childrens-furniture';
UPDATE categories SET name_ne = 'ढोका' WHERE slug = 'doors';
UPDATE categories SET name_ne = 'बाथरुम सामान' WHERE slug = 'bathroom-products';

-- Property Subcategories
UPDATE categories SET name_ne = 'जग्गा बिक्री' WHERE slug = 'land-for-sale';
UPDATE categories SET name_ne = 'फ्ल्याट बिक्री' WHERE slug = 'apartments-for-sale';
UPDATE categories SET name_ne = 'फ्ल्याट भाडा' WHERE slug = 'apartment-rentals';
UPDATE categories SET name_ne = 'व्यापारिक भवन भाडा' WHERE slug = 'commercial-property-rentals';
UPDATE categories SET name_ne = 'घर बिक्री' WHERE slug = 'houses-for-sale';
UPDATE categories SET name_ne = 'व्यापारिक भवन बिक्री' WHERE slug = 'commercial-properties-for-sale';
UPDATE categories SET name_ne = 'कोठा भाडा' WHERE slug = 'room-rentals';
UPDATE categories SET name_ne = 'घर भाडा' WHERE slug = 'house-rentals';
UPDATE categories SET name_ne = 'जग्गा भाडा' WHERE slug = 'land-rentals';

-- Pets & Animals Subcategories
UPDATE categories SET name_ne = 'पाल्तु जनावर' WHERE slug = 'pets';
UPDATE categories SET name_ne = 'पालतु पशुपन्छी' WHERE slug = 'farm-animals';
UPDATE categories SET name_ne = 'पशुपन्छी सामान' WHERE slug = 'pet-animal-accessories';
UPDATE categories SET name_ne = 'पशुपन्छी खाना' WHERE slug = 'pet-animal-food';
UPDATE categories SET name_ne = 'अन्य पशुपन्छी' WHERE slug = 'other-pets-animals';

-- Men's Fashion Subcategories
UPDATE categories SET name_ne = 'घडी' WHERE slug = 'watches';
UPDATE categories SET name_ne = 'सर्ट तथा टिसर्ट' WHERE slug = 'shirts-tshirts';
UPDATE categories SET name_ne = 'जुत्ता' WHERE slug = 'footwear';
UPDATE categories SET name_ne = 'झोला तथा सामान' WHERE slug = 'bags-accessories';
UPDATE categories SET name_ne = 'सिंगार तथा शरीर स्याहार' WHERE slug = 'grooming-bodycare';
UPDATE categories SET name_ne = 'प्यान्ट' WHERE slug = 'pants';
UPDATE categories SET name_ne = 'परम्परागत लुगा' WHERE slug = 'traditional-clothing';
UPDATE categories SET name_ne = 'ज्याकेट तथा कोट' WHERE slug = 'jacket-coat';
UPDATE categories SET name_ne = 'चस्मा' WHERE slug = 'optical-sunglasses';
UPDATE categories SET name_ne = 'बालबालिका फेसन' WHERE slug = 'baby-boys-fashion';
UPDATE categories SET name_ne = 'थोक बिक्री' WHERE slug = 'wholesale-bulk';

-- Women's Fashion Subcategories
UPDATE categories SET name_ne = 'परम्परागत पोशाक' WHERE slug = 'traditional-wear';
UPDATE categories SET name_ne = 'ब्युटी एण्ड पर्सनल केयर' WHERE slug = 'beauty-personal-care';
UPDATE categories SET name_ne = 'गहना तथा घडी' WHERE slug = 'jewellery-watches';
UPDATE categories SET name_ne = 'झोला तथा सामान' WHERE slug = 'bags-accessories-women';
UPDATE categories SET name_ne = 'पश्चिमी पोशाक' WHERE slug = 'western-wear';
UPDATE categories SET name_ne = 'बालिका फेसन' WHERE slug = 'baby-girls-fashion';
UPDATE categories SET name_ne = 'जुत्ता' WHERE slug = 'footwear-women';
UPDATE categories SET name_ne = 'अन्तर्वस्त्र' WHERE slug = 'lingerie-sleepwear';
UPDATE categories SET name_ne = 'थोक बिक्री' WHERE slug = 'wholesale-bulk-women';
UPDATE categories SET name_ne = 'जाडो लुगा' WHERE slug = 'winter-wear';
UPDATE categories SET name_ne = 'चस्मा' WHERE slug = 'optical-sunglasses-women';

-- Hobbies, Sports & Kids Subcategories
UPDATE categories SET name_ne = 'सङ्गीत वाद्ययन्त्र' WHERE slug = 'musical-instruments';
UPDATE categories SET name_ne = 'खेलकुद' WHERE slug = 'sports';
UPDATE categories SET name_ne = 'बालबालिका सामान' WHERE slug = 'childrens-items';
UPDATE categories SET name_ne = 'अन्य शौक, खेलकुद तथा बालबालिका' WHERE slug = 'other-hobby-sport-kids';
UPDATE categories SET name_ne = 'व्यायाम तथा जिम' WHERE slug = 'fitness-gym';
UPDATE categories SET name_ne = 'सङ्गीत, पुस्तक तथा चलचित्र' WHERE slug = 'music-books-movies';

-- Business & Industry Subcategories
UPDATE categories SET name_ne = 'उद्योग मेसिन तथा औजार' WHERE slug = 'industry-machinery-tools';
UPDATE categories SET name_ne = 'अन्य व्यापार तथा उद्योग' WHERE slug = 'other-business-industry';
UPDATE categories SET name_ne = 'कार्यालय सामान तथा स्टेशनरी' WHERE slug = 'office-supplies-stationary';
UPDATE categories SET name_ne = 'चिकित्सा उपकरण तथा सामान' WHERE slug = 'medical-equipment-supplies';
UPDATE categories SET name_ne = 'कच्चा पदार्थ तथा औद्योगिक सामान' WHERE slug = 'raw-materials-industrial-supplies';
UPDATE categories SET name_ne = 'लाइसेन्स टाइटल्स एण्ड टेन्डर्स' WHERE slug = 'licences-titles-tenders';
UPDATE categories SET name_ne = 'सुरक्षा' WHERE slug = 'safety-security';

-- Education Subcategories
UPDATE categories SET name_ne = 'पाठ्यपुस्तक' WHERE slug = 'textbooks';
UPDATE categories SET name_ne = 'ट्युसन' WHERE slug = 'tuition';
UPDATE categories SET name_ne = 'तालिम' WHERE slug = 'courses';
UPDATE categories SET name_ne = 'विदेश अध्ययन' WHERE slug = 'study-abroad';
UPDATE categories SET name_ne = 'अन्य शिक्षा' WHERE slug = 'other-education';

-- Essentials Subcategories
UPDATE categories SET name_ne = 'किराना' WHERE slug = 'grocery';
UPDATE categories SET name_ne = 'स्वास्थ्य सेवा' WHERE slug = 'healthcare';
UPDATE categories SET name_ne = 'अन्य आवश्यक सामान' WHERE slug = 'other-essentials';
UPDATE categories SET name_ne = 'घरायसी सामान' WHERE slug = 'household';
UPDATE categories SET name_ne = 'शिशु सामान' WHERE slug = 'baby-products';
UPDATE categories SET name_ne = 'फलफूल तथा तरकारी' WHERE slug = 'fruits-vegetables';
UPDATE categories SET name_ne = 'मासु तथा समुद्री खाना' WHERE slug = 'meat-seafood';

-- Jobs Subcategories
UPDATE categories SET name_ne = 'अकाउन्टेन्ट' WHERE slug = 'accountant';
UPDATE categories SET name_ne = 'ब्यूटिसियन' WHERE slug = 'beautician';
UPDATE categories SET name_ne = 'व्यापार विश्लेषक' WHERE slug = 'business-analyst';
UPDATE categories SET name_ne = 'सेफ' WHERE slug = 'chef';
UPDATE categories SET name_ne = 'कोल्लेक्सन & रेकोवेॠ अगेन्त्स' WHERE slug = 'collection-recovery-agents';
UPDATE categories SET name_ne = 'निर्माण कामदार' WHERE slug = 'construction-worker';
UPDATE categories SET name_ne = 'सामग्री लेखक' WHERE slug = 'content-writer';
UPDATE categories SET name_ne = 'काउन्सेलर' WHERE slug = 'counsellor';
UPDATE categories SET name_ne = 'ग्राहक सेवा कार्यकारी' WHERE slug = 'customer-service-executive';
UPDATE categories SET name_ne = 'ग्राहक सहायता प्रबन्धक' WHERE slug = 'customer-support-manager';
UPDATE categories SET name_ne = 'डेलिभरी राइडर' WHERE slug = 'delivery-rider';
UPDATE categories SET name_ne = 'डिजाइनर' WHERE slug = 'designer';
UPDATE categories SET name_ne = 'डिजिटल मार्केटिङ कार्यकारी' WHERE slug = 'digital-marketing-executive';
UPDATE categories SET name_ne = 'डिजिटल मार्केटिङ प्रबन्धक' WHERE slug = 'digital-marketing-manager';
UPDATE categories SET name_ne = 'चिकित्सक' WHERE slug = 'doctor';
UPDATE categories SET name_ne = 'चालक' WHERE slug = 'driver';
UPDATE categories SET name_ne = 'इलेक्ट्रिसियन' WHERE slug = 'electrician';
UPDATE categories SET name_ne = 'इन्जिनियर' WHERE slug = 'engineer';
UPDATE categories SET name_ne = 'कार्यक्रम आयोजक' WHERE slug = 'event-planner';
UPDATE categories SET name_ne = 'दमकलकर्मी' WHERE slug = 'fire-fighter';
UPDATE categories SET name_ne = 'विमान परिचारिका' WHERE slug = 'flight-attendant';
UPDATE categories SET name_ne = 'फूलबारी' WHERE slug = 'florist';
UPDATE categories SET name_ne = 'माली' WHERE slug = 'gardener';
UPDATE categories SET name_ne = 'लुगा कारखाना कामदार' WHERE slug = 'garments-worker';
UPDATE categories SET name_ne = 'सरकारी जागिर' WHERE slug = 'government-jobs';
UPDATE categories SET name_ne = 'आतिथ्य कार्यकारी' WHERE slug = 'hospitality-executive';
UPDATE categories SET name_ne = 'गृहसेविका' WHERE slug = 'house-keeper';
UPDATE categories SET name_ne = 'मानव संसाधन कार्यकारी' WHERE slug = 'hr-executive';
UPDATE categories SET name_ne = 'मानव संसाधन प्रबन्धक' WHERE slug = 'hr-manager';
UPDATE categories SET name_ne = 'इन्टेरियर डिजाइनर' WHERE slug = 'interior-designer';
UPDATE categories SET name_ne = 'पत्रकार' WHERE slug = 'journalist';
UPDATE categories SET name_ne = 'प्रयोगशाला सहायक' WHERE slug = 'lab-assistant';
UPDATE categories SET name_ne = 'घरेलु कामदार' WHERE slug = 'maid';
UPDATE categories SET name_ne = 'व्यवस्थापन प्रशिक्षार्थी' WHERE slug = 'management-trainee';
UPDATE categories SET name_ne = 'बजार अनुसन्धान विश्लेषक' WHERE slug = 'market-research-analyst';
UPDATE categories SET name_ne = 'मार्केटिङ कार्यकारी' WHERE slug = 'marketing-executive';
UPDATE categories SET name_ne = 'मार्केटिङ प्रबन्धक' WHERE slug = 'marketing-manager';
UPDATE categories SET name_ne = 'मेकानिक' WHERE slug = 'mechanic';
UPDATE categories SET name_ne = 'चिकित्सा प्रतिनिधि' WHERE slug = 'medical-representative';
UPDATE categories SET name_ne = 'मर्चेन्डाइजर' WHERE slug = 'merchandiser';
UPDATE categories SET name_ne = 'नर्स' WHERE slug = 'nurse';
UPDATE categories SET name_ne = 'कार्यालय प्रशासक' WHERE slug = 'office-admin';
UPDATE categories SET name_ne = 'अपरेटर' WHERE slug = 'operator';
UPDATE categories SET name_ne = 'अन्य' WHERE slug = 'other';
UPDATE categories SET name_ne = 'औषधि विशेषज्ञ' WHERE slug = 'pharmacist';
UPDATE categories SET name_ne = 'फोटोग्राफर' WHERE slug = 'photographer';
UPDATE categories SET name_ne = 'उत्पादन सोर्सिङ कार्यकारी' WHERE slug = 'product-sourcing-executive';
UPDATE categories SET name_ne = 'उत्पादन कार्यकारी' WHERE slug = 'production-executive';
UPDATE categories SET name_ne = 'जनसम्पर्क अधिकारी' WHERE slug = 'public-relations-officer';
UPDATE categories SET name_ne = 'खरिद अधिकारी' WHERE slug = 'purchase-officer';
UPDATE categories SET name_ne = 'गुणस्तर जाँचकर्ता' WHERE slug = 'quality-checker';
UPDATE categories SET name_ne = 'गुणस्तर नियन्त्रक' WHERE slug = 'quality-controller';
UPDATE categories SET name_ne = 'बिक्री कार्यकारी' WHERE slug = 'sales-executive';
UPDATE categories SET name_ne = 'बिक्री प्रबन्धक' WHERE slug = 'sales-manager-field';
UPDATE categories SET name_ne = 'सुरक्षा गार्ड' WHERE slug = 'security-guard';
UPDATE categories SET name_ne = 'एसइओ विशेषज्ञ' WHERE slug = 'seo-specialist';
UPDATE categories SET name_ne = 'सोशल मिडिया प्रस्तोता' WHERE slug = 'social-media-presenter';
UPDATE categories SET name_ne = 'सफ्टवेयर इन्जिनियर' WHERE slug = 'software-engineer';
UPDATE categories SET name_ne = 'सुपरभाइजर' WHERE slug = 'supervisor';
UPDATE categories SET name_ne = 'शिक्षक' WHERE slug = 'teacher';
UPDATE categories SET name_ne = 'भिडियोग्राफर' WHERE slug = 'videographer';

-- Services Subcategories
UPDATE categories SET name_ne = 'मर्मत तथा सेवा' WHERE slug = 'servicing-repair';
UPDATE categories SET name_ne = 'मिडिया तथा कार्यक्रम व्यवस्थापन' WHERE slug = 'media-event-management';
UPDATE categories SET name_ne = 'पर्यटन तथा यात्रा' WHERE slug = 'tours-travels';
UPDATE categories SET name_ne = 'आइटी सेवा' WHERE slug = 'it-services';
UPDATE categories SET name_ne = 'भवन मर्मत' WHERE slug = 'building-maintenance';
UPDATE categories SET name_ne = 'व्यावसायिक सेवा' WHERE slug = 'professional-services';
UPDATE categories SET name_ne = 'वैवाहिक' WHERE slug = 'matrimonials';
UPDATE categories SET name_ne = 'घरेलु तथा बालस्याहार सेवा' WHERE slug = 'domestic-daycare-services';
UPDATE categories SET name_ne = 'शरीर मालिस' WHERE slug = 'body-massage';
UPDATE categories SET name_ne = 'जिम तथा व्यायाम' WHERE slug = 'gym-fitness';
UPDATE categories SET name_ne = 'सौन्दर्य सेवा' WHERE slug = 'beauty-services';

-- Agriculture Subcategories
UPDATE categories SET name_ne = 'बाली, बीउ तथा बिरुवा' WHERE slug = 'crops-seeds-plants';
UPDATE categories SET name_ne = 'कृषि औजार तथा मेसिन' WHERE slug = 'farming-tools-machinery';
UPDATE categories SET name_ne = 'अन्य कृषि' WHERE slug = 'other-agriculture';

-- Overseas Jobs Subcategories (country names)
UPDATE categories SET name_ne = 'बुल्गेरिया' WHERE slug = 'bulgaria';
UPDATE categories SET name_ne = 'क्रोएसिया' WHERE slug = 'croatia';
UPDATE categories SET name_ne = 'सर्बिया' WHERE slug = 'serbia';
UPDATE categories SET name_ne = 'साउदी अरब' WHERE slug = 'saudi-arabia';
UPDATE categories SET name_ne = 'संयुक्त अरब इमिरेट्स' WHERE slug = 'uae';
UPDATE categories SET name_ne = 'कतार' WHERE slug = 'qatar';
UPDATE categories SET name_ne = 'मलेसिया' WHERE slug = 'malaysia';
UPDATE categories SET name_ne = 'सिंगापुर' WHERE slug = 'singapore';
