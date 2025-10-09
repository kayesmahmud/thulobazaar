-- Migration: Add remaining wards (8-32) for Kathmandu Metropolitan City
-- Wards 1-7 already added in migration 011

INSERT INTO areas (name, name_np, municipality_id, ward_number, area_type, is_popular) VALUES

-- WARD 8
('Pashupati area', 'पशुपति क्षेत्र', 30101, 8, 'neighborhood', true),
('Pashupatinath Marg', 'पशुपतिनाथ मार्ग', 30101, 8, 'street', true),

-- WARD 9
('Gaushala', 'गौशाला', 30101, 9, 'neighborhood', true),
('Sinamangal', 'सिनामंगल', 30101, 9, 'neighborhood', true),
('Lagankhel', 'लगनखेल', 30101, 9, 'neighborhood', true),

-- WARD 10
('Baneshwor', 'बानेश्वर', 30101, 10, 'neighborhood', true),
('New Baneshwor', 'नयाँ बानेश्वर', 30101, 10, 'neighborhood', true),
('Sajha Marg', 'साझा मार्ग', 30101, 10, 'street', true),

-- WARD 11
('Tripureshwor', 'त्रिपुरेश्वर', 30101, 11, 'neighborhood', true),
('Putalisadak', 'पुतलीसडक', 30101, 11, 'neighborhood', true),

-- WARD 12
('Teku', 'टेकु', 30101, 12, 'neighborhood', true),
('Gairigaon', 'गैरीगाउँ', 30101, 12, 'neighborhood', false),
('Kuleshwor', 'कुलेश्वर', 30101, 12, 'neighborhood', true),

-- WARD 13
('Kalimati', 'कालीमाटी', 30101, 13, 'neighborhood', true),
('Sorhakhutte', 'सोरहकुट्टे', 30101, 13, 'neighborhood', false),
('Tangal', 'टंगाल', 30101, 13, 'neighborhood', true),

-- WARD 14
('Kalanki', 'कलंकी', 30101, 14, 'neighborhood', true),
('Gongabu', 'गोंगबु', 30101, 14, 'neighborhood', true),
('Samakhusi', 'समाखुशी', 30101, 14, 'neighborhood', true),

-- WARD 15
('Dallu', 'दल्लु', 30101, 15, 'neighborhood', true),
('Chabalil', 'चाबहिल', 30101, 15, 'neighborhood', true),
('Swayambhu Marg', 'स्वयम्भू मार्ग', 30101, 15, 'street', true),

-- WARD 16
('Sohrakhutee', 'सोहराखुट्टी', 30101, 16, 'neighborhood', false),
('Gairidhara extension', 'गैरीधारा विस्तार', 30101, 16, 'neighborhood', false),
('Bagbazaar extension', 'बागबजार विस्तार', 30101, 16, 'neighborhood', true),

-- WARD 17
('Chhauni', 'छाउनी', 30101, 17, 'neighborhood', true),
('Jawalakhel', 'जावलाखेल', 30101, 17, 'neighborhood', true),
('Satdobato', 'सातदोबाटो', 30101, 17, 'neighborhood', true),

-- WARD 18
('Maitighar', 'माइतीघर', 30101, 18, 'neighborhood', true),
('Lazimpat extension', 'लाजिम्पाट विस्तार', 30101, 18, 'neighborhood', false),
('Durbar Marg vicinity', 'दरबार मार्ग परिसर', 30101, 18, 'locality', true),

-- WARD 19
('Yatkha', 'यत्खा', 30101, 19, 'neighborhood', false),
('Swayambhu', 'स्वयम्भू', 30101, 19, 'landmark', true),
('Bansbari marginal areas', 'बंसबारी सीमान्त क्षेत्र', 30101, 19, 'locality', false),

-- WARD 20
('Chabalil', 'चाबहिल', 30101, 20, 'neighborhood', true),
('Pashupatinath side', 'पशुपतिनाथ साइड', 30101, 20, 'locality', true),
('Gagal Pati', 'गगल पाटी', 30101, 20, 'neighborhood', false),

