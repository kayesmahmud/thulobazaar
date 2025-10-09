-- Migration: Complete Nepal Location Hierarchy
-- This migration populates all 7 provinces, 77 districts, and 753 municipalities

-- First, update any existing ads and users to reference safe location IDs
-- We'll move them to Nepal's capital Kathmandu (will be ID 30101)
UPDATE ads SET location_id = NULL WHERE location_id IS NOT NULL;
UPDATE users SET location_id = NULL WHERE location_id IS NOT NULL;

-- Now clear all existing location data
DELETE FROM locations;

-- Reset the sequence
ALTER SEQUENCE locations_id_seq RESTART WITH 1;

-- ============================================
-- PROVINCE 1: KOSHI PROVINCE
-- ============================================

INSERT INTO locations (id, name, type, parent_id) VALUES (1, 'Koshi Province', 'province', NULL);

-- Koshi Districts
INSERT INTO locations (id, name, type, parent_id) VALUES
(101, 'Bhojpur', 'district', 1),
(102, 'Dhankuta', 'district', 1),
(103, 'Ilam', 'district', 1),
(104, 'Jhapa', 'district', 1),
(105, 'Khotang', 'district', 1),
(106, 'Morang', 'district', 1),
(107, 'Okhaldhunga', 'district', 1),
(108, 'Panchthar', 'district', 1),
(109, 'Sankhuwasabha', 'district', 1),
(110, 'Solukhumbu', 'district', 1),
(111, 'Sunsari', 'district', 1),
(112, 'Taplejung', 'district', 1),
(113, 'Terhathum', 'district', 1),
(114, 'Udayapur', 'district', 1);

-- Bhojpur Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10101, 'Bhojpur Municipality', 'municipality', 101),
(10102, 'Shadananda Municipality', 'municipality', 101),
(10103, 'Hatuwagadhi Rural Municipality', 'municipality', 101),
(10104, 'Ramprasad Rai Rural Municipality', 'municipality', 101),
(10105, 'Aamchowk Rural Municipality', 'municipality', 101),
(10106, 'Tyamke Maiyum Rural Municipality', 'municipality', 101),
(10107, 'Pauwadungma Rural Municipality', 'municipality', 101),
(10108, 'Salpasilichho Rural Municipality', 'municipality', 101),
(10109, 'Arun Rural Municipality', 'municipality', 101);

-- Dhankuta Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10201, 'Dhankuta Municipality', 'municipality', 102),
(10202, 'Mahalaxmi Municipality', 'municipality', 102),
(10203, 'Pakhribas Municipality', 'municipality', 102),
(10204, 'Sangurigadhi Rural Municipality', 'municipality', 102),
(10205, 'Chaubise Rural Municipality', 'municipality', 102),
(10206, 'Shahidbhumi Rural Municipality', 'municipality', 102),
(10207, 'Chhathar Jorpati Rural Municipality', 'municipality', 102);

-- Ilam Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10301, 'Ilam Municipality', 'municipality', 103),
(10302, 'Deumai Municipality', 'municipality', 103),
(10303, 'Mai Municipality', 'municipality', 103),
(10304, 'Suryodaya Municipality', 'municipality', 103),
(10305, 'Phakphokthum Rural Municipality', 'municipality', 103),
(10306, 'Mangsebung Rural Municipality', 'municipality', 103),
(10307, 'Rong Rural Municipality', 'municipality', 103),
(10308, 'Sandakpur Rural Municipality', 'municipality', 103),
(10309, 'Chulachuli Rural Municipality', 'municipality', 103),
(10310, 'Maijogmai Rural Municipality', 'municipality', 103);

-- Jhapa Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10401, 'Bhadrapur Municipality', 'municipality', 104),
(10402, 'Mechinagar Municipality', 'municipality', 104),
(10403, 'Damak Municipality', 'municipality', 104),
(10404, 'Arjundhara Municipality', 'municipality', 104),
(10405, 'Gauradaha Municipality', 'municipality', 104),
(10406, 'Kankai Municipality', 'municipality', 104),
(10407, 'Shivasatakshi Municipality', 'municipality', 104),
(10408, 'Kamal Rural Municipality', 'municipality', 104),
(10409, 'Gauriganj Rural Municipality', 'municipality', 104),
(10410, 'Haldibari Rural Municipality', 'municipality', 104),
(10411, 'Jhapa Rural Municipality', 'municipality', 104),
(10412, 'Barhadashi Rural Municipality', 'municipality', 104),
(10413, 'Buddhashanti Rural Municipality', 'municipality', 104),
(10414, 'Kachankawal Rural Municipality', 'municipality', 104),
(10415, 'Birtamod Municipality', 'municipality', 104);

-- Khotang Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10501, 'Diktel Rupakot Majhuwagadhi Municipality', 'municipality', 105),
(10502, 'Halesi Tuwachung Municipality', 'municipality', 105),
(10503, 'Khotehang Rural Municipality', 'municipality', 105),
(10504, 'Diprung Rural Municipality', 'municipality', 105),
(10505, 'Aiselukharka Rural Municipality', 'municipality', 105),
(10506, 'Jantedhunga Rural Municipality', 'municipality', 105),
(10507, 'Kepilasgadhi Rural Municipality', 'municipality', 105),
(10508, 'Barahapokhari Rural Municipality', 'municipality', 105),
(10509, 'Rawabesi Rural Municipality', 'municipality', 105),
(10510, 'Sakela Rural Municipality', 'municipality', 105);

-- Morang Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10601, 'Biratnagar Metropolitan City', 'municipality', 106),
(10602, 'Sundarharaicha Municipality', 'municipality', 106),
(10603, 'Belbari Municipality', 'municipality', 106),
(10604, 'Pathari Sanischare Municipality', 'municipality', 106),
(10605, 'Urlabari Municipality', 'municipality', 106),
(10606, 'Rangeli Municipality', 'municipality', 106),
(10607, 'Letang Municipality', 'municipality', 106),
(10608, 'Sunbarshi Municipality', 'municipality', 106),
(10609, 'Budhiganga Rural Municipality', 'municipality', 106),
(10610, 'Gramthan Rural Municipality', 'municipality', 106),
(10611, 'Jahada Rural Municipality', 'municipality', 106),
(10612, 'Kanepokhari Rural Municipality', 'municipality', 106),
(10613, 'Katahari Rural Municipality', 'municipality', 106),
(10614, 'Kerabari Rural Municipality', 'municipality', 106),
(10615, 'Miklajung Rural Municipality', 'municipality', 106),
(10616, 'Dhanpalthan Rural Municipality', 'municipality', 106),
(10617, 'Ratuwamai Municipality', 'municipality', 106);

-- Okhaldhunga Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10701, 'Siddhicharan Municipality', 'municipality', 107),
(10702, 'Champadevi Rural Municipality', 'municipality', 107),
(10703, 'Chisankhugadhi Rural Municipality', 'municipality', 107),
(10704, 'Khijidemba Rural Municipality', 'municipality', 107),
(10705, 'Likhu Rural Municipality', 'municipality', 107),
(10706, 'Manebhanjyang Rural Municipality', 'municipality', 107),
(10707, 'Molung Rural Municipality', 'municipality', 107),
(10708, 'Sunkoshi Rural Municipality', 'municipality', 107);

-- Panchthar Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10801, 'Phidim Municipality', 'municipality', 108),
(10802, 'Hilihang Rural Municipality', 'municipality', 108),
(10803, 'Kummayak Rural Municipality', 'municipality', 108),
(10804, 'Miklajung Rural Municipality', 'municipality', 108),
(10805, 'Phalelung Rural Municipality', 'municipality', 108),
(10806, 'Phalgunanda Rural Municipality', 'municipality', 108),
(10807, 'Tumbewa Rural Municipality', 'municipality', 108),
(10808, 'Yangwarak Rural Municipality', 'municipality', 108);

