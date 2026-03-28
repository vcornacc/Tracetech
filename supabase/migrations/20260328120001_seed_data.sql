-- ============================================================
-- SEED DATA: Phase 1 — All 30 critical materials, ECU models,
-- sample ECUs, BOM compositions, lifecycle events, triggers
-- ============================================================

-- ============================================================
-- 1. ECU MODELS (8 types)
-- ============================================================
INSERT INTO public.ecu_models (id, model_code, description, base_weight_grams) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'ECU-MDG1', 'Motor Drive Gateway', 250),
  ('a0000001-0000-0000-0000-000000000002', 'ECU-ESP9', 'Electronic Stability Program', 220),
  ('a0000001-0000-0000-0000-000000000003', 'ECU-ACC4', 'Adaptive Cruise Control', 190),
  ('a0000001-0000-0000-0000-000000000004', 'ECU-BMS3', 'Battery Management System', 310),
  ('a0000001-0000-0000-0000-000000000005', 'ECU-TCU2', 'Transmission Control Unit', 280),
  ('a0000001-0000-0000-0000-000000000006', 'ECU-BCM5', 'Body Control Module', 200),
  ('a0000001-0000-0000-0000-000000000007', 'ECU-ADAS7', 'Advanced Driver Assistance', 350),
  ('a0000001-0000-0000-0000-000000000008', 'ECU-EPS6', 'Electric Power Steering', 240);

-- ============================================================
-- 2. MATERIALS (30 from Bosch Circuit BOM)
-- Including: Yale Criticality, EU CRM, HHI, risk profiles,
-- sustainability (GWP), price, geopolitical risk per country
-- ============================================================
INSERT INTO public.materials (id, name, cas_number, grams_per_circuit, price_per_kg, yale_score, eu_sr_x_ei, cluster, hhi, recycle_rate, top_producers, eu_crm_listed, eu_crm_year, risk_supply, risk_geopolitical, risk_price_volatility, risk_recycle_gap, risk_esg, risk_concentration_hhi, gwp_kg_co2_per_kg, water_usage_l_per_kg, energy_mj_per_kg, country_risk_scores) VALUES
-- Cluster: OPERATIONAL (green)
('b0000001-0000-0000-0000-000000000001', 'Copper', '7440-50-8', 19.17, 8.50, 52, 2.8, 'operational', 1200, 45, '{"Chile","Peru","China"}', false, NULL, 45, 40, 65, 30, 50, 35, 3.5, 130, 33, '{"Chile":25,"Peru":30,"China":65}'),
('b0000001-0000-0000-0000-000000000002', 'Gold', '7440-57-5', 0.00046, 62000, 50, 2.5, 'operational', 800, 50, '{"China","Australia","Russia"}', false, NULL, 35, 48, 60, 25, 55, 28, 16000, 260000, 210000, '{"China":65,"Australia":15,"Russia":72}'),
('b0000001-0000-0000-0000-000000000003', 'Manganese', '7439-96-5', 0.006, 2.10, 48, 2.2, 'operational', 1100, 35, '{"South Africa","Australia","Gabon"}', false, NULL, 42, 50, 45, 50, 48, 38, 4.4, 50, 55, '{"South Africa":42,"Australia":12,"Gabon":48}'),
('b0000001-0000-0000-0000-000000000004', 'Chromium', '7440-47-3', 0.000001, 9.80, 45, 2.0, 'operational', 1400, 30, '{"South Africa","Kazakhstan","India"}', false, NULL, 40, 45, 50, 55, 40, 42, 18, 100, 160, '{"South Africa":42,"Kazakhstan":55,"India":38}'),
('b0000001-0000-0000-0000-000000000005', 'Aluminum', '7429-90-5', 1.557, 2.30, 40, 1.8, 'operational', 900, 55, '{"China","India","Russia"}', false, NULL, 35, 55, 50, 25, 45, 60, 12, 1500, 170, '{"China":65,"India":38,"Russia":72}'),
('b0000001-0000-0000-0000-000000000006', 'Lead', '7439-92-1', 0.045, 2.00, 42, 1.9, 'operational', 1000, 60, '{"China","Australia","USA"}', false, NULL, 30, 35, 45, 20, 70, 32, 2.6, 45, 25, '{"China":65,"Australia":12,"USA":10}'),
('b0000001-0000-0000-0000-000000000007', 'Molybdenum', '7439-98-7', 0.001, 40, 52, 2.4, 'operational', 1300, 33, '{"China","Chile","USA"}', false, NULL, 48, 52, 58, 50, 40, 45, 6.5, 85, 110, '{"China":65,"Chile":25,"USA":10}'),
('b0000001-0000-0000-0000-000000000008', 'Selenium', '7782-49-2', 0.0000005, 25, 54, 2.5, 'operational', 1800, 20, '{"China","Germany","Japan"}', false, NULL, 52, 48, 42, 65, 35, 50, 3.0, 40, 42, '{"China":65,"Germany":8,"Japan":12}'),
('b0000001-0000-0000-0000-000000000009', 'Barium', '7440-39-3', 0.051, 0.30, 38, 1.6, 'operational', 900, 25, '{"China","India","Morocco"}', false, NULL, 32, 55, 30, 60, 35, 58, 2.8, 35, 30, '{"China":65,"India":38,"Morocco":35}'),
('b0000001-0000-0000-0000-000000000010', 'Boron', '7440-42-8', 0.013, 3.50, 48, 2.3, 'operational', 2600, 12, '{"Turkey","USA","Argentina"}', false, NULL, 55, 42, 35, 75, 30, 70, 4.2, 55, 65, '{"Turkey":45,"USA":10,"Argentina":32}'),
('b0000001-0000-0000-0000-000000000011', 'Titanium', '7440-32-6', 0.006, 11, 44, 2.1, 'operational', 1000, 38, '{"China","Russia","Japan"}', false, NULL, 38, 55, 42, 45, 35, 48, 36, 250, 350, '{"China":65,"Russia":72,"Japan":12}'),
('b0000001-0000-0000-0000-000000000012', 'Zinc', '7440-66-6', 0.041, 2.60, 35, 1.5, 'operational', 700, 50, '{"China","Peru","Australia"}', false, NULL, 28, 40, 55, 30, 38, 35, 3.6, 80, 50, '{"China":65,"Peru":30,"Australia":12}'),
('b0000001-0000-0000-0000-000000000013', 'Iron', '7439-89-6', 1.993, 0.10, 30, 1.2, 'operational', 600, 65, '{"Australia","Brazil","China"}', false, NULL, 22, 30, 45, 15, 40, 25, 1.9, 30, 20, '{"Australia":12,"Brazil":28,"China":65}'),
('b0000001-0000-0000-0000-000000000014', 'Silicon', '7440-21-3', 0.604, 2.50, 42, 2.0, 'operational', 2000, 20, '{"China","Russia","Norway"}', false, NULL, 40, 58, 38, 65, 42, 62, 11, 150, 100, '{"China":65,"Russia":72,"Norway":5}'),
('b0000001-0000-0000-0000-000000000015', 'Arsenic', '7440-38-2', 0.00039, 1.20, 50, 2.4, 'operational', 2400, 5, '{"China","Morocco","Russia"}', false, NULL, 52, 60, 35, 90, 85, 65, 2.2, 35, 28, '{"China":65,"Morocco":35,"Russia":72}'),