-- WARD 21
('Gairidhara backstreets', 'गैरीधारा गल्ली', 30101, 21, 'locality', false),
('Lazimpat backstreets', 'लाजिम्पाट गल्ली', 30101, 21, 'locality', false),
('Narayan Gopal Chowk', 'नारायण गोपाल चोक', 30101, 21, 'landmark', true),

-- WARD 22
('Gyaneshwar', 'ज्ञानेश्वर', 30101, 22, 'neighborhood', true),
('Rabi Bhawan area', 'रवि भवन क्षेत्र', 30101, 22, 'locality', false),
('New Baneshwor outskirts', 'नयाँ बानेश्वर बाहिरी क्षेत्र', 30101, 22, 'locality', false),

-- WARD 23
('Lainchaur', 'लैनचौर', 30101, 23, 'neighborhood', true),
('New Road fringes', 'न्यू रोड किनारा', 30101, 23, 'locality', true),
('Kathmandu Durbar Square side', 'काठमाडौं दरबार स्क्वायर साइड', 30101, 23, 'locality', true),

-- WARD 24
('New Road', 'न्यू रोड', 30101, 24, 'street', true),
('Indra Chowk', 'इन्द्र चोक', 30101, 24, 'landmark', true),
('Asan', 'असन', 30101, 24, 'landmark', true),

-- WARD 25
('Durbarmarg', 'दरबारमार्ग', 30101, 25, 'street', true),
('Thamel', 'थमेल', 30101, 25, 'neighborhood', true),
('Chhaya Devi area', 'छाया देवी क्षेत्र', 30101, 25, 'locality', false),

-- WARD 26
('Kamaladi', 'कमलादी', 30101, 26, 'neighborhood', true),
('Chhetrapati', 'क्षेत्रपति', 30101, 26, 'neighborhood', true),
('Ason side', 'असन साइड', 30101, 26, 'locality', true),

-- WARD 27
('Hattisar', 'हत्तिसार', 30101, 27, 'neighborhood', true),
('Sundhara', 'सुन्धारा', 30101, 27, 'neighborhood', true),
('Jamal vicinity', 'जमल परिसर', 30101, 27, 'locality', true),

-- WARD 28
('Anamnagar', 'अनामनगर', 30101, 28, 'neighborhood', true),
('Maitighar extension', 'माइतीघर विस्तार', 30101, 28, 'neighborhood', true),
('Lazimpat backstreets', 'लाजिम्पाट गल्ली', 30101, 28, 'locality', false),

-- WARD 29
('Dilli Bazaar', 'दिल्ली बजार', 30101, 29, 'neighborhood', true),
('Indrachowk', 'इन्द्रचोक', 30101, 29, 'landmark', true),
('Putalisadak backstreets', 'पुतलीसडक गल्ली', 30101, 29, 'locality', false),

-- WARD 30
('Bagbazar', 'बागबजार', 30101, 30, 'neighborhood', true),
('Jorpati', 'जोरपाटी', 30101, 30, 'neighborhood', true),
('Teku extension', 'टेकु विस्तार', 30101, 30, 'locality', false),

-- WARD 31
('Koteshwor', 'कोटेश्वर', 30101, 31, 'neighborhood', true),
('Balkhu', 'बल्खु', 30101, 31, 'neighborhood', true),
('Thapathali outskirts', 'थापाथली बाहिरी क्षेत्र', 30101, 31, 'locality', false),

-- WARD 32
('Koteshwor', 'कोटेश्वर', 30101, 32, 'neighborhood', true),
('Mahadeokthan', 'महादेवस्थान', 30101, 32, 'neighborhood', false),
('Bideing outskirts', 'बिदेइङ बाहिरी क्षेत्र', 30101, 32, 'locality', false),
('Sankhamul', 'सनखमुल', 30101, 32, 'neighborhood', true);

-- Update the comment on areas table
COMMENT ON TABLE areas IS 'Stores granular location data (neighborhoods, streets, landmarks) for all 32 wards of Kathmandu Metropolitan City';