-- Sankhuwasabha Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(10901, 'Khandbari Municipality', 'municipality', 109),
(10902, 'Chainpur Municipality', 'municipality', 109),
(10903, 'Dharmadevi Municipality', 'municipality', 109),
(10904, 'Madi Municipality', 'municipality', 109),
(10905, 'Panchkhapan Municipality', 'municipality', 109),
(10906, 'Makalu Rural Municipality', 'municipality', 109),
(10907, 'Silichong Rural Municipality', 'municipality', 109),
(10908, 'Sabhapokhari Rural Municipality', 'municipality', 109),
(10909, 'Chichila Rural Municipality', 'municipality', 109),
(10910, 'Bhotkhola Rural Municipality', 'municipality', 109);

-- Solukhumbu Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(11001, 'Solududhakunda Municipality', 'municipality', 110),
(11002, 'Khumbu Pasanglhamu Rural Municipality', 'municipality', 110),
(11003, 'Mahakulung Rural Municipality', 'municipality', 110),
(11004, 'Necha Salyan Rural Municipality', 'municipality', 110),
(11005, 'Sotang Rural Municipality', 'municipality', 110),
(11006, 'Likhupike Rural Municipality', 'municipality', 110),
(11007, 'Thulung Dudhkoshi Rural Municipality', 'municipality', 110),
(11008, 'Mapya Dudhkoshi Rural Municipality', 'municipality', 110);

-- Sunsari Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(11101, 'Itahari Sub-Metropolitan City', 'municipality', 111),
(11102, 'Dharan Sub-Metropolitan City', 'municipality', 111),
(11103, 'Inaruwa Municipality', 'municipality', 111),
(11104, 'Duhabi Municipality', 'municipality', 111),
(11105, 'Ramdhuni Municipality', 'municipality', 111),
(11106, 'Barahachhetra Municipality', 'municipality', 111),
(11107, 'Koshi Rural Municipality', 'municipality', 111),
(11108, 'Gadhi Rural Municipality', 'municipality', 111),
(11109, 'Barjung Rural Municipality', 'municipality', 111),
(11110, 'Bhokraha Rural Municipality', 'municipality', 111),
(11111, 'Harinagar Rural Municipality', 'municipality', 111),
(11112, 'Dewanganj Rural Municipality', 'municipality', 111);

-- Taplejung Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(11201, 'Phungling Municipality', 'municipality', 112),
(11202, 'Aathrai Triveni Rural Municipality', 'municipality', 112),
(11203, 'Sidingwa Rural Municipality', 'municipality', 112),
(11204, 'Phaktanglung Rural Municipality', 'municipality', 112),
(11205, 'Meringden Rural Municipality', 'municipality', 112),
(11206, 'Maiwakhola Rural Municipality', 'municipality', 112),
(11207, 'Mikwakhola Rural Municipality', 'municipality', 112),
(11208, 'Pathivara Yangwarak Rural Municipality', 'municipality', 112),
(11209, 'Sirijangha Rural Municipality', 'municipality', 112);

-- Terhathum Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(11301, 'Myanglung Municipality', 'municipality', 113),
(11302, 'Laligurans Municipality', 'municipality', 113),
(11303, 'Aathrai Rural Municipality', 'municipality', 113),
(11304, 'Chhathar Rural Municipality', 'municipality', 113),
(11305, 'Phedap Rural Municipality', 'municipality', 113),
(11306, 'Menchhayayem Rural Municipality', 'municipality', 113);

-- Udayapur Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(11401, 'Triyuga Municipality', 'municipality', 114),
(11402, 'Katari Municipality', 'municipality', 114),
(11403, 'Chaudandigadhi Municipality', 'municipality', 114),
(11404, 'Belaka Municipality', 'municipality', 114),
(11405, 'Udayapurgadhi Rural Municipality', 'municipality', 114),
(11406, 'Rautamai Rural Municipality', 'municipality', 114),
(11407, 'Tapli Rural Municipality', 'municipality', 114),
(11408, 'Limchungbung Rural Municipality', 'municipality', 114);

-- ============================================
-- PROVINCE 2: MADHESH PROVINCE
-- ============================================

INSERT INTO locations (id, name, type, parent_id) VALUES (2, 'Madhesh Province', 'province', NULL);

-- Madhesh Districts
INSERT INTO locations (id, name, type, parent_id) VALUES
(201, 'Bara', 'district', 2),
(202, 'Dhanusha', 'district', 2),
(203, 'Mahottari', 'district', 2),
(204, 'Parsa', 'district', 2),
(205, 'Rautahat', 'district', 2),
(206, 'Saptari', 'district', 2),
(207, 'Sarlahi', 'district', 2),
(208, 'Siraha', 'district', 2);

-- Bara Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20101, 'Kalaiya Sub-Metropolitan City', 'municipality', 201),
(20102, 'Jeetpur Simara Sub-Metropolitan City', 'municipality', 201),
(20103, 'Nijgadh Municipality', 'municipality', 201),
(20104, 'Kolhabi Municipality', 'municipality', 201),
(20105, 'Mahagadhimai Municipality', 'municipality', 201),
(20106, 'Simraungadh Municipality', 'municipality', 201),
(20107, 'Pachrauta Municipality', 'municipality', 201),
(20108, 'Pheta Rural Municipality', 'municipality', 201),
(20109, 'Bishrampur Rural Municipality', 'municipality', 201),
(20110, 'Prasauni Rural Municipality', 'municipality', 201),
(20111, 'Suvarna Rural Municipality', 'municipality', 201),
(20112, 'Baragadhi Rural Municipality', 'municipality', 201),
(20113, 'Parwanipur Rural Municipality', 'municipality', 201),
(20114, 'Adarsh Kotwal Rural Municipality', 'municipality', 201),
(20115, 'Karaiyamai Rural Municipality', 'municipality', 201),
(20116, 'Devtal Rural Municipality', 'municipality', 201);

-- Dhanusha Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20201, 'Janakpur Sub-Metropolitan City', 'municipality', 202),
(20202, 'Chhireshwarnath Municipality', 'municipality', 202),
(20203, 'Ganeshman Charnath Municipality', 'municipality', 202),
(20204, 'Dhanushadham Municipality', 'municipality', 202),
(20205, 'Mithila Municipality', 'municipality', 202),
(20206, 'Shahidnagar Municipality', 'municipality', 202),
(20207, 'Sabaila Municipality', 'municipality', 202),
(20208, 'Nagarain Municipality', 'municipality', 202),
(20209, 'Kamala Municipality', 'municipality', 202),
(20210, 'Bateshwar Rural Municipality', 'municipality', 202),
(20211, 'Mukhiyapatti Musaharmiya Rural Municipality', 'municipality', 202),
(20212, 'Aaurahi Rural Municipality', 'municipality', 202),
(20213, 'Janak Nandini Rural Municipality', 'municipality', 202),
(20214, 'Laxminiya Rural Municipality', 'municipality', 202),
(20215, 'Hansapur Municipality', 'municipality', 202),
(20216, 'Dhanauji Rural Municipality', 'municipality', 202),
(20217, 'Mithila Bihari Municipality', 'municipality', 202),
(20218, 'Bideha Municipality', 'municipality', 202);

-- Mahottari Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20301, 'Jaleshwar Municipality', 'municipality', 203),
(20302, 'Bardibas Municipality', 'municipality', 203),
(20303, 'Gaushala Municipality', 'municipality', 203),
(20304, 'Loharpatti Municipality', 'municipality', 203),
(20305, 'Ramgopalpur Municipality', 'municipality', 203),
(20306, 'Manara Shiswa Municipality', 'municipality', 203),
(20307, 'Matihani Municipality', 'municipality', 203),
(20308, 'Balwa Municipality', 'municipality', 203),
(20309, 'Bhangaha Municipality', 'municipality', 203),
(20310, 'Aurahi Rural Municipality', 'municipality', 203),
(20311, 'Ekdara Rural Municipality', 'municipality', 203),
(20312, 'Mahottari Rural Municipality', 'municipality', 203),
(20313, 'Pipra Rural Municipality', 'municipality', 203),
(20314, 'Samsi Rural Municipality', 'municipality', 203),
(20315, 'Sonama Rural Municipality', 'municipality', 203);

