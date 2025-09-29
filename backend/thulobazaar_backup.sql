--
-- PostgreSQL database dump
--

\restrict eI64x7b7PJjy4RkAf7rN0F1EOPhOsXxRZae2xgHtf8au5EbL4Ca5ulpZCJ7A85w

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ad_images; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ad_images (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ad_images OWNER TO elw;

--
-- Name: ad_images_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ad_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ad_images_id_seq OWNER TO elw;

--
-- Name: ad_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ad_images_id_seq OWNED BY public.ad_images.id;


--
-- Name: ad_reports; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ad_reports (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    reporter_id integer NOT NULL,
    reason character varying(100) NOT NULL,
    details text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ad_reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[])))
);


ALTER TABLE public.ad_reports OWNER TO elw;

--
-- Name: ad_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ad_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ad_reports_id_seq OWNER TO elw;

--
-- Name: ad_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ad_reports_id_seq OWNED BY public.ad_reports.id;


--
-- Name: ads; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.ads (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    price numeric(12,2),
    category_id integer,
    location_id integer,
    seller_name character varying(100),
    seller_phone character varying(20),
    condition character varying(20) DEFAULT 'used'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    view_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    user_id integer,
    status_reason text,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    latitude numeric(10,8),
    longitude numeric(11,8)
);


ALTER TABLE public.ads OWNER TO elw;

--
-- Name: ads_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.ads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ads_id_seq OWNER TO elw;

--
-- Name: ads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.ads_id_seq OWNED BY public.ads.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    icon character varying(10),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO elw;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO elw;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    ad_id integer NOT NULL,
    buyer_id integer NOT NULL,
    seller_id integer NOT NULL,
    buyer_name character varying(255) NOT NULL,
    buyer_email character varying(255) NOT NULL,
    buyer_phone character varying(20),
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_reply boolean DEFAULT false,
    reply_to_message_id integer
);


ALTER TABLE public.contact_messages OWNER TO elw;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contact_messages_id_seq OWNER TO elw;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    parent_id integer,
    created_at timestamp without time zone DEFAULT now(),
    slug character varying(100),
    latitude numeric(10,8),
    longitude numeric(11,8)
);


ALTER TABLE public.locations OWNER TO elw;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.locations_id_seq OWNER TO elw;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: elw
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    location_id integer,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(20) DEFAULT 'user'::character varying
);


ALTER TABLE public.users OWNER TO elw;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: elw
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO elw;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: elw
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ad_images id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_images ALTER COLUMN id SET DEFAULT nextval('public.ad_images_id_seq'::regclass);


--
-- Name: ad_reports id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports ALTER COLUMN id SET DEFAULT nextval('public.ad_reports_id_seq'::regclass);


