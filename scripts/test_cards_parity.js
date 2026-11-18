#!/usr/bin/env node
/**
 * Parity test for SecretaryBird card files (data/cards/{hub}.{lang}.json).
 * Verifies that for every record, every field read by the app's card/filter/compare/SEO
 * functions, and every test language (en, ar, ru, fa -> ar, zh -> en),
 * pickLocalized(full[field], lang) === pickLocalized(card[field], lang).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

const RTL_LANGS = { ar: 1, fa: 1, ur: 1, ckb: 1, ps: 1, sd: 1, he: 1, yi: 1, ug: 1 };
const LOCALE_BASE_ALIASES = {
  'en': 'en', 'en-gb': 'en', 'en-us': 'en', 'en-au': 'en',
  'fr': 'fr', 'fr-fr': 'fr', 'fr-ca': 'fr',
  'es': 'es', 'es-es': 'es', 'es-419': 'es',
  'pt': 'pt', 'pt-pt': 'pt', 'pt-br': 'pt', 'pt-af': 'pt',
  'zh-hans': 'zh-CN', 'zh-cn': 'zh-CN', 'zh-sg': 'zh-CN',
  'zh-hant': 'zh-TW', 'zh-tw': 'zh-TW', 'zh-hk': 'zh-TW',
  'fil': 'tl', 'tl': 'tl'
};
const CARD_LOCALES = {
  ar: 1, bg: 1, bn: 1, de: 1, en: 1, es: 1, fr: 1, hi: 1,
  id: 1, it: 1, ja: 1, kk: 1, pl: 1, pt: 1, ro: 1, ru: 1, uk: 1
};

function resolveBaseLangKey(code) {
  if (!code) return 'en';
  const lower = String(code).trim().toLowerCase();
  if (LOCALE_BASE_ALIASES[lower]) return LOCALE_BASE_ALIASES[lower];
  const base = lower.split('-')[0];
  return LOCALE_BASE_ALIASES[base] || base;
}

function cardLang(code) {
  const raw = String(code || 'en').trim();
  const low = raw.toLowerCase();
  const base = resolveBaseLangKey(raw);
  if (CARD_LOCALES[low]) return low;
  if (CARD_LOCALES[base]) return base;
  if (RTL_LANGS[raw] || RTL_LANGS[low] || RTL_LANGS[base]) return 'ar';
  return 'en';
}

function pickLocalized(val, lang, activeLangCode) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  const activeCode = activeLangCode || lang || 'en';
  const baseKey = resolveBaseLangKey(activeCode);
  const isRtl = !!(RTL_LANGS[activeCode] || RTL_LANGS[baseKey]);
  if (val[activeCode]) return val[activeCode];
  if (val[baseKey]) return val[baseKey];
  if (isRtl && val.ar) return val.ar;
  const l = lang || (isRtl ? 'ar' : 'en');
  return val[l] || val.en || val.ar || '';
}

// All fields read across renderHospitalCard, renderDoctorCard, renderCostCard,
// getFilteredListings, matchesSpecialtyFilter, refreshMultilingualSelectsAndData,
// buildCompareTableHtml, renderShortlistBody, enrichHospitalPageSeoAndSchema,
// hasLiveProfilePost, resolveItemUrl
const FIELDS_BY_HUB = {
  hospitals: [
    'id', 'facility_id', 'type', 'country', 'country_code', 'city', 'scope',
    'urlEn', 'urlAr', 'bloggerUrl', 'provider_page_url', 'nearest_international_airport_code',
    'destination_flag_svg', 'destination_flag_png', 'hospital_logo_url', 'hospital_photo_url',
    'facility_name', 'title', 'city_name', 'country_name', 'locationLabel',
    'beds_reported', 'icu_reported', 'original_overview', 'summary', 'spoken_languages',
    'medical_interpreter_available', 'e_visa_available', 'airport_pickup_included',
    'direct_insurance_billing', 'partner_recovery_hotels', 'distance_from_facility_km',
    'accreditations', 'specialties', 'arabCare', 'minPriceUsd', 'maxPriceUsd',
    'priceDated', 'certificate_id', 'accreditation_expiry_date', 'sourceDate',
    'lastReviewed', 'verificationStatus', 'seo.image_alt'
  ],
  doctors: [
    'id', 'doctor_id', 'type', 'country', 'country_code', 'city', 'scope',
    'bloggerUrl', 'destination_flag_svg', 'destination_flag_png', 'doctor_photo_url',
    'doctor_name', 'primary_specialty', 'specialty_code', 'specialty_slug',
    'sub_specialties', 'years_of_experience', 'procedures_performed_count',
    'primary_facility_id', 'primary_facility_name', 'affiliated_facility_ids',
    'education_and_qualifications', 'awards_and_honors', 'spoken_languages',
    'consultation_fee_usd', 'clinical_focus_and_bio', 'doctor_profile_url',
    'lastReviewed', 'verificationStatus', 'specialty_icon_url', 'seo.image_alt'
  ],
  costs: [
    'id', 'cost_id', 'type', 'country', 'country_code', 'city', 'scope',
    'bloggerUrl', 'destination_flag_svg', 'destination_flag_png', 'treatment_image_url',
    'procedure_code', 'cpt_icd_code', 'procedure_name', 'specialty_category',
    'specialty_code', 'specialty_slug', 'facility_id', 'facility_name',
    'lead_doctor_id', 'lead_doctor_name', 'price_low_usd', 'price_avg_package_usd',
    'price_high_complex_usd', 'local_currency_estimate', 'us_benchmark_price_usd',
    'estimated_savings_usd', 'estimated_savings_pct', 'clinical_success_rate',
    'hospital_stay_days', 'mandatory_local_recovery_days', 'fit_to_fly_clearance_days',
    'package_inclusions', 'package_quote_url', 'airport_pickup_included',
    'priceDated', 'sourceDate', 'lastReviewed', 'verificationStatus',
    'specialty_icon_url', 'seo.image_alt'
  ]
};

const SHORT_FIELDS = new Set([
  'title', 'facility_name', 'city_name', 'country_name', 'locationLabel',
  'doctor_name', 'primary_facility_name', 'lead_doctor_name',
  'procedure_name', 'primary_specialty', 'specialty_category'
]);

const TEST_LANGS = ['en', 'ar', 'ru', 'fa', 'zh'];

function getField(obj, fieldPath) {
  if (fieldPath === 'seo.image_alt') {
    return obj && obj.seo ? obj.seo.image_alt : undefined;
  }
  return obj ? obj[fieldPath] : undefined;
}

let passed = 0;
let failed = 0;
const failures = [];

for (const hub of Object.keys(FIELDS_BY_HUB)) {
  const fullData = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, `${hub}.json`), 'utf8')).items;
  const fields = FIELDS_BY_HUB[hub];

  for (const lang of TEST_LANGS) {
    const cLang = cardLang(lang);
    const cardPath = path.join(REPO_ROOT, 'data', 'cards', `${hub}.${cLang}.json`);
    const cardData = JSON.parse(fs.readFileSync(cardPath, 'utf8'));

    if (fullData.length !== cardData.length) {
      failed++;
      failures.push(`${hub}.${cLang}: length mismatch (${fullData.length} vs ${cardData.length})`);
      continue;
    }

    for (let i = 0; i < fullData.length; i++) {
      const fullRec = fullData[i];
      const cardRec = cardData[i];

      for (const field of fields) {
        const fullVal = getField(fullRec, field);
        const cardVal = getField(cardRec, field);

        if (Array.isArray(fullVal) || typeof fullVal === 'boolean' || fullVal === null || fullVal === undefined) {
          const fullJson = JSON.stringify(fullVal);
          const cardJson = JSON.stringify(cardVal);
          if (fullJson === cardJson) {
            passed++;
          } else {
            failed++;
            if (failures.length < 20) {
              failures.push(`${hub}[${i}] (${lang} -> ${cLang}) .${field}: expected ${fullJson}, got ${cardJson}`);
            }
          }
        } else {
          const exp = pickLocalized(fullVal, lang, lang);
          const act = pickLocalized(cardVal, lang, lang);
          if (exp === act) {
            passed++;
          } else {
            failed++;
            if (failures.length < 20) {
              failures.push(`${hub}[${i}] (${lang} -> ${cLang}) .${field}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(act)}`);
            }
          }
          // Also verify .en property on SHORT fields (used by refreshMultilingualSelectsAndData / enrichHospitalPageSeoAndSchema)
          if (SHORT_FIELDS.has(field)) {
            const expEn = fullVal && typeof fullVal === 'object' ? fullVal.en : fullVal;
            const actEn = cardVal && typeof cardVal === 'object' ? cardVal.en : cardVal;
            if (expEn === actEn) {
              passed++;
            } else {
              failed++;
              if (failures.length < 20) {
                failures.push(`${hub}[${i}] (${lang} -> ${cLang}) .${field}.en: expected ${JSON.stringify(expEn)}, got ${JSON.stringify(actEn)}`);
              }
            }
          }
        }
      }
    }
  }
}

console.log(`Parity test complete: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  console.error('Sample failures:', failures);
  process.exit(1);
}