-- Parsa Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20401, 'Birgunj Metropolitan City', 'municipality', 204),
(20402, 'Bahudaramai Municipality', 'municipality', 204),
(20403, 'Parsagadhi Municipality', 'municipality', 204),
(20404, 'Pokhariya Municipality', 'municipality', 204),
(20405, 'Bindabasini Rural Municipality', 'municipality', 204),
(20406, 'Dhobini Rural Municipality', 'municipality', 204),
(20407, 'Chhipaharmai Rural Municipality', 'municipality', 204),
(20408, 'Jagarnathpur Rural Municipality', 'municipality', 204),
(20409, 'Jirabhawani Rural Municipality', 'municipality', 204),
(20410, 'Kalikamai Rural Municipality', 'municipality', 204),
(20411, 'Paterwa Sugauli Rural Municipality', 'municipality', 204),
(20412, 'Sakhuwa Prasauni Rural Municipality', 'municipality', 204),
(20413, 'Thori Rural Municipality', 'municipality', 204),
(20414, 'Pakaha Mainpur Rural Municipality', 'municipality', 204);

-- Rautahat Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20501, 'Chandrapur Municipality', 'municipality', 205),
(20502, 'Garuda Municipality', 'municipality', 205),
(20503, 'Gaur Municipality', 'municipality', 205),
(20504, 'Baudhimai Municipality', 'municipality', 205),
(20505, 'Brindaban Municipality', 'municipality', 205),
(20506, 'Dewahi Gonahi Municipality', 'municipality', 205),
(20507, 'Gadhimai Municipality', 'municipality', 205),
(20508, 'Gujara Municipality', 'municipality', 205),
(20509, 'Ishnath Municipality', 'municipality', 205),
(20510, 'Katahariya Municipality', 'municipality', 205),
(20511, 'Madhav Narayan Municipality', 'municipality', 205),
(20512, 'Maulapur Municipality', 'municipality', 205),
(20513, 'Paroha Municipality', 'municipality', 205),
(20514, 'Phatuwa Bijayapur Municipality', 'municipality', 205),
(20515, 'Rajdevi Municipality', 'municipality', 205),
(20516, 'Rajpur Municipality', 'municipality', 205),
(20517, 'Durga Bhagwati Rural Municipality', 'municipality', 205),
(20518, 'Yamunamai Rural Municipality', 'municipality', 205);

-- Saptari Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20601, 'Rajbiraj Municipality', 'municipality', 206),
(20602, 'Bodebarsain Municipality', 'municipality', 206),
(20603, 'Dakneshwari Municipality', 'municipality', 206),
(20604, 'Hanumannagar Kankalini Municipality', 'municipality', 206),
(20605, 'Kanchanrup Municipality', 'municipality', 206),
(20606, 'Khadak Municipality', 'municipality', 206),
(20607, 'Shambhunath Municipality', 'municipality', 206),
(20608, 'Saptakoshi Municipality', 'municipality', 206),
(20609, 'Surunga Municipality', 'municipality', 206),
(20610, 'Agnisair Krishna Savaran Rural Municipality', 'municipality', 206),
(20611, 'Bishnupur Rural Municipality', 'municipality', 206),
(20612, 'Chhinnamasta Rural Municipality', 'municipality', 206),
(20613, 'Mahadeva Rural Municipality', 'municipality', 206),
(20614, 'Rajgadh Rural Municipality', 'municipality', 206),
(20615, 'Rupani Rural Municipality', 'municipality', 206),
(20616, 'Tirahut Rural Municipality', 'municipality', 206),
(20617, 'Tilathi Koiladi Rural Municipality', 'municipality', 206),
(20618, 'Balan Bihul Rural Municipality', 'municipality', 206);

-- Sarlahi Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20701, 'Bagmati Municipality', 'municipality', 207),
(20702, 'Balara Municipality', 'municipality', 207),
(20703, 'Barahathwa Municipality', 'municipality', 207),
(20704, 'Godaita Municipality', 'municipality', 207),
(20705, 'Haripur Municipality', 'municipality', 207),
(20706, 'Haripurwa Municipality', 'municipality', 207),
(20707, 'Hariwan Municipality', 'municipality', 207),
(20708, 'Ishworpur Municipality', 'municipality', 207),
(20709, 'Kabilasi Municipality', 'municipality', 207),
(20710, 'Lalbandi Municipality', 'municipality', 207),
(20711, 'Malangwa Municipality', 'municipality', 207),
(20712, 'Basbariya Rural Municipality', 'municipality', 207),
(20713, 'Bishnu Rural Municipality', 'municipality', 207),
(20714, 'Brahmapuri Rural Municipality', 'municipality', 207),
(20715, 'Chakraghatta Rural Municipality', 'municipality', 207),
(20716, 'Chandranagar Rural Municipality', 'municipality', 207),
(20717, 'Dhankaul Rural Municipality', 'municipality', 207),
(20718, 'Kaudena Rural Municipality', 'municipality', 207),
(20719, 'Parsa Rural Municipality', 'municipality', 207),
(20720, 'Ramnagar Rural Municipality', 'municipality', 207);

-- Siraha Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(20801, 'Lahan Municipality', 'municipality', 208),
(20802, 'Dhangadhimai Municipality', 'municipality', 208),
(20803, 'Siraha Municipality', 'municipality', 208),
(20804, 'Golbazar Municipality', 'municipality', 208),
(20805, 'Mirchaiya Municipality', 'municipality', 208),
(20806, 'Kalyanpur Municipality', 'municipality', 208),
(20807, 'Karjanha Municipality', 'municipality', 208),
(20808, 'Sukhipur Municipality', 'municipality', 208),
(20809, 'Bhagwanpur Rural Municipality', 'municipality', 208),
(20810, 'Aurahi Rural Municipality', 'municipality', 208),
(20811, 'Bishnupur Rural Municipality', 'municipality', 208),
(20812, 'Bariyarpatti Rural Municipality', 'municipality', 208),
(20813, 'Laxmipur Patari Rural Municipality', 'municipality', 208),
(20814, 'Naraha Rural Municipality', 'municipality', 208),
(20815, 'Sakhuwa Nankarkatti Rural Municipality', 'municipality', 208),
(20816, 'Arnama Rural Municipality', 'municipality', 208),
(20817, 'Navarajpur Rural Municipality', 'municipality', 208);

-- ============================================
-- PROVINCE 3: BAGMATI PROVINCE
-- ============================================

INSERT INTO locations (id, name, type, parent_id) VALUES (3, 'Bagmati Province', 'province', NULL);

-- Bagmati Districts
INSERT INTO locations (id, name, type, parent_id) VALUES
(301, 'Kathmandu', 'district', 3),
(302, 'Lalitpur', 'district', 3),
(303, 'Bhaktapur', 'district', 3),
(304, 'Chitwan', 'district', 3),
(305, 'Makwanpur', 'district', 3),
(306, 'Dhading', 'district', 3),
(307, 'Nuwakot', 'district', 3),
(308, 'Rasuwa', 'district', 3),
(309, 'Sindhuli', 'district', 3),
(310, 'Ramechhap', 'district', 3),
(311, 'Dolakha', 'district', 3),
(312, 'Sindhupalchok', 'district', 3),
(313, 'Kavrepalanchok', 'district', 3);