-- Cluster: PRODUCT (amber)
('b0000001-0000-0000-0000-000000000016', 'Tin', '7440-31-5', 2.083, 25.50, 58, 3.0, 'product', 1800, 30, '{"China","Indonesia","Myanmar"}', true, 2023, 60, 55, 70, 55, 65, 50, 16, 200, 220, '{"China":65,"Indonesia":42,"Myanmar":78}'),
('b0000001-0000-0000-0000-000000000017', 'Silver', '7440-22-4', 0.149, 850, 55, 2.9, 'product', 1500, 35, '{"Mexico","Peru","China"}', true, 2023, 50, 45, 75, 40, 42, 38, 110, 1500, 1640, '{"Mexico":38,"Peru":30,"China":65}'),
('b0000001-0000-0000-0000-000000000018', 'Platinum', '7440-56-4', 0.000019, 31000, 70, 3.5, 'product', 4200, 20, '{"South Africa","Russia","Zimbabwe"}', true, 2023, 82, 85, 70, 65, 58, 90, 12500, 180000, 195000, '{"South Africa":42,"Russia":72,"Zimbabwe":62}'),
('b0000001-0000-0000-0000-000000000019', 'Tantalum', '7440-25-7', 0.000019, 150, 65, 3.2, 'product', 3200, 15, '{"Congo (DRC)","Rwanda","Brazil"}', true, 2023, 75, 88, 60, 78, 85, 72, 200, 2500, 3200, '{"Congo (DRC)":92,"Rwanda":55,"Brazil":28}'),