--
-- Name: ads id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads ALTER COLUMN id SET DEFAULT nextval('public.ads_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: ad_images; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ad_images (id, ad_id, filename, original_name, file_path, file_size, mime_type, is_primary, created_at) FROM stdin;
3	21	ad-1759079351887-465595777.jpg	bdh-103interior.jpg	uploads/ads/ad-1759079351887-465595777.jpg	327332	image/jpeg	t	2025-09-28 23:09:11.902867
4	22	ad-1759082048494-375585715.jpeg	images.jpeg	uploads/ads/ad-1759082048494-375585715.jpeg	9174	image/jpeg	t	2025-09-28 23:54:08.505886
\.


--
-- Data for Name: ad_reports; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ad_reports (id, ad_id, reporter_id, reason, details, status, admin_notes, created_at, updated_at) FROM stdin;
1	1	7	inappropriate	csdcdsfs	pending	\N	2025-09-28 16:13:23.243468	2025-09-28 16:13:23.243468
\.


--
-- Data for Name: ads; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.ads (id, title, description, price, category_id, location_id, seller_name, seller_phone, condition, status, view_count, is_featured, created_at, updated_at, user_id, status_reason, reviewed_by, reviewed_at, latitude, longitude) FROM stdin;
5	Samsung	My old phone.....	120000.00	1	4	Me	321412421421	used	approved	44	f	2025-09-27 21:11:18.935264	2025-09-27 21:11:18.935264	2	\N	\N	\N	\N	\N
21	Wood Bed for sale	I will sell wood bed , its 4*5 feet long... I got it	40000.00	7	3	pre test	32432543523	used	approved	31	f	2025-09-28 23:09:11.898458	2025-09-28 23:09:59.998456	7	\N	\N	\N	\N	\N
25	Wooden Dining Table	Beautiful handcrafted wooden dining table	25000.00	7	4	Furniture Store	9812345680	new	approved	4	f	2025-09-29 00:01:33.768825	2025-09-29 00:01:33.768825	8	\N	\N	\N	\N	\N
7	Beautiful iPhone 15 for sale	Brand new iPhone 15 in excellent condition. All accessories included. Perfect for professional and personal use.	150000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:23:39.962014	2025-09-28 03:23:39.962014	8	\N	\N	\N	\N	\N
8	Test Ad 	This is a test ad number  with good content and no bad words.	1000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:24:01.012173	2025-09-28 03:24:01.012173	8	\N	\N	\N	\N	\N
19	iPhone 15 Pro Max 256GB	Brand new iPhone 15 Pro Max with 256GB storage. Amazing camera quality and performance. Comes with charger and original box.	200000.00	1	1	Test Seller	9812345678	new	approved	10	f	2025-09-28 03:31:10.919121	2025-09-28 03:31:10.919121	8	\N	\N	\N	\N	\N
9	Test Ad 1	This is a test ad number 1 with good content and no bad words.	1000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:24:24.711039	2025-09-28 03:24:24.711039	8	\N	\N	\N	\N	\N
10	Test Ad 2	This is a test ad number 2 with good content and no bad words.	1000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:24:24.728631	2025-09-28 03:24:24.728631	8	\N	\N	\N	\N	\N
11	Test Ad 3	This is a test ad number 3 with good content and no bad words.	1000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:24:24.745809	2025-09-28 03:24:24.745809	8	\N	\N	\N	\N	\N
13	Test Ad 5	This is a test ad number 5 with good content and no bad words.	1000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:24:24.779808	2025-09-28 03:24:24.779808	8	\N	\N	\N	\N	\N
14	Test Ad 6	This is a test ad number 6 with good content and no bad words.	1000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:24:24.795915	2025-09-28 03:24:24.795915	8	\N	\N	\N	\N	\N
15	iPhone 15 Pro Max 256GB	Brand new iPhone 15 Pro Max with 256GB storage. Amazing camera quality and performance. Comes with charger and original box.	200000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:29:40.073132	2025-09-28 03:29:40.073132	8	\N	\N	\N	\N	\N
16	iPhone 15 Pro Max 256GB For Sale	Brand new iPhone 15 Pro Max with 256GB storage. Amazing camera quality and performance. Comes with charger and original box.	200000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:29:46.716503	2025-09-28 03:29:46.716503	8	\N	\N	\N	\N	\N
17	iPhone 15 Pro Max 256GB	Brand new iPhone 15 Pro Max with 256GB storage. Amazing camera quality and performance. Comes with charger and original box.	200000.00	1	1	Test Seller	9812345678	new	approved	0	f	2025-09-28 03:30:01.423857	2025-09-28 03:30:01.423857	8	\N	\N	\N	\N	\N
24	Toyota Prius	Well maintained hybrid car	2500000.00	2	4	Car Dealer	9812345679	used	approved	10	f	2025-09-29 00:01:23.246276	2025-09-29 00:01:23.246276	8	\N	\N	\N	\N	\N
22	Toyota car	I have a old toyota car	500000.00	2	5	pre test	32432543523	new	approved	10	f	2025-09-28 23:54:08.503306	2025-09-28 23:54:08.503306	7	\N	\N	\N	\N	\N
4	MacBook Pro M2	MacBook Pro 13-inch with M2 chip, 8GB RAM, 256GB SSD. Like new condition.	185000.00	1	4	Tech Store KTM	+977-9871234567	used	approved	75	t	2025-09-27 16:54:31.439292	2025-09-27 16:54:31.439292	1	\N	\N	\N	\N	\N
3	2 BHK Apartment Rent	Beautiful 2 bedroom apartment in prime location of Lalitpur. Fully furnished.	25000.00	3	5	Sita Devi	+977-9861234567	new	approved	26	f	2025-09-27 16:54:31.439292	2025-09-27 16:54:31.439292	1	\N	\N	\N	\N	\N
12	Test Ad 4	This is a test ad number 4 with good content and no bad words.	1000.00	1	1	Test Seller	9812345678	new	approved	6	f	2025-09-28 03:24:24.762039	2025-09-28 03:24:24.762039	8	\N	\N	\N	\N	\N
2	Honda CB150R 2023	Brand new Honda CB150R, only 500km driven. Perfect for city riding.	285000.00	2	4	Bikash Motors	+977-9851234567	used	approved	67	f	2025-09-27 16:54:31.439292	2025-09-27 16:54:31.439292	1	\N	\N	\N	\N	\N
18	iPhone 15 Pro Max 256GB	Brand new iPhone 15 Pro Max with 256GB storage. Amazing camera quality and performance. Comes with charger and original box.	200000.00	1	1	Test Seller	9812345678	new	approved	4	f	2025-09-28 03:30:38.530803	2025-09-28 03:30:38.530803	8	\N	\N	\N	\N	\N
1	iPhone 13 Pro Max 256GB	Excellent condition iPhone 13 Pro Max, barely used. All accessories included.	155000.00	1	4	Ramesh Sharma	+977-9841234567	used	approved	57	t	2025-09-27 16:54:31.439292	2025-09-27 16:54:31.439292	1	\N	\N	\N	\N	\N
23	iPhone 15 Pro	Brand new iPhone 15 Pro with warranty	120000.00	1	4	Electronics Store	9812345678	new	approved	0	f	2025-09-29 00:01:13.251804	2025-09-29 00:01:13.251804	8	\N	\N	\N	\N	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.categories (id, name, slug, icon, created_at) FROM stdin;
1	Electronics	electronics	📱	2025-09-27 16:52:17.426284
2	Vehicles	vehicles	🚗	2025-09-27 16:52:17.426284
3	Property	property	🏠	2025-09-27 16:52:17.426284
4	Jobs	jobs	💼	2025-09-27 16:52:17.426284
5	Services	services	🔧	2025-09-27 16:52:17.426284
6	Fashion	fashion	👗	2025-09-27 16:52:17.426284
7	Furniture	furniture	🛋️	2025-09-27 16:52:17.426284
8	Pets	pets	🐕	2025-09-27 16:52:17.426284
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.contact_messages (id, ad_id, buyer_id, seller_id, buyer_name, buyer_email, buyer_phone, message, is_read, created_at, is_reply, reply_to_message_id) FROM stdin;
12	4	2	1	tt	s@gg.co	35543543543	Hi I am i am inteested to biy uoujsa 	f	2025-09-28 20:25:09.533312	f	\N
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.locations (id, name, type, parent_id, created_at, slug, latitude, longitude) FROM stdin;
1	Bagmati Province	province	\N	2025-09-27 16:52:42.456342	bagmati-province	\N	\N
2	Gandaki Province	province	\N	2025-09-27 16:52:42.456342	gandaki-province	\N	\N
3	Lumbini Province	province	\N	2025-09-27 16:52:42.456342	lumbini-province	\N	\N
4	Kathmandu	district	1	2025-09-27 16:52:54.289396	kathmandu	27.71720000	85.32400000
5	Lalitpur	district	1	2025-09-27 16:52:54.289396	lalitpur	27.67100000	85.32340000
6	Bhaktapur	district	1	2025-09-27 16:52:54.289396	bhaktapur	27.67220000	85.42980000
7	Kaski	district	2	2025-09-27 16:52:54.289396	kaski	28.20960000	83.98560000
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: elw
--

COPY public.users (id, email, password_hash, full_name, phone, location_id, is_verified, is_active, created_at, updated_at, role) FROM stdin;
1	system@thulobazaar.com	dummy_hash	System User	+977-9800000000	1	f	t	2025-09-27 18:26:42.089403	2025-09-27 18:26:42.089403	user
3	parvez@tst.com	$2b$12$b/6Da7Pl8GaBKW6oelu8JezmUooypucJq/UNne/uytuyqED/pfmxa	parvez	1767768678	\N	f	t	2025-09-27 18:45:18.982811	2025-09-27 18:45:18.982811	admin
4	admin@thulobazaar.com	$2b$10$tjzxU2h9tfElvDYuGbuN9uZNZ8pjZSR8RqB6g0qU3fq/scBVjb7Im	Admin User	+977-9800000001	\N	f	t	2025-09-27 21:37:24.590424	2025-09-27 22:25:05.708057	admin
2	test@test.com	$2b$12$vseh0ZwGV7J6LhcrexGg4Ot83yYtEkWI2Rc.rN53M5busmhH3/GiG	test		4	f	t	2025-09-27 18:36:51.759751	2025-09-27 18:36:51.759751	user
7	pre@test.com	$2b$12$RA1YUERTJ0tDAhFi9jaLMObiM2wZxZv7QsNu2QXb79svuJpan/M3m	pre test	32432543523	\N	f	t	2025-09-28 02:36:25.614601	2025-09-28 02:36:25.614601	user
8	test2@test.com	$2b$12$qUTJLitUZRn.JV62yqd3NuZn1NIGudetIrwkAO4gKdvVyTOWrJlau	Test User	9812345678	\N	f	t	2025-09-28 03:23:18.619379	2025-09-28 03:23:18.619379	user
\.


--
-- Name: ad_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ad_images_id_seq', 4, true);


--
-- Name: ad_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ad_reports_id_seq', 1, true);


--
-- Name: ads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.ads_id_seq', 25, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 13, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.locations_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: elw
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: ad_images ad_images_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_images
    ADD CONSTRAINT ad_images_pkey PRIMARY KEY (id);


--
-- Name: ad_reports ad_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports
    ADD CONSTRAINT ad_reports_pkey PRIMARY KEY (id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_slug_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_ad_images_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_images_ad_id ON public.ad_images USING btree (ad_id);


--
-- Name: idx_ad_images_primary; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_images_primary ON public.ad_images USING btree (ad_id, is_primary);


--
-- Name: idx_ad_reports_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_reports_ad_id ON public.ad_reports USING btree (ad_id);


--
-- Name: idx_ad_reports_reporter_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_reports_reporter_id ON public.ad_reports USING btree (reporter_id);


--
-- Name: idx_ad_reports_status; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_ad_reports_status ON public.ad_reports USING btree (status);


--
-- Name: idx_contact_messages_ad_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_ad_id ON public.contact_messages USING btree (ad_id);


--
-- Name: idx_contact_messages_buyer_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_buyer_id ON public.contact_messages USING btree (buyer_id);


--
-- Name: idx_contact_messages_seller_id; Type: INDEX; Schema: public; Owner: elw
--

CREATE INDEX idx_contact_messages_seller_id ON public.contact_messages USING btree (seller_id);


--
-- Name: idx_unique_ad_report; Type: INDEX; Schema: public; Owner: elw
--

CREATE UNIQUE INDEX idx_unique_ad_report ON public.ad_reports USING btree (ad_id, reporter_id);


--
-- Name: ad_images ad_images_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_images
    ADD CONSTRAINT ad_images_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_reports ad_reports_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports
    ADD CONSTRAINT ad_reports_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: ad_reports ad_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ad_reports
    ADD CONSTRAINT ad_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ads ads_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: ads ads_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: ads ads_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: ads ads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: contact_messages contact_messages_ad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contact_messages contact_messages_reply_to_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES public.contact_messages(id);


--
-- Name: contact_messages contact_messages_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: locations locations_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.locations(id);


--
-- Name: users users_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: elw
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- PostgreSQL database dump complete
--

\unrestrict eI64x7b7PJjy4RkAf7rN0F1EOPhOsXxRZae2xgHtf8au5EbL4Ca5ulpZCJ7A85w