-- Kathmandu Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30101, 'Kathmandu Metropolitan City', 'municipality', 301),
(30102, 'Budhanilkantha Municipality', 'municipality', 301),
(30103, 'Chandragiri Municipality', 'municipality', 301),
(30104, 'Dakshinkali Municipality', 'municipality', 301),
(30105, 'Gokarneshwor Municipality', 'municipality', 301),
(30106, 'Kageshwori Manohara Municipality', 'municipality', 301),
(30107, 'Kirtipur Municipality', 'municipality', 301),
(30108, 'Nagarjun Municipality', 'municipality', 301),
(30109, 'Shankharapur Municipality', 'municipality', 301),
(30110, 'Tarakeshwar Municipality', 'municipality', 301),
(30111, 'Tokha Municipality', 'municipality', 301);

-- Lalitpur Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30201, 'Lalitpur Metropolitan City', 'municipality', 302),
(30202, 'Godawari Municipality', 'municipality', 302),
(30203, 'Mahalaxmi Municipality', 'municipality', 302),
(30204, 'Konjyosom Rural Municipality', 'municipality', 302),
(30205, 'Bagmati Rural Municipality', 'municipality', 302),
(30206, 'Mahankal Rural Municipality', 'municipality', 302);

-- Bhaktapur Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30301, 'Bhaktapur Municipality', 'municipality', 303),
(30302, 'Changunarayan Municipality', 'municipality', 303),
(30303, 'Madhyapur Thimi Municipality', 'municipality', 303),
(30304, 'Suryabinayak Municipality', 'municipality', 303);

-- Chitwan Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30401, 'Bharatpur Metropolitan City', 'municipality', 304),
(30402, 'Kalika Municipality', 'municipality', 304),
(30403, 'Khairahani Municipality', 'municipality', 304),
(30404, 'Madi Municipality', 'municipality', 304),
(30405, 'Ratnanagar Municipality', 'municipality', 304),
(30406, 'Rapti Municipality', 'municipality', 304),
(30407, 'Ichchhakamana Rural Municipality', 'municipality', 304);

-- Makwanpur Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30501, 'Hetauda Sub-Metropolitan City', 'municipality', 305),
(30502, 'Thaha Municipality', 'municipality', 305),
(30503, 'Bhimphedi Rural Municipality', 'municipality', 305),
(30504, 'Makawanpurgadhi Rural Municipality', 'municipality', 305),
(30505, 'Manahari Rural Municipality', 'municipality', 305),
(30506, 'Raksirang Rural Municipality', 'municipality', 305),
(30507, 'Bakaiya Rural Municipality', 'municipality', 305),
(30508, 'Bagmati Rural Municipality', 'municipality', 305),
(30509, 'Kailash Rural Municipality', 'municipality', 305),
(30510, 'Indrasarowar Rural Municipality', 'municipality', 305);

-- Dhading Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30601, 'Dhading Besi Municipality', 'municipality', 306),
(30602, 'Nilkantha Municipality', 'municipality', 306),
(30603, 'Khaniyabas Rural Municipality', 'municipality', 306),
(30604, 'Gajuri Rural Municipality', 'municipality', 306),
(30605, 'Galchi Rural Municipality', 'municipality', 306),
(30606, 'Gangajamuna Rural Municipality', 'municipality', 306),
(30607, 'Jwalamukhi Rural Municipality', 'municipality', 306),
(30608, 'Netrawati Dabjong Rural Municipality', 'municipality', 306),
(30609, 'Benighat Rorang Rural Municipality', 'municipality', 306),
(30610, 'Ruby Valley Rural Municipality', 'municipality', 306),
(30611, 'Siddhalek Rural Municipality', 'municipality', 306),
(30612, 'Thakre Rural Municipality', 'municipality', 306),
(30613, 'Tripura Sundari Rural Municipality', 'municipality', 306);

-- Nuwakot Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30701, 'Bidur Municipality', 'municipality', 307),
(30702, 'Belkotgadhi Municipality', 'municipality', 307),
(30703, 'Kakani Rural Municipality', 'municipality', 307),
(30704, 'Kispang Rural Municipality', 'municipality', 307),
(30705, 'Likhu Rural Municipality', 'municipality', 307),
(30706, 'Myagang Rural Municipality', 'municipality', 307),
(30707, 'Panchakanya Rural Municipality', 'municipality', 307),
(30708, 'Shivapuri Rural Municipality', 'municipality', 307),
(30709, 'Dupcheshwor Rural Municipality', 'municipality', 307),
(30710, 'Suryagadhi Rural Municipality', 'municipality', 307),
(30711, 'Tadi Rural Municipality', 'municipality', 307),
(30712, 'Tarkeshwar Rural Municipality', 'municipality', 307);

-- Rasuwa Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30801, 'Gosaikunda Rural Municipality', 'municipality', 308),
(30802, 'Kalika Rural Municipality', 'municipality', 308),
(30803, 'Naukunda Rural Municipality', 'municipality', 308),
(30804, 'Parbatikunda Rural Municipality', 'municipality', 308),
(30805, 'Uttargaya Rural Municipality', 'municipality', 308);

-- Sindhuli Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(30901, 'Kamalamai Municipality', 'municipality', 309),
(30902, 'Dudhouli Municipality', 'municipality', 309),
(30903, 'Golanjor Rural Municipality', 'municipality', 309),
(30904, 'Ghyanglekh Rural Municipality', 'municipality', 309),
(30905, 'Hariharpurgadhi Rural Municipality', 'municipality', 309),
(30906, 'Marin Rural Municipality', 'municipality', 309),
(30907, 'Phikkal Rural Municipality', 'municipality', 309),
(30908, 'Sunkoshi Rural Municipality', 'municipality', 309),
(30909, 'Tinpatan Rural Municipality', 'municipality', 309);

-- Ramechhap Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(31001, 'Ramechhap Municipality', 'municipality', 310),
(31002, 'Manthali Municipality', 'municipality', 310),
(31003, 'Umakunda Rural Municipality', 'municipality', 310),
(31004, 'Khandadevi Rural Municipality', 'municipality', 310),
(31005, 'Likhu Tamakoshi Rural Municipality', 'municipality', 310),
(31006, 'Doramba Rural Municipality', 'municipality', 310),
(31007, 'Gokulganga Rural Municipality', 'municipality', 310),
(31008, 'Sunapati Rural Municipality', 'municipality', 310);

-- Dolakha Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(31101, 'Bhimeshwar Municipality', 'municipality', 311),
(31102, 'Jiri Municipality', 'municipality', 311),
(31103, 'Baiteshwor Rural Municipality', 'municipality', 311),
(31104, 'Bigu Rural Municipality', 'municipality', 311),
(31105, 'Gaurishankar Rural Municipality', 'municipality', 311),
(31106, 'Kalinchok Rural Municipality', 'municipality', 311),
(31107, 'Melung Rural Municipality', 'municipality', 311),
(31108, 'Sailung Rural Municipality', 'municipality', 311),
(31109, 'Tamakoshi Rural Municipality', 'municipality', 311);

-- Sindhupalchok Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(31201, 'Chautara Sangachokgadhi Municipality', 'municipality', 312),
(31202, 'Barhabise Municipality', 'municipality', 312),
(31203, 'Melamchi Municipality', 'municipality', 312),
(31204, 'Balefi Rural Municipality', 'municipality', 312),
(31205, 'Bhotekoshi Rural Municipality', 'municipality', 312),
(31206, 'Helambu Rural Municipality', 'municipality', 312),
(31207, 'Indrawati Rural Municipality', 'municipality', 312),
(31208, 'Jugal Rural Municipality', 'municipality', 312),
(31209, 'Lisankhu Pakhar Rural Municipality', 'municipality', 312),
(31210, 'Panchpokhari Thangpal Rural Municipality', 'municipality', 312),
(31211, 'Sunkoshi Rural Municipality', 'municipality', 312),
(31212, 'Tripurasundari Rural Municipality', 'municipality', 312);