-- Cluster: SECTORAL (cyan)
('b0000001-0000-0000-0000-000000000020', 'Nickel', '7440-02-0', 0.286, 16.50, 60, 3.1, 'sectoral', 1600, 40, '{"Indonesia","Philippines","Russia"}', true, 2023, 62, 68, 72, 45, 60, 48, 13, 200, 150, '{"Indonesia":42,"Philippines":35,"Russia":72}'),
('b0000001-0000-0000-0000-000000000021', 'Tungsten', '7440-33-7', 0.001, 35, 68, 3.4, 'sectoral', 3500, 22, '{"China","Vietnam","Russia"}', true, 2023, 78, 82, 55, 68, 52, 85, 25, 280, 320, '{"China":65,"Vietnam":38,"Russia":72}'),
('b0000001-0000-0000-0000-000000000022', 'Cadmium', '7440-43-9', 0.00072, 2.50, 55, 2.6, 'sectoral', 2000, 25, '{"China","South Korea","Japan"}', false, NULL, 55, 50, 40, 60, 80, 55, 5.5, 70, 80, '{"China":65,"South Korea":18,"Japan":12}'),
('b0000001-0000-0000-0000-000000000023', 'Antimony', '7440-36-0', 0.026, 12, 62, 3.3, 'sectoral', 3000, 10, '{"China","Russia","Tajikistan"}', true, 2023, 72, 78, 55, 82, 58, 80, 8.5, 120, 150, '{"China":65,"Russia":72,"Tajikistan":55}'),
('b0000001-0000-0000-0000-000000000024', 'Bismuth', '7440-69-9', 0.053, 8, 56, 2.7, 'sectoral', 2800, 8, '{"China","Vietnam","Mexico"}', true, 2023, 65, 70, 48, 85, 45, 75, 7.0, 90, 100, '{"China":65,"Vietnam":38,"Mexico":38}'),
('b0000001-0000-0000-0000-000000000025', 'Vanadium', '7440-62-2', 0.000077, 30, 58, 2.8, 'sectoral', 2200, 15, '{"China","Russia","South Africa"}', true, 2023, 60, 72, 65, 75, 50, 68, 38, 350, 480, '{"China":65,"Russia":72,"South Africa":42}'),
('b0000001-0000-0000-0000-000000000026', 'Phosphorus', '7723-14-0', 0.004, 1.50, 60, 3.0, 'sectoral', 2800, 18, '{"China","Morocco","USA"}', true, 2023, 65, 62, 50, 70, 55, 72, 3.0, 45, 38, '{"China":65,"Morocco":35,"USA":10}'),
('b0000001-0000-0000-0000-000000000027', 'Magnesium', '7439-95-4', 0.00005, 3.00, 55, 2.6, 'sectoral', 3000, 28, '{"China","Russia","Israel"}', true, 2023, 58, 72, 52, 55, 45, 80, 35, 400, 450, '{"China":65,"Russia":72,"Israel":30}'),

-- Cluster: SYSTEMIC (red)
('b0000001-0000-0000-0000-000000000028', 'Cobalt', '7440-48-4', 0.001, 33, 82, 4.2, 'systemic', 3800, 12, '{"Congo (DRC)","Russia","Australia"}', true, 2023, 92, 95, 78, 85, 90, 88, 8.3, 130, 100, '{"Congo (DRC)":92,"Russia":72,"Australia":12}'),
('b0000001-0000-0000-0000-000000000029', 'Palladium', '2023568', 0.000039, 45000, 78, 4.0, 'systemic', 4500, 18, '{"Russia","South Africa","Canada"}', true, 2023, 88, 90, 85, 70, 65, 92, 9800, 150000, 170000, '{"Russia":72,"South Africa":42,"Canada":8}'),
('b0000001-0000-0000-0000-000000000030', 'Indium', '7440-74-6', 0.0000185, 300, 72, 3.6, 'systemic', 3600, 5, '{"China","South Korea","Japan"}', true, 2023, 80, 75, 68, 90, 48, 82, 142, 1800, 2200, '{"China":65,"South Korea":18,"Japan":12}'),
('b0000001-0000-0000-0000-000000000031', 'Germanium', '7440-56-4', 0.0000185, 1500, 70, 3.5, 'systemic', 3400, 8, '{"China","Russia","USA"}', true, 2023, 78, 80, 62, 88, 42, 78, 150, 2000, 2500, '{"China":65,"Russia":72,"USA":10}'),
('b0000001-0000-0000-0000-000000000032', 'Tellurium', '13494-80-9', 0.00000007, 80, 68, 3.3, 'systemic', 3200, 4, '{"China","Sweden","Japan"}', true, 2023, 82, 72, 70, 92, 40, 78, 55, 800, 950, '{"China":65,"Sweden":5,"Japan":12}'),
('b0000001-0000-0000-0000-000000000033', 'Ruthenium', '12036-10-1', 0.000028, 15000, 74, 3.8, 'systemic', 4800, 10, '{"South Africa","Russia","Zimbabwe"}', true, 2023, 85, 88, 75, 80, 55, 95, 8500, 120000, 140000, '{"South Africa":42,"Russia":72,"Zimbabwe":62}');

