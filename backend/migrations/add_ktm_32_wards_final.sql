-- Add 32 Wards and Areas for Kathmandu Metropolitan City
-- Parent: Kathmandu Metropolitan City (id: 30101)

-- Ward 1 - Naxal, Gairidhara, Teku Marg, Kamal Pokhari, Sarkha Kriti Maha Bihar
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 1', 'ward-1', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Naxal', 'naxal', 'area', (SELECT id FROM locations WHERE slug = 'ward-1' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Gairidhara', 'gairidhara', 'area', (SELECT id FROM locations WHERE slug = 'ward-1' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Teku Marg', 'teku-marg', 'area', (SELECT id FROM locations WHERE slug = 'ward-1' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kamal Pokhari', 'kamal-pokhari', 'area', (SELECT id FROM locations WHERE slug = 'ward-1' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sarkha Kriti Maha Bihar', 'sarkha-kriti-maha-bihar', 'area', (SELECT id FROM locations WHERE slug = 'ward-1' AND parent_id = 30101));

-- Ward 2 - Lazimpat, Daxali, Gairidhara, Bhagwati Bhal, Thahiti, Sarikha
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 2', 'ward-2', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Lazimpat', 'lazimpat', 'area', (SELECT id FROM locations WHERE slug = 'ward-2' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Daxali', 'daxali', 'area', (SELECT id FROM locations WHERE slug = 'ward-2' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Bhagwati Bhal', 'bhagwati-bhal', 'area', (SELECT id FROM locations WHERE slug = 'ward-2' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Thahiti', 'thahiti', 'area', (SELECT id FROM locations WHERE slug = 'ward-2' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sarikha', 'sarikha', 'area', (SELECT id FROM locations WHERE slug = 'ward-2' AND parent_id = 30101));

-- Ward 3 - Maharajgunj, Shree Gopal Marg, Balaju
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 3', 'ward-3', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Maharajgunj', 'maharajgunj', 'area', (SELECT id FROM locations WHERE slug = 'ward-3' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Shree Gopal Marg', 'shree-gopal-marg', 'area', (SELECT id FROM locations WHERE slug = 'ward-3' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Balaju', 'balaju', 'area', (SELECT id FROM locations WHERE slug = 'ward-3' AND parent_id = 30101));

-- Ward 4 - Bauwater, Chappat Karkhana, Dhavedevi, Dhumbarahi
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 4', 'ward-4', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Bauwater', 'bauwater', 'area', (SELECT id FROM locations WHERE slug = 'ward-4' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chappat Karkhana', 'chappat-karkhana', 'area', (SELECT id FROM locations WHERE slug = 'ward-4' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Dhavedevi', 'dhavedevi', 'area', (SELECT id FROM locations WHERE slug = 'ward-4' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Dhumbarahi', 'dhumbarahi', 'area', (SELECT id FROM locations WHERE slug = 'ward-4' AND parent_id = 30101));

-- Ward 5 - Hadigaun, Kapan, Chapali Bhadrakali
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 5', 'ward-5', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Hadigaun', 'hadigaun', 'area', (SELECT id FROM locations WHERE slug = 'ward-5' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kapan', 'kapan', 'area', (SELECT id FROM locations WHERE slug = 'ward-5' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chapali Bhadrakali', 'chapali-bhadrakali', 'area', (SELECT id FROM locations WHERE slug = 'ward-5' AND parent_id = 30101));

-- Ward 6 - Bouddha, Bauddha Stupa area, Boudhanath Marg
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 6', 'ward-6', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Bouddha', 'bouddha', 'area', (SELECT id FROM locations WHERE slug = 'ward-6' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Bauddha Stupa area', 'bauddha-stupa-area', 'area', (SELECT id FROM locations WHERE slug = 'ward-6' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Boudhanath Marg', 'boudhanath-marg', 'area', (SELECT id FROM locations WHERE slug = 'ward-6' AND parent_id = 30101));

-- Ward 7 - Mitrapark, Chhauni, Ghattekulo
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 7', 'ward-7', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Mitrapark', 'mitrapark', 'area', (SELECT id FROM locations WHERE slug = 'ward-7' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chhauni', 'chhauni', 'area', (SELECT id FROM locations WHERE slug = 'ward-7' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ghattekulo', 'ghattekulo', 'area', (SELECT id FROM locations WHERE slug = 'ward-7' AND parent_id = 30101));

-- Ward 8 - Pashupati area, Pashupatinath Marg
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 8', 'ward-8', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Pashupati area', 'pashupati-area', 'area', (SELECT id FROM locations WHERE slug = 'ward-8' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Pashupatinath Marg', 'pashupatinath-marg', 'area', (SELECT id FROM locations WHERE slug = 'ward-8' AND parent_id = 30101));

-- Ward 9 - Gaushala, Sinamangal, Laganlkol Marg
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 9', 'ward-9', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Gaushala', 'gaushala', 'area', (SELECT id FROM locations WHERE slug = 'ward-9' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sinamangal', 'sinamangal', 'area', (SELECT id FROM locations WHERE slug = 'ward-9' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Laganlkol Marg', 'laganlkol-marg', 'area', (SELECT id FROM locations WHERE slug = 'ward-9' AND parent_id = 30101));

-- Ward 10 - Baneshwor, New Baneshwor, Sajha Marg
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 10', 'ward-10', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Baneshwor', 'baneshwor', 'area', (SELECT id FROM locations WHERE slug = 'ward-10' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('New Baneshwor', 'new-baneshwor', 'area', (SELECT id FROM locations WHERE slug = 'ward-10' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sajha Marg', 'sajha-marg', 'area', (SELECT id FROM locations WHERE slug = 'ward-10' AND parent_id = 30101));

-- Ward 11 - Tripureshwor, Putalisadak
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 11', 'ward-11', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Tripureshwor', 'tripureshwor', 'area', (SELECT id FROM locations WHERE slug = 'ward-11' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Putalisadak', 'putalisadak', 'area', (SELECT id FROM locations WHERE slug = 'ward-11' AND parent_id = 30101));

-- Ward 12 - Teku, Gairigaon, Kuleshwor
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 12', 'ward-12', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Teku', 'teku', 'area', (SELECT id FROM locations WHERE slug = 'ward-12' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Gairigaon', 'gairigaon', 'area', (SELECT id FROM locations WHERE slug = 'ward-12' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kuleshwor', 'kuleshwor', 'area', (SELECT id FROM locations WHERE slug = 'ward-12' AND parent_id = 30101));

-- Ward 13 - Kalimati, Sorhakhutte, Tangal
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 13', 'ward-13', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kalimati', 'kalimati', 'area', (SELECT id FROM locations WHERE slug = 'ward-13' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sorhakhutte', 'sorhakhutte', 'area', (SELECT id FROM locations WHERE slug = 'ward-13' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Tangal', 'tangal', 'area', (SELECT id FROM locations WHERE slug = 'ward-13' AND parent_id = 30101));

-- Ward 14 - Kalanki, Gongabu, Samakhusi
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 14', 'ward-14', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kalanki', 'kalanki', 'area', (SELECT id FROM locations WHERE slug = 'ward-14' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Gongabu', 'gongabu', 'area', (SELECT id FROM locations WHERE slug = 'ward-14' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Samakhusi', 'samakhusi', 'area', (SELECT id FROM locations WHERE slug = 'ward-14' AND parent_id = 30101));

-- Ward 15 - Dallu, Chabahil, Swayambhu Marg
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 15', 'ward-15', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Dallu', 'dallu', 'area', (SELECT id FROM locations WHERE slug = 'ward-15' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chabahil', 'chabahil', 'area', (SELECT id FROM locations WHERE slug = 'ward-15' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Swayambhu Marg', 'swayambhu-marg', 'area', (SELECT id FROM locations WHERE slug = 'ward-15' AND parent_id = 30101));

-- Ward 16 - Sorhakhutte, Gairidhara, Bagbazar extension
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 16', 'ward-16', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sorhakhutte Ward 16', 'sorhakhutte-ward-16', 'area', (SELECT id FROM locations WHERE slug = 'ward-16' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Gairidhara Ward 16', 'gairidhara-ward-16', 'area', (SELECT id FROM locations WHERE slug = 'ward-16' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Bagbazar extension', 'bagbazar-extension', 'area', (SELECT id FROM locations WHERE slug = 'ward-16' AND parent_id = 30101));

-- Ward 17 - Chhauni, Jawalakhel, Satdobato
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 17', 'ward-17', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chhauni Ward 17', 'chhauni-ward-17', 'area', (SELECT id FROM locations WHERE slug = 'ward-17' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Jawalakhel', 'jawalakhel', 'area', (SELECT id FROM locations WHERE slug = 'ward-17' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Satdobato', 'satdobato', 'area', (SELECT id FROM locations WHERE slug = 'ward-17' AND parent_id = 30101));

-- Ward 18 - Kalighar, Lazimpat extension, Durbar Marg vicinity
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 18', 'ward-18', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kalighar', 'kalighar', 'area', (SELECT id FROM locations WHERE slug = 'ward-18' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Lazimpat extension', 'lazimpat-extension', 'area', (SELECT id FROM locations WHERE slug = 'ward-18' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Durbar Marg vicinity', 'durbar-marg-vicinity', 'area', (SELECT id FROM locations WHERE slug = 'ward-18' AND parent_id = 30101));

-- Ward 19 - Yatkha, Swayambhu, Bansbari marginal areas
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 19', 'ward-19', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Yatkha', 'yatkha', 'area', (SELECT id FROM locations WHERE slug = 'ward-19' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Swayambhu', 'swayambhu', 'area', (SELECT id FROM locations WHERE slug = 'ward-19' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Bansbari marginal areas', 'bansbari-marginal-areas', 'area', (SELECT id FROM locations WHERE slug = 'ward-19' AND parent_id = 30101));

-- Ward 20 - Chabahil, Pashupatinath side
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 20', 'ward-20', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chabahil Ward 20', 'chabahil-ward-20', 'area', (SELECT id FROM locations WHERE slug = 'ward-20' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Pashupatinath side', 'pashupatinath-side', 'area', (SELECT id FROM locations WHERE slug = 'ward-20' AND parent_id = 30101));

-- Ward 21 - Gairidhara, Lazimpat backstreets, Narayan Gopal Chowk
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 21', 'ward-21', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Gairidhara Ward 21', 'gairidhara-ward-21', 'area', (SELECT id FROM locations WHERE slug = 'ward-21' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Lazimpat backstreets', 'lazimpat-backstreets', 'area', (SELECT id FROM locations WHERE slug = 'ward-21' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Narayan Gopal Chowk', 'narayan-gopal-chowk', 'area', (SELECT id FROM locations WHERE slug = 'ward-21' AND parent_id = 30101));

-- Ward 22 - Gyaneshwar, Rabi Bhawan area, New Baneshwor outskirts
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 22', 'ward-22', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Gyaneshwar', 'gyaneshwar', 'area', (SELECT id FROM locations WHERE slug = 'ward-22' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Rabi Bhawan area', 'rabi-bhawan-area', 'area', (SELECT id FROM locations WHERE slug = 'ward-22' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('New Baneshwor outskirts', 'new-baneshwor-outskirts', 'area', (SELECT id FROM locations WHERE slug = 'ward-22' AND parent_id = 30101));

-- Ward 23 - Lainchaur, New Road fringes, Kathmandu Durbar Square side
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 23', 'ward-23', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Lainchaur', 'lainchaur', 'area', (SELECT id FROM locations WHERE slug = 'ward-23' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('New Road fringes', 'new-road-fringes', 'area', (SELECT id FROM locations WHERE slug = 'ward-23' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kathmandu Durbar Square side', 'kathmandu-durbar-square-side', 'area', (SELECT id FROM locations WHERE slug = 'ward-23' AND parent_id = 30101));

-- Ward 24 - New Road, Indra Chowk, Asan
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 24', 'ward-24', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('New Road', 'new-road', 'area', (SELECT id FROM locations WHERE slug = 'ward-24' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Indra Chowk', 'indra-chowk', 'area', (SELECT id FROM locations WHERE slug = 'ward-24' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Asan', 'asan', 'area', (SELECT id FROM locations WHERE slug = 'ward-24' AND parent_id = 30101));

-- Ward 25 - Durbarmarg, Thamel, Chhaya Devi area
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 25', 'ward-25', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Durbarmarg', 'durbarmarg', 'area', (SELECT id FROM locations WHERE slug = 'ward-25' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Thamel', 'thamel', 'area', (SELECT id FROM locations WHERE slug = 'ward-25' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chhaya Devi area', 'chhaya-devi-area', 'area', (SELECT id FROM locations WHERE slug = 'ward-25' AND parent_id = 30101));

-- Ward 26 - Kamaladi, Chhetrapati, Ason side
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 26', 'ward-26', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Kamaladi', 'kamaladi', 'area', (SELECT id FROM locations WHERE slug = 'ward-26' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Chhetrapati', 'chhetrapati', 'area', (SELECT id FROM locations WHERE slug = 'ward-26' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ason side', 'ason-side', 'area', (SELECT id FROM locations WHERE slug = 'ward-26' AND parent_id = 30101));

-- Ward 27 - Hattsar, Sundhara, Jamal vicinity
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 27', 'ward-27', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Hattsar', 'hattsar', 'area', (SELECT id FROM locations WHERE slug = 'ward-27' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sundhara', 'sundhara', 'area', (SELECT id FROM locations WHERE slug = 'ward-27' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Jamal vicinity', 'jamal-vicinity', 'area', (SELECT id FROM locations WHERE slug = 'ward-27' AND parent_id = 30101));

-- Ward 28 - Anamnagar, Maitighar extension, Lazimpat backstreets
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 28', 'ward-28', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Anamnagar', 'anamnagar', 'area', (SELECT id FROM locations WHERE slug = 'ward-28' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Maitighar extension', 'maitighar-extension', 'area', (SELECT id FROM locations WHERE slug = 'ward-28' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Lazimpat backstreets Ward 28', 'lazimpat-backstreets-ward-28', 'area', (SELECT id FROM locations WHERE slug = 'ward-28' AND parent_id = 30101));

-- Ward 29 - Dilli Bazaar, Indrachowk, Putalisadak backstreets
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 29', 'ward-29', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Dilli Bazaar', 'dilli-bazaar', 'area', (SELECT id FROM locations WHERE slug = 'ward-29' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Indrachowk', 'indrachowk', 'area', (SELECT id FROM locations WHERE slug = 'ward-29' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Putalisadak backstreets', 'putalisadak-backstreets', 'area', (SELECT id FROM locations WHERE slug = 'ward-29' AND parent_id = 30101));

-- Ward 30 - Bagbazar, Jorpati, Teku extension
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 30', 'ward-30', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Bagbazar', 'bagbazar', 'area', (SELECT id FROM locations WHERE slug = 'ward-30' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Jorpati', 'jorpati', 'area', (SELECT id FROM locations WHERE slug = 'ward-30' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Teku extension', 'teku-extension', 'area', (SELECT id FROM locations WHERE slug = 'ward-30' AND parent_id = 30101));

-- Ward 31 - Koteshwor, Balkhu, Thapathali outskirts
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 31', 'ward-31', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Koteshwor', 'koteshwor', 'area', (SELECT id FROM locations WHERE slug = 'ward-31' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Balkhu', 'balkhu', 'area', (SELECT id FROM locations WHERE slug = 'ward-31' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Thapathali outskirts', 'thapathali-outskirts', 'area', (SELECT id FROM locations WHERE slug = 'ward-31' AND parent_id = 30101));

-- Ward 32 - Koteshwor Mahadevsthan, Boudia outskirts, Sankhamul
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Ward 32', 'ward-32', 'ward', 30101);
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Koteshwor Mahadevsthan', 'koteshwor-mahadevsthan', 'area', (SELECT id FROM locations WHERE slug = 'ward-32' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Boudia outskirts', 'boudia-outskirts', 'area', (SELECT id FROM locations WHERE slug = 'ward-32' AND parent_id = 30101));
INSERT INTO locations (name, slug, type, parent_id) VALUES ('Sankhamul', 'sankhamul', 'area', (SELECT id FROM locations WHERE slug = 'ward-32' AND parent_id = 30101));