-- Kavrepalanchok Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(31301, 'Dhulikhel Municipality', 'municipality', 313),
(31302, 'Banepa Municipality', 'municipality', 313),
(31303, 'Panauti Municipality', 'municipality', 313),
(31304, 'Panchkhal Municipality', 'municipality', 313),
(31305, 'Namobuddha Municipality', 'municipality', 313),
(31306, 'Mandan Deupur Municipality', 'municipality', 313),
(31307, 'Khanikhola Rural Municipality', 'municipality', 313),
(31308, 'Chauri Deurali Rural Municipality', 'municipality', 313),
(31309, 'Temal Rural Municipality', 'municipality', 313),
(31310, 'Bethanchok Rural Municipality', 'municipality', 313),
(31311, 'Bhumlu Rural Municipality', 'municipality', 313),
(31312, 'Mahabharat Rural Municipality', 'municipality', 313),
(31313, 'Roshi Rural Municipality', 'municipality', 313);

-- ============================================
-- PROVINCE 4: GANDAKI PROVINCE
-- ============================================

INSERT INTO locations (id, name, type, parent_id) VALUES (4, 'Gandaki Province', 'province', NULL);

-- Gandaki Districts
INSERT INTO locations (id, name, type, parent_id) VALUES
(401, 'Gorkha', 'district', 4),
(402, 'Lamjung', 'district', 4),
(403, 'Kaski', 'district', 4),
(404, 'Manang', 'district', 4),
(405, 'Mustang', 'district', 4),
(406, 'Nawalpur', 'district', 4),
(407, 'Syangja', 'district', 4),
(408, 'Tanahun', 'district', 4),
(409, 'Parbat', 'district', 4),
(410, 'Baglung', 'district', 4),
(411, 'Myagdi', 'district', 4);

-- Gorkha Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40101, 'Gorkha Municipality', 'municipality', 401),
(40102, 'Palungtar Municipality', 'municipality', 401),
(40103, 'Sulikot Rural Municipality', 'municipality', 401),
(40104, 'Siranchok Rural Municipality', 'municipality', 401),
(40105, 'Ajirkot Rural Municipality', 'municipality', 401),
(40106, 'Tsum Nubri Rural Municipality', 'municipality', 401),
(40107, 'Dharche Rural Municipality', 'municipality', 401),
(40108, 'Bhimsen Thapa Rural Municipality', 'municipality', 401),
(40109, 'Sahid Lakhan Rural Municipality', 'municipality', 401),
(40110, 'Aarughat Rural Municipality', 'municipality', 401),
(40111, 'Gandaki Rural Municipality', 'municipality', 401);

-- Lamjung Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40201, 'Besisahar Municipality', 'municipality', 402),
(40202, 'Madhya Nepal Municipality', 'municipality', 402),
(40203, 'Rainas Municipality', 'municipality', 402),
(40204, 'Sundarbazar Municipality', 'municipality', 402),
(40205, 'Kwholasothar Rural Municipality', 'municipality', 402),
(40206, 'Dudhpokhari Rural Municipality', 'municipality', 402),
(40207, 'Dordi Rural Municipality', 'municipality', 402),
(40208, 'Marsyangdi Rural Municipality', 'municipality', 402);

-- Kaski Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40301, 'Pokhara Metropolitan City', 'municipality', 403),
(40302, 'Annapurna Rural Municipality', 'municipality', 403),
(40303, 'Machhapuchchhre Rural Municipality', 'municipality', 403),
(40304, 'Madi Rural Municipality', 'municipality', 403),
(40305, 'Rupa Rural Municipality', 'municipality', 403);

-- Manang Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40401, 'Chame Rural Municipality', 'municipality', 404),
(40402, 'Nason Rural Municipality', 'municipality', 404),
(40403, 'Narpa Bhumi Rural Municipality', 'municipality', 404),
(40404, 'Manang Ngisyang Rural Municipality', 'municipality', 404);

-- Mustang Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40501, 'Gharapjhong Rural Municipality', 'municipality', 405),
(40502, 'Thasang Rural Municipality', 'municipality', 405),
(40503, 'Barhagaun Muktichhetra Rural Municipality', 'municipality', 405),
(40504, 'Lomanthang Rural Municipality', 'municipality', 405),
(40505, 'Lo-Ghekar Damodarkunda Rural Municipality', 'municipality', 405);

-- Nawalpur Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40601, 'Kawasoti Municipality', 'municipality', 406),
(40602, 'Gaindakot Municipality', 'municipality', 406),
(40603, 'Devchuli Municipality', 'municipality', 406),
(40604, 'Madhyabindu Municipality', 'municipality', 406),
(40605, 'Baudikali Rural Municipality', 'municipality', 406),
(40606, 'Bulingtar Rural Municipality', 'municipality', 406),
(40607, 'Binayi Tribeni Rural Municipality', 'municipality', 406),
(40608, 'Hupsekot Rural Municipality', 'municipality', 406);

-- Syangja Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40701, 'Galyang Municipality', 'municipality', 407),
(40702, 'Chapakot Municipality', 'municipality', 407),
(40703, 'Putalibazar Municipality', 'municipality', 407),
(40704, 'Bhirkot Municipality', 'municipality', 407),
(40705, 'Waling Municipality', 'municipality', 407),
(40706, 'Arjun Chaupari Rural Municipality', 'municipality', 407),
(40707, 'Aandhikhola Rural Municipality', 'municipality', 407),
(40708, 'Kaligandaki Rural Municipality', 'municipality', 407),
(40709, 'Phedikhola Rural Municipality', 'municipality', 407),
(40710, 'Harinas Rural Municipality', 'municipality', 407),
(40711, 'Biruwa Rural Municipality', 'municipality', 407);

-- Tanahun Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40801, 'Bhanu Municipality', 'municipality', 408),
(40802, 'Bhimad Municipality', 'municipality', 408),
(40803, 'Byas Municipality', 'municipality', 408),
(40804, 'Shuklagandaki Municipality', 'municipality', 408),
(40805, 'Anbu Khaireni Rural Municipality', 'municipality', 408),
(40806, 'Devghat Rural Municipality', 'municipality', 408),
(40807, 'Bandipur Rural Municipality', 'municipality', 408),
(40808, 'Rishing Rural Municipality', 'municipality', 408),
(40809, 'Ghiring Rural Municipality', 'municipality', 408),
(40810, 'Myagde Rural Municipality', 'municipality', 408);

-- Parbat Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(40901, 'Kushma Municipality', 'municipality', 409),
(40902, 'Phalewas Municipality', 'municipality', 409),
(40903, 'Jaljala Rural Municipality', 'municipality', 409),
(40904, 'Paiyun Rural Municipality', 'municipality', 409),
(40905, 'Mahashila Rural Municipality', 'municipality', 409),
(40906, 'Modi Rural Municipality', 'municipality', 409),
(40907, 'Bihadi Rural Municipality', 'municipality', 409);

-- Baglung Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(41001, 'Baglung Municipality', 'municipality', 410),
(41002, 'Dhorpatan Municipality', 'municipality', 410),
(41003, 'Galkot Municipality', 'municipality', 410),
(41004, 'Jaimuni Municipality', 'municipality', 410),
(41005, 'Bareng Rural Municipality', 'municipality', 410),
(41006, 'Kathekhola Rural Municipality', 'municipality', 410),
(41007, 'Taman Khola Rural Municipality', 'municipality', 410),
(41008, 'Tara Khola Rural Municipality', 'municipality', 410),
(41009, 'Nisikhola Rural Municipality', 'municipality', 410),
(41010, 'Badigad Rural Municipality', 'municipality', 410);