-- ============================================================
-- 3. SAMPLE ECUs (24 units)
-- ============================================================
INSERT INTO public.ecus (id, ecu_code, model_id, part_number, vehicle_model, vin, production_date, installation_date, status, circular_path, total_weight_grams, crm_content_grams, crm_value_euro, risk_score, recovery_rate, dpp_id, digital_twin_id, location, mileage_km, health_score, remaining_life_months) VALUES
('c0000001-0000-0000-0000-000000000001', 'ECU-0001', 'a0000001-0000-0000-0000-000000000001', '0 261 100 42', 'BMW 3 Series', 'WBAA1234567890XYZ', '2022-03-15', '2022-04-10', 'active', 'pending', 265.3, 12.45, 158.20, 45, 38, 'DPP-BOSCH-000001', 'DT-ECU-MDG1-0001', 'Stuttgart, DE', 85000, 82, 48),
('c0000001-0000-0000-0000-000000000002', 'ECU-0002', 'a0000001-0000-0000-0000-000000000002', '0 262 210 55', 'Mercedes C-Class', 'WBAB2345678901ABC', '2021-07-20', '2021-08-15', 'active', 'pending', 228.7, 9.82, 124.50, 52, 42, 'DPP-BOSCH-000002', 'DT-ECU-ESP9-0002', 'Munich, DE', 120000, 75, 36),
('c0000001-0000-0000-0000-000000000003', 'ECU-0003', 'a0000001-0000-0000-0000-000000000003', '0 263 320 18', 'Audi A4', 'WBAC3456789012DEF', '2023-01-10', '2023-02-05', 'active', 'pending', 195.2, 8.15, 98.30, 38, 35, 'DPP-BOSCH-000003', 'DT-ECU-ACC4-0003', 'Wolfsburg, DE', 45000, 90, 72),
('c0000001-0000-0000-0000-000000000004', 'ECU-0004', 'a0000001-0000-0000-0000-000000000004', '0 264 430 91', 'VW Golf', 'WBAD4567890123GHI', '2020-11-25', '2020-12-20', 'active', 'pending', 318.5, 18.90, 245.60, 61, 30, 'DPP-BOSCH-000004', 'DT-ECU-BMS3-0004', 'Ingolstadt, DE', 165000, 68, 24),
('c0000001-0000-0000-0000-000000000005', 'ECU-0005', 'a0000001-0000-0000-0000-000000000005', '0 265 540 73', 'Porsche Taycan', 'WBAE5678901234JKL', '2023-06-08', '2023-07-03', 'maintenance', 'repair', 290.1, 15.30, 198.40, 55, 40, 'DPP-BOSCH-000005', 'DT-ECU-TCU2-0005', 'Gothenburg, SE', 78000, 55, 8),
('c0000001-0000-0000-0000-000000000006', 'ECU-0006', 'a0000001-0000-0000-0000-000000000006', '0 266 650 29', 'BMW iX', 'WBAF6789012345MNO', '2022-09-12', '2022-10-07', 'active', 'pending', 205.8, 7.60, 92.10, 42, 45, 'DPP-BOSCH-000006', 'DT-ECU-BCM5-0006', 'Milan, IT', 95000, 78, 42),
('c0000001-0000-0000-0000-000000000007', 'ECU-0007', 'a0000001-0000-0000-0000-000000000007', '0 267 760 64', 'Mercedes EQS', 'WBAG7890123456PQR', '2021-04-18', '2021-05-13', 'active', 'pending', 358.2, 22.40, 312.80, 68, 28, 'DPP-BOSCH-000007', 'DT-ECU-ADAS7-0007', 'Paris, FR', 140000, 72, 30),
('c0000001-0000-0000-0000-000000000008', 'ECU-0008', 'a0000001-0000-0000-0000-000000000008', '0 268 870 38', 'Audi e-tron', 'WBAH8901234567STU', '2023-08-22', '2023-09-17', 'active', 'pending', 245.6, 10.20, 135.70, 48, 36, 'DPP-BOSCH-000008', 'DT-ECU-EPS6-0008', 'Barcelona, ES', 32000, 92, 84),
('c0000001-0000-0000-0000-000000000009', 'ECU-0009', 'a0000001-0000-0000-0000-000000000001', '0 269 180 45', 'VW ID.4', 'WBAI9012345678VWX', '2020-05-30', '2020-06-25', 'eol', 'selective_recovery', 253.4, 11.80, 148.90, 72, 25, 'DPP-BOSCH-000009', 'DT-ECU-MDG1-0009', 'Detroit, US', 245000, 15, 0),
('c0000001-0000-0000-0000-000000000010', 'ECU-0010', 'a0000001-0000-0000-0000-000000000002', '0 270 290 81', 'Porsche Cayenne', 'WBAJ0123456789YZA', '2021-12-14', '2022-01-09', 'maintenance', 'reuse', 232.1, 10.40, 130.20, 58, 44, 'DPP-BOSCH-000010', 'DT-ECU-ESP9-0010', 'Seoul, KR', 110000, 48, 6),
('c0000001-0000-0000-0000-000000000011', 'ECU-0011', 'a0000001-0000-0000-0000-000000000003', '0 271 310 62', 'Volvo XC90', 'WBAK1234567890BCD', '2022-02-28', '2022-03-25', 'active', 'pending', 192.8, 7.90, 95.40, 41, 37, 'DPP-BOSCH-000011', 'DT-ECU-ACC4-0011', 'Tokyo, JP', 88000, 80, 44),
('c0000001-0000-0000-0000-000000000012', 'ECU-0012', 'a0000001-0000-0000-0000-000000000004', '0 272 420 17', 'Toyota Camry', 'WBAL2345678901EFG', '2019-08-10', '2019-09-05', 'recovered', 'refurbish', 325.0, 19.50, 260.30, 65, 52, 'DPP-BOSCH-000012', 'DT-ECU-BMS3-0012', 'Shanghai, CN', 280000, 22, 0),
('c0000001-0000-0000-0000-000000000013', 'ECU-0013', 'a0000001-0000-0000-0000-000000000005', '0 273 530 48', 'Ford Mustang Mach-E', 'WBAM3456789012HIJ', '2023-04-05', '2023-05-01', 'active', 'pending', 285.3, 14.70, 185.90, 50, 33, 'DPP-BOSCH-000013', 'DT-ECU-TCU2-0013', 'Stuttgart, DE', 52000, 88, 60),
('c0000001-0000-0000-0000-000000000014', 'ECU-0014', 'a0000001-0000-0000-0000-000000000006', '0 274 640 93', 'Hyundai Ioniq 5', 'WBAN4567890123KLM', '2022-06-18', '2022-07-13', 'active', 'pending', 210.4, 8.30, 102.60, 44, 41, 'DPP-BOSCH-000014', 'DT-ECU-BCM5-0014', 'Munich, DE', 73000, 84, 50),
('c0000001-0000-0000-0000-000000000015', 'ECU-0015', 'a0000001-0000-0000-0000-000000000007', '0 275 750 26', 'BMW 3 Series', 'WBAO5678901234NOP', '2021-10-22', '2021-11-17', 'in_recovery', 'selective_recovery', 345.7, 21.10, 295.40, 70, 48, 'DPP-BOSCH-000015', 'DT-ECU-ADAS7-0015', 'Wolfsburg, DE', 195000, 30, 0),
('c0000001-0000-0000-0000-000000000016', 'ECU-0016', 'a0000001-0000-0000-0000-000000000008', '0 276 860 57', 'Mercedes C-Class', 'WBAP6789012345QRS', '2023-11-08', '2023-12-03', 'active', 'pending', 242.9, 10.80, 140.50, 46, 39, 'DPP-BOSCH-000016', 'DT-ECU-EPS6-0016', 'Ingolstadt, DE', 18000, 95, 90),
('c0000001-0000-0000-0000-000000000017', 'ECU-0017', 'a0000001-0000-0000-0000-000000000001', '0 277 170 84', 'Audi A4', 'WBAQ7890123456TUV', '2020-07-14', '2020-08-09', 'eol', 'refurbish', 270.5, 13.20, 170.80, 74, 22, 'DPP-BOSCH-000017', 'DT-ECU-MDG1-0017', 'Gothenburg, SE', 260000, 12, 0),
('c0000001-0000-0000-0000-000000000018', 'ECU-0018', 'a0000001-0000-0000-0000-000000000002', '0 278 280 31', 'VW Golf', 'WBAR8901234567WXY', '2022-01-20', '2022-02-15', 'active', 'pending', 225.3, 9.50, 118.70, 49, 40, 'DPP-BOSCH-000018', 'DT-ECU-ESP9-0018', 'Milan, IT', 98000, 76, 38),
('c0000001-0000-0000-0000-000000000019', 'ECU-0019', 'a0000001-0000-0000-0000-000000000003', '0 279 390 69', 'Porsche Taycan', 'WBAS9012345678ZAB', '2023-03-12', '2023-04-07', 'active', 'pending', 198.6, 8.40, 105.20, 40, 34, 'DPP-BOSCH-000019', 'DT-ECU-ACC4-0019', 'Paris, FR', 42000, 89, 66),
('c0000001-0000-0000-0000-000000000020', 'ECU-0020', 'a0000001-0000-0000-0000-000000000004', '0 280 410 52', 'BMW iX', 'WBAT0123456789CDE', '2021-09-28', '2021-10-23', 'maintenance', 'repair', 312.8, 17.60, 228.50, 59, 31, 'DPP-BOSCH-000020', 'DT-ECU-BMS3-0020', 'Barcelona, ES', 155000, 45, 4),
('c0000001-0000-0000-0000-000000000021', 'ECU-0021', 'a0000001-0000-0000-0000-000000000005', '0 281 520 38', 'Mercedes EQS', 'WBAU1234567890FGH', '2022-11-05', '2022-12-01', 'active', 'pending', 288.9, 14.90, 192.30, 53, 36, 'DPP-BOSCH-000021', 'DT-ECU-TCU2-0021', 'Detroit, US', 68000, 81, 52),
('c0000001-0000-0000-0000-000000000022', 'ECU-0022', 'a0000001-0000-0000-0000-000000000006', '0 282 630 75', 'Audi e-tron', 'WBAV2345678901IJK', '2023-07-19', '2023-08-14', 'active', 'pending', 208.1, 7.80, 94.60, 43, 43, 'DPP-BOSCH-000022', 'DT-ECU-BCM5-0022', 'Seoul, KR', 28000, 93, 78),
('c0000001-0000-0000-0000-000000000023', 'ECU-0023', 'a0000001-0000-0000-0000-000000000007', '0 283 740 16', 'VW ID.4', 'WBAW3456789012LMN', '2020-12-08', '2021-01-03', 'recovered', 'reuse', 352.4, 20.80, 285.60, 66, 55, 'DPP-BOSCH-000023', 'DT-ECU-ADAS7-0023', 'Tokyo, JP', 220000, 18, 0),
('c0000001-0000-0000-0000-000000000024', 'ECU-0024', 'a0000001-0000-0000-0000-000000000008', '0 284 850 49', 'Porsche Cayenne', 'WBAX4567890123OPQ', '2022-04-25', '2022-05-20', 'active', 'pending', 248.2, 11.10, 142.80, 47, 38, 'DPP-BOSCH-000024', 'DT-ECU-EPS6-0024', 'Shanghai, CN', 82000, 79, 46);