-- Myagdi Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(41101, 'Beni Municipality', 'municipality', 411),
(41102, 'Annapurna Rural Municipality', 'municipality', 411),
(41103, 'Dhaulagiri Rural Municipality', 'municipality', 411),
(41104, 'Mangala Rural Municipality', 'municipality', 411),
(41105, 'Malika Rural Municipality', 'municipality', 411),
(41106, 'Raghuganga Rural Municipality', 'municipality', 411);

-- ============================================
-- PROVINCE 5: LUMBINI PROVINCE
-- ============================================

INSERT INTO locations (id, name, type, parent_id) VALUES (5, 'Lumbini Province', 'province', NULL);

-- Lumbini Districts
INSERT INTO locations (id, name, type, parent_id) VALUES
(501, 'Gulmi', 'district', 5),
(502, 'Palpa', 'district', 5),
(503, 'Rupandehi', 'district', 5),
(504, 'Kapilvastu', 'district', 5),
(505, 'Arghakhanchi', 'district', 5),
(506, 'Pyuthan', 'district', 5),
(507, 'Rolpa', 'district', 5),
(508, 'Eastern Rukum', 'district', 5),
(509, 'Banke', 'district', 5),
(510, 'Bardiya', 'district', 5),
(511, 'Dang', 'district', 5),
(512, 'Nawalparasi West', 'district', 5);

-- Gulmi Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50101, 'Musikot Municipality', 'municipality', 501),
(50102, 'Resunga Municipality', 'municipality', 501),
(50103, 'Isma Rural Municipality', 'municipality', 501),
(50104, 'Kaligandaki Rural Municipality', 'municipality', 501),
(50105, 'Satyawati Rural Municipality', 'municipality', 501),
(50106, 'Chandrakot Rural Municipality', 'municipality', 501),
(50107, 'Ruru Rural Municipality', 'municipality', 501),
(50108, 'Chhatrakot Rural Municipality', 'municipality', 501),
(50109, 'Dhurkot Rural Municipality', 'municipality', 501),
(50110, 'Madane Rural Municipality', 'municipality', 501),
(50111, 'Malika Rural Municipality', 'municipality', 501),
(50112, 'Gulmi Darbar Rural Municipality', 'municipality', 501);

-- Palpa Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50201, 'Tansen Municipality', 'municipality', 502),
(50202, 'Rampur Municipality', 'municipality', 502),
(50203, 'Rainadevi Chhahara Rural Municipality', 'municipality', 502),
(50204, 'Ribdikot Rural Municipality', 'municipality', 502),
(50205, 'Purbakhola Rural Municipality', 'municipality', 502),
(50206, 'Rambha Rural Municipality', 'municipality', 502),
(50207, 'Tinahu Rural Municipality', 'municipality', 502),
(50208, 'Nisdi Rural Municipality', 'municipality', 502),
(50209, 'Mathagadhi Rural Municipality', 'municipality', 502),
(50210, 'Bagnaskali Rural Municipality', 'municipality', 502);

-- Rupandehi Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50301, 'Butwal Sub-Metropolitan City', 'municipality', 503),
(50302, 'Devdaha Municipality', 'municipality', 503),
(50303, 'Lumbini Sanskritik Municipality', 'municipality', 503),
(50304, 'Sainamaina Municipality', 'municipality', 503),
(50305, 'Siddharthanagar Municipality', 'municipality', 503),
(50306, 'Tilottama Municipality', 'municipality', 503),
(50307, 'Gaidahawa Rural Municipality', 'municipality', 503),
(50308, 'Kanchan Rural Municipality', 'municipality', 503),
(50309, 'Kotahimai Rural Municipality', 'municipality', 503),
(50310, 'Marchawari Rural Municipality', 'municipality', 503),
(50311, 'Mayadevi Rural Municipality', 'municipality', 503),
(50312, 'Omsatiya Rural Municipality', 'municipality', 503),
(50313, 'Rohini Rural Municipality', 'municipality', 503),
(50314, 'Sammarimai Rural Municipality', 'municipality', 503),
(50315, 'Siyari Rural Municipality', 'municipality', 503),
(50316, 'Suddhodhan Rural Municipality', 'municipality', 503);

-- Kapilvastu Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50401, 'Kapilvastu Municipality', 'municipality', 504),
(50402, 'Banganga Municipality', 'municipality', 504),
(50403, 'Buddhabhumi Municipality', 'municipality', 504),
(50404, 'Shivaraj Municipality', 'municipality', 504),
(50405, 'Krishnanagar Municipality', 'municipality', 504),
(50406, 'Maharajgunj Municipality', 'municipality', 504),
(50407, 'Mayadevi Rural Municipality', 'municipality', 504),
(50408, 'Yashodhara Rural Municipality', 'municipality', 504),
(50409, 'Suddhodhan Rural Municipality', 'municipality', 504),
(50410, 'Bijayanagar Rural Municipality', 'municipality', 504);

-- Arghakhanchi Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50501, 'Sandhikharka Municipality', 'municipality', 505),
(50502, 'Sitganga Municipality', 'municipality', 505),
(50503, 'Bhumikasthan Municipality', 'municipality', 505),
(50504, 'Chhatradev Rural Municipality', 'municipality', 505),
(50505, 'Panini Rural Municipality', 'municipality', 505),
(50506, 'Malarani Rural Municipality', 'municipality', 505);

-- Pyuthan Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50601, 'Pyuthan Municipality', 'municipality', 506),
(50602, 'Sworgadwari Municipality', 'municipality', 506),
(50603, 'Mandavi Rural Municipality', 'municipality', 506),
(50604, 'Mallarani Rural Municipality', 'municipality', 506),
(50605, 'Sarumarani Rural Municipality', 'municipality', 506),
(50606, 'Jhimruk Rural Municipality', 'municipality', 506),
(50607, 'Airawati Rural Municipality', 'municipality', 506),
(50608, 'Gaumukhi Rural Municipality', 'municipality', 506),
(50609, 'Naubahini Rural Municipality', 'municipality', 506);

-- Rolpa Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50701, 'Rolpa Municipality', 'municipality', 507),
(50702, 'Runtigadhi Rural Municipality', 'municipality', 507),
(50703, 'Triveni Rural Municipality', 'municipality', 507),
(50704, 'Sunil Smriti Rural Municipality', 'municipality', 507),
(50705, 'Lungri Rural Municipality', 'municipality', 507),
(50706, 'Sunchhahari Rural Municipality', 'municipality', 507),
(50707, 'Thawang Rural Municipality', 'municipality', 507),
(50708, 'Madi Rural Municipality', 'municipality', 507),
(50709, 'Gangadev Rural Municipality', 'municipality', 507),
(50710, 'Pariwartan Rural Municipality', 'municipality', 507);

-- Eastern Rukum Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50801, 'Bhume Rural Municipality', 'municipality', 508),
(50802, 'Sisne Rural Municipality', 'municipality', 508),
(50803, 'Putha Uttarganga Rural Municipality', 'municipality', 508);

-- Banke Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(50901, 'Nepalgunj Sub-Metropolitan City', 'municipality', 509),
(50902, 'Kohalpur Municipality', 'municipality', 509),
(50903, 'Rapti Sonari Rural Municipality', 'municipality', 509),
(50904, 'Narainapur Rural Municipality', 'municipality', 509),
(50905, 'Duduwa Rural Municipality', 'municipality', 509),
(50906, 'Janaki Rural Municipality', 'municipality', 509),
(50907, 'Khajura Rural Municipality', 'municipality', 509),
(50908, 'Baijnath Rural Municipality', 'municipality', 509);

-- Bardiya Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(51001, 'Gulariya Municipality', 'municipality', 510),
(51002, 'Madhuwan Municipality', 'municipality', 510),
(51003, 'Rajapur Municipality', 'municipality', 510),
(51004, 'Thakurbaba Municipality', 'municipality', 510),
(51005, 'Bansagadhi Municipality', 'municipality', 510),
(51006, 'Barbardiya Municipality', 'municipality', 510),
(51007, 'Badhaiyatal Rural Municipality', 'municipality', 510),
(51008, 'Geruwa Rural Municipality', 'municipality', 510);

-- Dang Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(51101, 'Ghorahi Sub-Metropolitan City', 'municipality', 511),
(51102, 'Tulsipur Sub-Metropolitan City', 'municipality', 511),
(51103, 'Lamahi Municipality', 'municipality', 511),
(51104, 'Gadhawa Rural Municipality', 'municipality', 511),
(51105, 'Rajpur Rural Municipality', 'municipality', 511),
(51106, 'Shantinagar Rural Municipality', 'municipality', 511),
(51107, 'Rapti Rural Municipality', 'municipality', 511),
(51108, 'Banglachuli Rural Municipality', 'municipality', 511),
(51109, 'Dangisharan Rural Municipality', 'municipality', 511),
(51110, 'Babai Rural Municipality', 'municipality', 511);

-- Nawalparasi West Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(51201, 'Bardaghat Municipality', 'municipality', 512),
(51202, 'Ramgram Municipality', 'municipality', 512),
(51203, 'Sunwal Municipality', 'municipality', 512),
(51204, 'Susta Rural Municipality', 'municipality', 512),
(51205, 'Palhinandan Rural Municipality', 'municipality', 512),
(51206, 'Pratappur Rural Municipality', 'municipality', 512),
(51207, 'Sarawal Rural Municipality', 'municipality', 512);

-- ============================================
-- PROVINCE 6: KARNALI PROVINCE
-- ============================================

INSERT INTO locations (id, name, type, parent_id) VALUES (6, 'Karnali Province', 'province', NULL);

-- Karnali Districts
INSERT INTO locations (id, name, type, parent_id) VALUES
(601, 'Western Rukum', 'district', 6),
(602, 'Salyan', 'district', 6),
(603, 'Dolpa', 'district', 6),
(604, 'Humla', 'district', 6),
(605, 'Jumla', 'district', 6),
(606, 'Kalikot', 'district', 6),
(607, 'Mugu', 'district', 6),
(608, 'Surkhet', 'district', 6),
(609, 'Dailekh', 'district', 6),
(610, 'Jajarkot', 'district', 6);

-- Western Rukum Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60101, 'Musikot Municipality', 'municipality', 601),
(60102, 'Chaurjahari Municipality', 'municipality', 601),
(60103, 'Aathbiskot Municipality', 'municipality', 601),
(60104, 'Banphikot Rural Municipality', 'municipality', 601),
(60105, 'Tribeni Rural Municipality', 'municipality', 601),
(60106, 'Sani Bheri Rural Municipality', 'municipality', 601);

-- Salyan Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60201, 'Bagchaur Municipality', 'municipality', 602),
(60202, 'Bangad Kupinde Municipality', 'municipality', 602),
(60203, 'Shaarda Municipality', 'municipality', 602),
(60204, 'Kalimati Rural Municipality', 'municipality', 602),
(60205, 'Tribeni Rural Municipality', 'municipality', 602),
(60206, 'Kapurkot Rural Municipality', 'municipality', 602),
(60207, 'Chhatreshwari Rural Municipality', 'municipality', 602),
(60208, 'Kumakh Rural Municipality', 'municipality', 602),
(60209, 'Siddha Kumakh Rural Municipality', 'municipality', 602),
(60210, 'Darma Rural Municipality', 'municipality', 602);

-- Dolpa Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60301, 'Thuli Bheri Municipality', 'municipality', 603),
(60302, 'Tripurasundari Municipality', 'municipality', 603),
(60303, 'Dolpo Buddha Rural Municipality', 'municipality', 603),
(60304, 'She Phoksundo Rural Municipality', 'municipality', 603),
(60305, 'Jagadulla Rural Municipality', 'municipality', 603),
(60306, 'Mudkechula Rural Municipality', 'municipality', 603),
(60307, 'Kaike Rural Municipality', 'municipality', 603),
(60308, 'Chharka Tangsong Rural Municipality', 'municipality', 603);

-- Humla Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60401, 'Simkot Rural Municipality', 'municipality', 604),
(60402, 'Namkha Rural Municipality', 'municipality', 604),
(60403, 'Kharpunath Rural Municipality', 'municipality', 604),
(60404, 'Sarkegad Rural Municipality', 'municipality', 604),
(60405, 'Chankheli Rural Municipality', 'municipality', 604),
(60406, 'Adanchuli Rural Municipality', 'municipality', 604),
(60407, 'Tanjakot Rural Municipality', 'municipality', 604);

-- Jumla Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60501, 'Chandannath Municipality', 'municipality', 605),
(60502, 'Kanakasundari Rural Municipality', 'municipality', 605),
(60503, 'Sinja Rural Municipality', 'municipality', 605),
(60504, 'Hima Rural Municipality', 'municipality', 605),
(60505, 'Tila Rural Municipality', 'municipality', 605),
(60506, 'Guthichaur Rural Municipality', 'municipality', 605),
(60507, 'Tatopani Rural Municipality', 'municipality', 605),
(60508, 'Patarasi Rural Municipality', 'municipality', 605);

-- Kalikot Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60601, 'Khandachakra Municipality', 'municipality', 606),
(60602, 'Raskot Municipality', 'municipality', 606),
(60603, 'Tilagufa Municipality', 'municipality', 606),
(60604, 'Pachaljharana Rural Municipality', 'municipality', 606),
(60605, 'Sanni Triveni Rural Municipality', 'municipality', 606),
(60606, 'Narharinath Rural Municipality', 'municipality', 606),
(60607, 'Shubha Kalika Rural Municipality', 'municipality', 606),
(60608, 'Mahawai Rural Municipality', 'municipality', 606),
(60609, 'Palata Rural Municipality', 'municipality', 606);

-- Mugu Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60701, 'Chhayanath Rara Municipality', 'municipality', 607),
(60702, 'Mugum Karmarong Rural Municipality', 'municipality', 607),
(60703, 'Soru Rural Municipality', 'municipality', 607),
(60704, 'Khatyad Rural Municipality', 'municipality', 607);

-- Surkhet Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60801, 'Birendranagar Municipality', 'municipality', 608),
(60802, 'Bheriganga Municipality', 'municipality', 608),
(60803, 'Gurbhakot Municipality', 'municipality', 608),
(60804, 'Panchapuri Municipality', 'municipality', 608),
(60805, 'Lekbesi Municipality', 'municipality', 608),
(60806, 'Chaukune Rural Municipality', 'municipality', 608),
(60807, 'Barahatal Rural Municipality', 'municipality', 608),
(60808, 'Chingad Rural Municipality', 'municipality', 608),
(60809, 'Simta Rural Municipality', 'municipality', 608);

-- Dailekh Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(60901, 'Narayan Municipality', 'municipality', 609),
(60902, 'Dullu Municipality', 'municipality', 609),
(60903, 'Chamunda Bindrasaini Municipality', 'municipality', 609),
(60904, 'Aathbis Municipality', 'municipality', 609),
(60905, 'Bhagawatimai Rural Municipality', 'municipality', 609),
(60906, 'Gurans Rural Municipality', 'municipality', 609),
(60907, 'Dungeshwor Rural Municipality', 'municipality', 609),
(60908, 'Naumule Rural Municipality', 'municipality', 609),
(60909, 'Mahabu Rural Municipality', 'municipality', 609),
(60910, 'Bhairabi Rural Municipality', 'municipality', 609),
(60911, 'Thantikandh Rural Municipality', 'municipality', 609);

-- Jajarkot Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(61001, 'Bheri Municipality', 'municipality', 610),
(61002, 'Chhedagad Municipality', 'municipality', 610),
(61003, 'Nalgad Municipality', 'municipality', 610),
(61004, 'Junichande Rural Municipality', 'municipality', 610),
(61005, 'Kuse Rural Municipality', 'municipality', 610),
(61006, 'Barekot Rural Municipality', 'municipality', 610),
(61007, 'Shivalaya Rural Municipality', 'municipality', 610);