-- ============================================================
-- 4. ECU-MATERIAL COMPOSITIONS (BOM)
-- Each ECU gets 8-10 materials from different clusters
-- ============================================================

-- ECU-0001 (MDG1, BMW 3 Series)
INSERT INTO public.ecu_materials (ecu_id, material_id, weight_grams, recoverable, recovery_method, value_per_kg) VALUES
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 19.17, true, 'Hydrometallurgy', 8.50),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', 1.56, true, 'Hydrometallurgy', 2.30),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000013', 1.99, true, 'Pyrometallurgy', 0.10),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000016', 2.08, true, 'Hydrometallurgy', 25.50),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000028', 0.001, false, 'Selective Leaching', 33.00),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000029', 0.000039, false, 'Selective Leaching', 45000.00),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 0.00046, true, 'Hydrometallurgy', 62000.00),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000020', 0.286, true, 'Hydrometallurgy', 16.50),
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000014', 0.60, false, 'Pyrometallurgy', 2.50);

-- ECU-0002 (ESP9, Mercedes C-Class)
INSERT INTO public.ecu_materials (ecu_id, material_id, weight_grams, recoverable, recovery_method, value_per_kg) VALUES
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 18.50, true, 'Hydrometallurgy', 8.50),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000016', 1.95, true, 'Hydrometallurgy', 25.50),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000017', 0.15, true, 'Hydrometallurgy', 850.00),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000018', 0.000019, false, 'Selective Leaching', 31000.00),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000019', 0.000019, false, 'Selective Leaching', 150.00),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 1.20, true, 'Hydrometallurgy', 2.30),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000028', 0.0008, false, 'Selective Leaching', 33.00),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000030', 0.0000185, false, 'Selective Leaching', 300.00);

-- ECU-0003 (ACC4, Audi A4)
INSERT INTO public.ecu_materials (ecu_id, material_id, weight_grams, recoverable, recovery_method, value_per_kg) VALUES
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 17.80, true, 'Hydrometallurgy', 8.50),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000014', 0.55, false, 'Pyrometallurgy', 2.50),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000016', 1.80, true, 'Hydrometallurgy', 25.50),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000002', 0.00042, true, 'Hydrometallurgy', 62000.00),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000021', 0.001, false, 'Pyrometallurgy', 35.00),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000029', 0.000035, false, 'Selective Leaching', 45000.00),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000013', 1.85, true, 'Pyrometallurgy', 0.10),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000020', 0.25, true, 'Hydrometallurgy', 16.50);

-- ECU-0004 (BMS3, VW Golf) — high CRM content
INSERT INTO public.ecu_materials (ecu_id, material_id, weight_grams, recoverable, recovery_method, value_per_kg) VALUES
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 20.50, true, 'Hydrometallurgy', 8.50),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000028', 0.0015, false, 'Selective Leaching', 33.00),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000020', 0.35, true, 'Hydrometallurgy', 16.50),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000003', 0.008, true, 'Hydrometallurgy', 2.10),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000016', 2.20, true, 'Hydrometallurgy', 25.50),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000017', 0.18, true, 'Hydrometallurgy', 850.00),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000029', 0.00005, false, 'Selective Leaching', 45000.00),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000031', 0.0000185, false, 'Selective Leaching', 1500.00),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000005', 1.80, true, 'Hydrometallurgy', 2.30),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000013', 2.10, true, 'Pyrometallurgy', 0.10);

-- ECU-0007 (ADAS7, Mercedes EQS) — highest CRM value
INSERT INTO public.ecu_materials (ecu_id, material_id, weight_grams, recoverable, recovery_method, value_per_kg) VALUES
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000001', 22.30, true, 'Hydrometallurgy', 8.50),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000002', 0.00055, true, 'Hydrometallurgy', 62000.00),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000018', 0.000025, false, 'Selective Leaching', 31000.00),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000029', 0.000055, false, 'Selective Leaching', 45000.00),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000033', 0.000035, false, 'Selective Leaching', 15000.00),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000028', 0.0012, false, 'Selective Leaching', 33.00),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000030', 0.0000225, false, 'Selective Leaching', 300.00),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000016', 2.50, true, 'Hydrometallurgy', 25.50),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000020', 0.32, true, 'Hydrometallurgy', 16.50),
('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000014', 0.65, false, 'Pyrometallurgy', 2.50);