-- ============================================
-- PROVINCE 7: SUDURPASHCHIM PROVINCE
-- ============================================

INSERT INTO locations (id, name, type, parent_id) VALUES (7, 'Sudurpashchim Province', 'province', NULL);

-- Sudurpashchim Districts
INSERT INTO locations (id, name, type, parent_id) VALUES
(701, 'Kailali', 'district', 7),
(702, 'Kanchanpur', 'district', 7),
(703, 'Dadeldhura', 'district', 7),
(704, 'Baitadi', 'district', 7),
(705, 'Doti', 'district', 7),
(706, 'Achham', 'district', 7),
(707, 'Bajhang', 'district', 7),
(708, 'Bajura', 'district', 7),
(709, 'Darchula', 'district', 7);

-- Kailali Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70101, 'Dhangadhi Sub-Metropolitan City', 'municipality', 701),
(70102, 'Tikapur Municipality', 'municipality', 701),
(70103, 'Ghodaghodi Municipality', 'municipality', 701),
(70104, 'Lamkichuha Municipality', 'municipality', 701),
(70105, 'Bhajani Municipality', 'municipality', 701),
(70106, 'Godawari Municipality', 'municipality', 701),
(70107, 'Gauriganga Municipality', 'municipality', 701),
(70108, 'Janaki Rural Municipality', 'municipality', 701),
(70109, 'Bardagoriya Rural Municipality', 'municipality', 701),
(70110, 'Mohanyal Rural Municipality', 'municipality', 701),
(70111, 'Kailari Rural Municipality', 'municipality', 701),
(70112, 'Joshipur Rural Municipality', 'municipality', 701),
(70113, 'Chure Rural Municipality', 'municipality', 701);

-- Kanchanpur Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70201, 'Bhimdatta Municipality', 'municipality', 702),
(70202, 'Punarbas Municipality', 'municipality', 702),
(70203, 'Bedkot Municipality', 'municipality', 702),
(70204, 'Mahakali Municipality', 'municipality', 702),
(70205, 'Shuklaphanta Municipality', 'municipality', 702),
(70206, 'Belauri Municipality', 'municipality', 702),
(70207, 'Krishnapur Municipality', 'municipality', 702),
(70208, 'Beldandi Rural Municipality', 'municipality', 702),
(70209, 'Laljhadi Rural Municipality', 'municipality', 702);

-- Dadeldhura Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70301, 'Amargadhi Municipality', 'municipality', 703),
(70302, 'Parshuram Municipality', 'municipality', 703),
(70303, 'Aalitaal Rural Municipality', 'municipality', 703),
(70304, 'Bhageshwar Rural Municipality', 'municipality', 703),
(70305, 'Navadurga Rural Municipality', 'municipality', 703),
(70306, 'Ajaymeru Rural Municipality', 'municipality', 703),
(70307, 'Ganyapdhura Rural Municipality', 'municipality', 703);

-- Baitadi Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70401, 'Dasharathchand Municipality', 'municipality', 704),
(70402, 'Patan Municipality', 'municipality', 704),
(70403, 'Melauli Municipality', 'municipality', 704),
(70404, 'Purchaudi Municipality', 'municipality', 704),
(70405, 'Surnaya Rural Municipality', 'municipality', 704),
(70406, 'Sigas Rural Municipality', 'municipality', 704),
(70407, 'Shivanath Rural Municipality', 'municipality', 704),
(70408, 'Pancheshwar Rural Municipality', 'municipality', 704),
(70409, 'Dogdakedar Rural Municipality', 'municipality', 704),
(70410, 'Dilasaini Rural Municipality', 'municipality', 704);

-- Doti Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70501, 'Dipayal Silgadhi Municipality', 'municipality', 705),
(70502, 'Shikhar Municipality', 'municipality', 705),
(70503, 'Purbichauki Rural Municipality', 'municipality', 705),
(70504, 'Badikedar Rural Municipality', 'municipality', 705),
(70505, 'Jorayal Rural Municipality', 'municipality', 705),
(70506, 'Sayal Rural Municipality', 'municipality', 705),
(70507, 'Aadarsha Rural Municipality', 'municipality', 705),
(70508, 'K I Singh Rural Municipality', 'municipality', 705),
(70509, 'Bogtan Rural Municipality', 'municipality', 705);

-- Achham Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70601, 'Mangalsen Municipality', 'municipality', 706),
(70602, 'Kamalbazar Municipality', 'municipality', 706),
(70603, 'Sanphebagar Municipality', 'municipality', 706),
(70604, 'Panchadewal Binayak Municipality', 'municipality', 706),
(70605, 'Chaurpati Rural Municipality', 'municipality', 706),
(70606, 'Mellekh Rural Municipality', 'municipality', 706),
(70607, 'Bannigadhi Jayagadh Rural Municipality', 'municipality', 706),
(70608, 'Ramaroshan Rural Municipality', 'municipality', 706),
(70609, 'Dhakari Rural Municipality', 'municipality', 706),
(70610, 'Turmakhand Rural Municipality', 'municipality', 706);

-- Bajhang Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70701, 'Jaya Prithvi Municipality', 'municipality', 707),
(70702, 'Bungal Municipality', 'municipality', 707),
(70703, 'Talkot Rural Municipality', 'municipality', 707),
(70704, 'Masta Rural Municipality', 'municipality', 707),
(70705, 'Khaptadchhanna Rural Municipality', 'municipality', 707),
(70706, 'Thalara Rural Municipality', 'municipality', 707),
(70707, 'Bitthadchir Rural Municipality', 'municipality', 707),
(70708, 'Surma Rural Municipality', 'municipality', 707),
(70709, 'Chhabis Pathibhera Rural Municipality', 'municipality', 707),
(70710, 'Durgathali Rural Municipality', 'municipality', 707),
(70711, 'Kedarsyu Rural Municipality', 'municipality', 707),
(70712, 'Saipal Rural Municipality', 'municipality', 707);

-- Bajura Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70801, 'Badimalika Municipality', 'municipality', 708),
(70802, 'Triveni Municipality', 'municipality', 708),
(70803, 'Budhiganga Municipality', 'municipality', 708),
(70804, 'Budhinanda Municipality', 'municipality', 708),
(70805, 'Gaumul Rural Municipality', 'municipality', 708),
(70806, 'Jagannath Rural Municipality', 'municipality', 708),
(70807, 'Swamikartik Khapar Rural Municipality', 'municipality', 708),
(70808, 'Khaptad Chhededaha Rural Municipality', 'municipality', 708),
(70809, 'Himali Rural Municipality', 'municipality', 708);

-- Darchula Municipalities
INSERT INTO locations (id, name, type, parent_id) VALUES
(70901, 'Shailyashikhar Municipality', 'municipality', 709),
(70902, 'Mahakali Municipality', 'municipality', 709),
(70903, 'Malikarjun Rural Municipality', 'municipality', 709),
(70904, 'Apihimal Rural Municipality', 'municipality', 709),
(70905, 'Duhun Rural Municipality', 'municipality', 709),
(70906, 'Naugad Rural Municipality', 'municipality', 709),
(70907, 'Marma Rural Municipality', 'municipality', 709),
(70908, 'Lekam Rural Municipality', 'municipality', 709),
(70909, 'Byans Rural Municipality', 'municipality', 709);

-- ============================================
-- VERIFICATION & SUMMARY
-- ============================================

-- Show final counts
SELECT
    COUNT(*) as total_locations,
    COUNT(*) FILTER (WHERE type = 'province') as provinces,
    COUNT(*) FILTER (WHERE type = 'district') as districts,
    COUNT(*) FILTER (WHERE type = 'municipality') as municipalities
FROM locations;