-- Remaining ECUs: bulk insert with representative compositions
-- ECU-0005 through ECU-0024 (excluding 0007 already done)
INSERT INTO public.ecu_materials (ecu_id, material_id, weight_grams, recoverable, recovery_method, value_per_kg)
SELECT e.id, m.material_id, m.weight_grams, m.recoverable, m.recovery_method, m.value_per_kg
FROM public.ecus e
CROSS JOIN LATERAL (
  VALUES
    ('b0000001-0000-0000-0000-000000000001'::UUID, 18.5, true, 'Hydrometallurgy', 8.50),
    ('b0000001-0000-0000-0000-000000000005'::UUID, 1.4, true, 'Hydrometallurgy', 2.30),
    ('b0000001-0000-0000-0000-000000000016'::UUID, 1.9, true, 'Hydrometallurgy', 25.50),
    ('b0000001-0000-0000-0000-000000000002'::UUID, 0.00044, true, 'Hydrometallurgy', 62000.00),
    ('b0000001-0000-0000-0000-000000000028'::UUID, 0.0009, false, 'Selective Leaching', 33.00),
    ('b0000001-0000-0000-0000-000000000020'::UUID, 0.28, true, 'Hydrometallurgy', 16.50),
    ('b0000001-0000-0000-0000-000000000014'::UUID, 0.58, false, 'Pyrometallurgy', 2.50),
    ('b0000001-0000-0000-0000-000000000013'::UUID, 1.90, true, 'Pyrometallurgy', 0.10)
) AS m(material_id, weight_grams, recoverable, recovery_method, value_per_kg)
WHERE e.id NOT IN (
  'c0000001-0000-0000-0000-000000000001',
  'c0000001-0000-0000-0000-000000000002',
  'c0000001-0000-0000-0000-000000000003',
  'c0000001-0000-0000-0000-000000000004',
  'c0000001-0000-0000-0000-000000000007'
);

-- ============================================================
-- 5. LIFECYCLE EVENTS (for key ECUs)
-- ============================================================
INSERT INTO public.ecu_lifecycle_events (ecu_id, event_type, event_date, description, location) VALUES
-- ECU-0001
('c0000001-0000-0000-0000-000000000001', 'production', '2022-03-15', 'Produzione ECU-MDG1', 'Reutlingen, DE'),
('c0000001-0000-0000-0000-000000000001', 'installation', '2022-04-10', 'Installazione su BMW 3 Series', 'Stuttgart, DE'),
-- ECU-0005 (maintenance)
('c0000001-0000-0000-0000-000000000005', 'production', '2023-06-08', 'Produzione ECU-TCU2', 'Reutlingen, DE'),
('c0000001-0000-0000-0000-000000000005', 'installation', '2023-07-03', 'Installazione su Porsche Taycan', 'Gothenburg, SE'),
('c0000001-0000-0000-0000-000000000005', 'maintenance', '2025-06-20', 'Manutenzione programmata', 'Gothenburg, SE'),
-- ECU-0009 (eol)
('c0000001-0000-0000-0000-000000000009', 'production', '2020-05-30', 'Produzione ECU-MDG1', 'Reutlingen, DE'),
('c0000001-0000-0000-0000-000000000009', 'installation', '2020-06-25', 'Installazione su VW ID.4', 'Detroit, US'),
('c0000001-0000-0000-0000-000000000009', 'maintenance', '2022-08-15', 'Manutenzione programmata', 'Detroit, US'),
('c0000001-0000-0000-0000-000000000009', 'eol', '2025-01-12', 'Fine vita veicolo', 'Detroit, US'),
-- ECU-0012 (recovered)
('c0000001-0000-0000-0000-000000000012', 'production', '2019-08-10', 'Produzione ECU-BMS3', 'Reutlingen, DE'),
('c0000001-0000-0000-0000-000000000012', 'installation', '2019-09-05', 'Installazione su Toyota Camry', 'Shanghai, CN'),
('c0000001-0000-0000-0000-000000000012', 'maintenance', '2021-10-20', 'Manutenzione programmata', 'Shanghai, CN'),
('c0000001-0000-0000-0000-000000000012', 'eol', '2024-03-15', 'Fine vita veicolo', 'Shanghai, CN'),
('c0000001-0000-0000-0000-000000000012', 'recovery', '2024-05-01', 'Recovery via refurbish', 'Reutlingen, DE'),
-- ECU-0015 (in_recovery)
('c0000001-0000-0000-0000-000000000015', 'production', '2021-10-22', 'Produzione ECU-ADAS7', 'Reutlingen, DE'),
('c0000001-0000-0000-0000-000000000015', 'installation', '2021-11-17', 'Installazione su BMW 3 Series', 'Wolfsburg, DE'),
('c0000001-0000-0000-0000-000000000015', 'maintenance', '2023-12-05', 'Manutenzione programmata', 'Wolfsburg, DE'),
('c0000001-0000-0000-0000-000000000015', 'eol', '2025-09-20', 'Fine vita programmata', 'Wolfsburg, DE');

-- ============================================================
-- 6. CIRCULAR TRIGGERS
-- ============================================================
INSERT INTO public.circular_triggers (trigger_code, trigger_type, label, description, triggered_at, severity, affected_ecus_count, affected_materials, status, payload) VALUES
('TRG-001', 'eol_vehicle', 'Fine Vita Veicolo', 'Lotto di 142 veicoli BMW 3 Series raggiungono fine vita programmata Q1 2026', '2026-02-10T08:30:00Z', 'high', 142, '{"Cobalt","Palladium","Tantalum","Indium"}', 'active', '{"vehicle_model":"BMW 3 Series","quarter":"Q1 2026","batch_size":142}'),
('TRG-002', 'geopolitical_shock', 'Shock Geopolitico — DRC', 'Instabilità politica nella regione del Katanga, Congo (DRC). Interruzione supply Cobalto prevista +3 mesi', '2026-02-08T14:15:00Z', 'critical', 850, '{"Cobalt","Tantalum"}', 'active', '{"country":"DRC","region":"Katanga","duration_months":3,"supply_impact_pct":-40}'),
('TRG-003', 'price_volatility', 'Volatilità Prezzo Palladio', 'Palladio supera soglia +25% variazione trimestrale. Attivazione protocollo hedging', '2026-02-05T10:00:00Z', 'high', 400, '{"Palladium"}', 'monitoring', '{"material":"Palladium","price_change_pct":25,"threshold_pct":20}'),
('TRG-004', 'regulatory_update', 'Aggiornamento EU Battery Regulation', 'Nuovi requisiti di contenuto riciclato minimo per Cobalto (16%) e Litio (6%) dal 2027', '2026-01-28T09:00:00Z', 'medium', 1200, '{"Cobalt","Nickel","Manganese"}', 'monitoring', '{"regulation":"EU Battery Regulation","effective_date":"2027-01-01","cobalt_min_recycled_pct":16,"lithium_min_recycled_pct":6}'),
('TRG-005', 'component_replacement', 'Sostituzione Batch ECU-ESP9', 'Campagna di richiamo per 230 ECU-ESP9 con difetto firmware. Opportunità recovery CRM', '2026-01-20T11:30:00Z', 'medium', 230, '{"Platinum","Gold","Silver"}', 'resolved', '{"ecu_model":"ECU-ESP9","reason":"firmware_defect","batch_size":230}'),
('TRG-006', 'geopolitical_shock', 'Restrizioni Export Cina — Germanio', 'Nuove restrizioni all''export di Germanio dalla Cina. Impatto su supply globale -30%', '2026-02-12T16:00:00Z', 'critical', 600, '{"Germanium","Indium","Tungsten"}', 'active', '{"country":"China","materials":["Germanium","Indium","Tungsten"],"supply_impact_pct":-30}');

-- ============================================================
-- 7. SAMPLE PRICE HISTORY (last 12 months for key materials)
-- ============================================================
INSERT INTO public.material_price_history (material_id, price_per_kg, recorded_date, source) VALUES
-- Cobalt price history
('b0000001-0000-0000-0000-000000000028', 28.50, '2025-04-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 29.80, '2025-05-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 31.20, '2025-06-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 30.50, '2025-07-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 32.10, '2025-08-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 33.80, '2025-09-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 35.20, '2025-10-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 34.00, '2025-11-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 32.50, '2025-12-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 31.80, '2026-01-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 33.00, '2026-02-01', 'LME'),
('b0000001-0000-0000-0000-000000000028', 33.00, '2026-03-01', 'LME'),
-- Palladium price history
('b0000001-0000-0000-0000-000000000029', 38000, '2025-04-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 39500, '2025-05-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 41000, '2025-06-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 40200, '2025-07-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 42500, '2025-08-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 43800, '2025-09-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 44200, '2025-10-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 43000, '2025-11-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 44500, '2025-12-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 44800, '2026-01-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 45000, '2026-02-01', 'LME'),
('b0000001-0000-0000-0000-000000000029', 45000, '2026-03-01', 'LME'),
-- Copper price history
('b0000001-0000-0000-0000-000000000001', 7.80, '2025-04-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 7.95, '2025-05-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.10, '2025-06-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.25, '2025-07-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.40, '2025-08-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.30, '2025-09-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.55, '2025-10-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.45, '2025-11-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.60, '2025-12-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.50, '2026-01-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.50, '2026-02-01', 'LME'),
('b0000001-0000-0000-0000-000000000001', 8.50, '2026-03-01', 'LME');

-- ============================================================
-- 8. DEFAULT FINANCIAL SCENARIO
-- ============================================================
INSERT INTO public.financial_scenarios (label, capex, opex, annual_capacity, crm_value_per_unit, discount_rate, years, results) VALUES
('Base Case', 2500000, 450000, 5000, 185, 0.08, 10, '{"npv": 1250000, "irr": 0.142, "payback_years": 4.2}');
