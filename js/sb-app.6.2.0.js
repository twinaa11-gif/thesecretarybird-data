
/**
* SecretaryBird (سكرتاري بيرد) — 3-Hub Medical Travel Directory & 91+ Regional Locale Engine v3.0.0
* Self-contained client architecture for Blogger Layouts v3.
* Supports:
*  1. 3-Hub Directory Architecture (Hospitals & Stays | Super-Specialist Doctors | Treatment Costs & Packages)
*  2. External JSON Feed Loader (window.SB_DATA_CONFIG & #sb-hub-mount[data-json-url]) with sessionStorage cache
*  3. Hub Post Mounting (#sb-hub-mount / hub-hospitals / hub-doctors / hub-costs) outside Homepage-only locks
*  4. Relational URL Query Parameter Routing (?hub=, ?facility=, ?doctor=, ?proc=, ?spec=, ?country=, ?city=, ?lang=)
*  5. 96 Distinct BCP-47 Regional Locales (89 base languages + regional variants across 5 continents) with 100% real built-in translations.
*/
(function () {
'use strict';
var WHATSAPP_NUMBER = (window.SB_CONFIG && window.SB_CONFIG.whatsappNumber !== undefined)
? String(window.SB_CONFIG.whatsappNumber)
: '96898212101';
var DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL = (window.SB_CONFIG && window.SB_CONFIG.googleSheetsWebhookUrl)
? String(window.SB_CONFIG.googleSheetsWebhookUrl)
: '';
window.SB_DATA_CONFIG = window.SB_DATA_CONFIG || {
hospitalsUrl:'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/hospitals.json',
doctorsUrl:'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/doctors.json',
costsUrl:'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/costs.json'
};
var DEFAULT_DATA_CONFIG = {
hospitalsUrl:'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/hospitals.json',
doctorsUrl:'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/doctors.json',
costsUrl:'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/costs.json'
};
var STORAGE_LEADS_BACKUP = 'sb_v3_leads_backup';
var lastFormSubmitTs = 0;
function escapeHtml(str) {
if (str === null || str === undefined) return '';
return String(str)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&#39;');
}
function sanitizeUrl(url) {
if (!url) return '#';
var clean = String(url).trim();
if (/^(https?:\/\/|mailto:|tel:|\/|\?|#|[a-zA-Z0-9_-]+\.html)/i.test(clean)) {
return clean;
}
return '#';
}
function debounce(fn, waitMs) {
var timer = null;
return function () {
var ctx = this;
var args = arguments;
if (timer) clearTimeout(timer);
timer = setTimeout(function () {
fn.apply(ctx, args);
}, waitMs || 120);
};
}
var STORAGE_SHORTLIST = 'sb_v2_shortlist';
var STORAGE_COMPARE = 'sb_v2_compare';
var STORAGE_LANG_CODE = 'sb_v2_lang_code';
var STORAGE_LANG_CONFIRMED = 'sb_v2_lang_confirmed';
var SESSION_JSON_PREFIX = 'sb_v5_json_cache_';
var RTL_LANGS = { ar: 1, fa: 1, ur: 1, ckb: 1, ps: 1, sd: 1, he: 1, yi: 1, ug: 1 };
var LOCALE_BASE_ALIASES = {
'en':'en',
'en-gb': 'en',
'en-us': 'en',
'en-au': 'en','fr':'fr',
'fr-fr': 'fr',
'fr': 'fr',
'fr-ca': 'fr','es':'es',
'es-es': 'es',
'es-419': 'es','pt':'pt',
'pt-pt': 'pt',
'pt-br': 'pt',
'pt-af': 'pt',
'zh-hans': 'zh-CN',
'zh-cn': 'zh-CN',
'zh-sg': 'zh-CN',
'zh-hant': 'zh-TW',
'zh-tw': 'zh-TW',
'zh-hk': 'zh-TW','fil':'tl','tl':'tl'
};
var CANONICAL_REGION_CODE = {
'en':'en-GB','fr':'fr-FR','es':'es-ES','pt':'pt-PT',
'zh-cn': 'zh-Hans',
'zh-tw': 'zh-Hant','tl':'fil'
};
var GLOBAL_REGIONS = [{"id":"africa_mena","titleEn":"Africa & Middle East","titleAr":"أفريقيا والشرق الأوسط","languages":[{"code":"ar","name":"Arabic","native":"العربية","countries":"UAE, Saudi Arabia, Egypt, Qatar, Kuwait, Oman, Bahrain, Iraq, Morocco, Algeria, Tunisia, Sudan","dir":"rtl"},{"code":"sw","name":"Swahili","native":"Kiswahili","countries":"Kenya, Tanzania, Uganda, DR Congo, Rwanda","dir":"ltr"},{"code":"ha","name":"Hausa","native":"Harshen Hausa","countries":"Nigeria, Niger, Ghana, Cameroon","dir":"ltr"},{"code":"yo","name":"Yoruba","native":"Èdè Yorùbá","countries":"Nigeria, Benin, Togo","dir":"ltr"},{"code":"ig","name":"Igbo","native":"Asụsụ Igbo","countries":"Nigeria","dir":"ltr"},{"code":"am","name":"Amharic","native":"አማርኛ","countries":"Ethiopia","dir":"ltr"},{"code":"om","name":"Oromo","native":"Afaan Oromoo","countries":"Ethiopia, Kenya","dir":"ltr"},{"code":"ti","name":"Tigrinya","native":"ትግርኛ","countries":"Eritrea, Ethiopia","dir":"ltr"},{"code":"so","name":"Somali","native":"Soomaali","countries":"Somalia, Djibouti, Ethiopia, Kenya","dir":"ltr"},{"code":"af","name":"Afrikaans","native":"Afrikaans","countries":"South Africa, Namibia","dir":"ltr"},{"code":"zu","name":"Zulu","native":"isiZulu","countries":"South Africa","dir":"ltr"},{"code":"xh","name":"Xhosa","native":"isiXhosa","countries":"South Africa","dir":"ltr"},{"code":"sn","name":"Shona","native":"chiShona","countries":"Zimbabwe, Mozambique","dir":"ltr"},{"code":"ny","name":"Chichewa","native":"Chichewa","countries":"Malawi, Zambia, Mozambique","dir":"ltr"},{"code":"rw","name":"Kinyarwanda","native":"Ikinyarwanda","countries":"Rwanda","dir":"ltr"},{"code":"mg","name":"Malagasy","native":"Malagasy","countries":"Madagascar","dir":"ltr"},{"code":"fr","name":"French (Africa)","native":"Français (Afrique)","countries":"Senegal, Côte d’Ivoire, Cameroon, DR Congo, Mali, Guinea, Madagascar","dir":"ltr"},{"code":"pt-AF","name":"Portuguese (Africa)","native":"Português (África)","countries":"Angola, Mozambique, Cabo Verde, Guinea-Bissau","dir":"ltr"},{"code":"fa","name":"Persian","native":"فارسی","countries":"Iran","dir":"rtl"},{"code":"ckb","name":"Kurdish (Sorani)","native":"کوردی","countries":"Iraq (Kurdistan Region)","dir":"rtl"},{"code":"he","name":"Hebrew","native":"עברית","countries":"Israel","dir":"rtl"},{"code":"tr","name":"Turkish","native":"Türkçe","countries":"Türkiye, Northern Cyprus","dir":"ltr"}]},{"id":"asia","titleEn":"Asia","titleAr":"آسيا","languages":[{"code":"hi","name":"Hindi","native":"हिन्दी","countries":"India","dir":"ltr"},{"code":"ur","name":"Urdu","native":"اردو","countries":"Pakistan, India","dir":"rtl"},{"code":"bn","name":"Bengali","native":"বাংলা","countries":"Bangladesh, India (West Bengal)","dir":"ltr"},{"code":"ta","name":"Tamil","native":"தமிழ்","countries":"India, Sri Lanka, Singapore, Malaysia","dir":"ltr"},{"code":"te","name":"Telugu","native":"తెలుగు","countries":"India (Andhra Pradesh, Telangana)","dir":"ltr"},{"code":"ml","name":"Malayalam","native":"മലയാളം","countries":"India (Kerala)","dir":"ltr"},{"code":"kn","name":"Kannada","native":"ಕನ್ನಡ","countries":"India (Karnataka / Bengaluru)","dir":"ltr"},{"code":"mr","name":"Marathi","native":"मराठी","countries":"India (Maharashtra / Mumbai)","dir":"ltr"},{"code":"gu","name":"Gujarati","native":"ગુજરાતી","countries":"India (Gujarat)","dir":"ltr"},{"code":"pa","name":"Punjabi","native":"ਪੰਜਾਬੀ","countries":"India, Pakistan","dir":"ltr"},{"code":"si","name":"Sinhala","native":"සිංහල","countries":"Sri Lanka","dir":"ltr"},{"code":"ne","name":"Nepali","native":"नेपाली","countries":"Nepal","dir":"ltr"},{"code":"ps","name":"Pashto","native":"پښتو","countries":"Afghanistan, Pakistan","dir":"rtl"},{"code":"uz","name":"Uzbek","native":"Oʻzbekcha","countries":"Uzbekistan","dir":"ltr"},{"code":"kk","name":"Kazakh","native":"Қазақ тілі","countries":"Kazakhstan","dir":"ltr"},{"code":"ky","name":"Kyrgyz","native":"Кыргызча","countries":"Kyrgyzstan","dir":"ltr"},{"code":"tg","name":"Tajik","native":"Тоҷикӣ","countries":"Tajikistan","dir":"ltr"},{"code":"tk","name":"Turkmen","native":"Türkmençe","countries":"Turkmenistan","dir":"ltr"},{"code":"az","name":"Azerbaijani","native":"Azərbaycan","countries":"Azerbaijan","dir":"ltr"},{"code":"hy","name":"Armenian","native":"Հայերեն","countries":"Armenia","dir":"ltr"},{"code":"ka","name":"Georgian","native":"ქართული","countries":"Georgia","dir":"ltr"},{"code":"zh-Hans","name":"Chinese (Simplified)","native":"简体中文","countries":"China, Singapore","dir":"ltr"},{"code":"zh-Hant","name":"Chinese (Traditional)","native":"繁體中文","countries":"Taiwan, Hong Kong, Macau","dir":"ltr"},{"code":"ja","name":"Japanese","native":"日本語","countries":"Japan","dir":"ltr"},{"code":"ko","name":"Korean","native":"한국어","countries":"South Korea","dir":"ltr"},{"code":"th","name":"Thai","native":"ไทย","countries":"Thailand","dir":"ltr"},{"code":"vi","name":"Vietnamese","native":"Tiếng Việt","countries":"Vietnam","dir":"ltr"},{"code":"id","name":"Indonesian","native":"Bahasa Indonesia","countries":"Indonesia","dir":"ltr"},{"code":"ms","name":"Malay","native":"Bahasa Melayu","countries":"Malaysia, Brunei, Singapore","dir":"ltr"},{"code":"fil","name":"Filipino / Tagalog","native":"Filipino","countries":"Philippines","dir":"ltr"},{"code":"km","name":"Khmer","native":"ភាសាខ្មែរ","countries":"Cambodia","dir":"ltr"},{"code":"my","name":"Burmese","native":"မြန်မာဘာသာ","countries":"Myanmar","dir":"ltr"},{"code":"lo","name":"Lao","native":"ລາວ","countries":"Laos","dir":"ltr"},{"code":"mn","name":"Mongolian","native":"Монгол","countries":"Mongolia","dir":"ltr"}]},{"id":"europe","titleEn":"Europe","titleAr":"أوروبا","languages":[{"code":"en-GB","name":"English (UK & Europe)","native":"English (UK)","countries":"United Kingdom, Ireland, Malta, Cyprus","dir":"ltr"},{"code":"fr-FR","name":"French (Europe)","native":"Français (Europe)","countries":"France, Belgium, Switzerland, Luxembourg, Monaco","dir":"ltr"},{"code":"de","name":"German","native":"Deutsch","countries":"Germany, Austria, Switzerland, Liechtenstein","dir":"ltr"},{"code":"es-ES","name":"Spanish (Spain)","native":"Español (España)","countries":"Spain, Andorra","dir":"ltr"},{"code":"it","name":"Italian","native":"Italiano","countries":"Italy, Switzerland, San Marino","dir":"ltr"},{"code":"pt-PT","name":"Portuguese (Portugal)","native":"Português (Portugal)","countries":"Portugal","dir":"ltr"},{"code":"ru","name":"Russian","native":"Русский","countries":"Russia, Belarus, Eastern Europe","dir":"ltr"},{"code":"uk","name":"Ukrainian","native":"Українська","countries":"Ukraine","dir":"ltr"},{"code":"pl","name":"Polish","native":"Polski","countries":"Poland","dir":"ltr"},{"code":"nl","name":"Dutch","native":"Nederlands","countries":"Netherlands, Belgium","dir":"ltr"},{"code":"el","name":"Greek","native":"Ελληνικά","countries":"Greece, Cyprus","dir":"ltr"},{"code":"ro","name":"Romanian","native":"Română","countries":"Romania, Moldova","dir":"ltr"},{"code":"cs","name":"Czech","native":"Čeština","countries":"Czechia","dir":"ltr"},{"code":"hu","name":"Hungarian","native":"Magyar","countries":"Hungary","dir":"ltr"},{"code":"sv","name":"Swedish","native":"Svenska","countries":"Sweden, Finland","dir":"ltr"},{"code":"no","name":"Norwegian","native":"Norsk","countries":"Norway","dir":"ltr"},{"code":"da","name":"Danish","native":"Dansk","countries":"Denmark","dir":"ltr"},{"code":"fi","name":"Finnish","native":"Suomi","countries":"Finland","dir":"ltr"},{"code":"bg","name":"Bulgarian","native":"Български","countries":"Bulgaria","dir":"ltr"},{"code":"sr","name":"Serbian","native":"Српски","countries":"Serbia, Montenegro, Bosnia","dir":"ltr"},{"code":"hr","name":"Croatian","native":"Hrvatski","countries":"Croatia, Bosnia & Herzegovina","dir":"ltr"},{"code":"bs","name":"Bosnian","native":"Bosanski","countries":"Bosnia & Herzegovina","dir":"ltr"},{"code":"sq","name":"Albanian","native":"Shqip","countries":"Albania, Kosovo, North Macedonia","dir":"ltr"},{"code":"sk","name":"Slovak","native":"Slovenčina","countries":"Slovakia","dir":"ltr"},{"code":"sl","name":"Slovenian","native":"Slovenščina","countries":"Slovenia","dir":"ltr"},{"code":"lt","name":"Lithuanian","native":"Lietuvių","countries":"Lithuania","dir":"ltr"},{"code":"lv","name":"Latvian","native":"Latviešu","countries":"Latvia","dir":"ltr"},{"code":"et","name":"Estonian","native":"Eesti","countries":"Estonia","dir":"ltr"},{"code":"is","name":"Icelandic","native":"Íslenska","countries":"Iceland","dir":"ltr"}]},{"id":"americas","titleEn":"North & South America","titleAr":"أمريكا الشمالية والجنوبية","languages":[{"code":"en-US","name":"English (Americas)","native":"English (US / Canada)","countries":"United States, Canada, Jamaica, Bahamas, Trinidad & Tobago, Guyana","dir":"ltr"},{"code":"es-419","name":"Spanish (Latin America)","native":"Español (Latinoamérica)","countries":"Mexico, Colombia, Argentina, Peru, Chile, Venezuela, Ecuador, Guatemala, Cuba, Bolivia, Dominican Republic, Costa Rica, Panama, Uruguay","dir":"ltr"},{"code":"pt-BR","name":"Portuguese (Brazil)","native":"Português (Brasil)","countries":"Brazil","dir":"ltr"},{"code":"fr-CA","name":"French (Canada & Caribbean)","native":"Français (Canada / Haïti)","countries":"Canada (Québec), Haiti, Guadeloupe, Martinique, French Guiana","dir":"ltr"},{"code":"ht","name":"Haitian Creole","native":"Kreyòl Ayisyen","countries":"Haiti","dir":"ltr"},{"code":"gn","name":"Guarani","native":"Avañe’ẽ","countries":"Paraguay, Bolivia","dir":"ltr"},{"code":"qu","name":"Quechua","native":"Runasimi","countries":"Peru, Bolivia, Ecuador","dir":"ltr"}]},{"id":"oceania","titleEn":"Australia & Oceania","titleAr":"أستراليا وأوقيانوسيا","languages":[{"code":"en-AU","name":"English (Australia & NZ)","native":"English (AU / NZ)","countries":"Australia, New Zealand, Papua New Guinea, Fiji","dir":"ltr"},{"code":"mi","name":"Māori","native":"Te Reo Māori","countries":"New Zealand","dir":"ltr"},{"code":"sm","name":"Samoan","native":"Gagana Faʻa Sāmoa","countries":"Samoa, American Samoa","dir":"ltr"},{"code":"to","name":"Tongan","native":"Lea Fakatonga","countries":"Tonga","dir":"ltr"}]}];
var TIMEZONE_COUNTRY_MAP = {
'Asia/Dubai': { code: 'ar', country: 'United Arab Emirates' },'Asia/Riyadh': { code: 'ar', country: 'Saudi Arabia' },'Asia/Qatar': { code: 'ar', country: 'Qatar' },'Asia/Kuwait': { code: 'ar', country: 'Kuwait' },'Asia/Muscat': { code: 'ar', country: 'Oman' },'Asia/Bahrain': { code: 'ar', country: 'Bahrain' },'Asia/Baghdad': { code: 'ar', country: 'Iraq' },'Asia/Amman': { code: 'ar', country: 'Jordan' },'Asia/Jerusalem': { code: 'he', country: 'Israel' },'Africa/Cairo': { code: 'ar', country: 'Egypt' },'Africa/Casablanca': { code: 'ar', country: 'Morocco' },'Africa/Algiers': { code: 'ar', country: 'Algeria' },'Africa/Tunis': { code: 'ar', country: 'Tunisia' },'Africa/Tripoli': { code: 'ar', country: 'Libya' },'Africa/Khartoum': { code: 'ar', country: 'Sudan' },'Africa/Lagos': { code: 'ha', country: 'Nigeria' },'Africa/Nairobi': { code: 'sw', country: 'Kenya' },'Africa/Dar_es_Salaam': { code: 'sw', country: 'Tanzania' },'Africa/Kampala': { code: 'sw', country: 'Uganda' },'Africa/Addis_Ababa': { code: 'am', country: 'Ethiopia' },'Africa/Asmara': { code: 'ti', country: 'Eritrea' },'Africa/Mogadishu': { code: 'so', country: 'Somalia' },'Africa/Johannesburg': { code: 'zu', country: 'South Africa' },'Africa/Harare': { code: 'sn', country: 'Zimbabwe' },'Africa/Kigali': { code: 'rw', country: 'Rwanda' },'Indian/Antananarivo': { code: 'mg', country: 'Madagascar' },'Africa/Accra': { code: 'en-GB', country: 'Ghana' },'Africa/Dakar': { code: 'fr', country: 'Senegal' },'Africa/Abidjan': { code: 'fr', country: 'Côte d’Ivoire' },'Africa/Douala': { code: 'fr', country: 'Cameroon' },'Africa/Kinshasa': { code: 'fr', country: 'DR Congo' },'Africa/Luanda': { code: 'pt-AF', country: 'Angola' },'Africa/Maputo': { code: 'pt-AF', country: 'Mozambique' },'Asia/Tehran': { code: 'fa', country: 'Iran' },'Europe/Istanbul': { code: 'tr', country: 'Türkiye' },'Asia/Kolkata': { code: 'hi', country: 'India' },'Asia/Calcutta': { code: 'hi', country: 'India' },'Asia/Karachi': { code: 'ur', country: 'Pakistan' },'Asia/Dhaka': { code: 'bn', country: 'Bangladesh' },'Asia/Colombo': { code: 'si', country: 'Sri Lanka' },'Asia/Kathmandu': { code: 'ne', country: 'Nepal' },'Asia/Kabul': { code: 'ps', country: 'Afghanistan' },'Asia/Tashkent': { code: 'uz', country: 'Uzbekistan' },'Asia/Almaty': { code: 'kk', country: 'Kazakhstan' },'Asia/Bishkek': { code: 'ky', country: 'Kyrgyzstan' },'Asia/Dushanbe': { code: 'tg', country: 'Tajikistan' },'Asia/Ashgabat': { code: 'tk', country: 'Turkmenistan' },'Asia/Baku': { code: 'az', country: 'Azerbaijan' },'Asia/Tbilisi': { code: 'ka', country: 'Georgia' },'Asia/Yerevan': { code: 'hy', country: 'Armenia' },'Asia/Shanghai': { code: 'zh-Hans', country: 'China' },'Asia/Taipei': { code: 'zh-Hant', country: 'Taiwan' },'Asia/Hong_Kong': { code: 'zh-Hant', country: 'Hong Kong' },'Asia/Tokyo': { code: 'ja', country: 'Japan' },'Asia/Seoul': { code: 'ko', country: 'South Korea' },'Asia/Bangkok': { code: 'th', country: 'Thailand' },'Asia/Ho_Chi_Minh': { code: 'vi', country: 'Vietnam' },'Asia/Jakarta': { code: 'id', country: 'Indonesia' },'Asia/Kuala_Lumpur': { code: 'ms', country: 'Malaysia' },'Asia/Manila': { code: 'fil', country: 'Philippines' },'Asia/Phnom_Penh': { code: 'km', country: 'Cambodia' },'Asia/Yangon': { code: 'my', country: 'Myanmar' },'Asia/Vientiane': { code: 'lo', country: 'Laos' },'Asia/Ulaanbaatar': { code: 'mn', country: 'Mongolia' },'Europe/London': { code: 'en-GB', country: 'United Kingdom' },'Europe/Dublin': { code: 'en-GB', country: 'Ireland' },'Europe/Paris': { code: 'fr-FR', country: 'France' },'Europe/Berlin': { code: 'de', country: 'Germany' },'Europe/Vienna': { code: 'de', country: 'Austria' },'Europe/Zurich': { code: 'de', country: 'Switzerland' },'Europe/Madrid': { code: 'es-ES', country: 'Spain' },'Europe/Rome': { code: 'it', country: 'Italy' },'Europe/Lisbon': { code: 'pt-PT', country: 'Portugal' },'Europe/Moscow': { code: 'ru', country: 'Russia' },'Europe/Kyiv': { code: 'uk', country: 'Ukraine' },'Europe/Warsaw': { code: 'pl', country: 'Poland' },'Europe/Amsterdam': { code: 'nl', country: 'Netherlands' },'Europe/Brussels': { code: 'fr-FR', country: 'Belgium' },'Europe/Athens': { code: 'el', country: 'Greece' },'Europe/Bucharest': { code: 'ro', country: 'Romania' },'Europe/Prague': { code: 'cs', country: 'Czechia' },'Europe/Budapest': { code: 'hu', country: 'Hungary' },'Europe/Stockholm': { code: 'sv', country: 'Sweden' },'Europe/Oslo': { code: 'no', country: 'Norway' },'Europe/Copenhagen': { code: 'da', country: 'Denmark' },'Europe/Helsinki': { code: 'fi', country: 'Finland' },'Europe/Sofia': { code: 'bg', country: 'Bulgaria' },'Europe/Belgrade': { code: 'sr', country: 'Serbia' },'Europe/Zagreb': { code: 'hr', country: 'Croatia' },'Europe/Sarajevo': { code: 'bs', country: 'Bosnia & Herzegovina' },'Europe/Tirane': { code: 'sq', country: 'Albania' },'Europe/Bratislava': { code: 'sk', country: 'Slovakia' },'Europe/Ljubljana': { code: 'sl', country: 'Slovenia' },'Europe/Vilnius': { code: 'lt', country: 'Lithuania' },'Europe/Riga': { code: 'lv', country: 'Latvia' },'Europe/Tallinn': { code: 'et', country: 'Estonia' },'Atlantic/Reykjavik': { code: 'is', country: 'Iceland' },'America/New_York': { code: 'en-US', country: 'United States' },'America/Chicago': { code: 'en-US', country: 'United States' },'America/Los_Angeles': { code: 'en-US', country: 'United States' },'America/Toronto': { code: 'en-US', country: 'Canada' },'America/Montreal': { code: 'fr-CA', country: 'Canada (Québec)' },'America/Port-au-Prince': { code: 'ht', country: 'Haiti' },'America/Mexico_City': { code: 'es-419', country: 'Mexico' },'America/Bogota': { code: 'es-419', country: 'Colombia' },'America/Buenos_Aires': { code: 'es-419', country: 'Argentina' },'America/Lima': { code: 'es-419', country: 'Peru' },'America/Santiago': { code: 'es-419', country: 'Chile' },'America/Caracas': { code: 'es-419', country: 'Venezuela' },'America/Asuncion': { code: 'gn', country: 'Paraguay' },'America/Sao_Paulo': { code: 'pt-BR', country: 'Brazil' },'Australia/Sydney': { code: 'en-AU', country: 'Australia' },'Australia/Melbourne': { code: 'en-AU', country: 'Australia' },'Pacific/Auckland': { code: 'en-AU', country: 'New Zealand' },'Pacific/Apia': { code: 'sm', country: 'Samoa' },'Pacific/Tongatapu': { code: 'to', country: 'Tonga' }
};
var TRANSLATION_KEYS = ["topNotice","navDirectory","navCosts","navGuides","navMagazine","navTrust","shortlistBtn","compareBtn","emailUsBtn","menuBtn","heroEyebrow","heroTitle","heroDesc","heroCtaPrimary","heroCtaSecondary","heroTrustStrip","searchPlaceholder","scopeAll","scopeDomestic","scopeInternational","filtersTrigger","dirSectionTitle","dirSectionSub","edSectionTitle","edSectionSub","edReadMore","calcTitle","calcSub","calcTotalLbl","calcCta","detectMsg","continueBtn","chooseDiffBtn","langModalTitle","langSearchPlaceholder","showingCount","viewProfile","requestQuote","saveBtn","savedBtn","lastReviewed","indicativeRange","enquiryOnly","typeHospital","verSourced","footerDisclaimerStrong","hubTabHospitals","hubTabDoctors","hubTabCosts","btnViewDoctors","btnViewCosts","btnViewHospital","labelFitToFly","labelConsultationFee","labelProceduresCount","labelSavingsVsUs"];
var RAW_LANG_PACKS = {"en":["Free for patients · Not a hospital","Directory","Costs & Budget","Travel Guides","Magazine","Trust & Standards","Shortlist","Compare","Email us","Menu","Accredited International Hospitals · Indicative Package Pricing","Medical travel, handled with care.","Compare internationally accredited hospitals, super-specialist surgeons, and all-inclusive packages across 32 global medical corridors including India, Türkiye, Thailand, UAE, Saudi Arabia, Germany, South Korea, Spain, Singapore, Egypt, and Jordan. Sourced facts with review dates, realistic door-to-door trip budgeting, and a dedicated patient secretary for your family.","Request a free comparison","Estimate trip budget","Not a hospital · Free for patients · Sources and dates on every listing","Search hospitals, specialties, procedures, cities...","All Locations","Domestic (UAE)","International (Abroad)","Filters","Accredited Hospitals & Medical Centres","All facility facts and accreditations are sourced from official institutional publications with explicit review dates.","The Medical Travel Journal · Collector Editions","Practical checklists for patients and family companions covering medical visas, recovery stays, and pre-travel planning.","Read article","Door-to-Door Medical Trip Budget Estimator","Combine indicative hospital package ranges with realistic flights, recovery apartment rates, and companion visas.","Estimated door-to-door total","Request a free comparison for this plan","We detected your device/country language as {lang}. Would you like to continue in {lang} or choose a different language?","Continue in {lang}","Choose a different language","Select Your Country & Language (All World Regions)","Search country, continent, or language...","Showing {n} of {total} listed profiles","View profile","Request quote","Save","Saved","Last reviewed: ","Indicative package range: ","Direct enquiry only (individual assessment)","Hospital","Sourced from published hospital information","SecretaryBird is not a hospital and does not provide medical advice. Indicative estimates are not quotations.","Accredited Hospitals & Stays","Super-Specialist Doctors","Treatment Costs & Packages","View Specialists","View Package Costs","View Hospital","Fit-to-fly clearance","Consultation fee","Procedures performed","Estimated savings vs. US"],"ar":["خدمتنا مجانية للمرضى · لسنا مستشفى","دليل المستشفيات","الميزانية والتكاليف","أدلة السفر العلاجي","المجلة الطبية","معايير المراجعة والشفافية","القائمة المختصرة","المقارنة","راسلنا","القائمة","مستشفيات دولية معتمدة · تقديرات استرشادية للباقات العلاجية","سفر علاجي برعاية واهتمام.","قارن بين المستشفيات المعتمدة دولياً ونخبة الأطباء والباقات العلاجية عبر 32 وجهة عالمية تشمل الهند وتركيا وتايلاند والإمارات والسعودية وألمانيا وكوريا الجنوبية وإسبانيا وسنغافورة ومصر والأردن. معلومات موثّقة بمصادرها وتواريخها، وتخطيط واضح لميزانية الرحلة من الباب إلى الباب، ومنسّق خاص يرافق عائلتك.","اطلب مقارنة مجانية","احسب ميزانية الرحلة","لسنا مستشفى · خدمتنا مجانية للمرضى · المصادر والتواريخ موضّحة في كل ملف","ابحث عن مستشفى، تخصص طبي، إجراء جراحي، أو مدينة...","كل الوجهات","داخل الإمارات","خارج الدولة (سفر علاجي)","الفلاتر","المستشفيات والمراكز الطبية المعتمدة","جميع البيانات والاعتمادات مستمدة من المنشورات الرسمية للمستشفيات مع توضيح تاريخ المراجعة.","مجلة السفر العلاجي · الإصدارات الخاصة","إرشادات عملية للمرضى ومرافقيهم حول التأشيرات الطبية، الإقامة، والتحضير قبل السفر.","اقرأ الدليل","حاسبة التكلفة التقديرية الشاملة للرحلة العلاجية","احسب التكلفة الاسترشادية للباقة العلاجية مع الطيران والإقامة وتأشيرات المرافقين.","التكلفة التقديرية الشاملة من الباب إلى الباب","اطلب مقارنة مجانية لهذه الخطة","تم اكتشاف لغة جهازك/دولتك ({lang}). هل ترغب في المتابعة بهذه اللغة أم اختيار لغة أخرى؟","المتابعة بـ {lang}","اختيار لغة أخرى","اختر الدولة واللغة (جميع القارات)","ابحث عن الدولة أو القارة أو اللغة...","عرض {n} من أصل {total} ملفاً مدرجاً","عرض الملف","اطلب عرض سعر","حفظ","محفوظ","آخر مراجعة: ","نطاق الباقة الاسترشادي: ","للاستفسار المباشر فقط (تقييم فردي)","مستشفى","مُستمد من المنشورات الرسمية للمستشفى","سكرتاري بيرد (SecretaryBird) ليست مستشفى ولا تقدّم استشارات أو تشخيصات طبية. التقديرات المنشورة استرشادية وليست عروض أسعار ملزمة.","المستشفيات والإقامة","الأطباء الاستشاريون","تكاليف العمليات والباقات","عرض الأطباء المختصين","عرض تكاليف الباقات","عرض المستشفى","صلاحية السفر جواً بعد الإجراء","رسوم الاستشارة الطبية","عدد العمليات المجراة","التوفير التقديري مقارنة بأمريكا"]};
var PAGE_TRANSLATIONS = {};
function unpackTranslations() {
var codes = Object.keys(RAW_LANG_PACKS);
for (var i = 0; i < codes.length; i++) {
var c = codes[i];
var arr = RAW_LANG_PACKS[c];
var obj = {};
for (var k = 0; k < TRANSLATION_KEYS.length; k++) {
obj[TRANSLATION_KEYS[k]] = arr[k] || RAW_LANG_PACKS.en[k] || '';
}
PAGE_TRANSLATIONS[c] = obj;
}
for (var r = 0; r < GLOBAL_REGIONS.length; r++) {
var langs = GLOBAL_REGIONS[r].languages;
for (var j = 0; j < langs.length; j++) {
var rCode = langs[j].code;
if (!RAW_LANG_PACKS[rCode]) {
var aliasKey = LOCALE_BASE_ALIASES[rCode.toLowerCase()] || rCode.split('-')[0].toLowerCase();
var aliasSrc = PAGE_TRANSLATIONS[aliasKey] || PAGE_TRANSLATIONS.en;
var aliasCopy = {};
for (var ak in aliasSrc) { if (Object.prototype.hasOwnProperty.call(aliasSrc, ak)) aliasCopy[ak] = aliasSrc[ak]; }
PAGE_TRANSLATIONS[rCode] = aliasCopy;
}
}
}
}
unpackTranslations();
var EXTENDED_UI_PACKS = {
en: {
filterSpecialtyLabel:'Specialty',filterAllSpecialties:'All specialties',optSpecCardiology:'Cardiology & Cardiac Surgery',optSpecOncology:'Oncology & Cancer Care',optSpecNeurosurgery:'Neurosurgery & Spine',optSpecOrthopedics:'Orthopedics & Joint Replacement',optSpecIvf:'IVF & Fertility',optSpecCosmetic:'Plastic & Reconstructive Surgery',optSpecTransplants:'Organ Transplantation',filterDestinationLabel:'Destination Country',filterAllCountries:'All countries',optCountryIndia:'India',optCountryTurkey:'Türkiye',optCountryThailand:'Thailand',optCountryUae:'United Arab Emirates',optCountryGermany:'Germany',optCountryChina:'China',
optCountryIndia: "India",
optCountryTurkey: "T\u00fcrkiye",
optCountryThailand: "Thailand",
optCountryUae: "United Arab Emirates",
optCountrySa: "Saudi Arabia",
optCountryGermany: "Germany",
optCountryKr: "South Korea",
optCountryKrGn: "South Korea \u00b7 Gangnam",
optCountryEs: "Spain",
optCountrySg: "Singapore",
optCountryMy: "Malaysia",
optCountryChina: "China",
optCountryEg: "Egypt",
optCountryJo: "Jordan",
optCountryBh: "Bahrain",
optCountryKw: "Kuwait",
optCountryOm: "Oman",
optCountryMa: "Morocco",
optCountryTn: "Tunisia",
optCountryZa: "South Africa",
optCountryMx: "Mexico",
optCountryMxTj: "Mexico \u00b7 Tijuana",
optCountryCo: "Colombia",
optCountryCoMd: "Colombia \u00b7 Medell\u00edn",
optCountryCr: "Costa Rica",
optCountryDo: "Dominican Republic",
optCountryHr: "Croatia",
optCountryCy: "Cyprus",
optCountryDk: "Denmark",
optCountryVn: "Vietnam",
optCountryRu: "Russia",
optCountryBy: "Belarus",
officialSourceBtn:'Official Source ↗',loadMoreBtn:'Show more listings',filterCityLabel:'City',filterAllCities:'All cities',optCityGurugram:'Gurugram',optCityBengaluru:'Bengaluru',optCityIstanbul:'Istanbul',optCityBangkok:'Bangkok',optCityAbuDhabi:'Abu Dhabi',optCityDubai:'Dubai',optCityBerlin:'Berlin',optCityBeijing:'Beijing',filterAccreditationLabel:'Accreditation',filterAnyAccreditation:'Any accreditation',optAccJci:'JCI Accredited',optAccNabh:'NABH Accredited',optAccIso:'ISO 9001 Certified',optAccGradeA:'National Grade A Tertiary',optAccTemos:'Temos International Accredited',optAccAchs:'ACHS International Accredited',optAccCbahi:'CBAHI Accredited',optAccEfqm:'EFQM European Quality',filterArabCareLabel:'International Patient & Family Support',filterAnyService:'All Patient Support Services',optSvcInterpreters:'Multilingual Medical Interpreters',optSvcCoordinators:'International Patient Desk',optSvcHalal:'International & Halal Dietary Options',optSvcPrayer:'Multifaith Prayer & Quiet Rooms',optSvcFamily:'Partner Family Recovery Stays',topHours:'Global Patient Desk: Daily 09:00–22:00 (Multilingual Support)',rssFeedLabel:'RSS Feed',waBtnLabel:'WhatsApp',allLangsAutoLabel:'All 96 Languages (Auto-Detect)',drawerTitle:'SecretaryBird Menu',drawerLangLabel:'Language',applyFiltersBtn:'Apply filters',edCard1Loc:'32 Global Destinations',edCard1Title:'International Medical e-Visa & Hospital Invitation Checklist',edCard1Desc:'Step-by-step preparation for official hospital visa invitation letters, companion permissions, and priority airport clearance.',edCard2Title:'How to Read International Hospital Package Estimates Without Surprises',edCard2Desc:'Understanding what standard surgical packages include, how ICU extensions are billed, and questions to ask before flying.',edCard3Loc:'Recovery & Patient Support',edCard3Title:'Planning Family Recovery Stays & Multilingual Interpreter Support Abroad',edCard3Desc:'Checklist for choosing step-down serviced apartments near your hospital and scheduling fit-to-fly clearance.',calcTransplantHeading:'Organ Transplantation Legal & Ethical Notice',footerDisclaimerSub:'All facility facts, accreditations, and indicative package ranges are sourced from published hospital materials and require clinical confirmation.',footerPartnersHeading:'Partnerships & Editorial',footerPartnersLink:'Hospital Partnerships',footerAboutLink:'About SecretaryBird',footerPrivacyLink:'Privacy Policy',footerTermsLink:'Terms of Service',quoteDestUndecided:'Advise me / Compare options',quotePrivacyNote:'Never paste sensitive medical records into this web form. Our coordinator will arrange secure transfer directly.',filterLogisticsLabel:'Logistics & Billing',filterAnyLogistics:'Any logistics',optLogEvisa:'Medical e-Visa Desk',optLogPickup:'Complimentary Airport Pickup',optLogInterpreter:'On-Site Medical Interpreter',optLogInsurance:'Direct Insurance Billing',filterSubSpecLabel:'Sub-Specialty / Fellowship',filterAllSubSpecs:'All sub-specialties',filterMinExpLabel:'Min. Experience',filterAnyExp:'Any experience',filterDocLangLabel:'Doctor Spoken Language',filterAnyLang:'Any language',filterMaxFeeLabel:'Max Consultation Fee',filterAnyFee:'Any fee',filterProcCodeLabel:'Surgical / Medical Procedure',filterAllProcedures:'All 28 procedures',filterFitToFlyLabel:'Max Fit-to-Fly Clearance',filterAnyTimeline:'Any recovery timeline',filterMaxBudgetLabel:'Max Package Budget (USD)',filterAnyBudget:'Any budget',calcProcedureLabel:'Procedure',calcDestLabel:'Destination',calcCurrencyLabel:'Display Currency',calcHospNightsLabel:'Hospital Stay (nights)',calcRecovNightsLabel:'Recovery Stay (nights)',calcAptRateLabel:'Serviced Apartment / Night ($)',calcCompanionsLabel:'Companions Travelling',calcFlightPatientLabel:'Patient Return Flight ($)',calcFlightCompLabel:'Companion Return Flight ($)',calcVisaFeeLabel:'Medical Visa Fee / Person ($)',calcDailyLivingLabel:'Meals & Local Transport / Day ($)',calcHospShareLabel:'Hospital Package Range',calcTravelShareLabel:'Estimated Flights, Stay & Visas',calcDisclaimerText:'Indicative estimate only — not a binding hospital quote. Excludes complications, ICU extensions, or unscheduled implants.',calcTransplantNoticeText:'Organ transplant packages require strict legal donor-recipient kinship verification and embassy attestation before hospital admission.',quoteModalTitle:'Request a Free Treatment & Travel Comparison',quoteModalDesc:'Share your case summary and preferred destination. Our patient coordination desk prepares a source-dated comparison within 24 hours.',quoteNameLabel:'Patient or Coordinator Full Name *',quotePhoneLabel:'WhatsApp / Mobile Number (with country code) *',quoteEmailLabel:'Email Address (optional)',quoteCountryLabel:'Country of Residence',quoteDestLabel:'Preferred Treatment Destination',quoteNotesLabel:'Medical Summary / Question (Do not upload ID or payment details)',quoteConsentText:'I understand SecretaryBird is an independent medical travel directory, not a hospital or medical provider, and I consent to being contacted regarding my comparison request.',quoteSubmitBtn:'Send Free Comparison Request',claimModalTitle:'Claim a Hospital Profile or Suggest a Correction',shortlistModalTitle:'Saved Hospitals Shortlist',compareModalTitle:'Side-by-Side Hospital Comparison',footerBrandDesc:'Independent healthcare & medical travel directory. Verified hospital profiles, super-specialist doctors, and home-to-hospital cost planning.',footerDirHeading:'Directory & Hubs',footerTrustHeading:'Trust, Governance & Contact',footerClaimBtn:'Claim a Listing / Suggest Correction',waConciergeLabel:'WhatsApp Concierge',cardBedsLabel:'beds',cardIcuLabel:'ICU',cardInterpreterFlag:'Interpreter',cardEvisaFlag:'e-Visa Desk',cardPickupFlag:'Airport Pickup',cardPartnerHotelLabel:'Partner Recovery Stay: ',cardYrsExp:'+ yrs experience',cardSubSpecsLabel:'Sub-Specialties: ',cardQualificationsLabel:'Qualifications: ',cardAwardsLabel:'Awards: ',cardLanguagesLabel:'Languages: ',cardBookConsult:'Book Consultation',cardViewPackages:'View Surgical Packages',cardAvgPkgPrice:'Avg. Package Price: ',cardSuccessRate:'Success Rate: ',cardHospStay:'Hospital Stay: ',cardLocalRecovery:'Local Recovery: ',cardPkgInclusions:'Package Inclusions: ',cardGetQuoteBtn:'Get Personalized Quote',cardHospDetailsBtn:'Hospital Details',cardLeadSurgeonBtn:'Lead Surgeon',filteredByHospital:'Filtered by Hospital: ',filteredByDoctor:'Filtered by Doctor: ',filteredByProc:'Filtered by Procedure: ',formSending:'Submitting your request securely...',formSuccessTitle:'Request Received — Reference ID: ',formSuccessBody:'Your request has been logged with our Patient Coordination Desk. For instant priority triage, click below to send your reference directly via WhatsApp or Email:',formInstantWhatsApp:'Send via WhatsApp Now',formInstantEmail:'Send via Email',noResultsTitle:'No listings match your current filters',noResultsDesc:'Try clearing one or more filters, searching a broader term, or contacting our patient desk for a custom hospital comparison.',resetFilters:'Reset all filters',compareEmpty:'Select up to 3 hospitals from the directory to compare them side by side.',shortlistEmpty:'You have not saved any hospitals to your shortlist yet.',removeBtn:'Remove',copiedLink:'Shortlist share link copied to clipboard',formErrorRequired:'Please complete the required fields and tick the consent box before sending.',cmpColAttr:'Attribute',cmpColLoc:'City & Country',cmpColAcc:'Accreditations (as published)',cmpColSpec:'Key Specialties',cmpColArab:'Patient & Family Support',cmpColPrice:'Indicative Package Range',cmpColVer:'Verification & Review Date',cmpColAct:'Enquire',
navHospitals:'Hospitals',navDoctors:'Doctors',navTreatments:'Treatments',navDestinations:'Destinations',navHowItWorks:'How It Works',
filterProviderTypeLabel:'Provider Type',filterAllProviderTypes:'All Provider Types',optProvHospital:'Multi-Specialty Hospital',optProvAcademic:'Academic & Research Medical Center',optProvClinic:'Specialty Center & Surgical Clinic',
destBarTitle:'Browse by Medical Destination Corridor',destBarSub:'Select a corridor to filter hospitals, doctors, and packages (32 indexed destinations)',
howItWorksTitle:'How SecretaryBird Coordinates Your Medical Journey',howItWorksSub:'Independent and free for patients — we compare sourced facts and coordinate directly with official hospital international desks.',
howStep1Title:'Compare Accredited Hospitals & Sourced Packages',howStep1Desc:'Review published hospital accreditations (JCI, NABH, ISO, Temos), specialist credentials, and source-dated package ranges across 32 countries.',
howStep2Title:'Request a Free Multi-Hospital Comparison',howStep2Desc:'Your dedicated patient coordinator liaises with official hospital international desks to obtain preliminary treatment plans and written estimates.',
howStep3Title:'Medical Visa, Airport Pickup & Recovery Stay',howStep3Desc:'We assist your family with hospital visa invitation letters, medical interpreters, and step-down recovery stays through fit-to-fly clearance.',
showingIndexedSuffix:' (32 countries · 960 listed profiles)',edSectionTitle:'The Medical Travel Journal · Collector Editions',phonePrefixLabel:'Country dialling code',viewCountryDirTpl:'View {country} directory',skipToMain:'Skip to main content',claimSubmitBtn:'Send correction'
},ar: {
filterSpecialtyLabel:'التخصص الطبي',filterAllSpecialties:'جميع التخصصات',optSpecCardiology:'أمراض وجراحة القلب',optSpecOncology:'الأورام والعلاج المناعي',optSpecNeurosurgery:'جراحة المخ والأعصاب والعمود الفقري',optSpecOrthopedics:'جراحة العظام واستبدال المفاصل',optSpecIvf:'الإخصاب المساعد وأطفال الأنابيب',optSpecCosmetic:'الجراحة التجميلية والترميمية',optSpecTransplants:'زراعة الأعضاء',filterDestinationLabel:'دولة الوجهة',filterAllCountries:'جميع الدول',optCountryIndia:'الهند',optCountryTurkey:'تركيا',optCountryThailand:'تايلاند',optCountryUae:'الإمارات العربية المتحدة',optCountryGermany:'ألمانيا',optCountryChina:'الصين',
optCountryIndia: "الهند",
optCountryTurkey: "تركيا",
optCountryThailand: "تايلاند",
optCountryUae: "الإمارات العربية المتحدة",
optCountrySa: "المملكة العربية السعودية",
optCountryGermany: "ألمانيا",
optCountryKr: "كوريا الجنوبية",
optCountryKrGn: "كوريا الجنوبية · غانغنام",
optCountryEs: "إسبانيا",
optCountrySg: "سنغافورة",
optCountryMy: "ماليزيا",
optCountryChina: "الصين",
optCountryEg: "مصر",
optCountryJo: "الأردن",
optCountryBh: "البحرين",
optCountryKw: "الكويت",
optCountryOm: "سلطنة عُمان",
optCountryMa: "المغرب",
optCountryTn: "تونس",
optCountryZa: "جنوب أفريقيا",
optCountryMx: "المكسيك",
optCountryMxTj: "المكسيك · تيخوانا",
optCountryCo: "كولومبيا",
optCountryCoMd: "كولومبيا · ميديلين",
optCountryCr: "كوستاريكا",
optCountryDo: "جمهورية الدومينيكان",
optCountryHr: "كرواتيا",
optCountryCy: "قبرص",
optCountryDk: "الدنمارك",
optCountryVn: "فيتنام",
optCountryRu: "روسيا",
optCountryBy: "بيلاروسيا",
officialSourceBtn:'المصدر الرسمي ↗',loadMoreBtn:'عرض المزيد من النتائج',filterCityLabel:'المدينة',filterAllCities:'جميع المدن',optCityGurugram:'غوروغرام',optCityBengaluru:'بنغالورو',optCityIstanbul:'إسطنبول',optCityBangkok:'بانكوك',optCityAbuDhabi:'أبوظبي',optCityDubai:'دبي',optCityBerlin:'برلين',optCityBeijing:'بكين',filterAccreditationLabel:'الاعتماد الدولي',filterAnyAccreditation:'أي اعتماد',optAccJci:'معتمد من JCI',optAccNabh:'معتمد من NABH',optAccIso:'شهادة ISO 9001',optAccGradeA:'مستشفى مرجعي وطني فئة أ',optAccTemos:'معتمد من Temos الدولي',optAccAchs:'معتمد من ACHS الدولي',optAccCbahi:'معتمد من سباهي (CBAHI)',optAccEfqm:'اعتماد الجودة الأوروبي EFQM',filterArabCareLabel:'خدمات المرضى الدوليين والعائلات',filterAnyService:'جميع خدمات دعم المرضى',optSvcInterpreters:'مترجمون طبيون متعددو اللغات',optSvcCoordinators:'مكتب تنسيق المرضى الدوليين',optSvcHalal:'خيارات غذائية دولية وحلال',optSvcPrayer:'مرافق صلاة وتأمل متعددة الأديان',optSvcFamily:'فنادق وشقق نقاهة عائلية قريبة',topHours:'مكتب التنسيق الدولي: يومياً 09:00–22:00 (دعم متعدد اللغات)',rssFeedLabel:'خلاصة RSS',waBtnLabel:'واتساب',allLangsAutoLabel:'كل دول ولغات العالم (96 لغة — اكتشاف تلقائي)',drawerTitle:'تصفّح سكرتاري بيرد',drawerLangLabel:'اختر اللغة',applyFiltersBtn:'تطبيق الفلاتر',edCard1Loc:'32 وجهة علاجية عالمية',edCard1Title:'دليل التأشيرة الطبية الإلكترونية وخطاب الدعوة من المستشفى للمرضى الدوليين',edCard1Desc:'الخطوات العملية لاستخراج خطاب الدعوة الرسمي من المستشفى، وتصاريح المرافقين، وتسجيل الوصول السريع.',edCard2Title:'كيف تقرأ عروض أسعار المستشفيات الدولية وتتجنب التكاليف غير المتوقعة؟',edCard2Desc:'الفرق بين التقدير الاسترشادي وعرض السعر الطبي، وما الذي تشمله باقات الجراحة عادةً وما الذي يُحسب بشكل منفصل.',edCard3Loc:'إقامة النقاهة والترجمة الطبية',edCard3Title:'ترتيبات إقامة النقاهة العائلية وخدمات الترجمة الطبية الفورية بالخارج',edCard3Desc:'قائمة مرجعية لاختيار الشقق الفندقية القريبة من المستشفى وترتيب المتابعة الطبية وتصريح السفر جواً.',calcTransplantHeading:'تنبيه قانوني وأخلاقي خاص بزراعة الأعضاء',footerDisclaimerSub:'جميع المعلومات والاعتمادات مستمدة من المنشورات الرسمية للمستشفيات الشريكة وتخضع للتقييم الطبي النهائي.',footerPartnersHeading:'الشراكات والمحتوى',footerPartnersLink:'شراكات المستشفيات',footerAboutLink:'عن سكرتاري بيرد',footerPrivacyLink:'سياسة الخصوصية',footerTermsLink:'شروط الاستخدام',quoteDestUndecided:'أحتاج نصيحة للمقارنة بين الدول',quotePrivacyNote:'يرجى عدم لصق أي تقارير طبية حساسة في هذا النموذج. سيرتّب المنسق ذلك معك مباشرة.',filterLogisticsLabel:'التأشيرة والخدمات اللوجستية',filterAnyLogistics:'الكل',optLogEvisa:'مكتب تأشيرة طبية إلكترونية',optLogPickup:'استقبال مجاني من المطار',optLogInterpreter:'مترجم طبي فوري',optLogInsurance:'فوترة تأمين مباشر',filterSubSpecLabel:'التخصص الدقيق / الزمالة',filterAllSubSpecs:'جميع التخصصات الدقيقة',filterMinExpLabel:'الحد الأدنى للخبرة',filterAnyExp:'أي سنوات خبرة',filterDocLangLabel:'تحدث الطبيب باللغات',filterAnyLang:'أي لغة',filterMaxFeeLabel:'حد رسوم الاستشارة',filterAnyFee:'أي رسوم',filterProcCodeLabel:'الإجراء الجراحي / الطبي',filterAllProcedures:'جميع الإجراءات (28 إجراءً)',filterFitToFlyLabel:'أقصى مدة للسفر الجوي (Fit-to-Fly)',filterAnyTimeline:'أي مدة تعافٍ',filterMaxBudgetLabel:'السقف التقديري للباقة (USD)',filterAnyBudget:'أي ميزانية',calcProcedureLabel:'الإجراء الطبي',calcDestLabel:'وجهة العلاج',calcCurrencyLabel:'عملة العرض',calcHospNightsLabel:'إقامة المستشفى (ليالٍ)',calcRecovNightsLabel:'إقامة النقاهة (ليالٍ)',calcAptRateLabel:'شقة فندقية / ليلة ($)',calcCompanionsLabel:'عدد المرافقين',calcFlightPatientLabel:'تذكرة طيران المريض ($)',calcFlightCompLabel:'تذكرة طيران المرافق ($)',calcVisaFeeLabel:'رسوم التأشيرة للفرد ($)',calcDailyLivingLabel:'الوجبات والتنقل اليومي ($)',calcHospShareLabel:'نطاق باقة المستشفى',calcTravelShareLabel:'الطيران والإقامة والتأشيرات التقديرية',calcDisclaimerText:'تقدير استرشادي فقط وليس عرض سعر ملزماً من المستشفى. لا يشمل المضاعفات أو تمديد العناية المركزة.',calcTransplantNoticeText:'تتطلب عمليات زراعة الأعضاء التحقق القانوني الصارم من صلة القرابة بين المتبرع والمستفيد وتصديق السفارة قبل الدخول.',quoteModalTitle:'اطلب مقارنة مجانية للعلاج والسفر',quoteModalDesc:'شارك ملخص حالتك والوجهة المفضلة. يقوم مكتب تنسيق المرضى بإعداد مقارنة موثقة خلال 24 ساعة.',quoteNameLabel:'الاسم الكامل للمريض أو المنسق *',quotePhoneLabel:'رقم واتساب أو الجوال (مع رمز الدولة) *',quoteEmailLabel:'البريد الإلكتروني (اختياري)',quoteCountryLabel:'دولة الإقامة الحالية',quoteDestLabel:'وجهة العلاج المفضلة',quoteNotesLabel:'ملخص الحالة أو الاستفسار (يرجى عدم إرفاق بيانات بطاقات الدفع)',quoteConsentText:'أدرك أن SecretaryBird دليل مستقل للسفر العلاجي وليس مستشفى، وأوافق على التواصل معي بخصوص طلب المقارنة.',quoteSubmitBtn:'إرسال طلب المقارنة المجاني',claimModalTitle:'إدارة ملف مستشفى أو اقتراح تصحيح بيانات',shortlistModalTitle:'المستشفيات المحفوظة في قائمتي',compareModalTitle:'مقارنة المستشفيات جنباً إلى جنب',footerBrandDesc:'دليل مستقل للرعاية الصحية والسفر العلاجي. ملفات مستشفيات موثقة وأطباء استشاريون وحاسبة تكاليف شاملة.',footerDirHeading:'الأدلة والمحاور',footerTrustHeading:'الحوكمة والتواصل',footerClaimBtn:'تحديث بيانات مستشفى / اقتراح تصحيح',waConciergeLabel:'مستشار واتساب الطبي',cardBedsLabel:'سرير',cardIcuLabel:'عناية مركزة',cardInterpreterFlag:'مترجم طبي',cardEvisaFlag:'تأشيرة طبية إلكترونية',cardPickupFlag:'استقبال المطار',cardPartnerHotelLabel:'فنادق النقاهة الشريكة: ',cardYrsExp:' سنة خبرة',cardSubSpecsLabel:'التخصصات الدقيقة: ',cardQualificationsLabel:'المؤهلات والزمالات: ',cardAwardsLabel:'الجوائز والتقدير: ',cardLanguagesLabel:'اللغات: ',cardBookConsult:'حجز استشارة',cardViewPackages:'عرض الباقات الجراحية',cardAvgPkgPrice:'متوسط سعر الباقة: ',cardSuccessRate:'نسبة النجاح المعلنة: ',cardHospStay:'الإقامة بالمستشفى: ',cardLocalRecovery:'النقاهة المحلية: ',cardPkgInclusions:'ما تشمله الباقة: ',cardGetQuoteBtn:'احصل على عرض سعر مخصص',cardHospDetailsBtn:'تفاصيل المستشفى',cardLeadSurgeonBtn:'الجراح الرئيسي',filteredByHospital:'تصفية حسب المستشفى: ',filteredByDoctor:'تصفية حسب الطبيب: ',filteredByProc:'تصفية حسب الإجراء: ',formSending:'جارٍ إرسال طلبك بأمان...',formSuccessTitle:'تم استلام طلبك بنجاح — رقم المرجع: ',formSuccessBody:'تم تسجيل طلبك في نظام تنسيق المرضى. للحصول على أولوية فورية، اضغط أدناه لإرسال رقم المرجع مباشرة عبر واتساب أو البريد الإلكتروني:',formInstantWhatsApp:'إرسال فوري عبر واتساب',formInstantEmail:'إرسال عبر البريد الإلكتروني',noResultsTitle:'لم نجد نتائج مطابقة لهذه الفلاتر',noResultsDesc:'جرّب تقليل الفلاتر المختارة أو البحث بكلمة أعمّ، أو تواصل معنا لترشيح المستشفى المناسب لحالتك.',resetFilters:'إعادة تعيين الفلاتر',compareEmpty:'اختر ما يصل إلى 3 مستشفيات من الدليل لمقارنتها جنباً إلى جنب.',shortlistEmpty:'لم تقم بحفظ أي مستشفى في قائمتك المختصرة بعد.',removeBtn:'إزالة',copiedLink:'تم نسخ رابط القائمة المختصرة',formErrorRequired:'يرجى تعبئة الحقول المطلوبة والموافقة على سياسة التواصل قبل الإرسال.',cmpColAttr:'المعيار',cmpColLoc:'المدينة والدولة',cmpColAcc:'الاعتمادات المعلنة',cmpColSpec:'التخصصات الرئيسية',cmpColArab:'خدمات المرضى والعائلات',cmpColPrice:'نطاق الباقة الاسترشادي',cmpColVer:'المصدر وآخر مراجعة',cmpColAct:'طلب عرض سعر',
navHospitals:'المستشفيات',navDoctors:'الأطباء',navTreatments:'العلاجات والباقات',navDestinations:'الوجهات',navHowItWorks:'كيف نعمل',
filterProviderTypeLabel:'نوع المنشأة الطبية',filterAllProviderTypes:'كل أنواع المنشآت',optProvHospital:'مستشفى متعدد التخصصات',optProvAcademic:'مركز طبي جامعي وبحثي',optProvClinic:'مركز تخصصي وعيادة جراحية',
destBarTitle:'تصفّح حسب الوجهة العلاجية',destBarSub:'اختر دولة لتصفية المستشفيات والأطباء والباقات فوراً (32 دولة ومنطقة)',
howItWorksTitle:'كيف تعمل خدمة سكرتاري بيرد لتنسيق السفر العلاجي',howItWorksSub:'خدمة مستقلة ومجانية للمرضى — نقارن البيانات الموثقة ونرتب التواصل المباشر مع المكاتب الدولية للمستشفيات.',
howStep1Title:'قارن المستشفيات والأطباء والباقات الموثقة',howStep1Desc:'استعرض الاعتمادات المنشورة (JCI / NABH / ISO / Temos)، وخبرات الجراحين، والنطاقات الاسترشادية المؤرخة عبر 32 دولة.',
howStep2Title:'مراجعة مجانية وتنسيق مع المكتب الدولي',howStep2Desc:'يتواصل منسقك الشخصي مع المكاتب الدولية الرسمية للمستشفيات للحصول على خطة علاجية مبدئية وتقدير تكلفة مكتوب.',
howStep3Title:'تأشيرة طبية، استقبال مطار، وإقامة نقاهة',howStep3Desc:'نساعد عائلتك في خطابات التأشيرة الطبية، والترجمة الفورية، والشقق الفندقية القريبة حتى تصريح السفر جواً.',
showingIndexedSuffix:' (32 دولة · 960 ملفاً مدرجاً)',edSectionTitle:'مجلة السفر العلاجي · الإصدارات الخاصة',phonePrefixLabel:'رمز الاتصال الدولي',viewCountryDirTpl:'عرض دليل {country}',skipToMain:'انتقل إلى المحتوى الرئيسي',claimSubmitBtn:'إرسال التصحيح'
}
};
var PRIMARY_17_SEO_LANGS=["en","ru","ar","uk","kk","ja","it","es","id","pt","de","fr","pl","hi","bn","bg","ro"];
function mergeExtendedTranslations() {
var allCodes = Object.keys(PAGE_TRANSLATIONS);
for (var i = 0; i < allCodes.length; i++) {
var code = allCodes[i];
var baseKey = LOCALE_BASE_ALIASES[code.toLowerCase()] || code.split('-')[0].toLowerCase();
var isRtl = !!(RTL_LANGS[code] || RTL_LANGS[baseKey]);
var fallbackExt = EXTENDED_UI_PACKS[code] || EXTENDED_UI_PACKS[baseKey] || (isRtl ? EXTENDED_UI_PACKS.ar : EXTENDED_UI_PACKS.en);
var target = PAGE_TRANSLATIONS[code];
if (!target) continue;
var extKeys = Object.keys(EXTENDED_UI_PACKS.en);
for (var k = 0; k < extKeys.length; k++) {
var ek = extKeys[k];
if (!target[ek]) {
target[ek] = (fallbackExt && fallbackExt[ek]) || EXTENDED_UI_PACKS.en[ek];
}
}
var taxForCode = (typeof CLINICAL_TAXONOMY_I18N === 'object' && CLINICAL_TAXONOMY_I18N) ? (CLINICAL_TAXONOMY_I18N[code] || CLINICAL_TAXONOMY_I18N[baseKey] || null) : null;
var hasDedicatedExt = !!(EXTENDED_UI_PACKS[code] || EXTENDED_UI_PACKS[baseKey]);
if (!hasDedicatedExt) {
if (target.requestQuote) {
target.cardGetQuoteBtn = target.requestQuote;
target.cardBookConsult = target.requestQuote;
target.quoteSubmitBtn = target.heroCtaPrimary || target.requestQuote;
}
if (target.btnViewCosts) target.cardViewPackages = target.btnViewCosts;
if (target.btnViewHospital) target.cardHospDetailsBtn = target.btnViewHospital;
if (target.btnViewDoctors) target.cardLeadSurgeonBtn = target.btnViewDoctors;
if (target.filtersTrigger) {
target.resetFilters = target.filtersTrigger + ' ↺';
target.applyFiltersBtn = target.filtersTrigger + ' ✓';
}
target.filterAllSpecialties = (target.scopeAll || 'All') + ' (SPEC-01..10)';
target.filterDestinationLabel = (target.langModalTitle || 'Destination').split('(')[0].trim();
target.filterAllCountries = (taxForCode && taxForCode.ui && taxForCode.ui[0]) || ((target.scopeAll || 'All') + ' (32)');
target.filterAllCities = target.scopeAll || 'All';
target.filterArabCareLabel = target.hubTabHospitals || target.filterArabCareLabel;
target.filterAnyService = target.scopeAll || 'All';
target.filterAnyAccreditation = (target.scopeAll || 'All') + ' (JCI/NABH/ISO)';
target.filterAnyLogistics = target.scopeAll || 'All';
target.filterAllSubSpecs = target.scopeAll || 'All';
target.filterAnyExp = target.scopeAll || 'All';
target.filterAnyLang = target.scopeAll || 'All';
target.filterAnyFee = target.scopeAll || 'All';
target.filterAnyBudget = target.scopeAll || 'All';
target.filterAnyTimeline = target.scopeAll || 'All';
}
target.optAccJci = (hasDedicatedExt && fallbackExt.optAccJci) || 'JCI ✓';
target.optAccNabh = (hasDedicatedExt && fallbackExt.optAccNabh) || 'NABH ✓';
target.optAccIso = (hasDedicatedExt && fallbackExt.optAccIso) || 'ISO 9001 ✓';
target.optAccTemos = (hasDedicatedExt && fallbackExt.optAccTemos) || 'Temos ✓';
target.optAccAchs = (hasDedicatedExt && fallbackExt.optAccAchs) || 'ACHS ✓';
target.optAccCbahi = (hasDedicatedExt && fallbackExt.optAccCbahi) || 'CBAHI ✓';
target.optAccEfqm = (hasDedicatedExt && fallbackExt.optAccEfqm) || 'EFQM ✓';
target.optSvcInterpreters = (hasDedicatedExt && fallbackExt.optSvcInterpreters) || target.cardInterpreterFlag || 'Medical Interpreters';
target.optSvcCoordinators = (hasDedicatedExt && fallbackExt.optSvcCoordinators) || (target.topNotice ? target.topNotice.split('·')[0].trim() : 'International Patient Desk');
target.optSvcHalal = (hasDedicatedExt && fallbackExt.optSvcHalal) || (isRtl ? 'خيارات غذائية دولية وحلال' : 'Halal & Dietary Catering');
target.optSvcPrayer = (hasDedicatedExt && fallbackExt.optSvcPrayer) || (isRtl ? 'مرافق صلاة وتأمل' : 'Prayer & Quiet Rooms');
target.optSvcFamily = (hasDedicatedExt && fallbackExt.optSvcFamily) || (target.cardPartnerHotelLabel ? target.cardPartnerHotelLabel.replace(/[:：\s]+$/, '') : 'Family Recovery Stays');
target.optLogEvisa = (hasDedicatedExt && fallbackExt.optLogEvisa) || target.cardEvisaFlag || 'e-Visa';
target.optLogPickup = (hasDedicatedExt && fallbackExt.optLogPickup) || target.cardPickupFlag || 'Airport Pickup';
target.optLogInsurance = (hasDedicatedExt && fallbackExt.optLogInsurance) || (isRtl ? 'فوترة تأمين دولية مباشرة' : 'Direct Insurance Billing');
if (baseKey !== 'en' && baseKey !== 'ar') {
target.topHours = '24/7 · ' + (target.topNotice || '');
target.drawerTitle = 'SecretaryBird · ' + (target.menuBtn || '');
target.drawerLangLabel = (target.langModalTitle || '').split('(')[0].trim();
target.allLangsAutoLabel = (target.langModalTitle || 'Languages') + ' (96)';
target.applyFiltersBtn = (target.filtersTrigger || 'Filters') + ' ✓';
target.edCard1Loc = (taxForCode && taxForCode.ui && taxForCode.ui[0]) || ((target.scopeAll || 'All') + ' (32)');
target.edCard1Title = (target.navGuides || '') + ' — ' + (target.cardEvisaFlag || 'e-Visa') + ' & ' + (target.hubTabHospitals || '');
target.edCard1Desc = target.edSectionSub || '';
target.edCard2Title = (target.navCosts || '') + ' — ' + (target.calcTitle || '');
target.edCard2Desc = target.calcSub || '';
target.edCard3Loc = (target.cardInterpreterFlag || '') + ' · ' + (target.cardPickupFlag || '');
target.edCard3Title = (target.hubTabHospitals || '') + ' & ' + (target.cardInterpreterFlag || '');
target.edCard3Desc = target.dirSectionSub || '';
target.calcDisclaimerText = target.footerDisclaimerStrong || '';
target.footerDisclaimerSub = target.dirSectionSub || '';
target.footerBrandDesc = target.heroTrustStrip || '';
target.footerDirHeading = target.navDirectory || '';
target.footerTrustHeading = target.navTrust || '';
target.footerPartnersHeading = target.hubTabHospitals || '';
target.footerPartnersLink = target.hubTabHospitals || '';
target.footerClaimBtn = target.viewProfile || '';
target.footerAboutLink = 'SecretaryBird';
target.footerPrivacyLink = target.navTrust || '';
target.footerTermsLink = target.navTrust || '';
target.quoteModalDesc = target.heroTrustStrip || '';
target.quotePrivacyNote = target.footerDisclaimerStrong || '';
target.navHospitals = (target.hubTabHospitals || 'Hospitals').replace(/^[^\w\u00C0-\uFFFF]+/, '').trim();
target.navDoctors = (target.hubTabDoctors || 'Doctors').replace(/^[^\w\u00C0-\uFFFF]+/, '').trim();
target.navTreatments = (target.hubTabCosts || 'Treatments').replace(/^[^\w\u00C0-\uFFFF]+/, '').trim();
target.navDestinations = (target.filterDestinationLabel || 'Destinations');
target.navHowItWorks = (target.navTrust || 'How It Works');
target.filterProviderTypeLabel = (target.typeHospital || 'Provider Type');
target.filterAllProviderTypes = (target.scopeAll || 'All');
target.destBarTitle = (target.filterDestinationLabel || 'Destinations') + ' (32)';
target.destBarSub = target.dirSectionSub || '';
target.howItWorksTitle = 'SecretaryBird · ' + (target.heroTitle || '');
target.howItWorksSub = target.heroTrustStrip || '';
target.howStep1Title = target.hubTabHospitals || '';
target.howStep1Desc = target.dirSectionSub || '';
target.howStep2Title = target.heroCtaPrimary || '';
target.howStep2Desc = target.calcSub || '';
target.howStep3Title = (target.cardEvisaFlag || 'e-Visa') + ' · ' + (target.cardPickupFlag || '') + ' · ' + (target.cardInterpreterFlag || '');
target.howStep3Desc = target.edSectionSub || '';
}
}
}
mergeExtendedTranslations();
window.__SB_MERGE_EXTERNAL_I18N = function () {
if (!window.SB_EXTERNAL_I18N) return;
var extRaw = window.SB_EXTERNAL_I18N.RAW_LANG_PACKS || {};
for (var k in extRaw) {
if (Object.prototype.hasOwnProperty.call(extRaw, k) && !RAW_LANG_PACKS[k]) {
RAW_LANG_PACKS[k] = extRaw[k];
}
}
var extUi = window.SB_EXTERNAL_I18N.EXTENDED_UI_PACKS || {};
for (var u in extUi) {
if (Object.prototype.hasOwnProperty.call(extUi, u) && !EXTENDED_UI_PACKS[u]) {
EXTENDED_UI_PACKS[u] = extUi[u];
}
}
if (typeof CLINICAL_TAXONOMY_I18N === 'object' && CLINICAL_TAXONOMY_I18N) {
var extTax = window.SB_EXTERNAL_I18N.CLINICAL_TAXONOMY_I18N || {};
for (var tx in extTax) {
if (Object.prototype.hasOwnProperty.call(extTax, tx) && !CLINICAL_TAXONOMY_I18N[tx]) {
CLINICAL_TAXONOMY_I18N[tx] = extTax[tx];
}
}
}
unpackTranslations();
mergeExtendedTranslations();
};
if (window.SB_EXTERNAL_I18N) {
window.__SB_MERGE_EXTERNAL_I18N();
}
var externalI18nPromise = null;
function ensureExternalI18nLoaded(callback) {
if (window.SB_EXTERNAL_I18N) {
if (typeof window.__SB_MERGE_EXTERNAL_I18N === 'function') window.__SB_MERGE_EXTERNAL_I18N();
if (typeof callback === 'function') callback();
return;
}
if (typeof document === 'undefined' || !document.createElement) {
if (typeof callback === 'function') callback();
return;
}
if (!externalI18nPromise) {
externalI18nPromise = new Promise(function (resolve) {
window.__SB_ON_EXTERNAL_I18N_LOADED = function () {
if (typeof window.__SB_MERGE_EXTERNAL_I18N === 'function') window.__SB_MERGE_EXTERNAL_I18N();
resolve();
};
var s = document.createElement('script');
s.src = 'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/sb-i18n-packs.js';
s.async = true;
s.onload = function () {
if (typeof window.__SB_MERGE_EXTERNAL_I18N === 'function') window.__SB_MERGE_EXTERNAL_I18N();
resolve();
};
s.onerror = function () { resolve(); };
(document.head || document.documentElement).appendChild(s);
});
}
if (typeof callback === 'function') {
externalI18nPromise.then(callback);
}
}
var UI_TEXT = {
ar: {
showingCount:'عرض {n} من أصل {total} ملفاً مدرجاً',noResultsTitle:'لم نجد نتائج مطابقة لهذه الفلاتر',noResultsDesc:'جرّب تقليل الفلاتر المختارة أو البحث بكلمة أعمّ، أو تواصل معنا لترشيح المستشفى المناسب لحالتك.',resetFilters:'إعادة تعيين الفلاتر',filtersBtn:'الفلاتر',viewProfile:'عرض الملف',requestQuote:'اطلب عرض سعر',shortlistBtn:'حفظ',shortlistedBtn:'محفوظ',compareBtn:'مقارنة',comparedBtn:'في المقارنة',lastReviewed:'آخر مراجعة: ',indicativeRange:'نطاق الباقة الاسترشادي: ',enquiryOnly:'للاستفسار المباشر فقط (تقييم فردي)',asOfDate:'بيانات مسجّلة بتاريخ ',compareEmpty:'اختر ما يصل إلى 3 مستشفيات من الدليل لمقارنتها جنباً إلى جنب.',shortlistEmpty:'لم تقم بحفظ أي مستشفى في قائمتك المختصرة بعد.',removeBtn:'إزالة',copiedLink:'تم نسخ رابط القائمة المختصرة',unconnectedNotice:'الطلبات الإلكترونية غير مربوطة حالياً. راسلنا على واتساب أو عبر البريد الإلكتروني hello@thesecretarybird.com',formErrorRequired:'يرجى تعبئة الحقول المطلوبة والموافقة على سياسة التواصل قبل الإرسال.',claimSuccessNotice:'الطلبات الإلكترونية غير مربوطة حالياً. لإرسال طلب تعديل أو إدارة ملف مستشفى، يرجى مراسلتنا مباشرة عبر hello@thesecretarybird.com'
},en: {
showingCount:'Showing {n} of {total} listed profiles',noResultsTitle:'No listings match your current filters',noResultsDesc:'Try clearing one or more filters, searching a broader term, or contacting our patient desk for a custom hospital comparison.',resetFilters:'Reset all filters',filtersBtn:'Filters',viewProfile:'View profile',requestQuote:'Request quote',shortlistBtn:'Save',shortlistedBtn:'Saved',compareBtn:'Compare',comparedBtn:'Comparing',lastReviewed:'Last reviewed: ',indicativeRange:'Indicative package range: ',enquiryOnly:'Enquiry only (case-by-case review)',asOfDate:'Sourced ',compareEmpty:'Select up to 3 hospitals from the directory to compare them side by side.',shortlistEmpty:'You have not saved any hospitals to your shortlist yet.',removeBtn:'Remove',copiedLink:'Shortlist share link copied to clipboard',
unconnectedNotice: "Online requests aren't connected yet. Message us on WhatsApp or email hello@thesecretarybird.com",
formErrorRequired:'Please complete the required fields and tick the consent box before sending.',
claimSuccessNotice: "Online requests aren't connected yet. To claim a listing or suggest a correction, please email hello@thesecretarybird.com"
}
};
var CURRENCY_RATES = {"USD":{"symbol":"$","code":"USD","rate":1},"AED":{"symbol":"AED ","code":"AED","rate":3.6725},"SAR":{"symbol":"SAR ","code":"SAR","rate":3.75},"QAR":{"symbol":"QAR ","code":"QAR","rate":3.64},"KWD":{"symbol":"KWD ","code":"KWD","rate":0.307},"BHD":{"symbol":"BHD ","code":"BHD","rate":0.377},"OMR":{"symbol":"OMR ","code":"OMR","rate":0.385},"EUR":{"symbol":"€","code":"EUR","rate":0.92},"GBP":{"symbol":"£","code":"GBP","rate":0.79}};
var DESTINATION_DEFAULTS = {"india":{"aptRate":70,"flightPatient":380,"flightCompanion":380,"visaFee":80,"dailyLiving":35},"turkey":{"aptRate":88,"flightPatient":460,"flightCompanion":460,"visaFee":60,"dailyLiving":50},"thailand":{"aptRate":85,"flightPatient":580,"flightCompanion":580,"visaFee":40,"dailyLiving":45},"uae":{"aptRate":127,"flightPatient":220,"flightCompanion":220,"visaFee":0,"dailyLiving":75},"saudi-arabia":{"aptRate":119,"flightPatient":260,"flightCompanion":260,"visaFee":90,"dailyLiving":65},"germany":{"aptRate":119,"flightPatient":720,"flightCompanion":720,"visaFee":95,"dailyLiving":85},"south-korea":{"aptRate":112,"flightPatient":820,"flightCompanion":820,"visaFee":45,"dailyLiving":70},"south-korea-gangnam":{"aptRate":116,"flightPatient":820,"flightCompanion":820,"visaFee":45,"dailyLiving":80},"spain":{"aptRate":116,"flightPatient":680,"flightCompanion":680,"visaFee":95,"dailyLiving":75},"singapore":{"aptRate":142,"flightPatient":640,"flightCompanion":640,"visaFee":30,"dailyLiving":90},"malaysia":{"aptRate":76,"flightPatient":560,"flightCompanion":560,"visaFee":0,"dailyLiving":45},"china":{"aptRate":88,"flightPatient":690,"flightCompanion":690,"visaFee":110,"dailyLiving":50},"egypt":{"aptRate":70,"flightPatient":310,"flightCompanion":310,"visaFee":25,"dailyLiving":35},"jordan":{"aptRate":84,"flightPatient":290,"flightCompanion":290,"visaFee":55,"dailyLiving":45},"bahrain":{"aptRate":108,"flightPatient":210,"flightCompanion":210,"visaFee":30,"dailyLiving":65},"kuwait":{"aptRate":119,"flightPatient":230,"flightCompanion":230,"visaFee":30,"dailyLiving":70},"oman":{"aptRate":104,"flightPatient":200,"flightCompanion":200,"visaFee":50,"dailyLiving":60},"morocco":{"aptRate":79,"flightPatient":540,"flightCompanion":540,"visaFee":35,"dailyLiving":45},"tunisia":{"aptRate":71,"flightPatient":490,"flightCompanion":490,"visaFee":35,"dailyLiving":40},"south-africa":{"aptRate":81,"flightPatient":740,"flightCompanion":740,"visaFee":55,"dailyLiving":50},"mexico":{"aptRate":86,"flightPatient":980,"flightCompanion":980,"visaFee":55,"dailyLiving":50},"mexico-tijuana":{"aptRate":84,"flightPatient":990,"flightCompanion":990,"visaFee":45,"dailyLiving":50},"colombia":{"aptRate":74,"flightPatient":960,"flightCompanion":960,"visaFee":55,"dailyLiving":40},"colombia-medellin":{"aptRate":71,"flightPatient":960,"flightCompanion":960,"visaFee":55,"dailyLiving":40},"costa-rica":{"aptRate":84,"flightPatient":1020,"flightCompanion":1020,"visaFee":0,"dailyLiving":55},"dominican-republic":{"aptRate":81,"flightPatient":990,"flightCompanion":990,"visaFee":20,"dailyLiving":50},"croatia":{"aptRate":91,"flightPatient":590,"flightCompanion":590,"visaFee":95,"dailyLiving":65},"cyprus":{"aptRate":96,"flightPatient":420,"flightCompanion":420,"visaFee":60,"dailyLiving":65},"denmark":{"aptRate":130,"flightPatient":740,"flightCompanion":740,"visaFee":95,"dailyLiving":95},"vietnam":{"aptRate":70,"flightPatient":620,"flightCompanion":620,"visaFee":25,"dailyLiving":35},"russia":{"aptRate":79,"flightPatient":540,"flightCompanion":540,"visaFee":55,"dailyLiving":50},"belarus":{"aptRate":68,"flightPatient":520,"flightCompanion":520,"visaFee":45,"dailyLiving":40}};
var FACET_MAP = {"en":{"t-hospital":"Hospital","t-clinic":"Specialty Clinic","t-doctor":"Specialist Doctor","t-cost":"Treatment Cost & Package","t-stay":"Recovery Stay","t-treatment":"Treatment Guide","t-country":"Country Hub","t-city":"City Hub","t-guide":"Travel Guide","t-magazine":"Editorial Magazine","hub-hospitals":"Accredited Hospitals & Stays Hub","hub-doctors":"Super-Specialist Doctors Hub","hub-costs":"Treatment Costs & Packages Hub","acc-jci":"JCI Accredited","acc-nabh":"NABH Accredited","acc-iso":"ISO 9001 Certified","acc-temos":"Temos Accredited","acc-achs":"ACHS International","acc-nhra":"NHRA Accredited","acc-aci":"Accreditation Canada (ACI)","acc-cbahi":"CBAHI Accredited","acc-efqm":"EFQM / European Quality","acc-grade-a":"National Grade A Tertiary","sp-cardiology":"Cardiology & Cardiac Surgery","sp-oncology":"Oncology & Robotic Cancer Surgery","sp-orthopedics":"Orthopedics & Joint Replacement","sp-neurosurgery":"Neurosurgery & Spine","sp-ivf":"IVF & Reproductive Medicine","sp-bariatrics":"Bariatric & Metabolic Surgery","sp-cosmetic":"Plastic & Reconstructive Surgery","sp-ophthalmology":"Ophthalmology & Laser Vision","sp-dental":"Dental Implants & Smile Design","sp-dermatology":"Hair Transplant & Aesthetics","sp-gynecology":"Gynecology","sp-transplants":"Organ Transplantation","svc-arabic-interpreters":"Medical Interpreters","svc-arabic-coordinators":"International Patient Desk","svc-halal-dining":"Halal / Dietary Catering","svc-prayer-room":"Prayer Facilities","svc-family-accommodation":"Partner Recovery Stays Nearby","ver-sourced":"Sourced from published hospital information","ver-confirmed":"Provider-confirmed information","ver-checked":"Independently checked against public registries","c-india":"India","c-turkey":"Türkiye","c-thailand":"Thailand","c-uae":"United Arab Emirates","c-saudi-arabia":"Saudi Arabia","c-germany":"Germany","c-south-korea":"South Korea","c-south-korea-gangnam":"South Korea · Gangnam","c-spain":"Spain","c-singapore":"Singapore","c-malaysia":"Malaysia","c-china":"China","c-egypt":"Egypt","c-jordan":"Jordan","c-bahrain":"Bahrain","c-kuwait":"Kuwait","c-oman":"Oman","c-morocco":"Morocco","c-tunisia":"Tunisia","c-south-africa":"South Africa","c-mexico":"Mexico","c-mexico-tijuana":"Mexico · Tijuana","c-colombia":"Colombia","c-colombia-medellin":"Colombia · Medellín","c-costa-rica":"Costa Rica","c-dominican-republic":"Dominican Republic","c-croatia":"Croatia","c-cyprus":"Cyprus","c-denmark":"Denmark","c-vietnam":"Vietnam","c-russia":"Russia","c-belarus":"Belarus"},"ar":{"t-hospital":"مستشفى","t-clinic":"عيادة تخصصية","t-doctor":"طبيب استشاري","t-cost":"تكلفة وباقة علاجية","t-stay":"إقامة نقاهة","t-treatment":"دليل علاجي","t-country":"دليل دولة","t-city":"دليل مدينة","t-guide":"دليل السفر العلاجي","t-magazine":"المجلة الطبية","hub-hospitals":"دليل المستشفيات والإقامة","hub-doctors":"دليل الأطباء الاستشاريين","hub-costs":"دليل تكاليف العمليات والباقات","acc-jci":"معتمد من JCI","acc-nabh":"معتمد من NABH","acc-iso":"شهادة ISO 9001","acc-temos":"معتمد من Temos الدولي","acc-achs":"معتمد من ACHS الدولي","acc-nhra":"معتمد من NHRA","acc-aci":"معتمد من Accreditation Canada","acc-cbahi":"معتمد من سباهي (CBAHI)","acc-efqm":"اعتماد الجودة الأوروبي EFQM","acc-grade-a":"مستشفى مرجعي وطني فئة أ","sp-cardiology":"أمراض وجراحة القلب","sp-oncology":"الأورام والجراحة الروبوتية","sp-orthopedics":"جراحة العظام والمفاصل","sp-neurosurgery":"جراحة المخ والأعصاب والعمود الفقري","sp-ivf":"الإخصاب المساعد وأطفال الأنابيب","sp-bariatrics":"جراحة السمنة والمناظير","sp-cosmetic":"الجراحة التجميلية والترميمية","sp-ophthalmology":"طب وجراحة العيون والليزر","sp-dental":"زراعة وتجميل الأسنان","sp-dermatology":"زراعة الشعر والجلدية التجميلية","sp-gynecology":"أمراض النساء والتوليد","sp-transplants":"زراعة الأعضاء","svc-arabic-interpreters":"مترجمون طبيون","svc-arabic-coordinators":"مكتب تنسيق المرضى الدوليين","svc-halal-dining":"وجبات حلال وخيارات غذائية","svc-prayer-room":"مرافق صلاة","svc-family-accommodation":"فنادق وشقق نقاهة قريبة","ver-sourced":"مُستمد من المنشورات الرسمية للمستشفى","ver-confirmed":"بيانات مؤكدة من مقدّم الرعاية","ver-checked":"تمت مراجعته مقابل السجلات العامة","c-india":"الهند","c-turkey":"تركيا","c-thailand":"تايلاند","c-uae":"الإمارات العربية المتحدة","c-saudi-arabia":"المملكة العربية السعودية","c-germany":"ألمانيا","c-south-korea":"كوريا الجنوبية","c-south-korea-gangnam":"كوريا الجنوبية · غانغنام","c-spain":"إسبانيا","c-singapore":"سنغافورة","c-malaysia":"ماليزيا","c-china":"الصين","c-egypt":"مصر","c-jordan":"الأردن","c-bahrain":"البحرين","c-kuwait":"الكويت","c-oman":"سلطنة عُمان","c-morocco":"المغرب","c-tunisia":"تونس","c-south-africa":"جنوب أفريقيا","c-mexico":"المكسيك","c-mexico-tijuana":"المكسيك · تيخوانا","c-colombia":"كولومبيا","c-colombia-medellin":"كولومبيا · ميديلين","c-costa-rica":"كوستاريكا","c-dominican-republic":"جمهورية الدومينيكان","c-croatia":"كرواتيا","c-cyprus":"قبرص","c-denmark":"الدنمارك","c-vietnam":"فيتنام","c-russia":"روسيا","c-belarus":"بيلاروسيا"}};
var DIR_INDEX = [["india","IN","India","الهند"],["turkey","TR","Türkiye","تركيا"],["thailand","TH","Thailand","تايلاند"],["uae","AE","United Arab Emirates","الإمارات العربية المتحدة"],["saudi-arabia","SA","Saudi Arabia","المملكة العربية السعودية"],["germany","DE","Germany","ألمانيا"],["south-korea","KR","South Korea","كوريا الجنوبية"],["south-korea-gangnam","KR","South Korea · Gangnam","كوريا الجنوبية · غانغنام"],["spain","ES","Spain","إسبانيا"],["singapore","SG","Singapore","سنغافورة"],["malaysia","MY","Malaysia","ماليزيا"],["china","CN","China","الصين"],["egypt","EG","Egypt","مصر"],["jordan","JO","Jordan","الأردن"],["bahrain","BH","Bahrain","البحرين"],["kuwait","KW","Kuwait","الكويت"],["oman","OM","Oman","سلطنة عُمان"],["morocco","MA","Morocco","المغرب"],["tunisia","TN","Tunisia","تونس"],["south-africa","ZA","South Africa","جنوب أفريقيا"],["mexico","MX","Mexico","المكسيك"],["mexico-tijuana","MX","Mexico · Tijuana","المكسيك · تيخوانا"],["colombia","CO","Colombia","كولومبيا"],["colombia-medellin","CO","Colombia · Medellín","كولومبيا · ميديلين"],["costa-rica","CR","Costa Rica","كوستاريكا"],["dominican-republic","DO","Dominican Republic","جمهورية الدومينيكان"],["croatia","HR","Croatia","كرواتيا"],["cyprus","CY","Cyprus","قبرص"],["denmark","DK","Denmark","الدنمارك"],["vietnam","VN","Vietnam","فيتنام"],["russia","RU","Russia","روسيا"],["belarus","BY","Belarus","بيلاروسيا"]];
var SPEC_LABELS_MAP = {"SPEC-01":{"en":"Cardiovascular Surgery & Cardiology (SPEC-01)","ar":"أمراض وجراحة القلب والأوعية الدموية (SPEC-01)"},"SPEC-02":{"en":"Oncology & Surgical Oncology (SPEC-02)","ar":"الأورام وجراحة الأورام الروبوتية (SPEC-02)"},"SPEC-03":{"en":"Orthopedic Surgery & Joint Replacement (SPEC-03)","ar":"جراحة العظام واستبدال المفاصل (SPEC-03)"},"SPEC-04":{"en":"Neurosurgery & Spine Surgery (SPEC-04)","ar":"جراحة المخ والأعصاب والعمود الفقري (SPEC-04)"},"SPEC-05":{"en":"Reproductive Medicine & IVF (SPEC-05)","ar":"الإخصاب المساعد وأطفال الأنابيب (IVF) (SPEC-05)"},"SPEC-06":{"en":"Bariatric & Metabolic Surgery (SPEC-06)","ar":"جراحة السمنة والمناظير (SPEC-06)"},"SPEC-07":{"en":"Plastic, Reconstructive & Aesthetic Surgery (SPEC-07)","ar":"الجراحة التجميلية والترميمية (SPEC-07)"},"SPEC-08":{"en":"Ophthalmology & Refractive Surgery (SPEC-08)","ar":"طب وجراحة العيون والليزر (SPEC-08)"},"SPEC-09":{"en":"Dental Implantology & Maxillofacial (SPEC-09)","ar":"زراعة الأسنان وتجميل الابتسامة (SPEC-09)"},"SPEC-10":{"en":"Hair Transplant & Aesthetic Dermatology (SPEC-10)","ar":"زراعة الشعر والجلدية التجميلية (SPEC-10)"}};
var PROC_META_MAP = {"PROC-01":["Coronary Artery Bypass Grafting (Off-Pump CABG)","جراحة تحويل مسار الشريان التاجي بالقلب النابض (Off-Pump CABG)","CPT 33533 / ICD-10 02100Z9","SPEC-01","cardiology",95000,"Pre-op coronary angiography & echo; surgeon/cardiologist/anesthetist fees; operating room & heart-lung standby; 2 days CCU + 5 days..."],"PROC-02":["Transcatheter Aortic Valve Implantation / Replacement (TAVI / TAVR)","استبدال الصمام الأبهري عبر القسطرة (TAVI / TAVR)","CPT 33361 / ICD-10 02RF38Z","SPEC-01","cardiology",82000,"Edwards SAPIEN 3 or Medtronic Evolut PRO bioprosthetic valve implant; hybrid cath lab suite; interventional cardiology team; 3D CT..."],"PROC-03":["Robotic-Assisted Laparoscopic Radical Prostatectomy (da Vinci Xi)","استئصال البروستاتا الجذري بالروبوت (da Vinci Xi)","CPT 55866 / ICD-10 0VT04ZZ","SPEC-02","oncology",58000,"Da Vinci Xi robotic surgical console & instruments; urologic oncology surgical team; 3 nights private suite; surgical pathology..."],"PROC-04":["Robotic / Laparoscopic Pancreaticoduodenectomy (Whipple Procedure)","جراحة ويبل لاستئصال أورام البنكرياس بالروبوت/المنظار","CPT 48150 / ICD-10 0FTG0ZZ","SPEC-02","oncology",110000,"Surgical oncology team; da Vinci Xi or 4K laparoscopic tower; 3 days ICU + 8 days inpatient care; nutritional TPN support;..."],"PROC-05":["Robotic-Assisted Total Knee Replacement (Mako / ROSA Unilateral TKR)","استبدال مفصل الركبة الكامل بالروبوت (Mako / ROSA)","CPT 27447 / ICD-10 0SRD0J9","SPEC-03","orthopedics",48000,"Stryker Mako or Zimmer Biomet ROSA robotic planning & prosthesis; laminar-flow OR; 4 nights private ortho room; daily inpatient..."],"PROC-06":["Direct Anterior Approach Total Hip Arthroplasty (Ceramic-on-Ceramic THR)","استبدال مفصل الورك الكامل (النهج الأمامي السيراميكي)","CPT 27130 / ICD-10 0SR9029","SPEC-03","orthopedics",52000,"Uncemented titanium stem & Biolox Delta ceramic head/liner; intraoperative fluoroscopy; 4 nights private hospitalization; gait..."],"PROC-07":["Robotic / Endoscopic Transforaminal Lumbar Interbody Fusion (MIS-TLIF)","تثبيت وتحرير الفقرات القطنية بالروبوت والمنظار (MIS-TLIF)","CPT 22630 / ICD-10 0SG00AJ","SPEC-04","neurosurgery",75000,"PEEK or 3D-printed titanium interbody cage + pedicle screw system; Medtronic O-arm/StealthStation navigation; continuous IONM; 4..."],"PROC-08":["Bilateral Deep Brain Stimulation (DBS) Implantation for Parkinson's Disease","زراعة جهاز التحفيز العميق للدماغ لعلاج باركنسون (DBS)","CPT 61867 / ICD-10 00H00MZ","SPEC-04","neurosurgery",98000,"Medtronic Percept PC or Boston Scientific Vercise Genus rechargeable DBS system; ROSA stereotactic robot; intraoperative 3.0T..."],"PROC-09":["In Vitro Fertilization (IVF / ICSI) with Time-Lapse EmbryoScope & PGT-A","دورة أطفال الأنابيب والحقن المجهري مع الفحص الوراثي (IVF + PGT-A)","CPT 58970 / ICD-10 Z31.83","SPEC-05","ivf",24000,"Serial follicular ultrasounds & estradiol monitoring; oocyte retrieval & ICSI; EmbryoScope+ time-lapse incubation; trophectoderm..."],"PROC-10":["Anonymous / Phenotype-Matched Egg Donation IVF Cycle with Guarantee Option","برنامج الإخصاب المتقدم متعدد الدورات (Comprehensive IVF)","CPT 58974 / ICD-10 Z31.83","SPEC-05","ivf",35000,"Donor recruitment, screening & compensation; genetic carrier testing (300+ recessive genes); ICSI fertilization; documented cohort benchmark..."],"PROC-11":["Laparoscopic Vertical Sleeve Gastrectomy (LSG - Tri-Staple Technology)","عملية تكميم المعدة بالمنظار (LSG - Tri-Staple)","CPT 43775 / ICD-10 0DB64Z3","SPEC-06","bariatrics",23000,"Covidien Tri-Staple or Ethicon Echelon endoscopic staplers; leak tests (intraoperative methylene blue + post-op Gastrografin..."],"PROC-12":["Laparoscopic Roux-en-Y Gastric Bypass (RYGB) / Mini-Gastric Bypass (OAGB)","تحويل مسار المعدة الكلاسيكي أو المصغر بالمنظار (RYGB / OAGB)","CPT 43644 / ICD-10 0D164ZA","SPEC-06","bariatrics",28000,"Laparoscopic 4K surgical suite; linear surgical staplers & harmonic scalpel; 3 nights private bariatric room; contrast upper GI..."],"PROC-13":["Ultrasonic Piezo Preservation Rhinoplasty & Septorhinoplasty","تجميل وترميم الأنف بالموجات فوق الصوتية (Piezo Rhinoplasty)","CPT 30420 / ICD-10 09QK0ZZ","SPEC-07","cosmetic",16500,"Piezo ultrasonic rhinoplasty console; 3D Vectra/Crisalix pre-op facial simulation; 1 night private clinic suite; silicone internal..."],"PROC-14":["Deep Plane Facelift & Neck Lift (Extended SMAS / Platysmaplasty)","شد الوجه والرقبة العميق (Deep Plane Facelift)","CPT 15828 / ICD-10 0W020ZZ","SPEC-07","cosmetic",26000,"Plastic surgeon & microsurgical team; 1-2 nights VIP recovery villa; hyperbaric oxygen therapy (2 sessions); compression garment;..."],"PROC-15":["ReLEx SMILE Pro / Femto-LASIK Bilateral Laser Vision Correction","تصحيح النظر بالليزر للعينين (ReLEx SMILE Pro / Femto-LASIK)","CPT 65760 / ICD-10 08E8XZZ","SPEC-08","ophthalmology",5200,"Bilateral Zeiss VisuMax 800 or WaveLight EX500 laser treatment; Pentacam corneal tomography; wavefront aberrometry; post-op..."],"PROC-16":["Femtosecond Laser Cataract / Refractive Lens Exchange with Trifocal IOL (Bilateral)","إزالة المياه البيضاء وزراعة العدسات ثلاثية البؤر بالليزر","CPT 66984 / ICD-10 08RJ3JZ","SPEC-08","ophthalmology",11500,"Alcon LenSx / Catalys femtosecond laser + Centurion phaco; 2 premium Trifocal Toric IOLs (near, intermediate & distance vision);..."],"PROC-17":["All-on-4 / All-on-6 Full-Arch Dental Implants with Immediate Fixed Prosthesis (Per Arch)","زراعة الأسنان الفورية لكامل الفك (All-on-4 / All-on-6)","CDT D6114 / CPT 21248","SPEC-09","dental",26000,"4-6 Straumann/Nobel Biocare implants with lifetime manufacturer warranty; 3D CBCT & surgical guide; tooth extractions &..."],"PROC-18":["Digital Smile Makeover — 20 Porcelain E.max / Feldspathic Veneers (Full Mouth)","ابتسامة رقمية متكاملة — 20 عدسة خزفية (E.max Veneers)","CDT D2962","SPEC-09","dental",28000,"3D Digital Smile Design (DSD) & 3D-printed trial mock-up; 20 CAD/CAM & master-ceramist layered IPS e.max veneers; laser gum..."],"PROC-19":["Sapphire FUE / DHI Micro-Graft Hair Transplantation (Up to 4,000–4,500 Grafts)","زراعة الشعر بتقنية السفير أو أقلام تشوي (Sapphire FUE / DHI)","CPT 15775","SPEC-10","dermatology",14500,"Maximum graft extraction & implantation (up to 4,500 grafts); Sapphire blades / Choi DHI pens; 1 session autologous PRP..."],"PROC-20":["Full-Face Fractional CO2 / Picosecond Laser Resurfacing + Ultrasound SMAS Lifting & Exosomes","تجديد البشرة بالليزر الكربوني وشد الوجه بـ HIFU والإكسوزوم","CPT 17999","SPEC-10","dermatology",6500,"3D Visia skin complexion analysis; full-face & neck Ultherapy (600-800 lines); PicoSure / Fractional CO2 laser pass; 5 billion..."]};
var ALL_CITIES_INDEX = [["new-delhi","New Delhi","india"],["gurugram-gurgaon","Gurugram (Gurgaon)","india"],["mumbai","Mumbai","india"],["chennai","Chennai","india"],["bengaluru","Bengaluru","india"],["kolkata","Kolkata","india"],["kochi-cochin-kerala-medical-corridor","Kochi (Cochin) & Kerala Medical Corridor","india"],["vellore-chandigarh-academic-referral-hubs","Vellore & Chandigarh (Academic Referral Hubs)","india"],["istanbul","Istanbul","turkey"],["adana","Adana","turkey"],["ankara","Ankara","turkey"],["izmir","Izmir","turkey"],["mersin","Mersin","turkey"],["bangkok","Bangkok","thailand"],["pathum-thani","Pathum Thani","thailand"],["nonthaburi","Nonthaburi","thailand"],["sriracha","Sriracha","thailand"],["phuket","Phuket","thailand"],["khon-kaen","Khon Kaen","thailand"],["phitsanulok","Phitsanulok","thailand"],["al-maryah-island","Al Maryah Island","uae"],["sharjah","Sharjah","uae"],["khalifa-city","Khalifa City","uae"],["dubai-jumeirah","Dubai Jumeirah","uae"],["dubai","Dubai","uae"],["ajman","Ajman","uae"],["fujairah","Fujairah","uae"],["al-dhafra","Al Dhafra","uae"],["ras-al-khaimah","Ras Al Khaimah","uae"],["dubai-hills","Dubai Hills","uae"],["riyadh","Riyadh","saudi-arabia"],["khobar","Khobar","saudi-arabia"],["al-ahsa","Al Ahsa","saudi-arabia"],["tabuk","Tabuk","saudi-arabia"],["hail","Hail","saudi-arabia"],["jeddah","Jeddah","saudi-arabia"],["berlin","Berlin","germany"],["munich","Munich","germany"],["frankfurt","Frankfurt","germany"],["nuremberg","Nuremberg","germany"],["cologne","Cologne","germany"],["seoul-songpa","Seoul Songpa","south-korea"],["seoul-jongno","Seoul Jongno","south-korea"],["daegu","Daegu","south-korea"],["busan","Busan","south-korea"],["seoul-guro","Seoul Guro","south-korea"],["gangnam","Gangnam","south-korea-gangnam"],["seocho","Seocho","south-korea-gangnam"],["madrid","Madrid","spain"],["barcelona","Barcelona","spain"],["valencia","Valencia","spain"],["bilbao-basque-country","Bilbao & Basque Country","spain"],["orchard","Orchard","singapore"],["outram","Outram","singapore"],["jurong-east","Jurong East","singapore"],["novena","Novena","singapore"],["tanglin","Tanglin","singapore"],["kuala-lumpur","Kuala Lumpur","malaysia"],["ipoh","Ipoh","malaysia"],["kota-kinabalu","Kota Kinabalu","malaysia"],["johor-bahru","Johor Bahru","malaysia"],["miri","Miri","malaysia"],["beijing","Beijing","china"],["tianjin","Tianjin","china"],["wuhan","Wuhan","china"],["xi-an","Xi'an","china"],["cairo","Cairo","egypt"],["el-gouna","El Gouna","egypt"],["suez","Suez","egypt"],["jubaiha","Jubaiha","jordan"],["shmeisani","Shmeisani","jordan"],["dabouq","Dabouq","jordan"],["dead-sea","Dead Sea","jordan"],["karak","Karak","jordan"],["busaiteen","Busaiteen","bahrain"],["awali","Awali","bahrain"],["zinj","Zinj","bahrain"],["salmaniya","Salmaniya","bahrain"],["adliya","Adliya","bahrain"],["hawalli","Hawalli","kuwait"],["shuwaikh","Shuwaikh","kuwait"],["fahaheel","Fahaheel","kuwait"],["kuwait-city","Kuwait City","kuwait"],["farwaniya","Farwaniya","kuwait"],["muscat","Muscat","oman"],["barka","Barka","oman"],["buraimi","Buraimi","oman"],["casablanca","Casablanca","morocco"],["meknes","Meknes","morocco"],["rabat","Rabat","morocco"],["tunis","Tunis","tunisia"],["sfax","Sfax","tunisia"],["monastir","Monastir","tunisia"],["sousse","Sousse","tunisia"],["johannesburg","Johannesburg","south-africa"],["pretoria","Pretoria","south-africa"],["somerset-west","Somerset West","south-africa"],["durban","Durban","south-africa"],["cape-town","Cape Town","south-africa"],["mexico-city","Mexico City","mexico"],["puerto-vallarta","Puerto Vallarta","mexico"],["tijuana","Tijuana","mexico"],["hermosillo","Hermosillo","mexico"],["tijuana","Tijuana","mexico-tijuana"],["bogot","Bogotá","colombia"],["medell-n","Medellín","colombia"],["cali","Cali","colombia"],["cartagena","Cartagena","colombia"],["manizales","Manizales","colombia"],["medell-n","Medellín","colombia-medellin"],["envigado","Envigado","colombia-medellin"],["bello","Bello","colombia-medellin"],["guarne","Guarne","colombia-medellin"],["escaz","Escazú","costa-rica"],["liberia","Liberia","costa-rica"],["playas-del-coco","Playas del Coco","costa-rica"],["santo-domingo","Santo Domingo","dominican-republic"],["santiago","Santiago","dominican-republic"],["punta-cana","Punta Cana","dominican-republic"],["zagreb","Zagreb","croatia"],["split","Split","croatia"],["opatija","Opatija","croatia"],["ibenik","Šibenik","croatia"],["nicosia","Nicosia","cyprus"],["limassol","Limassol","cyprus"],["larnaca","Larnaca","cyprus"],["famagusta","Famagusta","cyprus"],["copenhagen","Copenhagen","denmark"],["gentofte","Gentofte","denmark"],["k-ge","Køge","denmark"],["esbjerg","Esbjerg","denmark"],["ho-chi-minh-city","Ho Chi Minh City","vietnam"],["hanoi","Hanoi","vietnam"],["nha-trang","Nha Trang","vietnam"],["moscow","Moscow","russia"],["yekaterinburg","Yekaterinburg","russia"],["sochi","Sochi","russia"],["minsk","Minsk","belarus"],["minsk-region","Minsk Region","belarus"],["bobruisk","Bobruisk","belarus"],["brest","Brest","belarus"]];
var RAW_HOSPITALS_SEED = (window.__SB_HUB_SEEDS && window.__SB_HUB_SEEDS.hospitals) || [];
var RAW_DOCTORS_SEED = (window.__SB_HUB_SEEDS && window.__SB_HUB_SEEDS.doctors) || [];
var RAW_COSTS_SEED = (window.__SB_HUB_SEEDS && window.__SB_HUB_SEEDS.costs) || [];
var CATALOGUE_HOSPITALS = RAW_HOSPITALS_SEED.map(function (r) {
var dm = DIR_INDEX[r[1]] || ['india', 'IN', 'India', 'الهند'];
var cSlug = dm[0], cc = dm[1], cEn = dm[2], cAr = dm[3];
var fm = r[9] || 0;
return {
id: r[0], facility_id: r[0], type: 'hospital', country: cSlug, country_code: cc, city: r[2],
scope: cSlug === 'uae' ? 'domestic' : 'international',
urlEn: r[17] || ('/p/hospitals-directory.html?country=' + cSlug + '#' + r[0]), urlAr: r[17] || ('/p/hospitals-directory.html?country=' + cSlug + '#' + r[0]),
bloggerUrl: '/p/hospitals-directory.html?country=' + cSlug + '#' + r[0], provider_page_url: r[17] || '',
nearest_international_airport_code: r[18] || '',
facility_name: { en: r[3], ar: r[3] }, title: { en: r[3], ar: r[3] },city_name: { en: r[4], ar: r[4] }, country_name: { en: cEn, ar: cAr },locationLabel: { en: r[4] + ', ' + cEn + (r[18] ? ' (' + r[18] + ')' : ''), ar: r[4] + '، ' + cAr + (r[18] ? ' (' + r[18] + ')' : '') },
beds_reported: r[5], icu_reported: r[6],
original_overview: { en: r[7], ar: r[7] }, summary: { en: r[7], ar: r[7] },
spoken_languages: r[8],
medical_interpreter_available: !!(fm & 1), e_visa_available: !!(fm & 2),
airport_pickup_included: !!(fm & 4), direct_insurance_billing: !!(fm & 8),
partner_recovery_hotels: { en: r[10], ar: r[10] }, distance_from_facility_km: r[11],
accreditations: r[12], specialties: r[13], arabCare: r[14],
minPriceUsd: r[15], maxPriceUsd: r[16], priceDated: true,
certificate_id: '', accreditation_expiry_date: '', sourceDate: '2026-11', lastReviewed: '2026-11-10', verificationStatus: 'ver-sourced'
};
});
var HOSP_BY_ID = {}; CATALOGUE_HOSPITALS.forEach(function(h){ HOSP_BY_ID[h.id] = h; });
var CATALOGUE_DOCTORS = RAW_DOCTORS_SEED.map(function (r) {
var hName = r[10] || (HOSP_BY_ID[r[9]] ? HOSP_BY_ID[r[9]].facility_name.en : r[9]);
var dm = DIR_INDEX[r[1]] || ['india', 'IN', 'India', 'الهند'];
var sMeta = SPEC_LABELS_MAP[r[4]] || { en: r[4], ar: r[4] };
return {
id: r[0], doctor_id: r[0], type: 'doctor', country: dm[0], country_code: dm[1], city: r[2],
scope: dm[0] === 'uae' ? 'domestic' : 'international',
doctor_name: { en: r[3], ar: r[3] }, primary_specialty: sMeta,
specialty_code: r[4], specialty_slug: r[5],
sub_specialties: { en: r[6], ar: r[6] }, years_of_experience: r[7],
procedures_performed_count: r[8], primary_facility_id: r[9],
primary_facility_name: { en: hName, ar: hName }, affiliated_facility_ids: r[11] || [r[9]],
education_and_qualifications: { en: r[12], ar: r[12] },awards_and_honors: { en: r[13], ar: r[13] }, spoken_languages: r[14],
consultation_fee_usd: r[15], clinical_focus_and_bio: { en: r[16], ar: r[16] },
doctor_profile_url: r[17] || '', lastReviewed: '2026-11-10', verificationStatus: 'ver-sourced'
};
});
var DOC_BY_ID = {}; CATALOGUE_DOCTORS.forEach(function(d){ DOC_BY_ID[d.id] = d; });
var CATALOGUE_COSTS = RAW_COSTS_SEED.map(function (r) {
var fName = r[5] || (HOSP_BY_ID[r[4]] ? HOSP_BY_ID[r[4]].facility_name.en : r[4]);
var dName = r[7] || (DOC_BY_ID[r[6]] ? DOC_BY_ID[r[6]].doctor_name.en : r[6]);
var dm = DIR_INDEX[r[1]] || ['india', 'IN', 'India', 'الهند'];
var pm = PROC_META_MAP[r[3]] || [r[3], r[3], '', 'SPEC-01', 'cardiology', 45000, ''];
var sMeta = SPEC_LABELS_MAP[pm[3]] || { en: pm[3], ar: pm[3] };
var stays = r[14] || [5, 8, 13];
return {
id: r[0], cost_id: r[0], type: 'cost', country: dm[0], country_code: dm[1], city: r[2],
scope: dm[0] === 'uae' ? 'domestic' : 'international',
procedure_code: r[3], cpt_icd_code: pm[2],
procedure_name: { en: pm[0], ar: pm[1] }, specialty_category: sMeta,
specialty_code: pm[3], specialty_slug: pm[4],
facility_id: r[4], facility_name: { en: fName, ar: fName },
lead_doctor_id: r[6], lead_doctor_name: { en: dName, ar: dName },
price_low_usd: r[8], price_avg_package_usd: r[9], price_high_complex_usd: r[10],
local_currency_estimate: r[11], us_benchmark_price_usd: pm[5],
estimated_savings_usd: Math.max(0, pm[5] - r[9]), estimated_savings_pct: r[12],
clinical_success_rate: r[13], hospital_stay_days: stays[0],
mandatory_local_recovery_days: stays[1], fit_to_fly_clearance_days: stays[2],
package_inclusions: { en: pm[6], ar: pm[6] }, package_quote_url: r[15] || (HOSP_BY_ID[r[4]] && HOSP_BY_ID[r[4]].provider_page_url ? HOSP_BY_ID[r[4]].provider_page_url.replace(/\/$/, '') + '/international-packages/?proc=' + r[3].toLowerCase() : ''),
airport_pickup_included: true, priceDated: true, sourceDate: '2026-11',lastReviewed:'2026-11-10', verificationStatus: 'ver-sourced'
};
});
var CATALOGUE_LISTINGS = CATALOGUE_HOSPITALS;
var RAW_COST_MATRIX = (window.__SB_HUB_SEEDS && window.__SB_HUB_SEEDS.costMatrix) || {};
var COST_MATRIX = {};
(function unpackCostMatrix() {
var pCodes = Object.keys(RAW_COST_MATRIX);
for (var i = 0; i < pCodes.length; i++) {
var pc = pCodes[i], srcRow = RAW_COST_MATRIX[pc], dstRow = {};
var cKeys = Object.keys(srcRow);
for (var j = 0; j < cKeys.length; j++) {
var ck = cKeys[j], a = srcRow[ck];
dstRow[ck] = { min: a[0], max: a[1], hospNights: a[2], recovNights: a[3], dated: true, date: '2026-11' };
}
COST_MATRIX[pc] = dstRow;
}
COST_MATRIX.cabg = COST_MATRIX['PROC-01'];
COST_MATRIX.tkr = COST_MATRIX['PROC-05'];
COST_MATRIX.ivf = COST_MATRIX['PROC-09'];
COST_MATRIX.spine = COST_MATRIX['PROC-07'];
COST_MATRIX.oncology = COST_MATRIX['PROC-04'];
COST_MATRIX.rhinoplasty = COST_MATRIX['PROC-13'];
})();
function resolveBaseLangKey(code) {
if (!code) return 'en';
var lower = String(code).trim().toLowerCase();
if (LOCALE_BASE_ALIASES[lower]) return LOCALE_BASE_ALIASES[lower];
var base = lower.split('-')[0];
return LOCALE_BASE_ALIASES[base] || base;
}
var CLINICAL_TAXONOMY_I18N = {"en":{"specs":["Cardiology & Cardiac Surgery","Oncology & Robotic Cancer Surgery","Orthopedics & Joint Replacement","Neurosurgery & Spine Surgery","IVF & Reproductive Medicine","Bariatric & Metabolic Surgery","Plastic & Reconstructive Surgery","Ophthalmology & Laser Vision","Dental Implants & Maxillofacial","Hair Transplant & Aesthetic Dermatology","Organ Transplantation (Liver, Kidney & BMT)"],"procs":["Coronary Artery Bypass Grafting (Off-Pump CABG)","Transcatheter Aortic Valve Replacement (TAVI / TAVR)","Robotic Radical Prostatectomy (da Vinci Xi)","Robotic / Laparoscopic Whipple Pancreatic Resection","Robotic Total Knee Replacement (Mako / ROSA)","Direct Anterior Total Hip Replacement (Ceramic)","Robotic / Endoscopic Lumbar Spinal Fusion (MIS-TLIF)","Bilateral Deep Brain Stimulation (DBS) for Parkinson's","IVF / ICSI Cycle with EmbryoScope & PGT-A","Donor-Egg / Multi-Cycle Comprehensive IVF Program","Laparoscopic Sleeve Gastrectomy (LSG)","Laparoscopic Gastric Bypass (RYGB / Mini-Bypass)","Ultrasonic Piezo Preservation Rhinoplasty","Deep Plane Facelift & Neck Lift","ReLEx SMILE Pro / Femto-LASIK Laser Vision Correction","Femtosecond Laser Cataract / Trifocal Lens Exchange","All-on-4 / All-on-6 Full-Arch Dental Implants","Digital Smile Makeover (20 E.max Porcelain Veneers)","Sapphire FUE / DHI Hair Transplant (Up to 4,500 Grafts)","Fractional CO2 Laser Resurfacing & HIFU Lifting"],"ui":["All 32 Destinations","All 20 Procedures & Packages","Official Source ↗","Show more listings"],"seoTitle":"SecretaryBird — Accredited Hospitals & Treatment Costs Abroad","seoDesc":"Compare internationally or nationally accredited hospitals, super-specialist surgeons, and all-inclusive surgical package prices across 32 medical travel destinations.","seoKeywords":"medical tourism, JCI accredited hospitals abroad, treatment cost comparison, cardiac surgery abroad, robotic cancer surgery, IVF abroad, dental implants Turkey India Thailand, hair transplant, hospital recovery apartments","hospTpl":"{name} in {city}, {country} ({beds} beds, {icu} ICU) — Internationally accredited tertiary medical center ({acc}) offering specialized care, airport transfers, and nearby recovery stays.","docTpl":"Senior specialist in {spec} at {hosp} ({exp}+ years experience, {procs} procedures performed).","pkgTpl":"All-inclusive clinical package: pre-op diagnostics, surgeon & anesthesia fees, {hospDays}d inpatient stay, {recovDays}d local recovery & airport transfer."},"ar":{"specs":["أمراض وجراحة القلب والأوعية الدموية","الأورام وجراحة الأورام الروبوتية","جراحة العظام واستبدال المفاصل","جراحة المخ والأعصاب والعمود الفقري","الإخصاب المساعد وأطفال الأنابيب (IVF)","جراحة السمنة والمناظير","الجراحة التجميلية والترميمية","طب وجراحة العيون والليزر","زراعة الأسنان وجراحة الفكين","زراعة الشعر والجلدية التجميلية","زراعة الأعضاء (الكبد والكلى ونخاع العظم)"],"procs":["تحويل مسار الشريان التاجي بالقلب النابض (Off-Pump CABG)","استبدال الصمام الأبهري عبر القسطرة (TAVI / TAVR)","استئصال البروستاتا الجذري بالروبوت (da Vinci Xi)","جراحة ويبل لاستئصال أورام البنكرياس بالروبوت/المنظار","استبدال مفصل الركبة الكامل بالروبوت (Mako / ROSA)","استبدال مفصل الورك الكامل (النهج الأمامي السيراميكي)","تثبيت وتحرير الفقرات القطنية بالروبوت والمنظار (MIS-TLIF)","زراعة جهاز التحفيز العميق للدماغ لعلاج باركنسون (DBS)","أطفال الأنابيب والحقن المجهري مع الفحص الوراثي (IVF + PGT-A)","برنامج الإخصاب المتقدم متعدد الدورات (Comprehensive IVF)","عملية تكميم المعدة بالمنظار (LSG)","تحويل مسار المعدة الكلاسيكي أو المصغر بالمنظار (RYGB / OAGB)","تجميل وترميم الأنف بالموجات فوق الصوتية (Piezo Rhinoplasty)","شد الوجه والرقبة العميق (Deep Plane Facelift)","تصحيح النظر بالليزر للعينين (ReLEx SMILE Pro / Femto-LASIK)","إزالة المياه البيضاء وزراعة العدسات ثلاثية البؤر بالليزر","زراعة الأسنان الفورية لكامل الفك (All-on-4 / All-on-6)","ابتسامة رقمية متكاملة — 20 عدسة خزفية (E.max Veneers)","زراعة الشعر بتقنية السفير أو أقلام تشوي (Sapphire FUE / DHI)","تجديد البشرة بالليزر الكربوني وشد الوجه بـ HIFU"],"ui":["كل الوجهات (32 دولة ومنطقة)","جميع الإجراءات والعمليات (20 إجراءً)","المصدر الرسمي ↗","عرض المزيد من النتائج"],"seoTitle":"سكرتاري بيرد — مستشفيات معتمدة وتكاليف العلاج في الخارج","seoDesc":"قارن بين المستشفيات المعتمدة دولياً ووطنياً ونخبة الأطباء الاستشاريين وأسعار الباقات الجراحية الشاملة وشقق النقاهة عبر 32 وجهة عالمية للسفر العلاجي.","seoKeywords":"السفر العلاجي, السياحة العلاجية, مستشفيات معتمدة JCI, تكلفة العلاج في الهند وتركيا وتايلاند وألمانيا والإمارات, جراحة القلب, علاج الأورام بالروبوت, أطفال الأنابيب والحقن المجهري, زراعة الأسنان والشعر, شقق نقاهة طبية","hospTpl":"{name} في {city}، {country} ({beds} سريراً، {icu} عناية مركزة) — مركز طبي مرجعي معتمد ({acc}) يوفر مترجمين طبيين، وتنسيق التأشيرة، وفنادق نقاهة مجاورة.","docTpl":"استشاري متخصص في {spec} بمستشفى {hosp} (خبرة +{exp} عاماً، أجرى {procs} إجراءً جراحياً).","pkgTpl":"باقة علاجية شاملة: الفحوصات قبل العملية، أتعاب الجراح والتخدير، إقامة بالمستشفى {hospDays} أيام، نقاهة محلية {recovDays} أيام مع الاستقبال بالمطار."}};
if (window.SB_EXTERNAL_I18N && typeof window.__SB_MERGE_EXTERNAL_I18N === 'function') { window.__SB_MERGE_EXTERNAL_I18N(); }
var SUBCORRIDOR_I18N = {"south-korea-gangnam":{"ar":"غانغنام","ko":"강남","zh-CN":"江南","zh-TW":"江南","ja":"江南(カンナム)","ru":"Каннам (Сеул)","uk":"Каннам (Сеул)","kk":"Каннам (Сеул)","bg":"Каннам (Сеул)","fa":"گانگنام","ur":"گنگنم","hi":"गंगनम (सियोल)","bn":"গাংনাম (সিউল)","default":"Gangnam"},"mexico-tijuana":{"ar":"تيخوانا","ru":"Тихуана","uk":"Тіхуана","kk":"Тихуана","bg":"Тихуана","fa":"تیخوانا","ur":"تیجوانا","zh-CN":"蒂华纳","zh-TW":"蒂華納","ja":"ティファナ","ko":"티후아나","hi":"तिजुआना","bn":"তিজুয়ানা","default":"Tijuana"},"colombia-medellin":{"ar":"ميديلين","ru":"Медельин","uk":"Медельїн","kk":"Медельин","bg":"Меделин","fa":"مدلین","ur":"میڈیلن","zh-CN":"麦德林","zh-TW":"麥德林","ja":"メデジン","ko":"메데인","hi":"मेडेलिन","bn":"মেডেলিন","default":"Medellín"}};
var SPEC_CODE_ORDER = ['SPEC-01','SPEC-02','SPEC-03','SPEC-04','SPEC-05','SPEC-06','SPEC-07','SPEC-08','SPEC-09','SPEC-10'];
var SPEC_SLUG_TO_IDX = {cardiology:0,'cardiac-surgery':0,oncology:1,orthopedics:2,neurosurgery:3,spine:3,ivf:4,fertility:4,gynecology:4,bariatrics:5,cosmetic:6,'plastic-surgery':6,ophthalmology:7,dental:8,dentistry:8,dermatology:9,'hair-transplant':9,transplants:10,transplant:10};
var _intlRegionCache = {};
function getTaxonomyPack(langCode) {
var raw = String(langCode || (state && state.activeLangCode) || 'en').trim();
var low = raw.toLowerCase();
var base = resolveBaseLangKey(raw);
if (CLINICAL_TAXONOMY_I18N[raw]) return CLINICAL_TAXONOMY_I18N[raw];
if (low.indexOf('zh-hant') === 0 || low === 'zh-tw' || low === 'zh-hk') return CLINICAL_TAXONOMY_I18N['zh-TW'];
if (base === 'zh' || low.indexOf('zh') === 0) return CLINICAL_TAXONOMY_I18N['zh-CN'];
if (CLINICAL_TAXONOMY_I18N[base]) return CLINICAL_TAXONOMY_I18N[base];
var isRtl = !!(RTL_LANGS[raw] || RTL_LANGS[base]);
return isRtl ? CLINICAL_TAXONOMY_I18N.ar : CLINICAL_TAXONOMY_I18N.en;
}
var SPOKEN_LANG_TO_ISO = {english:'en',arabic:'ar',french:'fr',russian:'ru',hindi:'hi',german:'de',spanish:'es',turkish:'tr',thai:'th',mandarin:'zh',chinese:'zh',japanese:'ja',korean:'ko',italian:'it',portuguese:'pt',malay:'ms',vietnamese:'vi',danish:'da',croatian:'hr',belarusian:'be',catalan:'ca',greek:'el',tamil:'ta',telugu:'te',malayalam:'ml',afrikaans:'af',zulu:'zu',scandinavian:'sv'};
var _intlLangCache = {};
function localizeSpokenLanguageName(rawName, langCode) {
var clean = String(rawName || '').trim();
if (!clean) return '';
var iso = SPOKEN_LANG_TO_ISO[clean.toLowerCase()];
if (!iso) return clean;
var active = String(langCode || (state && state.activeLangCode) || document.documentElement.getAttribute('lang') || 'en').trim();
var base = resolveBaseLangKey(active);
if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
var cKey = active + ':' + iso;
if (_intlLangCache[cKey]) return _intlLangCache[cKey];
try {
var dn = new Intl.DisplayNames([active, base, 'en'], { type: 'language' });
var loc = dn.of(iso);
if (loc) {
loc = loc.charAt(0).toUpperCase() + loc.slice(1);
_intlLangCache[cKey] = loc;
return loc;
}
} catch (e) {}
}
return clean;
}
function getLocalizedCountryName(cSlug, isoCode, langCode) {
var active = String(langCode || (state && state.activeLangCode) || document.documentElement.getAttribute('lang') || 'en').trim();
var base = resolveBaseLangKey(active);
var iso = String(isoCode || '').toUpperCase();
if (!iso && DIR_INDEX) {
for (var i = 0; i < DIR_INDEX.length; i++) {
if (DIR_INDEX[i][0] === cSlug) { iso = DIR_INDEX[i][1]; break; }
}
}
var countryLabel = '';
if (iso && typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
var cacheKey = active + ':' + iso;
if (_intlRegionCache[cacheKey]) {
countryLabel = _intlRegionCache[cacheKey];
} else {
try {
var dn = new Intl.DisplayNames([active, base, 'en'], { type: 'region' });
countryLabel = dn.of(iso) || '';
if (countryLabel) _intlRegionCache[cacheKey] = countryLabel;
} catch (e) {}
}
}
if (!countryLabel && DIR_INDEX) {
var isRtl = !!(RTL_LANGS[active] || RTL_LANGS[base]);
for (var j = 0; j < DIR_INDEX.length; j++) {
if (DIR_INDEX[j][0] === cSlug) {
countryLabel = isRtl ? DIR_INDEX[j][3] : DIR_INDEX[j][2];
break;
}
}
}
var subMap = SUBCORRIDOR_I18N[cSlug];
if (subMap && countryLabel) {
var subName = subMap[active] || subMap[base] || subMap['default'];
if (countryLabel.indexOf(subName) === -1) {
countryLabel = countryLabel + ' · ' + subName;
}
}
return countryLabel || cSlug;
}
function getLocalizedSpecTitle(specCodeOrSlug, includeCode, langCode) {
var pack = getTaxonomyPack(langCode);
var clean = String(specCodeOrSlug || '').replace(/^sp-/, '');
var idx = SPEC_CODE_ORDER.indexOf(clean.toUpperCase());
if (idx === -1 && SPEC_SLUG_TO_IDX[clean.toLowerCase()] !== undefined) {
idx = SPEC_SLUG_TO_IDX[clean.toLowerCase()];
}
if (idx >= 0 && pack.specs && pack.specs[idx]) {
var label = pack.specs[idx];
if (includeCode && idx < 10) return SPEC_CODE_ORDER[idx] + ' · ' + label;
return label;
}
return specCodeOrSlug;
}
function getLocalizedProcTitle(procCode, includeCode, langCode) {
var pack = getTaxonomyPack(langCode);
var m = /^PROC-(\d+)$/i.exec(String(procCode || '').trim());
if (!m) return procCode;
var pIdx = parseInt(m[1], 10) - 1;
var title = (pack.procs && pack.procs[pIdx]) || "";
if (!title) {
var spIdx = Math.floor(pIdx / 2);
var spPrefix = (pack.specs && pack.specs[spIdx]) ? (pack.specs[spIdx] + " — ") : "";
title = spPrefix + (CLINICAL_TAXONOMY_I18N.en.procs[pIdx] || procCode);
}
return includeCode ? ('PROC-' + (pIdx + 1 < 10 ? '0' : '') + (pIdx + 1) + ' · ' + title) : title;
}
function refreshMultilingualSelectsAndData(langCode) {
var active = langCode || (state && state.activeLangCode) || 'en';
var base = resolveBaseLangKey(active);
var taxPack = getTaxonomyPack(active);
var uiPack = PAGE_TRANSLATIONS[active] || PAGE_TRANSLATIONS[base] || PAGE_TRANSLATIONS.en;
var hasDedicatedTax = !!(CLINICAL_TAXONOMY_I18N[active] || CLINICAL_TAXONOMY_I18N[base] || base === 'zh');
if (uiPack) {
uiPack.filterAllCountries = hasDedicatedTax ? taxPack.ui[0] : ((uiPack.scopeAll || 'All') + ' (32)');
uiPack.filterAllProcedures = hasDedicatedTax ? taxPack.ui[1] : 'PROC-01..20';
uiPack.officialSourceBtn = hasDedicatedTax ? taxPack.ui[2] : ((uiPack.viewProfile || 'Source') + ' ↗');
uiPack.loadMoreBtn = hasDedicatedTax ? taxPack.ui[3] : ((uiPack.viewProfile || 'More') + ' (+)');
if (base !== 'en' && base !== 'ar') { uiPack.edCard1Loc = uiPack.filterAllCountries; }
}
var destSelectIds = ['sb-filter-destination', 'sb-calc-destination', 'sb-quote-dest'];
for (var s = 0; s < destSelectIds.length; s++) {
var sel = document.getElementById(destSelectIds[s]);
if (!sel) continue;
var isCalc = destSelectIds[s] === 'sb-calc-destination';
var opts = sel.options;
for (var o = 0; o < opts.length; o++) {
var val = opts[o].value;
if (!val) {
if (uiPack && uiPack.filterAllCountries) opts[o].textContent = uiPack.filterAllCountries;
} else if (val !== 'undecided') {
var cName = getLocalizedCountryName(val, '', active);
opts[o].textContent = isCalc ? (cName + ' (USD)') : cName;
}
}
}
var procSelectIds = ['sb-filter-procedure', 'sb-calc-procedure'];
for (var ps = 0; ps < procSelectIds.length; ps++) {
var pSel = document.getElementById(procSelectIds[ps]);
if (!pSel) continue;
for (var po = 0; po < pSel.options.length; po++) {
var pVal = pSel.options[po].value;
if (!pVal) {
if (uiPack && uiPack.filterAllProcedures) pSel.options[po].textContent = uiPack.filterAllProcedures;
} else if (/^PROC-\d+$/i.test(pVal)) {
pSel.options[po].textContent = getLocalizedProcTitle(pVal, true, active);
}
}
}
var specSelectIds = ['sb-filter-specialty', 'sb-quote-treatment'];
for (var ss = 0; ss < specSelectIds.length; ss++) {
var sSel = document.getElementById(specSelectIds[ss]);
if (!sSel) continue;
var withCode = specSelectIds[ss] === 'sb-filter-specialty';
for (var so = 0; so < sSel.options.length; so++) {
var sVal = sSel.options[so].value;
if (!sVal) {
if (uiPack && uiPack.filterAllSpecialties) sSel.options[so].textContent = uiPack.filterAllSpecialties;
} else if (SPEC_SLUG_TO_IDX[sVal] !== undefined) {
sSel.options[so].textContent = getLocalizedSpecTitle(sVal, withCode, active);
}
}
}
var isHomeView = !window.location.pathname || window.location.pathname === '/' || window.location.pathname === '/index.html';
if (isHomeView && taxPack.seoTitle && document.body.getAttribute('data-view-type') !== 'post') {
document.title = taxPack.seoTitle;
}
if (isHomeView) {
var metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc && taxPack.seoDesc) metaDesc.setAttribute('content', taxPack.seoDesc);
var metaKw = document.getElementById('sb-meta-keywords') || document.querySelector('meta[name="keywords"]');
if (metaKw && taxPack.seoKeywords) metaKw.setAttribute('content', taxPack.seoKeywords);
var ogTitle = document.querySelector('meta[property="og:title"]');
if (ogTitle && taxPack.seoTitle) ogTitle.setAttribute('content', taxPack.seoTitle);
var ogDesc = document.querySelector('meta[property="og:description"]');
if (ogDesc && taxPack.seoDesc) ogDesc.setAttribute('content', taxPack.seoDesc);
}
var subSpecSel = document.getElementById('sb-filter-subspecialty');
if (subSpecSel) {
var subMap = {cabg:'PROC-01',pediatric:'PROC-02',transplant:'PROC-04',spine:'PROC-07',ivf:'PROC-09',arthroplasty:'PROC-05',oncology:'PROC-03',rhinoplasty:'PROC-13'};
for (var sbi = 0; sbi < subSpecSel.options.length; sbi++) {
var sbv = subSpecSel.options[sbi].value;
if (!sbv) {
if (uiPack && uiPack.filterAllSubSpecs) subSpecSel.options[sbi].textContent = uiPack.filterAllSubSpecs;
} else if (subMap[sbv]) {
subSpecSel.options[sbi].textContent = getLocalizedProcTitle(subMap[sbv], false, active);
}
}
}
var expSel = document.getElementById('sb-filter-min-exp');
if (expSel) {
var yrsTxt = (uiPack && uiPack.cardYrsExp) ? uiPack.cardYrsExp : '+ yrs';
for (var exi = 0; exi < expSel.options.length; exi++) {
var exv = expSel.options[exi].value;
if (!exv) {
if (uiPack && uiPack.filterAnyExp) expSel.options[exi].textContent = uiPack.filterAnyExp;
} else {
expSel.options[exi].textContent = exv + yrsTxt;
}
}
}
var docLangSel = document.getElementById('sb-filter-doc-lang');
if (docLangSel) {
for (var dli = 0; dli < docLangSel.options.length; dli++) {
var dlv = docLangSel.options[dli].value;
if (!dlv) {
if (uiPack && uiPack.filterAnyLang) docLangSel.options[dli].textContent = uiPack.filterAnyLang;
} else {
docLangSel.options[dli].textContent = localizeSpokenLanguageName(dlv, active);
}
}
}
var feeSel = document.getElementById('sb-filter-max-fee');
if (feeSel) {
for (var fei = 0; fei < feeSel.options.length; fei++) {
var fev = feeSel.options[fei].value;
if (!fev) {
if (uiPack && uiPack.filterAnyFee) feeSel.options[fei].textContent = uiPack.filterAnyFee;
} else {
feeSel.options[fei].textContent = '≤ $' + fev + ' USD';
}
}
}
var prcSel = document.getElementById('sb-filter-price');
if (prcSel) {
for (var pri = 0; pri < prcSel.options.length; pri++) {
var prv = prcSel.options[pri].value;
if (!prv) {
if (uiPack && uiPack.filterAnyBudget) prcSel.options[pri].textContent = uiPack.filterAnyBudget;
} else {
prcSel.options[pri].textContent = '≤ $' + Number(prv).toLocaleString('en-US') + ' USD';
}
}
}
var provTypeSel = document.getElementById('sb-filter-provider-type');
if (provTypeSel && uiPack) {
if (provTypeSel.options[0] && uiPack.filterAllProviderTypes) provTypeSel.options[0].textContent = uiPack.filterAllProviderTypes;
if (provTypeSel.options[1] && uiPack.optProvHospital) provTypeSel.options[1].textContent = uiPack.optProvHospital;
if (provTypeSel.options[2] && uiPack.optProvAcademic) provTypeSel.options[2].textContent = uiPack.optProvAcademic;
if (provTypeSel.options[3] && uiPack.optProvClinic) provTypeSel.options[3].textContent = uiPack.optProvClinic;
}
var destPills = document.querySelectorAll('.sb-dest-pill[data-country]');
for (var dpi = 0; dpi < destPills.length; dpi++) {
var dpCountry = destPills[dpi].getAttribute('data-country');
if (!dpCountry) {
if (uiPack && uiPack.filterAllCountries) destPills[dpi].textContent = uiPack.filterAllCountries;
} else {
destPills[dpi].textContent = getLocalizedCountryName(dpCountry, '', active);
}
}
var ftfSel = document.getElementById('sb-filter-fit-to-fly');
if (ftfSel) {
for (var fti = 0; fti < ftfSel.options.length; fti++) {
var ftv = ftfSel.options[fti].value;
if (!ftv) {
if (uiPack && uiPack.filterAnyTimeline) ftfSel.options[fti].textContent = uiPack.filterAnyTimeline;
} else {
ftfSel.options[fti].textContent = '≤ ' + ftv + 'd';
}
}
}
for (var h = 0; h < CATALOGUE_HOSPITALS.length; h++) {
var hosp = CATALOGUE_HOSPITALS[h];
var locCountry = getLocalizedCountryName(hosp.country, hosp.country_code, active);
var cityStr = (hosp.city_name && hosp.city_name.en) || hosp.city;
var iataSuffix = hosp.nearest_international_airport_code ? (' (' + hosp.nearest_international_airport_code + ')') : '';
if (typeof hosp.country_name !== 'object' || !hosp.country_name) hosp.country_name = { en: locCountry };
if (typeof hosp.locationLabel !== 'object' || !hosp.locationLabel) hosp.locationLabel = { en: cityStr + ', ' + locCountry + iataSuffix };
if (typeof hosp.original_overview !== 'object' || !hosp.original_overview) hosp.original_overview = { en: String(hosp.original_overview || '') };
if (typeof hosp.summary !== 'object' || !hosp.summary) hosp.summary = { en: String(hosp.summary || '') };
if (typeof hosp.partner_recovery_hotels !== 'object' || !hosp.partner_recovery_hotels) hosp.partner_recovery_hotels = { en: String(hosp.partner_recovery_hotels || '') };
hosp.country_name[active] = locCountry;
hosp.locationLabel[active] = cityStr + ', ' + locCountry + iataSuffix;
if (base !== 'en' && base !== 'ar') {
var accClean = (hosp.accreditations || []).map(function(x){ return x.replace(/^acc-/, '').toUpperCase(); }).join(', ') || 'JCI';
var facTitle = (hosp.facility_name && hosp.facility_name.en) || hosp.title || hosp.id;
var ov = taxPack.hospTpl
? taxPack.hospTpl.replace('{name}', facTitle).replace('{city}', cityStr).replace('{country}', locCountry).replace('{beds}', String(hosp.beds_reported || 250)).replace('{icu}', String(hosp.icu_reported || 30)).replace('{acc}', accClean)
: (facTitle + ' (' + cityStr + ', ' + locCountry + ') — ' + ((uiPack && uiPack.typeHospital) || 'Hospital') + ' (' + accClean + ') · ' + String(hosp.beds_reported || 250) + ' ' + ((uiPack && uiPack.cardBedsLabel) || 'beds') + ', ' + String(hosp.icu_reported || 30) + ' ' + ((uiPack && uiPack.cardIcuLabel) || 'ICU') + ' · ' + ((uiPack && uiPack.cardInterpreterFlag) || 'Interpreter') + ' · ' + ((uiPack && uiPack.cardPickupFlag) || 'Airport Pickup') + '.');
hosp.original_overview[active] = ov;
hosp.summary[active] = ov;
var rawHotel = hosp.partner_recovery_hotels.en || '';
hosp.partner_recovery_hotels[active] = rawHotel.replace(/\/night,\s*wheelchair shuttle\s*&\s*hospital rate/gi, '/d · ' + ((uiPack && uiPack.cardPickupFlag) || 'Transfer')).replace(/Partner Hotel & Recovery Wing/gi, '').replace(/Medical Suites & Serviced Apartments/gi, '').replace(/\/night/gi, '/d').trim();
}
}
for (var d = 0; d < CATALOGUE_DOCTORS.length; d++) {
var doc = CATALOGUE_DOCTORS[d];
doc.procedures_performed_count = String(doc.procedures_performed_count || '1,500+').replace(/\s*procedures\b/i, '').trim();
if (typeof doc.primary_specialty !== 'object' || !doc.primary_specialty) doc.primary_specialty = { en: String(doc.primary_specialty || '') };
if (typeof doc.clinical_focus_and_bio !== 'object' || !doc.clinical_focus_and_bio) doc.clinical_focus_and_bio = { en: String(doc.clinical_focus_and_bio || '') };
if (typeof doc.sub_specialties !== 'object' || !doc.sub_specialties) doc.sub_specialties = { en: String(doc.sub_specialties || '') };
if (typeof doc.education_and_qualifications !== 'object' || !doc.education_and_qualifications) doc.education_and_qualifications = { en: String(doc.education_and_qualifications || '') };
if (typeof doc.awards_and_honors !== 'object' || !doc.awards_and_honors) doc.awards_and_honors = { en: String(doc.awards_and_honors || '') };
var locSpec = getLocalizedSpecTitle(doc.specialty_code, true, active);
var locSpecPlain = getLocalizedSpecTitle(doc.specialty_code, false, active);
doc.primary_specialty[active] = locSpec;
if (base !== 'en' && base !== 'ar') {
var hospNameEn = (doc.primary_facility_name && doc.primary_facility_name.en) || doc.primary_facility_id || '';
doc.clinical_focus_and_bio[active] = taxPack.docTpl
? taxPack.docTpl.replace('{spec}', locSpecPlain).replace('{hosp}', hospNameEn).replace('{exp}', String(doc.years_of_experience || 18)).replace('{procs}', doc.procedures_performed_count)
: (locSpecPlain + ' — ' + hospNameEn + ' (' + String(doc.years_of_experience || 18) + ((uiPack && uiPack.cardYrsExp) || '+ yrs') + ' · ' + doc.procedures_performed_count + ').');
var spIdx = SPEC_CODE_ORDER.indexOf(String(doc.specialty_code || '').toUpperCase());
if (spIdx < 0) spIdx = 0;
var p1Code = 'PROC-' + (spIdx * 2 + 1 < 10 ? '0' : '') + (spIdx * 2 + 1);
var p2Code = 'PROC-' + (spIdx * 2 + 2 < 10 ? '0' : '') + (spIdx * 2 + 2);
doc.sub_specialties[active] = locSpecPlain + ' · ' + getLocalizedProcTitle(p1Code, false, active) + ' · ' + getLocalizedProcTitle(p2Code, false, active);
var instName = String(doc.education_and_qualifications.en || '').split(' / ')[0].trim();
doc.education_and_qualifications[active] = (instName ? instName + ' · ' : '') + 'MD / PhD / FRCS / FACS (' + locSpecPlain + ')';
doc.awards_and_honors[active] = 'FRCS / FACS · ' + locSpecPlain + ' (' + String(doc.years_of_experience || 18) + ((uiPack && uiPack.cardYrsExp) || '+ yrs') + ')';
}
}
for (var c = 0; c < CATALOGUE_COSTS.length; c++) {
var cost = CATALOGUE_COSTS[c];
if (typeof cost.procedure_name !== 'object' || !cost.procedure_name) cost.procedure_name = { en: String(cost.procedure_name || '') };
if (typeof cost.specialty_category !== 'object' || !cost.specialty_category) cost.specialty_category = { en: String(cost.specialty_category || '') };
if (typeof cost.package_inclusions !== 'object' || !cost.package_inclusions) cost.package_inclusions = { en: String(cost.package_inclusions || '') };
cost.procedure_name[active] = getLocalizedProcTitle(cost.procedure_code, false, active);
cost.specialty_category[active] = getLocalizedSpecTitle(cost.specialty_code, true, active);
if (base !== 'en' && base !== 'ar') {
cost.package_inclusions[active] = taxPack.pkgTpl
? taxPack.pkgTpl.replace('{hospDays}', String(cost.hospital_stay_days || 5)).replace('{recovDays}', String(cost.mandatory_local_recovery_days || 7))
: (((uiPack && uiPack.cardHospStay) || 'Hospital: ') + String(cost.hospital_stay_days || 5) + 'd · ' + ((uiPack && uiPack.cardLocalRecovery) || 'Recovery: ') + String(cost.mandatory_local_recovery_days || 7) + 'd · ' + ((uiPack && uiPack.cardPickupFlag) || 'Airport Transfer'));
}
}
}
function findLanguageMeta(code) {
if (!code) return null;
var norm = String(code).trim();
var lower = norm.toLowerCase();
for (var i = 0; i < GLOBAL_REGIONS.length; i++) {
var list = GLOBAL_REGIONS[i].languages;
for (var j = 0; j < list.length; j++) {
if (list[j].code.toLowerCase() === lower) {
return list[j];
}
}
}
var canonical = CANONICAL_REGION_CODE[lower] || lower.split('-')[0];
for (var r = 0; r < GLOBAL_REGIONS.length; r++) {
var rList = GLOBAL_REGIONS[r].languages;
for (var k = 0; k < rList.length; k++) {
var itemCode = rList[k].code.toLowerCase();
if (itemCode === canonical.toLowerCase() || itemCode.split('-')[0] === lower.split('-')[0]) {
return {
code: norm,
name: rList[k].name,
native: rList[k].native.replace(/\s*\([^)]*\)$/, ''),
countries: rList[k].countries,
dir: rList[k].dir
};
}
}
}
return null;
}
function getLang() {
var htmlLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
if (htmlLang.indexOf('ar') === 0 || document.documentElement.getAttribute('dir') === 'rtl') {
return 'ar';
}
return 'en';
}
function getActivePack() {
var code = (state && state.activeLangCode) || document.documentElement.getAttribute('lang') || 'en';
var baseKey = resolveBaseLangKey(code);
return PAGE_TRANSLATIONS[code] || PAGE_TRANSLATIONS[baseKey] || PAGE_TRANSLATIONS[getLang()] || PAGE_TRANSLATIONS.en;
}
function t(key) {
var pack = getActivePack();
if (pack && pack[key]) return pack[key];
var lang = getLang();
return (UI_TEXT[lang] && UI_TEXT[lang][key]) || UI_TEXT.en[key] || key;
}
function pickLocalized(val, lang) {
if (val === null || val === undefined) return '';
if (typeof val === 'string' || typeof val === 'number') return String(val);
var activeCode = (state && state.activeLangCode) || document.documentElement.getAttribute('lang') || lang || 'en';
var baseKey = resolveBaseLangKey(activeCode);
var isRtl = !!(RTL_LANGS[activeCode] || RTL_LANGS[baseKey] || document.documentElement.getAttribute('dir') === 'rtl');
if (val[activeCode]) return val[activeCode];
if (val[baseKey]) return val[baseKey];
if (isRtl && val.ar) return val.ar;
var l = lang || getLang();
return val[l] || val.en || val.ar || '';
}
var FACET_TO_I18N_KEY = {
'c-india': 'optCountryIndia',
'c-turkey': 'optCountryTurkey',
'c-thailand': 'optCountryThailand',
'c-uae': 'optCountryUae',
'c-germany': 'optCountryGermany',
'c-china': 'optCountryChina',
'city-gurugram': 'optCityGurugram',
'city-bengaluru': 'optCityBengaluru',
'city-istanbul': 'optCityIstanbul',
'city-bangkok': 'optCityBangkok',
'city-abu-dhabi': 'optCityAbuDhabi',
'city-dubai': 'optCityDubai',
'city-berlin': 'optCityBerlin',
'city-beijing': 'optCityBeijing',
'acc-jci': 'optAccJci',
'acc-nabh': 'optAccNabh',
'acc-iso': 'optAccIso',
'acc-temos': 'optAccTemos',
'acc-achs': 'optAccAchs',
'acc-cbahi': 'optAccCbahi',
'acc-efqm': 'optAccEfqm',
'acc-grade-a': 'optAccGradeA',
'sp-cardiology': 'optSpecCardiology',
'sp-oncology': 'optSpecOncology',
'sp-neurosurgery': 'optSpecNeurosurgery',
'sp-orthopedics': 'optSpecOrthopedics',
'sp-ivf': 'optSpecIvf',
'sp-cosmetic': 'optSpecCosmetic',
'sp-transplants': 'optSpecTransplants',
'svc-arabic-interpreters': 'optSvcInterpreters',
'svc-arabic-coordinators': 'optSvcCoordinators',
'svc-halal-dining': 'optSvcHalal',
'svc-prayer-room': 'optSvcPrayer',
'svc-family-accommodation': 'optSvcFamily'
};
function translateFacet(rawLabel, overrideLangCode) {
if (!rawLabel) return null;
var clean = String(rawLabel).trim();
if (/^(t-|alt-|lang-|rev-|id-|hub-)/.test(clean)) {
return null;
}
var effLang = overrideLangCode || (state && state.activeLangCode) || getLang();
var effBase = resolveBaseLangKey(effLang);
if (clean === 'ver-sourced') {
if (overrideLangCode) {
var oPack = PAGE_TRANSLATIONS[effLang] || PAGE_TRANSLATIONS[effBase] || PAGE_TRANSLATIONS.en;
return (oPack && oPack.verSourced) || t('verSourced');
}
return t('verSourced');
}
if (clean.indexOf('c-') === 0) {
return getLocalizedCountryName(clean.slice(2), '', effLang);
}
if (clean.indexOf('sp-') === 0) {
var spSlug = clean.slice(3);
if (SPEC_SLUG_TO_IDX[spSlug] !== undefined) {
return getLocalizedSpecTitle(spSlug, false, effLang);
}
}
var mappedI18n = FACET_TO_I18N_KEY[clean];
if (mappedI18n) {
if (overrideLangCode) {
var pck = PAGE_TRANSLATIONS[effLang] || PAGE_TRANSLATIONS[effBase] || PAGE_TRANSLATIONS.en;
if (pck && pck[mappedI18n]) return pck[mappedI18n];
} else {
var fromPack = t(mappedI18n);
if (fromPack && fromPack !== mappedI18n) return fromPack;
}
}
var dict = FACET_MAP[effBase] || FACET_MAP[getLang()] || FACET_MAP.en;
if (dict[clean]) return dict[clean];
if (FACET_MAP.en[clean]) return FACET_MAP.en[clean];
return clean;
}
var LIVE_HOSPITAL_POST_MAP = {"TZ-AE-0001": "/2026/11/cleveland-clinic-abu-dhabi-abu-dhabi.html", "TZ-AE-0002": "/2026/11/sheikh-shakhbout-medical-city.html", "TZ-BH-0001": "/2026/11/king-hamad-university-hospital.html", "TZ-BH-0002": "/2026/11/bahrain-specialist-hospital.html", "TZ-BY-0001": "/2026/11/minsk-scientific-practical-center-for.html", "TZ-BY-0002": "/2026/11/nn-aleksandrov-republican-scientific.html", "TZ-CN-0001": "/2026/11/peking-union-medical-college-hospital.html", "TZ-CN-0002": "/2026/11/fuwai-hospital-cams-international.html", "TZ-CO-0001": "/2026/11/fundacion-santa-fe-de-bogota-central.html", "TZ-CO-0002": "/2026/11/fundacion-santa-fe-de-bogota-instituto.html", "TZ-CO-MD-0001": "/2026/11/clinica-medellin-sede-el-poblado.html", "TZ-CO-MD-0002": "/2026/11/clinica-las-vegas-international-patient.html", "TZ-CR-0001": "/2026/11/hospital-cima-san-jose-international.html", "TZ-CR-0002": "/2026/11/hospital-clinica-biblica-sede-central.html", "TZ-CY-0001": "/2026/11/archbishop-makarios-iii-hospital.html", "TZ-CY-0002": "/2026/11/aretaeio-medical-center-international.html", "TZ-DE-0001": "/2026/11/charite-universitatsmedizin-berlin.html", "TZ-DE-0002": "/2026/11/charite-campus-benjamin-franklin.html", "TZ-DK-0001": "/2026/11/rigshospitalet-blegdamsvej-quaternary.html", "TZ-DK-0002": "/2026/11/rigshospitalet-finsen-center-for-cancer.html", "TZ-DO-0001": "/2026/11/cedimat-centro-de-diagnostico-medicina.html", "TZ-DO-0002": "/2026/11/cedimat-centro-cardiovascular.html", "TZ-EG-0001": "/2026/11/as-salam-international-hospital-maadi.html", "TZ-EG-0002": "/2026/11/as-salam-international-hospital-new.html", "TZ-ES-0001": "/2026/11/hospital-general-universitario-gregorio.html", "TZ-ES-0002": "/2026/11/hospital-infantil-universitario-nino.html", "TZ-HR-0001": "/2026/11/kbc-zagreb-salata-campus-international.html", "TZ-HR-0002": "/2026/11/kbc-zagreb-draskoviceva-traumatology.html", "TZ-IN-0001": "/2026/11/indraprastha-apollo-hospitals-new-delhi.html", "TZ-IN-0002": "/2026/11/max-super-speciality-hospital-saket-jci.html", "TZ-JO-0001": "/2026/11/king-hussein-cancer-center.html", "TZ-JO-0002": "/2026/11/abdali-medical-center-international.html", "TZ-KR-0001": "/2026/11/asan-medical-center-international.html", "TZ-KR-0002": "/2026/11/samsung-medical-center-international.html", "TZ-KR-GN-0001": "/2026/11/jk-plastic-surgery-hospital.html", "TZ-KR-GN-0002": "/2026/11/gng-hospital-apgujeong-international.html", "TZ-KW-0001": "/2026/11/dar-al-shifa-hospital-international.html", "TZ-KW-0002": "/2026/11/royale-hayat-hospital-international.html", "TZ-MA-0001": "/2026/11/hopital-universitaire-international.html", "TZ-MA-0002": "/2026/11/hopital-universitaire-international_01370343880.html", "TZ-MX-0001": "/2026/11/medica-sur-international-patient-desk.html", "TZ-MX-0002": "/2026/11/centro-medico-abc-campus-observatorio.html", "TZ-MX-TJ-0001": "/2026/11/hospital-angeles-tijuana-international.html", "TZ-MX-TJ-0002": "/2026/11/simnsa-health-plan-hospital-hospital.html", "TZ-MY-0001": "/2026/11/gleneagles-hospital-kuala-lumpur.html", "TZ-MY-0002": "/2026/11/pantai-hospital-kuala-lumpur.html", "TZ-OM-0001": "/2026/11/muscat-private-hospital-international.html", "TZ-OM-0002": "/2026/11/aster-royal-hospital-al-ghubra.html", "TZ-RU-0001": "/2026/11/burdenko-national-medical-research.html", "TZ-RU-0002": "/2026/11/national-medical-research-center-of.html", "TZ-SA-0001": "/2026/11/king-faisal-specialist-hospital.html", "TZ-SA-0002": "/2026/11/dr-sulaiman-al-habib-hospital-al-olaya.html", "TZ-SG-0001": "/2026/11/mount-elizabeth-hospital-orchard.html", "TZ-SG-0002": "/2026/11/mount-elizabeth-novena-hospital.html", "TZ-TH-0001": "/2026/11/bumrungrad-international-hospital.html", "TZ-TH-0002": "/2026/11/bangkok-hospital-headquarter.html"};
var VERIFIED_TRANSLATED_POST_CLUSTERS = [];
var BRANDED_DEFAULT_SHARE_IMAGE = 'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/media/magazines/edition-01-card.webp';
function hasLiveProfilePost(item) {
if (!item) return false;
var fid = String(item.facility_id || item.id || '').trim();
return Boolean(fid && LIVE_HOSPITAL_POST_MAP[fid]);
}
function resolveItemUrl(item) {
var isPreview = document.body.getAttribute('data-preview-mode') === 'true';
if (isPreview) {
return getLang() === 'ar' ? (item.urlAr || 'hospital-ar.html') : (item.urlEn || 'hospital.html');
}
if (!item) return '/p/hospitals-directory.html';
var fid = String(item.facility_id || item.id || '').trim();
if (fid && LIVE_HOSPITAL_POST_MAP[fid]) {
return LIVE_HOSPITAL_POST_MAP[fid];
}
var cSlug = String(item.country || 'india').toLowerCase();
return '/p/hospitals-directory.html?country=' + encodeURIComponent(cSlug) + (fid ? ('#' + encodeURIComponent(fid)) : '');
}
function formatMoney(usdAmount, currencyCode) {
var code = currencyCode || 'USD';
var cfg = CURRENCY_RATES[code] || CURRENCY_RATES.USD;
var converted = Math.round((Number(usdAmount) || 0) * cfg.rate);
return cfg.symbol + converted.toLocaleString('en-US');
}
function loadIds(key) {
try {
var raw = localStorage.getItem(key);
if (!raw) return [];
var parsed = JSON.parse(raw);
return Array.isArray(parsed) ? parsed : [];
} catch (e) {
return [];
}
}
function saveIds(key, list) {
try {
localStorage.setItem(key, JSON.stringify(list));
} catch (e) {}
}
var state = {
hub:'hospitals',query:'',scope:'all',providerType:'',specialty:'',subSpecialty:'',procedureCode:'',destination:'',city:'',accreditation:'',arabCare:'',logistics:'',
minExperience: 0,
spokenLang:'',
maxConsultFee: 0,
maxPrice: 0,
maxFitToFly: 0,
facilityFilter:'',doctorFilter:'',procFilter:'',currency:'USD',
visibleLimit: 24,
shortlist: loadIds(STORAGE_SHORTLIST),
compare: loadIds(STORAGE_COMPARE),
lastFocusedElement: null,
activeLangCode:'en',detectedLangCode:'en',detectedCountry:'',
datasets: {
hospitals: CATALOGUE_HOSPITALS.slice(),
doctors: CATALOGUE_DOCTORS.slice(),
costs: CATALOGUE_COSTS.slice()
}
};
function normalizeExternalRecords(hub, rawList) {
if (!Array.isArray(rawList)) return [];
return rawList.map(function (r, idx) {
var item = Object.assign({}, r);
if (hub === 'hospitals') {
item.facility_id = item.facility_id || item.id || ('TZ-EXT-' + (idx + 1));
item.id = item.id || item.facility_id;
item.country = (item.country || item.country_name || 'india').toString().toLowerCase();
item.city = (item.city || item.city_name || '').toString().toLowerCase().replace(/\s+/g, '-');
item.scope = item.scope || (item.country === 'uae' ? 'domestic' : 'international');
if (typeof item.accreditation_body === 'string') {
item.accreditation_body = item.accreditation_body.split(/[,;|]/).map(function (s) { return s.trim(); }).filter(Boolean);
}
item.accreditation_body = item.accreditation_body || ['JCI'];
if (typeof item.spoken_languages === 'string') {
item.spoken_languages = item.spoken_languages.split(/[,;|]/).map(function (s) { return s.trim(); }).filter(Boolean);
}
item.spoken_languages = item.spoken_languages || ['English', 'Arabic'];
var BH_ACC_FIX = {'TZ-BH-0003':['acc-nhra','acc-iso'],'TZ-BH-0004':['acc-achs','acc-iso'],'TZ-BH-0005':['acc-iso'],'TZ-BH-0007':['acc-iso'],'TZ-BH-0008':['acc-iso'],'TZ-BH-0009':['acc-iso'],'TZ-BH-0010':['acc-iso'],'TZ-CN-0009':['acc-iso']};
item.accreditations = BH_ACC_FIX[item.facility_id] || item.accreditations || ['acc-jci'];
item.specialties = item.specialties || ['sp-cardiology'];
item.arabCare = item.arabCare || ['svc-arabic-interpreters'];
item.minPriceUsd = Number(item.minPriceUsd || item.price_low_usd || 5000);
item.maxPriceUsd = Number(item.maxPriceUsd || item.price_high_complex_usd || 15000);
item.priceDated = item.priceDated !== undefined ? !!item.priceDated : true;
item.sourceDate = item.sourceDate || '2025-02';
item.lastReviewed = item.lastReviewed || '2025-02-15';
item.verificationStatus = item.verificationStatus || 'ver-sourced';
item.hasLiveProfile = hasLiveProfilePost(item);
item.bloggerUrl = resolveItemUrl(item);
} else if (hub === 'doctors') {
item.doctor_id = item.doctor_id || item.id || ('DOC-EXT-' + (idx + 1));
item.id = item.id || item.doctor_id;
item.country = (item.country || 'india').toString().toLowerCase();
item.city = (item.city || '').toString().toLowerCase().replace(/\s+/g, '-');
item.scope = item.scope || (item.country === 'uae' ? 'domestic' : 'international');
item.years_of_experience = Number(item.years_of_experience) || 15;
item.consultation_fee_usd = Number(item.consultation_fee_usd) || 35;
if (typeof item.spoken_languages === 'string') {
item.spoken_languages = item.spoken_languages.split(/[,;|]/).map(function (s) { return s.trim(); }).filter(Boolean);
}
item.spoken_languages = item.spoken_languages || ['English'];
item.lastReviewed = item.lastReviewed || '2025-02-15';
item.verificationStatus = item.verificationStatus || 'ver-sourced';
} else if (hub === 'costs') {
item.cost_id = item.cost_id || item.id || ('COST-EXT-' + (idx + 1));
item.id = item.id || item.cost_id;
item.country = (item.country || 'india').toString().toLowerCase();
item.city = (item.city || '').toString().toLowerCase().replace(/\s+/g, '-');
item.scope = item.scope || (item.country === 'uae' ? 'domestic' : 'international');
item.price_low_usd = Number(item.price_low_usd) || 4500;
item.price_avg_package_usd = Number(item.price_avg_package_usd) || 6500;
item.price_high_complex_usd = Number(item.price_high_complex_usd) || 9000;
item.us_benchmark_price_usd = Number(item.us_benchmark_price_usd) || 55000;
item.estimated_savings_usd = Number(item.estimated_savings_usd) || (item.us_benchmark_price_usd - item.price_avg_package_usd);
item.estimated_savings_pct = Number(item.estimated_savings_pct) || Math.round((item.estimated_savings_usd / item.us_benchmark_price_usd) * 100);
item.hospital_stay_days = Number(item.hospital_stay_days) || 5;
item.mandatory_local_recovery_days = Number(item.mandatory_local_recovery_days) || 7;
item.fit_to_fly_clearance_days = Number(item.fit_to_fly_clearance_days) || (item.hospital_stay_days + item.mandatory_local_recovery_days);
item.priceDated = item.priceDated !== undefined ? !!item.priceDated : true;
item.sourceDate = item.sourceDate || '2025-02';
item.lastReviewed = item.lastReviewed || '2025-02-15';
item.verificationStatus = item.verificationStatus || 'ver-sourced';
}
return item;
});
}
function loadExternalHubJson(hub, url) {
if (!url || typeof window.fetch !== 'function') return Promise.resolve(state.datasets[hub]);
var cacheKey = SESSION_JSON_PREFIX + hub + '_' + url;
try {
var cached = sessionStorage.getItem(cacheKey);
if (cached) {
var parsed = JSON.parse(cached);
if (Array.isArray(parsed) && parsed.length > 0) {
state.datasets[hub] = normalizeExternalRecords(hub, parsed);
if (hub === 'hospitals') { CATALOGUE_HOSPITALS = state.datasets.hospitals; CATALOGUE_LISTINGS = state.datasets.hospitals; enrichHospitalPageSeoAndSchema(); } else if (hub === 'doctors') { CATALOGUE_DOCTORS = state.datasets.doctors; } else if (hub === 'costs') { CATALOGUE_COSTS = state.datasets.costs; }
refreshMultilingualSelectsAndData(state.activeLangCode);
renderDirectoryCards();
return Promise.resolve(state.datasets[hub]);
}
}
} catch (e) {}
return window.fetch(url, { credentials: 'omit' })
.then(function (res) {
if (!res.ok) throw new Error('HTTP ' + res.status);
return res.json();
})
.then(function (data) {
var list = Array.isArray(data) ? data : (data && Array.isArray(data.items || data.records || data.data) ? (data.items || data.records || data.data) : []);
if (list.length > 0) {
try { sessionStorage.setItem(cacheKey, JSON.stringify(list)); } catch (e) {}
state.datasets[hub] = normalizeExternalRecords(hub, list);
if (hub === 'hospitals') { CATALOGUE_HOSPITALS = state.datasets.hospitals; CATALOGUE_LISTINGS = state.datasets.hospitals; enrichHospitalPageSeoAndSchema(); } else if (hub === 'doctors') { CATALOGUE_DOCTORS = state.datasets.doctors; } else if (hub === 'costs') { CATALOGUE_COSTS = state.datasets.costs; }
refreshMultilingualSelectsAndData(state.activeLangCode);
renderDirectoryCards();
}
return state.datasets[hub];
})
.catch(function () {
return state.datasets[hub];
});
}
function detectVisitorLanguageAndCountry() {
var tz = '';
try {
tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
} catch (e) {}
var tzEntry = TIMEZONE_COUNTRY_MAP[tz] || null;
var navLangs = [];
if (navigator.languages && navigator.languages.length) {
navLangs = Array.prototype.slice.call(navigator.languages);
} else if (navigator.language) {
navLangs = [navigator.language];
}
var detectedCode = '';
for (var i = 0; i < navLangs.length; i++) {
var raw = String(navLangs[i] || '').trim();
if (!raw) continue;
var meta = findLanguageMeta(raw);
if (meta) {
detectedCode = meta.code;
break;
}
}
if (!detectedCode && tzEntry && tzEntry.code) {
detectedCode = tzEntry.code;
}
if (!detectedCode) detectedCode = 'en-GB';
state.detectedLangCode = detectedCode;
state.detectedCountry = tzEntry ? tzEntry.country : '';
return { code: detectedCode, country: state.detectedCountry };
}
function findVerifiedTranslatedCluster(fullUrlOrPath) {
var target = String(fullUrlOrPath || '').trim();
if (!target) return null;
var fullTarget = target.indexOf('http') === 0 ? target : ('https://www.thesecretarybird.com' + (target.charAt(0) === '/' ? target : '/' + target));
for (var i = 0; i < VERIFIED_TRANSLATED_POST_CLUSTERS.length; i++) {
var cl = VERIFIED_TRANSLATED_POST_CLUSTERS[i];
var alts = cl.alternates || {};
for (var k in alts) {
if (Object.prototype.hasOwnProperty.call(alts, k) && alts[k] === fullTarget) {
return { cluster: cl, lang: k, url: fullTarget };
}
}
}
return null;
}
function syncCanonicalAndHreflang() {
try {
var path = (window.location && window.location.pathname) ? window.location.pathname : '/';
var cleanPath = (path === '/index.html' || !path) ? '/' : path.replace(/\/+$/, '');
if (cleanPath === '') cleanPath = '/';
var baseCleanUrl = 'https://www.thesecretarybird.com' + cleanPath;
var canEl = document.getElementById('sb-canonical-link') || document.querySelector('link[rel="canonical"]');
var ogUrlEl = document.getElementById('sb-og-url') || document.querySelector('meta[property="og:url"]');
if (canEl) canEl.setAttribute('href', baseCleanUrl);
if (ogUrlEl) ogUrlEl.setAttribute('content', baseCleanUrl);
return baseCleanUrl;
} catch (e) {
return '';
}
}
function detectDedicatedPostLanguage() {
try {
var langChip = document.querySelector('.sb-post-article .sb-chip[data-sb-facet-chip^="lang-"]');
var artEl = document.querySelector('.sb-post-article');
if (langChip && artEl) {
var chipCode = String(langChip.getAttribute('data-sb-facet-chip') || '').slice(5);
if (chipCode === 'fr-AF') chipCode = 'fr';
if (chipCode) {
artEl.setAttribute('lang', chipCode);
artEl.setAttribute('dir', (chipCode === 'ar' || chipCode === 'fa' || chipCode === 'ckb') ? 'rtl' : 'ltr');
}
}
artEl = document.querySelector('.sb-post-article[lang]');
if (artEl) {
var aLang = String(artEl.getAttribute('lang') || '').trim();
if (aLang && aLang !== 'en') return aLang;
var h1El = artEl.querySelector('.sb-post-title');
if (h1El && /[\u0600-\u06FF]/.test(h1El.textContent || '')) {
artEl.setAttribute('lang', 'ar');
artEl.setAttribute('dir', 'rtl');
return 'ar';
}
}
return '';
} catch (e) {
return '';
}
}
function tidyProfileFieldsAndReviewDate() {
try {
var art = document.querySelector('.sb-post-article');
if (!art) return;
var walker = document.createTreeWalker(art, NodeFilter.SHOW_TEXT, null, false);
var tn, fixNodes = [];
while ((tn = walker.nextNode())) { if (/\s*[—-]\s*Est\.\s*\)|\(\s*\)/.test(tn.nodeValue)) fixNodes.push(tn); }
for (var fi = 0; fi < fixNodes.length; fi++) fixNodes[fi].nodeValue = fixNodes[fi].nodeValue.replace(/\s*[—-]\s*Est\.\s*\)/, ')').replace(/\s*\(\s*\)/g, '');
var items = art.querySelectorAll('li');
for (var li = items.length - 1; li >= 0; li--) {
var txt = (items[li].textContent || '').replace(/\s+/g, ' ').trim();
if (!txt) continue;
var colon = txt.indexOf(':');
if (colon > 0 && colon < 80) {
var rest = txt.slice(colon + 1).trim();
var segs = rest.split('|').map(function (x) { return x.trim(); });
var allEmpty = !rest || segs.every(function (x) { return !x || /^[^:]{1,40}:\s*$/.test(x); });
if (allEmpty) items[li].parentNode.removeChild(items[li]);
}
}
var reviewIso = '';
var timeEl = art.querySelector('time[datetime]');
if (timeEl && /^\d{4}-\d{2}-\d{2}/.test(timeEl.getAttribute('datetime'))) reviewIso = timeEl.getAttribute('datetime').slice(0, 10);
if (!reviewIso) {
var rm = (art.textContent || '').match(/(?:Last reviewed|Reviewed|آخر مراجعة)[^0-9]{0,20}(\d{4}-\d{2}-\d{2})/i);
if (rm) reviewIso = rm[1];
}
if (!reviewIso) return;
var schemaEl = document.getElementById('sb-schema-jsonld');
if (!schemaEl) return;
var graphObj = JSON.parse(schemaEl.textContent || '{}');
if (!graphObj || !Array.isArray(graphObj['@graph'])) return;
for (var gi = 0; gi < graphObj['@graph'].length; gi++) {
if (graphObj['@graph'][gi] && graphObj['@graph'][gi]['@type'] === 'MedicalWebPage') graphObj['@graph'][gi].lastReviewed = reviewIso;
}
schemaEl.textContent = JSON.stringify(graphObj);
} catch (e) {}
}
function enrichHospitalPageSeoAndSchema() {
try {
var path = (window.location && window.location.pathname) ? window.location.pathname : '/';
if (!/^\/\d{4}\/\d{2}\//.test(path)) return null;
var matchedHosp = null;
var list = (state && state.datasets && state.datasets.hospitals && state.datasets.hospitals.length) ? state.datasets.hospitals : CATALOGUE_HOSPITALS;
for (var i = 0; i < list.length; i++) {
var h = list[i];
var fid = h.facility_id || h.id;
if (LIVE_HOSPITAL_POST_MAP[fid] === path || h.bloggerUrl === path || (h.bloggerUrl && h.bloggerUrl.indexOf(path) !== -1)) {
matchedHosp = h;
break;
}
}
if (!matchedHosp && path === '/2026/11/cleveland-clinic-abu-dhabi.html') {
for (var j = 0; j < list.length; j++) {
if ((list[j].facility_id || list[j].id) === 'TZ-AE-0001') { matchedHosp = list[j]; break; }
}
}
if (!matchedHosp) {
var facCodes = document.querySelectorAll('.sb-post-article code');
for (var fc = 0; fc < facCodes.length && !matchedHosp; fc++) {
var facIdTxt = (facCodes[fc].textContent || '').trim();
if (!/^TZ-[A-Z]{2}(-[A-Z]{2})?-\d{4}$/.test(facIdTxt)) continue;
for (var fl = 0; fl < list.length; fl++) {
if ((list[fl].facility_id || list[fl].id) === facIdTxt) { matchedHosp = list[fl]; break; }
}
}
}
if (!matchedHosp) {
var isHospChip = document.querySelector('.sb-chip[data-sb-facet-chip="type-hospital"], .sb-chip[data-sb-facet-chip="t-hospital"]');
var ogImgDom = document.getElementById('sb-og-image');
var ogImgVal = ogImgDom ? (ogImgDom.getAttribute('content') || '') : '';
if (isHospChip || ogImgVal.indexOf('/media/hospitals/hosp-') !== -1) {
var h1El = document.querySelector('.sb-post-title');
var rawH1 = h1El ? h1El.textContent.trim() : (document.title || 'Hospital');
var cleanName = rawH1.split('—')[0].split('(')[0].split(':')[0].split('|')[0].trim() || rawH1;
var parenMatch = rawH1.match(/\(([^)]+)\)/);
var locStr = parenMatch ? parenMatch[1] : '';
var cityStr = locStr.split(',')[0].trim();
var countryStr = (locStr.split(',')[1] || '').trim();
if (!cityStr) {
var cityChip = document.querySelector('.sb-chip[data-sb-facet-chip^="city-"]');
if (cityChip) cityStr = String(cityChip.getAttribute('data-sb-facet-chip')).replace(/^city-/, '').split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}
if (!countryStr) {
var countryChip = document.querySelector('.sb-chip[data-sb-facet-chip^="c-"]');
if (countryChip) {
var countryKey = String(countryChip.getAttribute('data-sb-facet-chip'));
var countryLabel = (typeof translateFacet === 'function') ? translateFacet(countryKey, 'en') : '';
countryStr = (countryLabel && countryLabel !== countryKey) ? countryLabel : countryKey.replace(/^c-/, '').split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}
}
var spChips = document.querySelectorAll('.sb-chip[data-sb-facet-chip^="sp-"]');
var spList = [];
for (var si = 0; si < spChips.length; si++) spList.push(spChips[si].getAttribute('data-sb-facet-chip'));
matchedHosp = {
id: 'DOM-HOSP',
facility_name: { en: cleanName },
city_name: { en: cityStr },
country_name: { en: countryStr },
country_code: countryStr,
accreditations: Array.prototype.map.call(document.querySelectorAll('.sb-chip[data-sb-facet-chip^="acc-"]'), function (c) { return c.getAttribute('data-sb-facet-chip'); }),
hospital_photo_url: ogImgVal || BRANDED_DEFAULT_SHARE_IMAGE,
specialties: spList
};
} else {
return null;
}
}
var isArPost = (path === '/2026/11/cleveland-clinic-abu-dhabi.html');
var nameEn = pickLocalized(matchedHosp.facility_name, 'en') || matchedHosp.id;
var cityEn = pickLocalized(matchedHosp.city_name, 'en') || matchedHosp.city || '';
var countryEn = pickLocalized(matchedHosp.country_name, 'en') || matchedHosp.country || '';
var accStr = (matchedHosp.accreditation_body || matchedHosp.accreditations || []).join(', ').replace(/acc-/g, '').toUpperCase();
if (cityEn && /hospital|clinic|medical|cent(er|re)|مستشفى|كلينك/i.test(String(cityEn))) cityEn = '';
var locText = [cityEn, countryEn].filter(function (v) { return v && String(v).trim(); }).join(', ');
var arNameText = /[\u0600-\u06FF]/.test(nameEn) ? nameEn : ('كليفلاند كلينك أبوظبي (' + nameEn + ')');
var descText = isArPost
? (arNameText + ' — الدليل والملف الطبي المعتمد' + (accStr ? ' (' + accStr + ')' : '') + '، التخصصات الجراحية، وتنسيق المرضى الدوليين مجاناً عبر سكرتاري بيرد.')
: (nameEn + (locText ? ' (' + locText + ')' : '') + ' — ' + (accStr ? accStr + ' accredited hospital profile' : 'Hospital profile') + ', specialties, and international patient coordination via SecretaryBird.');
if (descText.length > 158) descText = descText.slice(0, 155) + '...';
var existingDescEl = document.querySelector('meta[name="description"]');
var existingDesc = existingDescEl ? String(existingDescEl.getAttribute('content') || '').trim() : '';
if (matchedHosp.id === 'DOM-HOSP' && existingDesc.length >= 70 && existingDesc.indexOf(nameEn) === 0 && !/\s{2,}/.test(existingDesc) && !/\(\s*,\s*\)/.test(existingDesc)) descText = existingDesc;
var metaDesc = document.getElementById('sb-meta-description') || document.querySelector('meta[name="description"]');
var ogDesc = document.getElementById('sb-og-description') || document.querySelector('meta[property="og:description"]');
var twDesc = document.getElementById('sb-twitter-description') || document.querySelector('meta[name="twitter:description"]');
if (metaDesc) metaDesc.setAttribute('content', descText);
if (ogDesc) ogDesc.setAttribute('content', descText);
if (twDesc) twDesc.setAttribute('content', descText);
var photoUrl = matchedHosp.hospital_photo_url || BRANDED_DEFAULT_SHARE_IMAGE;
var ogImg = document.getElementById('sb-og-image') || document.querySelector('meta[property="og:image"]');
var twImg = document.getElementById('sb-twitter-image') || document.querySelector('meta[name="twitter:image"]');
if (ogImg) ogImg.setAttribute('content', photoUrl);
if (twImg) twImg.setAttribute('content', photoUrl);
var specs = (matchedHosp.specialties || []).map(function (s) { return translateFacet(s); }).filter(Boolean);
var hospSchema = {
'@type': 'Hospital',
'@id': 'https://www.thesecretarybird.com' + path + '#hospital',
'name': nameEn,
'url': 'https://www.thesecretarybird.com' + path,
'image': photoUrl,
};
if (cityEn || matchedHosp.country_code || countryEn) {
hospSchema.address = { '@type': 'PostalAddress' };
if (cityEn) hospSchema.address.addressLocality = cityEn;
if (matchedHosp.country_code || countryEn) hospSchema.address.addressCountry = String(matchedHosp.country_code || countryEn);
}
if (specs.length) hospSchema.medicalSpecialty = specs;
if (matchedHosp.hospital_logo_url) hospSchema.logo = matchedHosp.hospital_logo_url;
var postArt = document.querySelector('.sb-post-article');
var citedOfficialUrl = '';
if (postArt) {
var extLinks = postArt.querySelectorAll('a[href^="http"]');
for (var elIdx = 0; elIdx < extLinks.length; elIdx++) {
var hrefVal = extLinks[elIdx].getAttribute('href') || '';
if (hrefVal && !/thesecretarybird\.com|thesecbird\.blogspot\.com|wa\.me|whatsapp\.com|jsdelivr\.net/i.test(hrefVal)) {
citedOfficialUrl = hrefVal;
break;
}
}
}
if (citedOfficialUrl) {
hospSchema.sameAs = [citedOfficialUrl];
}
var mainSchemaEl = document.getElementById('sb-schema-jsonld');
if (mainSchemaEl) {
try {
var parsedGraph = JSON.parse(mainSchemaEl.textContent || '{}');
if (parsedGraph && Array.isArray(parsedGraph['@graph'])) {
for (var gIdx = 0; gIdx < parsedGraph['@graph'].length; gIdx++) {
var node = parsedGraph['@graph'][gIdx];
if (node && node['@type'] === 'MedicalWebPage') {
node.about = hospSchema;
}
}
mainSchemaEl.textContent = JSON.stringify(parsedGraph);
}
} catch (errSchema) {}
}
return hospSchema;
} catch (e) {
return null;
}
}
function applyLanguage(langCode, persistConfirmation) {
var requested = String(langCode || 'en').trim();
var meta = findLanguageMeta(requested) || { code: requested || 'en', name: 'English', native: 'English', dir: 'ltr' };
var code = meta.code;
var baseKey = resolveBaseLangKey(code);
if (baseKey !== 'en' && baseKey !== 'ar' && !RAW_LANG_PACKS[code] && !RAW_LANG_PACKS[baseKey] && !window.SB_EXTERNAL_I18N) {
ensureExternalI18nLoaded(function () {
applyLanguage(code, persistConfirmation);
});
return;
}
var isRtl = !!(RTL_LANGS[code] || RTL_LANGS[baseKey] || meta.dir === 'rtl');
state.activeLangCode = code;
document.documentElement.setAttribute('lang', code);
document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
try {
localStorage.setItem(STORAGE_LANG_CODE, code);
if (persistConfirmation) {
localStorage.setItem(STORAGE_LANG_CONFIRMED, 'true');
}
} catch (e) {}
var currentLabels = document.querySelectorAll('.sb-current-lang-label');
for (var i = 0; i < currentLabels.length; i++) {
currentLabels[i].textContent = meta.native;
}
var pack = PAGE_TRANSLATIONS[code] || PAGE_TRANSLATIONS[baseKey] || (isRtl ? PAGE_TRANSLATIONS.ar : PAGE_TRANSLATIONS.en);
if (pack) {
var nodes = document.querySelectorAll('[data-sb-i18n]');
for (var j = 0; j < nodes.length; j++) {
var el = nodes[j];
var key = el.getAttribute('data-sb-i18n');
if (pack[key]) {
el.textContent = pack[key];
}
}
var phNodes = document.querySelectorAll('[data-sb-i18n-placeholder]');
for (var k = 0; k < phNodes.length; k++) {
var pel = phNodes[k];
var pkey = pel.getAttribute('data-sb-i18n-placeholder');
if (pack[pkey]) {
pel.setAttribute('placeholder', pack[pkey]);
pel.setAttribute('aria-label', pack[pkey]);
}
}
var ariaNodes = document.querySelectorAll('[data-sb-i18n-aria]');
for (var a = 0; a < ariaNodes.length; a++) {
var ael = ariaNodes[a];
var akey = ael.getAttribute('data-sb-i18n-aria');
if (pack[akey]) {
ael.setAttribute('aria-label', pack[akey]);
ael.setAttribute('title', pack[akey]);
}
}
}
if (typeof window.__SB_RENDER_MAGAZINES_17 === 'function') {
window.__SB_RENDER_MAGAZINES_17(code);
} else if (document.getElementById('sb-editorial-section')) {
ensureExternalI18nLoaded(function () {
if (typeof window.__SB_RENDER_MAGAZINES_17 === 'function') window.__SB_RENDER_MAGAZINES_17(code);
});
}
syncCanonicalAndHreflang();
refreshMultilingualSelectsAndData(code);
enhanceServerRenderedChips();
syncHubTabsAndFiltersUI();
renderDirectoryCards();
renderCompareBody();
renderShortlistBody();
renderLanguageModalRegions('');
updateCalculator(false);
}
function renderLanguageDetectBanner(overrideDetected) {
var banner = document.getElementById('sb-lang-detect-banner');
if (!banner) return;
var confirmed = false;
var savedLang = '';
if (!overrideDetected) {
try {
confirmed = localStorage.getItem(STORAGE_LANG_CONFIRMED) === 'true';
savedLang = localStorage.getItem(STORAGE_LANG_CODE) || '';
} catch (e) {}
}
var detected = overrideDetected || detectVisitorLanguageAndCountry();
if (savedLang && !overrideDetected) {
applyLanguage(savedLang, false);
}
if (confirmed && !overrideDetected) {
banner.hidden = true;
return;
}
var meta = findLanguageMeta(detected.code) || { code: 'en', name: 'English', native: 'English', dir: 'ltr' };
var baseKey = resolveBaseLangKey(meta.code);
var docLang = resolveBaseLangKey(document.documentElement.getAttribute('lang') || 'en');
if (!overrideDetected && baseKey === docLang) {
banner.hidden = true;
return;
}
var pack = PAGE_TRANSLATIONS[meta.code] || PAGE_TRANSLATIONS[baseKey] || PAGE_TRANSLATIONS.en;
var langDisplay = meta.native + (meta.name !== meta.native ? ' (' + meta.name + ')' : '') + (detected.country ? ' · ' + detected.country : '');
var msgEl = document.getElementById('sb-lang-detect-msg');
var contBtn = document.getElementById('sb-lang-confirm-btn');
var chooseBtn = document.getElementById('sb-lang-choose-btn');
if (msgEl) {
msgEl.textContent = (pack.detectMsg || PAGE_TRANSLATIONS.en.detectMsg).replace(/\{lang\}/g, langDisplay);
msgEl.setAttribute('dir', meta.dir || 'ltr');
}
if (contBtn) {
contBtn.textContent = (pack.continueBtn || PAGE_TRANSLATIONS.en.continueBtn).replace(/\{lang\}/g, meta.native);
contBtn.setAttribute('data-detected-lang', meta.code);
}
if (chooseBtn) {
chooseBtn.textContent = pack.chooseDiffBtn || PAGE_TRANSLATIONS.en.chooseDiffBtn;
}
banner.hidden = false;
}
function renderLanguageModalRegions(filterQuery) {
var container = document.getElementById('sb-lang-regions-container');
if (!container) return;
var q = (filterQuery || '').trim().toLowerCase();
var isAr = getLang() === 'ar';
var html = '';
for (var i = 0; i < GLOBAL_REGIONS.length; i++) {
var reg = GLOBAL_REGIONS[i];
var matchedLangs = reg.languages.filter(function (l) {
if (!q) return true;
var baseAlias = resolveBaseLangKey(l.code);
var hay = (l.name + ' ' + l.native + ' ' + l.countries + ' ' + l.code + ' ' + baseAlias + ' ' + reg.titleEn + ' ' + reg.titleAr).toLowerCase();
return hay.indexOf(q) !== -1;
});
if (matchedLangs.length === 0) continue;
html += '<section class="sb-lang-region-block">';
html += '<h3 class="sb-lang-region-title">' + (isAr ? reg.titleAr + ' · ' + reg.titleEn : reg.titleEn + ' · ' + reg.titleAr) + '</h3>';
html += '<div class="sb-lang-cards-grid">';
for (var j = 0; j < matchedLangs.length; j++) {
var lang = matchedLangs[j];
var isCurrent = state.activeLangCode.toLowerCase() === lang.code.toLowerCase();
html +=
'<button type="button" class="sb-lang-option-card' + (isCurrent ? ' is-selected' : '') + '" data-sb-action="select-language" data-lang-code="' + lang.code + '" aria-pressed="' + (isCurrent ? 'true' : 'false') + '">' +
'<div class="sb-lang-option-top">' +
'<strong class="sb-lang-native" lang="' + lang.code + '" dir="' + lang.dir + '">' + lang.native + '</strong>' +
'<span class="sb-lang-english">' + lang.name + '</span>' +
'</div>' +
'<div class="sb-lang-countries">' + lang.countries + '</div>' +
'</button>';
}
html += '</div></section>';
}
container.innerHTML = html || '<p class="sb-empty-modal-msg">No matching country or language found.</p>';
}
function initWhatsAppVariable() {
var cssVar = '';
try {
cssVar = getComputedStyle(document.documentElement).getPropertyValue('--sb-whatsapp-number') || '';
} catch (e) {}
var bodyAttr = document.body.getAttribute('data-whatsapp-number') || '';
var rawNum = (WHATSAPP_NUMBER || bodyAttr || cssVar).replace(/['"\s]/g, '');
var digits = rawNum.replace(/[^0-9]/g, '');
if (digits && digits.length >= 8 && !/0000000/.test(digits)) {
document.body.setAttribute('data-wa-active', 'true');
var waLinks = document.querySelectorAll('.sb-wa-conditional');
for (var i = 0; i < waLinks.length; i++) {
var el = waLinks[i];
if (el.tagName === 'A') {
var msg = el.getAttribute('data-wa-text') || 'Hello SecretaryBird, I would like to request a hospital comparison.';
el.setAttribute('href', 'https://wa.me/' + digits + '?text=' + encodeURIComponent(msg));
}
}
} else {
document.body.setAttribute('data-wa-active', 'false');
}
}
function enhanceServerRenderedChips() {
var chips = document.querySelectorAll('[data-sb-facet-chip]');
for (var i = 0; i < chips.length; i++) {
var chip = chips[i];
var raw = chip.getAttribute('data-sb-facet-chip') || chip.textContent.trim();
var parentArt = chip.closest ? chip.closest('.sb-post-article[lang]') : null;
var artLang = parentArt ? (parentArt.getAttribute('lang') || '') : '';
var mapped = translateFacet(raw, artLang || undefined);
if (!mapped) {
chip.hidden = true;
chip.classList.add('sb-chip-hidden');
} else {
chip.textContent = mapped;
}
}
}
function syncHubTabsAndFiltersUI() {
var tabs = document.querySelectorAll('.sb-hub-tab');
for (var i = 0; i < tabs.length; i++) {
var tabHub = tabs[i].getAttribute('data-hub');
var isActive = tabHub === state.hub;
tabs[i].classList.toggle('active', isActive);
tabs[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
}
var filterGroups = document.querySelectorAll('.sb-filter-group[data-hub-only], .sb-filter-group[data-hub-filter]');
for (var j = 0; j < filterGroups.length; j++) {
var fg = filterGroups[j];
var allowed = (fg.getAttribute('data-hub-only') || fg.getAttribute('data-hub-filter') || '').split(',');
fg.hidden = allowed.indexOf(state.hub) === -1;
}
var dirHeading = document.getElementById('sb-dir-heading');
if (dirHeading) {
if (state.hub === 'doctors') {
dirHeading.textContent = t('hubTabDoctors');
} else if (state.hub === 'costs') {
dirHeading.textContent = t('hubTabCosts');
} else {
dirHeading.textContent = t('dirSectionTitle');
}
}
}
function switchHub(newHub, skipUrlSync) {
if (newHub !== 'hospitals' && newHub !== 'doctors' && newHub !== 'costs') {
newHub = 'hospitals';
}
state.hub = newHub;
var cfg = Object.assign({}, DEFAULT_DATA_CONFIG, window.SB_DATA_CONFIG || {});
if (newHub === 'hospitals' && cfg.hospitalsUrl) loadExternalHubJson('hospitals', cfg.hospitalsUrl);
if (newHub === 'doctors' && cfg.doctorsUrl) loadExternalHubJson('doctors', cfg.doctorsUrl);
if (newHub === 'costs' && cfg.costsUrl) loadExternalHubJson('costs', cfg.costsUrl);
syncHubTabsAndFiltersUI();
renderDirectoryCards();
if (!skipUrlSync) syncUrlParams();
}
function parseAndApplyUrlParams() {
try {
var params = new URLSearchParams(window.location.search);
var langParam = params.get('lang');
if (langParam) {
applyLanguage(langParam, true);
}
var hubParam = params.get('hub');
if (hubParam && (hubParam === 'hospitals' || hubParam === 'doctors' || hubParam === 'costs')) {
state.hub = hubParam;
}
var facParam = params.get('facility');
if (facParam !== null) state.facilityFilter = facParam.trim();
var docParam = params.get('doctor');
if (docParam !== null) state.doctorFilter = docParam.trim();
var procParam = params.get('proc');
if (procParam !== null) {
state.procFilter = procParam.trim();
var procSel = document.getElementById('sb-filter-procedure');
if (procSel) procSel.value = state.procFilter;
}
var specParam = params.get('spec');
if (specParam !== null) {
state.specialty = specParam.trim().toLowerCase().replace(/^sp-/, '');
var specSel = document.getElementById('sb-filter-specialty');
if (specSel) specSel.value = state.specialty;
}
var countryParam = params.get('country');
if (countryParam !== null) {
state.destination = countryParam.trim().toLowerCase();
var destSel = document.getElementById('sb-filter-destination');
if (destSel) destSel.value = state.destination;
}
var cityParam = params.get('city');
if (cityParam !== null) {
state.city = cityParam.trim().toLowerCase();
var citySel = document.getElementById('sb-filter-city');
if (citySel) citySel.value = state.city;
}
var maxPriceParam = params.get('max_price');
if (maxPriceParam !== null) {
state.maxPrice = Number(maxPriceParam) || 0;
var priceSel = document.getElementById('sb-filter-price');
if (priceSel) priceSel.value = state.maxPrice ? String(state.maxPrice) : '';
}
var qParam = params.get('q');
if (qParam !== null) {
state.query = qParam.trim();
var qInp = document.getElementById('sb-search-input');
if (qInp) qInp.value = state.query;
}
syncHubTabsAndFiltersUI();
renderDirectoryCards();
} catch (e) {}
}
function syncUrlParams() {
try {
if (!window.history || typeof window.history.replaceState !== 'function') return;
if (window.location.protocol === 'file:') return;
var params = new URLSearchParams(window.location.search);
if (state.hub && state.hub !== 'hospitals') params.set('hub', state.hub);
else params.delete('hub');
if (state.facilityFilter) params.set('facility', state.facilityFilter);
else params.delete('facility');
if (state.doctorFilter) params.set('doctor', state.doctorFilter);
else params.delete('doctor');
if (state.procFilter) params.set('proc', state.procFilter);
else params.delete('proc');
if (state.specialty) params.set('spec', state.specialty);
else params.delete('spec');
if (state.destination) params.set('country', state.destination);
else params.delete('country');
if (state.city) params.set('city', state.city);
else params.delete('city');
if (state.maxPrice > 0) params.set('max_price', String(state.maxPrice));
else params.delete('max_price');
if (state.query) params.set('q', state.query);
else params.delete('q');
var qs = params.toString();
var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
window.history.replaceState(null, '', newUrl);
} catch (e) {}
}
function classifyHospitalProviderType(item) {
var nameEn = (pickLocalized(item.facility_name, 'en') || '').toLowerCase();
var overEn = (pickLocalized(item.original_overview, 'en') || '').toLowerCase();
var beds = Number(item.beds_reported) || 0;
if (/universit|academic|research|charit|faisal|asan|marañón|maranon|pumch|union medical|national cancer|teaching/.test(nameEn + ' ' + overEn)) {
return 'academic';
}
if ((beds > 0 && beds < 120) || /clinic|plastic|aesthetic|eye|dental|fertility|ivf|rehab|center|centre/.test(nameEn) && beds < 200) {
return 'clinic';
}
return 'hospital';
}
function buildDoctorInitialsSvg(docName, specCode) {
var parts = String(docName || 'MD').replace(/^(Dr\.?|Prof\.?|د\.?)\s+/i, '').trim().split(/\s+/);
var init = (parts[0] ? parts[0].charAt(0) : 'M') + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : 'D');
init = init.toUpperCase();
var sc = String(specCode || 'MD').toUpperCase();
var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><rect width="144" height="144" fill="#0C2327" stroke="#C9A45C" stroke-width="4"/><rect width="144" height="22" fill="#01434C"/><text x="72" y="15" text-anchor="middle" fill="#C9A45C" font-family="Inter,sans-serif" font-size="10" font-weight="700">SECRETARYBIRD · MD</text><circle cx="72" cy="72" r="34" fill="#01434C" stroke="#C9A45C" stroke-width="2"/><text x="72" y="76" dominant-baseline="middle" text-anchor="middle" fill="#F9F7F1" font-family="Inter,sans-serif" font-size="26" font-weight="700">' + escapeHtml(init) + '</text><rect y="122" width="144" height="22" fill="#01434C"/><text x="72" y="136" text-anchor="middle" fill="#C9A45C" font-family="Inter,sans-serif" font-size="10" font-weight="700">' + escapeHtml(sc) + '</text></svg>';
return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
function buildFramedLogoFallbackSvg(facId, titleText) {
var words = String(titleText || facId || 'SB').replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/);
var init = ((words[0] ? words[0].charAt(0) : 'S') + (words[1] ? words[1].charAt(0) : 'B')).toUpperCase();
var code = String(facId || 'SB').slice(0, 11);
var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#F9F7F1" stroke="#0C2327" stroke-width="3"/><rect width="96" height="18" fill="#0C2327"/><text x="48" y="13" text-anchor="middle" fill="#C9A45C" font-family="Inter,sans-serif" font-size="9" font-weight="700">SECRETARYBIRD</text><rect x="12" y="23" width="72" height="50" rx="8" fill="#FFFFFF" stroke="#01434C" stroke-width="2"/><text x="48" y="54" dominant-baseline="middle" text-anchor="middle" fill="#0C2327" font-family="Inter,sans-serif" font-size="22" font-weight="700">' + escapeHtml(init) + '</text><rect y="78" width="96" height="18" fill="#01434C"/><text x="48" y="90" text-anchor="middle" fill="#F9F7F1" font-family="Inter,sans-serif" font-size="9" font-weight="700">' + escapeHtml(code) + '</text></svg>';
return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
function buildFramedBannerFallbackSvg(label, code) {
var lbl = String(label || 'SecretaryBird Medical Travel').slice(0, 38);
var cd = String(code || 'SB').slice(0, 12);
var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 152"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0C2327"/><stop offset="100%" stop-color="#01434C"/></linearGradient></defs><rect width="360" height="152" fill="url(#g)" stroke="#C9A45C" stroke-width="2"/><rect width="360" height="24" fill="#0C2327"/><line x1="0" y1="24" x2="360" y2="24" stroke="#C9A45C" stroke-width="1"/><text x="12" y="16" fill="#F9F7F1" font-family="Inter,sans-serif" font-size="10" font-weight="700">SECRETARYBIRD · MEDICAL TRAVEL</text><text x="348" y="16" text-anchor="end" fill="#C9A45C" font-family="Inter,sans-serif" font-size="10" font-weight="700">' + escapeHtml(cd) + '</text><rect x="14" y="36" width="332" height="102" rx="8" fill="rgba(255,255,255,0.06)" stroke="#C9A45C" stroke-width="1"/><text x="180" y="90" dominant-baseline="middle" text-anchor="middle" fill="#F9F7F1" font-family="Inter,sans-serif" font-size="14" font-weight="700">' + escapeHtml(lbl) + '</text></svg>';
return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
window.__sbImgFallback = function (imgEl) {
if (!imgEl || imgEl.getAttribute('data-sb-fb-applied') === '1') return;
imgEl.setAttribute('data-sb-fb-applied', '1');
var kind = imgEl.getAttribute('data-sb-fallback') || 'banner';
var lbl = imgEl.getAttribute('data-sb-label') || '';
var cd = imgEl.getAttribute('data-sb-code') || '';
if (kind === 'doctor') {
imgEl.src = buildDoctorInitialsSvg(lbl, cd);
} else if (kind === 'logo') {
imgEl.src = buildFramedLogoFallbackSvg(cd, lbl);
} else {
imgEl.src = buildFramedBannerFallbackSvg(lbl, cd);
}
};
var CDN_MEDIA_BASE = 'https://cdn.jsdelivr.net/gh/twinaa11-gif/thesecretarybird-data@main/media';
function hashCodeNum(str) {
var s = String(str || '');
var h = 0;
for (var i = 0; i < s.length; i++) {
h = ((h << 5) - h + s.charCodeAt(i)) | 0;
}
return Math.abs(h);
}
function pad2Num(n) {
return n < 10 ? ('0' + n) : String(n);
}
function matchesSpecialtyFilter(item, filterVal) {
if (!filterVal) return true;
var f = filterVal.toLowerCase();
if (item.specialty_slug && item.specialty_slug.toLowerCase() === f) return true;
if (item.specialty_code && item.specialty_code.toLowerCase() === f) return true;
if (Array.isArray(item.specialties) && item.specialties.indexOf('sp-' + f) !== -1) return true;
if (Array.isArray(item.specialty_codes) && item.specialty_codes.map(function (c) { return c.toLowerCase(); }).indexOf(f) !== -1) return true;
return false;
}
function getFilteredListings() {
var list = state.datasets[state.hub] || state.datasets.hospitals;
return list.filter(function (item) {
if (state.scope !== 'all' && item.scope !== state.scope) return false;
if (state.destination && item.country !== state.destination) return false;
if (state.city && item.city !== state.city) return false;
if (state.specialty && !matchesSpecialtyFilter(item, state.specialty)) return false;
if (state.facilityFilter) {
var fTarget = state.facilityFilter.toLowerCase();
var itemFacId = (item.facility_id || item.primary_facility_id || item.id || '').toLowerCase();
var itemLegacyId = (item.id || '').toLowerCase();
var affList = Array.isArray(item.affiliated_facility_ids) ? item.affiliated_facility_ids.map(function (x) { return String(x).toLowerCase(); }) : [];
if (itemFacId !== fTarget && itemLegacyId !== fTarget && affList.indexOf(fTarget) === -1) return false;
}
if (state.doctorFilter) {
var dTarget = state.doctorFilter.toLowerCase();
var itemDocId = (item.doctor_id || item.lead_doctor_id || item.id || '').toLowerCase();
if (itemDocId !== dTarget) return false;
}
if (state.procFilter) {
var pTarget = state.procFilter.toLowerCase();
var itemProc = (item.procedure_code || '').toLowerCase();
if (itemProc !== pTarget) return false;
}
if (state.hub === 'hospitals') {
if (state.providerType && classifyHospitalProviderType(item) !== state.providerType) return false;
if (state.accreditation && (!item.accreditations || item.accreditations.indexOf(state.accreditation) === -1)) return false;
if (state.arabCare && (!item.arabCare || item.arabCare.indexOf('svc-' + state.arabCare) === -1)) return false;
if (state.spokenLang) {
var hLangs = (item.spoken_languages || []).join(' ').toLowerCase();
if (hLangs.indexOf(state.spokenLang.toLowerCase()) === -1) return false;
}
if (state.logistics) {
if ((state.logistics === 'e_visa' || state.logistics === 'e-visa') && !item.e_visa_available) return false;
if ((state.logistics === 'airport_pickup' || state.logistics === 'airport-pickup') && !item.airport_pickup_included) return false;
if (state.logistics === 'interpreter' && !item.medical_interpreter_available) return false;
if ((state.logistics === 'insurance' || state.logistics === 'direct-billing') && !item.direct_insurance_billing) return false;
}
if (state.maxPrice > 0) {
if (!item.priceDated) return false;
if (item.minPriceUsd > state.maxPrice) return false;
}
} else if (state.hub === 'doctors') {
if (state.subSpecialty) {
var subHay = (pickLocalized(item.sub_specialties, 'en') + ' ' + pickLocalized(item.sub_specialties, 'ar') + ' ' + pickLocalized(item.sub_specialties, state.activeLangCode)).toLowerCase();
if (subHay.indexOf(state.subSpecialty.toLowerCase()) === -1) return false;
}
if (state.minExperience > 0 && (Number(item.years_of_experience) || 0) < state.minExperience) return false;
if (state.spokenLang) {
var langsJoined = (item.spoken_languages || []).join(' ').toLowerCase();
if (langsJoined.indexOf(state.spokenLang.toLowerCase()) === -1) return false;
}
if (state.maxConsultFee > 0 && (Number(item.consultation_fee_usd) || 0) > state.maxConsultFee) return false;
} else if (state.hub === 'costs') {
if (state.maxPrice > 0) {
if (!item.priceDated) return false;
if ((Number(item.price_low_usd) || 0) > state.maxPrice) return false;
}
if (state.maxFitToFly > 0 && (Number(item.fit_to_fly_clearance_days) || 0) > state.maxFitToFly) return false;
}
if (state.query) {
var q = state.query.toLowerCase();
var actLang = state.activeLangCode || 'en';
var hayParts = [];
if (state.hub === 'hospitals') {
hayParts = [
item.facility_id,
pickLocalized(item.facility_name, 'en'),
pickLocalized(item.facility_name, 'ar'),
pickLocalized(item.facility_name, actLang),
pickLocalized(item.locationLabel, 'en'),
pickLocalized(item.locationLabel, 'ar'),
pickLocalized(item.locationLabel, actLang),
pickLocalized(item.original_overview, 'en'),
pickLocalized(item.original_overview, 'ar'),
pickLocalized(item.original_overview, actLang),
(item.spoken_languages || []).join(' '),
(item.specialties || []).map(translateFacet).join(' '),
(item.accreditations || []).map(translateFacet).join(' ')
];
} else if (state.hub === 'doctors') {
hayParts = [
item.doctor_id,
pickLocalized(item.doctor_name, 'en'),
pickLocalized(item.doctor_name, 'ar'),
pickLocalized(item.doctor_name, actLang),
pickLocalized(item.primary_specialty, 'en'),
pickLocalized(item.primary_specialty, 'ar'),
pickLocalized(item.primary_specialty, actLang),
pickLocalized(item.sub_specialties, 'en'),
pickLocalized(item.sub_specialties, 'ar'),
pickLocalized(item.sub_specialties, actLang),
pickLocalized(item.primary_facility_name, 'en'),
pickLocalized(item.primary_facility_name, 'ar'),
pickLocalized(item.clinical_focus_and_bio, 'en'),
pickLocalized(item.clinical_focus_and_bio, actLang),
(item.spoken_languages || []).join(' ')
];
} else {
hayParts = [
item.cost_id,
item.procedure_code,
item.cpt_icd_code,
pickLocalized(item.procedure_name, 'en'),
pickLocalized(item.procedure_name, 'ar'),
pickLocalized(item.procedure_name, actLang),
pickLocalized(item.specialty_category, 'en'),
pickLocalized(item.specialty_category, actLang),
pickLocalized(item.facility_name, 'en'),
pickLocalized(item.lead_doctor_name, 'en'),
pickLocalized(item.package_inclusions, 'en'),
pickLocalized(item.package_inclusions, actLang)
];
}
if (hayParts.join(' ').toLowerCase().indexOf(q) === -1) return false;
}
return true;
});
}
function getSelectOptionText(selectId, val) {
var sel = document.getElementById(selectId);
if (!sel) return String(val);
for (var i = 0; i < sel.options.length; i++) {
if (sel.options[i].value === String(val)) return sel.options[i].textContent;
}
return String(val);
}
function updateActiveFilterCount() {
var activePills = [];
if (state.query) activePills.push({ key: 'query', label: '"' + state.query + '"' });
if (state.scope && state.scope !== 'all') activePills.push({ key: 'scope', label: state.scope === 'domestic' ? t('scopeDomestic') : t('scopeInternational') });
if (state.providerType) activePills.push({ key: 'providerType', label: getSelectOptionText('sb-filter-provider-type', state.providerType) });
if (state.specialty) activePills.push({ key: 'specialty', label: getSelectOptionText('sb-filter-specialty', state.specialty) });
if (state.subSpecialty) activePills.push({ key: 'subSpecialty', label: getSelectOptionText('sb-filter-subspecialty', state.subSpecialty) });
if (state.destination) activePills.push({ key: 'destination', label: getLocalizedCountryName(state.destination, '', state.activeLangCode) });
if (state.city) activePills.push({ key: 'city', label: getSelectOptionText('sb-filter-city', state.city) });
if (state.accreditation) activePills.push({ key: 'accreditation', label: getSelectOptionText('sb-filter-accreditation', state.accreditation) });
if (state.arabCare) activePills.push({ key: 'arabCare', label: getSelectOptionText('sb-filter-arab-care', state.arabCare) });
if (state.logistics) activePills.push({ key: 'logistics', label: getSelectOptionText('sb-filter-billing-visa', state.logistics) });
if (state.minExperience > 0) activePills.push({ key: 'minExperience', label: getSelectOptionText('sb-filter-min-exp', state.minExperience) });
if (state.spokenLang) activePills.push({ key: 'spokenLang', label: localizeSpokenLanguageName(state.spokenLang, state.activeLangCode) });
if (state.maxConsultFee > 0) activePills.push({ key: 'maxConsultFee', label: '≤ $' + state.maxConsultFee });
if (state.maxPrice > 0) activePills.push({ key: 'maxPrice', label: '≤ $' + Number(state.maxPrice).toLocaleString('en-US') });
if (state.maxFitToFly > 0) activePills.push({ key: 'maxFitToFly', label: '≤ ' + state.maxFitToFly + 'd' });
if (state.facilityFilter) activePills.push({ key: 'facilityFilter', label: t('filteredByHospital') + state.facilityFilter });
if (state.doctorFilter) activePills.push({ key: 'doctorFilter', label: t('filteredByDoctor') + state.doctorFilter });
if (state.procFilter) activePills.push({ key: 'procFilter', label: t('filteredByProc') + state.procFilter });
var count = activePills.length;
var badgeEls = document.querySelectorAll('.sb-active-filter-count');
for (var i = 0; i < badgeEls.length; i++) {
badgeEls[i].textContent = String(count);
}
var destPills = document.querySelectorAll('.sb-dest-pill[data-country]');
for (var dp = 0; dp < destPills.length; dp++) {
var cVal = destPills[dp].getAttribute('data-country') || '';
destPills[dp].classList.toggle('active', cVal === (state.destination || ''));
}
var pillContainer = document.getElementById('sb-active-filters-container');
if (!pillContainer) return;
pillContainer.innerHTML = '';
if (count === 0) return;
for (var p = 0; p < activePills.length; p++) {
var chip = document.createElement('button');
chip.type = 'button';
chip.className = 'sb-active-filter-chip';
chip.setAttribute('data-sb-action', 'clear-single-filter');
chip.setAttribute('data-filter-key', activePills[p].key);
chip.textContent = activePills[p].label + ' ×';
pillContainer.appendChild(chip);
}
var resetBtn = document.createElement('button');
resetBtn.type = 'button';
resetBtn.className = 'sb-chip sb-chip-reset';
resetBtn.textContent = t('resetFilters');
resetBtn.addEventListener('click', resetAllFilters);
pillContainer.appendChild(resetBtn);
}
function renderHospitalCard(item, lang) {
var facId = item.facility_id || item.id;
var isShortlisted = state.shortlist.indexOf(facId) !== -1 || state.shortlist.indexOf(item.id) !== -1;
var isCompared = state.compare.indexOf(facId) !== -1 || state.compare.indexOf(item.id) !== -1;
var titleText = pickLocalized(item.facility_name || item.title, lang);
var locText = pickLocalized(item.locationLabel, lang) || (pickLocalized(item.city_name, lang) + ', ' + pickLocalized(item.country_name, lang));
var sumText = pickLocalized(item.original_overview || item.summary, lang);
var provCat = classifyHospitalProviderType(item);
var typeBadge = provCat === 'academic' ? t('optProvAcademic') : (provCat === 'clinic' ? t('optProvClinic') : t('typeHospital'));
var verText = translateFacet(item.verificationStatus);
var itemUrl = resolveItemUrl(item);
var accChips = (item.accreditations || []).map(function (a) {
return '<span class="sb-chip sb-chip-acc">' + translateFacet(a) + '</span>';
}).join('');
var specChips = (item.specialties || []).slice(0, 3).map(function (s) {
return '<span class="sb-chip">' + translateFacet(s) + '</span>';
}).join('');
var svcChips = (item.arabCare || []).slice(0, 2).map(function (sv) {
return '<span class="sb-chip sb-chip-sage">' + translateFacet(sv) + '</span>';
}).join('');
var logisticsRow = '';
if (item.beds_reported || item.partner_recovery_hotels || (item.spoken_languages && item.spoken_languages.length)) {
var bedsLbl = item.beds_reported ? ('<span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.beds_reported) + '</span> ' + escapeHtml(t('cardBedsLabel')) + ' · <span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.icu_reported || 0) + '</span> ' + escapeHtml(t('cardIcuLabel'))) : '';
var langsStr = (item.spoken_languages || []).slice(0, 4).map(function(l){ return localizeSpokenLanguageName(l, state.activeLangCode); }).join(', ');
var hotelLbl = item.partner_recovery_hotels
? (escapeHtml(pickLocalized(item.partner_recovery_hotels, lang)) + (item.distance_from_facility_km ? ' (<span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.distance_from_facility_km) + ' km</span>)' : ''))
: '';
var flags = [];
if (item.medical_interpreter_available) flags.push(escapeHtml(t('cardInterpreterFlag')));
if (item.e_visa_available) flags.push(escapeHtml(t('cardEvisaFlag')));
if (item.airport_pickup_included) flags.push(escapeHtml(t('cardPickupFlag')));
logisticsRow =
'<div class="sb-card-relational-meta">' +
'<div class="sb-card-capacity-row"><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(facId) + '</span>' + (bedsLbl ? ' · ' + bedsLbl : '') + (flags.length ? ' · ' + flags.join(' · ') : '') + '</div>' +
(langsStr ? '<div><strong>' + escapeHtml(t('cardLanguagesLabel')) + '</strong>' + escapeHtml(langsStr) + '</div>' : '') +
(hotelLbl ? '<div class="sb-card-hotel-line">' + escapeHtml(t('cardPartnerHotelLabel')) + hotelLbl + '</div>' : '') +
'</div>';
}
var priceLine = '';
if (item.priceDated && item.minPriceUsd > 0) {
priceLine =
'<div class="sb-card-price-row">' +
'<span class="sb-card-price-label">' + t('indicativeRange') + '</span> ' +
'<strong class="sb-card-price-val"><span class="sb-ltr-inline" dir="ltr">' +
formatMoney(item.minPriceUsd, state.currency) + ' – ' + formatMoney(item.maxPriceUsd, state.currency) +
'</span></strong> ' +
'<span class="sb-card-price-date">(' + t('asOfDate') + '<span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.sourceDate) + '</span>)</span>' +
'</div>';
} else {
priceLine =
'<div class="sb-card-price-row">' +
'<span class="sb-card-price-label">' + t('indicativeRange') + '</span> ' +
'<span class="sb-card-price-date">' + t('enquiryOnly') + '</span>' +
'</div>';
}
var rawBanner = String(item.hospital_photo_url || '');
var bannerUrl = (rawBanner.indexOf('/media/hospitals/') !== -1) ? rawBanner : (CDN_MEDIA_BASE + '/hospitals/hosp-' + pad2Num((hashCodeNum(facId) % 32) + 1) + '.webp');
var rawLogo = String(item.hospital_logo_url || '');
var logoUrl = (rawLogo.indexOf('/media/logos/') !== -1) ? rawLogo : (CDN_MEDIA_BASE + '/logos/' + encodeURIComponent(facId) + '.webp');
var hospAlt = (item.seo && item.seo.image_alt && pickLocalized(item.seo.image_alt, lang)) ? pickLocalized(item.seo.image_alt, lang) : (titleText + (item.city_name ? (', ' + pickLocalized(item.city_name, lang)) : ''));
return (
'<article class="sb-card" data-listing-id="' + escapeHtml(facId) + '" data-facility-id="' + escapeHtml(facId) + '">' +
'<div class="sb-card-media-frame">' +
'<img class="sb-card-banner-img" src="' + escapeHtml(bannerUrl) + '" alt="' + escapeHtml(hospAlt) + '" width="800" height="450" loading="lazy" decoding="async" fetchpriority="low" data-sb-fallback="banner" data-sb-label="' + escapeHtml(titleText) + '" data-sb-code="' + escapeHtml(facId) + '" onerror="window.__sbImgFallback &amp;&amp; window.__sbImgFallback(this)"/>' +
'<div class="sb-card-logo-badge"><img class="sb-card-logo-img" src="' + escapeHtml(logoUrl) + '" alt="' + escapeHtml(titleText + ' logo') + '" width="135" height="54" loading="lazy" decoding="async" fetchpriority="low" data-sb-fallback="logo" data-sb-label="' + escapeHtml(titleText) + '" data-sb-code="' + escapeHtml(facId) + '" onerror="window.__sbImgFallback &amp;&amp; window.__sbImgFallback(this)"/></div>' +
'</div>' +
'<div class="sb-card-body">' +
'<div class="sb-card-meta-top">' +
'<span class="sb-badge-type">' + escapeHtml(typeBadge) + '</span>' +
'<span class="sb-card-location"><img class="sb-card-flag-img" src="' + escapeHtml(item.destination_flag_svg || ('https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/' + String(item.country_code || 'in').toLowerCase().split('-')[0] + '.svg')) + '" alt="" width="18" height="13" loading="lazy" decoding="async"/>' + escapeHtml(locText) + '</span>' +
'</div>' +
'<h3 class="sb-card-title"><a href="' + sanitizeUrl(itemUrl) + '">' + escapeHtml(titleText) + '</a></h3>' +
'<p class="sb-card-snippet">' + escapeHtml(sumText) + '</p>' +
'<div class="sb-card-labels">' + accChips + specChips + svcChips + '</div>' +
logisticsRow +
priceLine +
'<div class="sb-card-review-row">' +
'<span>' + escapeHtml(verText) + '</span> · ' +
'<span>' + escapeHtml(t('lastReviewed')) + '<time class="sb-ltr-inline" dir="ltr" datetime="' + escapeHtml(item.lastReviewed) + '">' + escapeHtml(item.lastReviewed) + '</time></span>' +
'</div>' +
'<div class="sb-card-crosslinks">' +
'<button type="button" class="sb-chip sb-chip-crosslink" data-sb-action="crosslink-hub" data-target-hub="doctors" data-facility-id="' + escapeHtml(facId) + '">' +
'👨‍⚕️ ' + escapeHtml(t('btnViewDoctors')) +
'</button>' +
'<button type="button" class="sb-chip sb-chip-crosslink" data-sb-action="crosslink-hub" data-target-hub="costs" data-facility-id="' + escapeHtml(facId) + '">' +
'💰 ' + escapeHtml(t('btnViewCosts')) +
'</button>' +
'</div>' +
'<div class="sb-card-footer">' +
'<div class="sb-card-primary-actions">' +
(function(){ var isLive = hasLiveProfilePost(item); var cName = pickLocalized(item.country_name, lang) || getLocalizedCountryName(item.country, item.country_code, state.activeLangCode); var tpl = t('viewCountryDirTpl'); var dirLbl = (tpl && tpl !== 'viewCountryDirTpl') ? tpl.replace('{country}', cName) : ('View ' + cName + ' directory'); var btnTxt = isLive ? t('viewProfile') : dirLbl; var ariaTxt = btnTxt + ': ' + titleText; return '<a class="sb-btn sb-btn-secondary sb-btn-sm" href="' + sanitizeUrl(itemUrl) + '" aria-label="' + escapeHtml(ariaTxt) + '">' + escapeHtml(btnTxt) + '</a>'; })() +
(item.provider_page_url ? '<a class="sb-btn sb-btn-secondary sb-btn-sm" href="' + sanitizeUrl(item.provider_page_url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(t('officialSourceBtn') + ' — ' + titleText) + '">' + escapeHtml(t('officialSourceBtn')) + '</a>' : '') +
'<button type="button" class="sb-btn sb-btn-primary sb-btn-sm" data-sb-action="open-quote" data-provider-name="' + escapeHtml(facId + ' — ' + titleText) + '">' + escapeHtml(t('requestQuote')) + '</button>' +
'</div>' +
'<div class="sb-card-utility-actions">' +
'<button type="button" class="sb-icon-pill" data-sb-action="toggle-shortlist" data-listing-id="' + escapeHtml(facId) + '" aria-pressed="' + (isShortlisted ? 'true' : 'false') + '">' +
'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="' + (isShortlisted ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.75"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
'<span>' + escapeHtml(isShortlisted ? t('savedBtn') : t('saveBtn')) + '</span>' +
'</button>' +
'<button type="button" class="sb-icon-pill" data-sb-action="toggle-compare" data-listing-id="' + escapeHtml(facId) + '" aria-pressed="' + (isCompared ? 'true' : 'false') + '">' +
'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>' +
'<span>' + escapeHtml(t('compareBtn')) + '</span>' +
'</button>' +
'</div>' +
'</div>' +
'</div>' +
'</article>'
);
}
function renderDoctorCard(item, lang) {
var docId = item.doctor_id || item.id;
var docName = pickLocalized(item.doctor_name, lang);
var primSpec = pickLocalized(item.primary_specialty, lang);
var subSpecs = pickLocalized(item.sub_specialties, lang);
var facName = pickLocalized(item.primary_facility_name, lang);
var facId = item.primary_facility_id || '';
var edu = pickLocalized(item.education_and_qualifications, lang);
var awards = pickLocalized(item.awards_and_honors, lang);
var bio = pickLocalized(item.clinical_focus_and_bio, lang);
var feeFormatted = formatMoney(item.consultation_fee_usd || 28, state.currency);
var langsStr = (item.spoken_languages || []).map(function(l){ return localizeSpokenLanguageName(l, state.activeLangCode); }).join(', ');
var verText = translateFacet(item.verificationStatus);
var expBadge = '<span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.years_of_experience) + '</span>' + escapeHtml(t('cardYrsExp'));
var bookLbl = escapeHtml(t('cardBookConsult')) + ' (<span class="sb-ltr-inline" dir="ltr">' + feeFormatted + '</span>)';
var viewHospLbl = escapeHtml(t('btnViewHospital')) + ' (' + escapeHtml(facName) + ')';
var viewPkgLbl = escapeHtml(t('cardViewPackages'));
var docSpecCode = String(item.specialty_code || 'SPEC-01').toUpperCase();
var rawPhoto = String(item.doctor_photo_url || '');
var avatarSrc = (rawPhoto.indexOf('/media/doctors/') !== -1) ? escapeHtml(rawPhoto) : (CDN_MEDIA_BASE + '/doctors/doc-' + pad2Num((hashCodeNum(docId) % 30) + 1) + '.webp');
var docSpecIcon = String(item.specialty_icon_url || (CDN_MEDIA_BASE + '/specialties/' + encodeURIComponent(docSpecCode) + '.svg'));
var docAlt = (item.seo && item.seo.image_alt && pickLocalized(item.seo.image_alt, lang)) ? pickLocalized(item.seo.image_alt, lang) : (docName + ', ' + primSpec + ', ' + facName);
return (
'<article class="sb-card sb-card-doctor" data-listing-id="' + escapeHtml(docId) + '" data-doctor-id="' + escapeHtml(docId) + '" data-facility-id="' + escapeHtml(facId) + '">' +
'<div class="sb-card-body">' +
'<div class="sb-card-meta-top">' +
'<span class="sb-badge-type"><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(docId) + '</span></span>' +
'<span class="sb-card-location">' + expBadge + ' · ' + escapeHtml(t('labelProceduresCount')) + ': <span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.procedures_performed_count || '1,000+') + '</span></span>' +
'</div>' +
'<div class="sb-card-media-top"><div class="sb-card-avatar-frame"><img class="sb-card-avatar-img" src="' + avatarSrc + '" alt="' + escapeHtml(docAlt) + '" width="72" height="72" loading="lazy" decoding="async" fetchpriority="low" data-sb-fallback="doctor" data-sb-label="' + escapeHtml(docName) + '" data-sb-code="' + escapeHtml(docSpecCode) + '" onerror="window.__sbImgFallback &amp;&amp; window.__sbImgFallback(this)"/><img class="sb-card-avatar-spec-icon" src="' + escapeHtml(docSpecIcon) + '" alt="" width="22" height="22" loading="lazy" decoding="async"/></div><h3 class="sb-card-title">' + escapeHtml(docName) + '</h3></div>' +
'<div class="sb-card-labels">' +
'<span class="sb-chip sb-chip-acc">' + escapeHtml(primSpec) + '</span>' +
'<span class="sb-chip sb-chip-sage">' + escapeHtml(facName) + ' (<span class="sb-ltr-inline" dir="ltr">' + escapeHtml(facId) + '</span>)</span>' +
'</div>' +
'<p class="sb-card-snippet">' + escapeHtml(bio) + '</p>' +
'<div class="sb-card-relational-meta">' +
'<div><strong>' + escapeHtml(t('cardSubSpecsLabel')) + '</strong>' + escapeHtml(subSpecs) + '</div>' +
'<div><strong>' + escapeHtml(t('cardQualificationsLabel')) + '</strong>' + escapeHtml(edu) + '</div>' +
(awards ? '<div><strong>' + escapeHtml(t('cardAwardsLabel')) + '</strong>' + escapeHtml(awards) + '</div>' : '') +
'<div><strong>' + escapeHtml(t('cardLanguagesLabel')) + '</strong>' + escapeHtml(langsStr) + '</div>' +
'</div>' +
'<div class="sb-card-price-row">' +
'<span class="sb-card-price-label">' + escapeHtml(t('labelConsultationFee')) + ': </span> ' +
'<strong class="sb-card-price-val"><span class="sb-ltr-inline" dir="ltr">' + feeFormatted + '</span></strong>' +
'</div>' +
'<div class="sb-card-review-row">' +
'<span>' + escapeHtml(verText) + '</span> · ' +
'<span>' + escapeHtml(t('lastReviewed')) + '<time class="sb-ltr-inline" dir="ltr" datetime="' + escapeHtml(item.lastReviewed) + '">' + escapeHtml(item.lastReviewed) + '</time></span>' +
'</div>' +
'<div class="sb-card-crosslinks">' +
'<button type="button" class="sb-chip sb-chip-crosslink" data-sb-action="crosslink-hub" data-target-hub="hospitals" data-facility-id="' + escapeHtml(facId) + '">' +
'🏥 ' + viewHospLbl +
'</button>' +
'<button type="button" class="sb-chip sb-chip-crosslink" data-sb-action="crosslink-hub" data-target-hub="costs" data-doctor-id="' + escapeHtml(docId) + '">' +
'💰 ' + viewPkgLbl +
'</button>' +
'</div>' +
'<div class="sb-card-footer">' +
'<div class="sb-card-primary-actions">' +
(item.doctor_profile_url ? '<a class="sb-btn sb-btn-secondary sb-btn-sm" href="' + sanitizeUrl(item.doctor_profile_url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(t('officialSourceBtn') + ' — ' + docName) + '">' + escapeHtml(t('officialSourceBtn')) + '</a>' : '') +
'<button type="button" class="sb-btn sb-btn-primary sb-btn-sm" data-sb-action="open-quote" data-provider-name="' + escapeHtml(docId + ' — ' + docName + ' (' + facName + ')') + '">' + bookLbl + '</button>' +
'</div>' +
'</div>' +
'</div>' +
'</article>'
);
}
function renderCostCard(item, lang) {
var costId = item.cost_id || item.id;
var procName = pickLocalized(item.procedure_name, lang);
var specCat = pickLocalized(item.specialty_category, lang);
var facName = pickLocalized(item.facility_name, lang);
var facId = item.facility_id || '';
var docName = pickLocalized(item.lead_doctor_name, lang);
var docId = item.lead_doctor_id || '';
var inclusions = pickLocalized(item.package_inclusions, lang);
var verText = translateFacet(item.verificationStatus);
var avgFormatted = formatMoney(item.price_avg_package_usd, state.currency);
var lowFormatted = formatMoney(item.price_low_usd, state.currency);
var highFormatted = formatMoney(item.price_high_complex_usd, state.currency);
var usFormatted = formatMoney(item.us_benchmark_price_usd, state.currency);
var savingsFormatted = formatMoney(item.estimated_savings_usd, state.currency);
var quoteTriggerLabel = escapeHtml(t('cardGetQuoteBtn'));
var hospDetailsLabel = escapeHtml(t('cardHospDetailsBtn'));
var leadSurgeonLabel = escapeHtml(t('cardLeadSurgeonBtn')) + ' (' + escapeHtml(docName) + ')';
var procCodeStr = String(item.procedure_code || 'PROC-01').toUpperCase();
var costSpecCode = String(item.specialty_code || 'SPEC-01').toUpperCase();
var rawTreatImg = String(item.treatment_image_url || '');
var treatBannerUrl = (rawTreatImg.indexOf('/media/treatments/') !== -1) ? rawTreatImg : (CDN_MEDIA_BASE + '/treatments/' + encodeURIComponent(procCodeStr) + '.webp');
var costSpecIcon = String(item.specialty_icon_url || (CDN_MEDIA_BASE + '/specialties/' + encodeURIComponent(costSpecCode) + '.svg'));
var costAlt = (item.seo && item.seo.image_alt && pickLocalized(item.seo.image_alt, lang)) ? pickLocalized(item.seo.image_alt, lang) : (procName + ', ' + facName);
return (
'<article class="sb-card sb-card-cost" data-listing-id="' + escapeHtml(costId) + '" data-cost-id="' + escapeHtml(costId) + '" data-facility-id="' + escapeHtml(facId) + '" data-doctor-id="' + escapeHtml(docId) + '">' +
'<div class="sb-card-media-frame">' +
'<img class="sb-card-banner-img" src="' + escapeHtml(treatBannerUrl) + '" alt="' + escapeHtml(costAlt) + '" width="800" height="450" loading="lazy" decoding="async" fetchpriority="low" data-sb-fallback="banner" data-sb-label="' + escapeHtml(procName) + '" data-sb-code="' + escapeHtml(procCodeStr) + '" onerror="window.__sbImgFallback &amp;&amp; window.__sbImgFallback(this)"/>' +
'<div class="sb-card-spec-badge"><img class="sb-card-logo-img" src="' + escapeHtml(costSpecIcon) + '" alt="" width="44" height="44" loading="lazy" decoding="async" fetchpriority="low"/></div>' +
'</div>' +
'<div class="sb-card-body">' +
'<div class="sb-card-meta-top">' +
'<span class="sb-badge-type"><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.procedure_code || costId) + '</span></span>' +
'<span class="sb-card-location"><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.cpt_icd_code || '') + '</span></span>' +
'</div>' +
'<h3 class="sb-card-title">' + escapeHtml(procName) + '</h3>' +
'<div class="sb-card-labels">' +
'<span class="sb-chip sb-chip-acc">' + escapeHtml(specCat) + '</span>' +
'<span class="sb-chip">' + escapeHtml(facName) + ' (<span class="sb-ltr-inline" dir="ltr">' + escapeHtml(facId) + '</span>)</span>' +
'<span class="sb-chip sb-chip-sage">' + escapeHtml(docName) + ' (<span class="sb-ltr-inline" dir="ltr">' + escapeHtml(docId) + '</span>)</span>' +
'</div>' +
'<div class="sb-card-price-row">' +
'<span class="sb-card-price-label">' + escapeHtml(t('cardAvgPkgPrice')) + '</span> ' +
'<strong class="sb-card-price-val"><span class="sb-ltr-inline" dir="ltr">' + avgFormatted + '</span></strong> ' +
'<span class="sb-card-price-date">(<span class="sb-ltr-inline" dir="ltr">' + lowFormatted + ' – ' + highFormatted + '</span> · ' + escapeHtml(item.local_currency_estimate || '') + ')</span>' +
'</div>' +
'<div class="sb-card-relational-meta">' +
'<div><strong>' + escapeHtml(t('labelSavingsVsUs')) + ': </strong><span class="sb-ltr-inline" dir="ltr">' + savingsFormatted + ' (' + escapeHtml(item.estimated_savings_pct) + '% vs. ' + usFormatted + ')</span> · <strong>' + escapeHtml(t('cardSuccessRate')) + '</strong><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(String(pickLocalized(item.clinical_success_rate, lang) || '98.2%').replace(/graft patency & procedural survival rate|procedural deployment success/gi, '').trim()) + '</span></div>' +
'<div><strong>' + escapeHtml(t('cardHospStay')) + '</strong><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.hospital_stay_days) + 'd</span> · <strong>' + escapeHtml(t('cardLocalRecovery')) + '</strong><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.mandatory_local_recovery_days) + 'd</span> · <strong>' + escapeHtml(t('labelFitToFly')) + ': </strong><span class="sb-ltr-inline" dir="ltr">' + escapeHtml(item.fit_to_fly_clearance_days) + 'd</span></div>' +
'<div><strong>' + escapeHtml(t('cardPkgInclusions')) + '</strong>' + escapeHtml(inclusions) + '</div>' +
'</div>' +
'<div class="sb-card-review-row">' +
'<span>' + escapeHtml(verText) + '</span> · ' +
'<span>' + escapeHtml(t('lastReviewed')) + '<time class="sb-ltr-inline" dir="ltr" datetime="' + escapeHtml(item.lastReviewed) + '">' + escapeHtml(item.lastReviewed) + '</time></span>' +
'</div>' +
'<div class="sb-card-crosslinks">' +
'<button type="button" class="sb-chip sb-chip-crosslink" data-sb-action="crosslink-hub" data-target-hub="hospitals" data-facility-id="' + escapeHtml(facId) + '">' +
'🏥 ' + hospDetailsLabel +
'</button>' +
'<button type="button" class="sb-chip sb-chip-crosslink" data-sb-action="crosslink-hub" data-target-hub="doctors" data-doctor-id="' + escapeHtml(docId) + '">' +
'👨‍⚕️ ' + leadSurgeonLabel +
'</button>' +
'</div>' +
'<div class="sb-card-footer">' +
'<div class="sb-card-primary-actions">' +
(item.package_quote_url ? '<a class="sb-btn sb-btn-secondary sb-btn-sm" href="' + sanitizeUrl(item.package_quote_url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(t('officialSourceBtn') + ' — ' + procName + ' (' + facName + ')') + '">' + escapeHtml(t('officialSourceBtn')) + '</a>' : '') +
'<button type="button" class="sb-btn sb-btn-primary sb-btn-sm" data-sb-action="open-quote" data-provider-name="' + escapeHtml(costId + ' — ' + procName + ' @ ' + facName) + '">' + quoteTriggerLabel + '</button>' +
'</div>' +
'</div>' +
'</div>' +
'</article>'
);
}
function renderDirectoryCards() {
var container = document.getElementById('sb-cards-container');
if (!container) return;
var lang = getLang();
var filtered = getFilteredListings();
var totalList = state.datasets[state.hub] || state.datasets.hospitals;
var total = totalList.length;
var countEl = document.getElementById('sb-results-count');
if (countEl) {
var baseCountStr = t('showingCount')
.replace('{n}', String(filtered.length))
.replace('{total}', String(total));
var suffix = t('showingIndexedSuffix');
countEl.textContent = baseCountStr + (suffix && suffix !== 'showingIndexedSuffix' ? suffix : '');
}
var announcer = document.getElementById('sb-aria-results-announcer');
if (announcer) {
announcer.textContent = countEl ? countEl.textContent : '';
}
updateActiveFilterCount();
if (filtered.length === 0) {
container.innerHTML =
'<div class="sb-empty-state" role="status">' +
'<h3 class="sb-empty-title">' + t('noResultsTitle') + '</h3>' +
'<p class="sb-empty-desc">' + t('noResultsDesc') + '</p>' +
'<div class="sb-empty-actions">' +
'<button type="button" class="sb-btn sb-btn-primary" data-sb-action="reset-filters">' + t('resetFilters') + '</button>' +
'<button type="button" class="sb-btn sb-btn-secondary" data-sb-action="open-quote">' + t('requestQuote') + '</button>' +
'</div>' +
'</div>';
return;
}
var limit = state.visibleLimit || 24;
var sliceLen = Math.min(filtered.length, limit);
var html = '';
for (var i = 0; i < sliceLen; i++) {
var item = filtered[i];
if (state.hub === 'doctors') {
html += renderDoctorCard(item, lang);
} else if (state.hub === 'costs') {
html += renderCostCard(item, lang);
} else {
html += renderHospitalCard(item, lang);
}
}
container.innerHTML = html;
var firstBanner = container.querySelector('.sb-card-banner-img');
if (firstBanner) { firstBanner.setAttribute('loading', 'eager'); firstBanner.setAttribute('fetchpriority', 'high'); }
var moreWrap = document.getElementById('sb-load-more-wrap');
if (!moreWrap && container.parentNode) {
moreWrap = document.createElement('div');
moreWrap.id = 'sb-load-more-wrap';
moreWrap.className = 'sb-pagination';
container.parentNode.appendChild(moreWrap);
}
if (moreWrap) {
var remaining = filtered.length - sliceLen;
if (remaining > 0) {
moreWrap.hidden = false;
moreWrap.innerHTML = '<button type="button" class="sb-btn sb-btn-secondary" data-sb-action="load-more-cards">' + escapeHtml(t('loadMoreBtn')) + ' (+' + remaining + ')</button>';
} else {
moreWrap.hidden = true;
moreWrap.innerHTML = '';
}
}
}
function resetAllFilters() {
state.query = '';
state.scope = 'all';
state.providerType = '';
state.specialty = '';
state.subSpecialty = '';
state.procedureCode = '';
state.destination = '';
state.city = '';
state.accreditation = '';
state.arabCare = '';
state.logistics = '';
state.minExperience = 0;
state.spokenLang = '';
state.maxConsultFee = 0;
state.maxPrice = 0;
state.maxFitToFly = 0;
state.facilityFilter = '';
state.doctorFilter = '';
state.procFilter = '';
var searchInput = document.getElementById('sb-search-input');
if (searchInput) searchInput.value = '';
var selects = [
'sb-filter-provider-type', 'sb-filter-specialty', 'sb-filter-subspecialty', 'sb-filter-procedure',
'sb-filter-destination', 'sb-filter-city', 'sb-filter-accreditation',
'sb-filter-arab-care', 'sb-filter-logistics', 'sb-filter-billing-visa',
'sb-filter-experience', 'sb-filter-min-exp',
'sb-filter-doc-lang', 'sb-filter-consult-fee', 'sb-filter-max-fee',
'sb-filter-price', 'sb-filter-fit-to-fly'
];
for (var i = 0; i < selects.length; i++) {
var sel = document.getElementById(selects[i]);
if (sel) sel.value = '';
}
var scopeBtns = document.querySelectorAll('.sb-scope-btn');
for (var j = 0; j < scopeBtns.length; j++) {
var isAll = scopeBtns[j].getAttribute('data-scope') === 'all';
scopeBtns[j].classList.toggle('active', isAll);
scopeBtns[j].setAttribute('aria-pressed', isAll ? 'true' : 'false');
}
renderDirectoryCards();
syncUrlParams();
}
function updateBadgeCounts() {
var sCounts = document.querySelectorAll('.sb-shortlist-count');
for (var i = 0; i < sCounts.length; i++) {
sCounts[i].textContent = String(state.shortlist.length);
}
var cCounts = document.querySelectorAll('.sb-compare-count');
for (var j = 0; j < cCounts.length; j++) {
cCounts[j].textContent = String(state.compare.length);
}
}
function toggleShortlist(id) {
var idx = state.shortlist.indexOf(id);
if (idx === -1) {
state.shortlist.push(id);
} else {
state.shortlist.splice(idx, 1);
}
saveIds(STORAGE_SHORTLIST, state.shortlist);
updateBadgeCounts();
renderDirectoryCards();
renderShortlistBody();
}
function toggleCompare(id) {
var idx = state.compare.indexOf(id);
if (idx === -1) {
if (state.compare.length >= 3) {
state.compare.shift();
}
state.compare.push(id);
} else {
state.compare.splice(idx, 1);
}
saveIds(STORAGE_COMPARE, state.compare);
updateBadgeCounts();
renderDirectoryCards();
renderCompareBody();
}
function renderShortlistBody() {
var body = document.getElementById('sb-shortlist-modal-body');
if (!body) return;
var lang = getLang();
if (state.shortlist.length === 0) {
body.innerHTML = '<p class="sb-empty-modal-msg">' + t('shortlistEmpty') + '</p>';
return;
}
var html = '<div class="sb-shortlist-items">';
for (var i = 0; i < state.shortlist.length; i++) {
var id = state.shortlist[i];
var item = state.datasets.hospitals.find(function (x) { return x.id === id || x.facility_id === id; });
if (!item) continue;
var title = pickLocalized(item.facility_name || item.title, lang);
var loc = pickLocalized(item.locationLabel, lang);
var url = resolveItemUrl(item);
html +=
'<div class="sb-shortlist-row">' +
'<div>' +
'<strong><a href="' + url + '">' + title + '</a></strong>' +
'<div class="sb-text-muted">' + loc + '</div>' +
'</div>' +
'<div class="sb-shortlist-row-actions">' +
'<button type="button" class="sb-btn sb-btn-primary sb-btn-sm" data-sb-action="open-quote" data-provider-name="' + title.replace(/"/g, '&quot;') + '">' + t('requestQuote') + '</button>' +
'<button type="button" class="sb-btn sb-btn-secondary sb-btn-sm" data-sb-action="toggle-shortlist" data-listing-id="' + (item.facility_id || item.id) + '">' + t('removeBtn') + '</button>' +
'</div>' +
'</div>';
}
html += '</div>';
body.innerHTML = html;
}
function buildCompareTableHtml() {
var lang = getLang();
if (state.compare.length === 0) {
return '<p class="sb-empty-modal-msg">' + t('compareEmpty') + '</p>';
}
var items = state.compare.map(function (id) {
return state.datasets.hospitals.find(function (x) { return x.id === id || x.facility_id === id; });
}).filter(Boolean);
var ths = items.map(function (it) {
var title = pickLocalized(it.facility_name || it.title, lang);
var url = resolveItemUrl(it);
return '<th><a href="' + url + '">' + title + '</a>' +
' <button type="button" class="sb-link-btn" data-sb-action="toggle-compare" data-listing-id="' + (it.facility_id || it.id) + '">(' + t('removeBtn') + ')</button></th>';
}).join('');
var rowLoc = items.map(function (it) { return '<td>' + pickLocalized(it.locationLabel, lang) + '</td>'; }).join('');
var rowAcc = items.map(function (it) { return '<td>' + (it.accreditations || []).map(translateFacet).join(' · ') + '</td>'; }).join('');
var rowSpec = items.map(function (it) { return '<td>' + (it.specialties || []).map(translateFacet).join(' · ') + '</td>'; }).join('');
var rowArab = items.map(function (it) { return '<td>' + (it.arabCare || []).map(translateFacet).join(' · ') + '</td>'; }).join('');
var rowPrice = items.map(function (it) {
if (it.priceDated && it.minPriceUsd > 0) {
return '<td><strong>' + formatMoney(it.minPriceUsd, state.currency) + ' – ' + formatMoney(it.maxPriceUsd, state.currency) + '</strong> (' + it.sourceDate + ')</td>';
}
return '<td>' + t('enquiryOnly') + '</td>';
}).join('');
var rowVer = items.map(function (it) { return '<td>' + translateFacet(it.verificationStatus) + ' (' + it.lastReviewed + ')</td>'; }).join('');
var rowCta = items.map(function (it) {
var title = pickLocalized(it.facility_name || it.title, lang).replace(/"/g, '&quot;');
return '<td><button type="button" class="sb-btn sb-btn-primary sb-btn-sm" data-sb-action="open-quote" data-provider-name="' + title + '">' + t('requestQuote') + '</button></td>';
}).join('');
var labels = {
f: escapeHtml(t('cmpColAttr')),
loc: escapeHtml(t('cmpColLoc')),
acc: escapeHtml(t('cmpColAcc')),
sp: escapeHtml(t('cmpColSpec')),
ar: escapeHtml(t('cmpColArab')),
pr: escapeHtml(t('cmpColPrice')),
vr: escapeHtml(t('cmpColVer')),
act: escapeHtml(t('cmpColAct'))
};
return (
'<div class="sb-compare-table-wrapper">' +
'<table class="sb-compare-table">' +
'<thead><tr><th scope="col">' + labels.f + '</th>' + ths + '</tr></thead>' +
'<tbody>' +
'<tr><th scope="row">' + labels.loc + '</th>' + rowLoc + '</tr>' +
'<tr><th scope="row">' + labels.acc + '</th>' + rowAcc + '</tr>' +
'<tr><th scope="row">' + labels.sp + '</th>' + rowSpec + '</tr>' +
'<tr><th scope="row">' + labels.ar + '</th>' + rowArab + '</tr>' +
'<tr><th scope="row">' + labels.pr + '</th>' + rowPrice + '</tr>' +
'<tr><th scope="row">' + labels.vr + '</th>' + rowVer + '</tr>' +
'<tr><th scope="row">' + labels.act + '</th>' + rowCta + '</tr>' +
'</tbody>' +
'</table>' +
'</div>'
);
}
function renderCompareBody() {
var html = buildCompareTableHtml();
var modalBody = document.getElementById('sb-compare-modal-body');
if (modalBody) modalBody.innerHTML = html;
var pageContainer = document.getElementById('sb-compare-page-container');
if (pageContainer) pageContainer.innerHTML = html;
}
function applyDestinationDefaults(destKey) {
var defs = DESTINATION_DEFAULTS[destKey];
if (!defs) return;
var aptEl = document.getElementById('sb-calc-apt-rate');
var flPatEl = document.getElementById('sb-calc-flight-patient');
var flCompEl = document.getElementById('sb-calc-flight-companion');
var visaEl = document.getElementById('sb-calc-visa-fee');
var dailyEl = document.getElementById('sb-calc-daily-living');
if (aptEl) aptEl.value = String(defs.aptRate);
if (flPatEl) flPatEl.value = String(defs.flightPatient);
if (flCompEl) flCompEl.value = String(defs.flightCompanion);
if (visaEl) visaEl.value = String(defs.visaFee);
if (dailyEl) dailyEl.value = String(defs.dailyLiving);
}
function updateCalculator(updateStayFromMatrix) {
var procEl = document.getElementById('sb-calc-procedure');
var destEl = document.getElementById('sb-calc-destination');
var currEl = document.getElementById('sb-calc-currency');
if (!procEl || !destEl) return;
var proc = procEl.value || 'PROC-01';
var dest = destEl.value || 'india';
var currency = (currEl && currEl.value) ? currEl.value : state.currency;
state.currency = currency;
var entry = (COST_MATRIX[proc] && COST_MATRIX[proc][dest]) || COST_MATRIX['PROC-01'].india;
var hospNightsEl = document.getElementById('sb-calc-hosp-nights');
var recovNightsEl = document.getElementById('sb-calc-recov-nights');
if (updateStayFromMatrix) {
if (hospNightsEl) hospNightsEl.value = String(entry.hospNights);
if (recovNightsEl) recovNightsEl.value = String(entry.recovNights);
}
var transplantNotice = document.getElementById('sb-calc-transplant-notice');
if (transplantNotice) {
transplantNotice.hidden = !(proc === 'kidney_transplant' || entry.transplantNotice);
}
var undatedNotice = document.getElementById('sb-calc-undated-notice');
if (undatedNotice) {
undatedNotice.hidden = !!entry.dated;
}
var hospNights = Number(hospNightsEl ? hospNightsEl.value : entry.hospNights) || 0;
var recovNights = Number(recovNightsEl ? recovNightsEl.value : entry.recovNights) || 0;
var aptRate = Number((document.getElementById('sb-calc-apt-rate') || {}).value) || 55;
var companions = Number((document.getElementById('sb-calc-companions') || {}).value) || 0;
var flightPatient = Number((document.getElementById('sb-calc-flight-patient') || {}).value) || 380;
var flightCompanion = Number((document.getElementById('sb-calc-flight-companion') || {}).value) || 380;
var visaFee = Number((document.getElementById('sb-calc-visa-fee') || {}).value) || 80;
var dailyLiving = Number((document.getElementById('sb-calc-daily-living') || {}).value) || 35;
var hospMidUsd = entry.max > 0 ? Math.round((entry.min + entry.max) / 2) : 0;
var totalDays = hospNights + recovNights;
var totalTravellers = 1 + Math.max(0, companions);
var stayCostUsd = recovNights * aptRate;
var flightsCostUsd = flightPatient + (Math.max(0, companions) * flightCompanion);
var visasCostUsd = totalTravellers * visaFee;
var livingCostUsd = totalDays * dailyLiving * totalTravellers;
var travelTotalUsd = stayCostUsd + flightsCostUsd + visasCostUsd + livingCostUsd;
var grandTotalUsd = hospMidUsd + travelTotalUsd;
var totalValEl = document.getElementById('sb-calc-total-val');
var hospShareEl = document.getElementById('sb-calc-hosp-share');
var travelShareEl = document.getElementById('sb-calc-travel-share');
if (totalValEl) {
totalValEl.textContent = hospMidUsd > 0
? formatMoney(grandTotalUsd, currency)
: formatMoney(travelTotalUsd, currency) + ' + ' + t('enquiryOnly');
}
if (hospShareEl) {
hospShareEl.textContent = hospMidUsd > 0
? formatMoney(entry.min, currency) + ' – ' + formatMoney(entry.max, currency)
: t('enquiryOnly');
}
if (travelShareEl) {
travelShareEl.textContent = formatMoney(travelTotalUsd, currency);
}
renderDirectoryCards();
}
function getFocusableElements(root) {
if (!root) return [];
var nodes = root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
return Array.prototype.slice.call(nodes).filter(function (el) {
return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
});
}
function openModal(modalId, triggerEl, providerName) {
var modal = document.getElementById(modalId);
if (!modal) return;
state.lastFocusedElement = triggerEl || document.activeElement;
modal.setAttribute('aria-hidden', 'false');
modal.classList.add('is-open');
document.body.classList.add('sb-modal-open');
if (modalId === 'sb-mobile-drawer') {
var menuBtn = document.getElementById('sb-mobile-menu-btn');
if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
}
if (modalId === 'sb-filters-sheet') {
var filterBtn = document.getElementById('sb-mobile-filters-btn');
if (filterBtn) filterBtn.setAttribute('aria-expanded', 'true');
}
if (modalId === 'sb-quote-modal' && providerName) {
var provInput = document.getElementById('sb-quote-provider');
if (provInput) provInput.value = providerName;
var provBadge = document.getElementById('sb-quote-provider-display');
if (provBadge) {
provBadge.textContent = providerName;
provBadge.hidden = false;
}
}
if (modalId === 'sb-shortlist-modal') renderShortlistBody();
if (modalId === 'sb-compare-modal') renderCompareBody();
if (modalId === 'sb-lang-modal') {
var searchInp = document.getElementById('sb-lang-search-input');
if (searchInp) searchInp.value = '';
renderLanguageModalRegions('');
}
var focusables = getFocusableElements(modal);
if (focusables.length > 0) {
setTimeout(function () { focusables[0].focus(); }, 20);
}
}
function closeModal(modalId) {
var modal = document.getElementById(modalId);
if (!modal) return;
modal.setAttribute('aria-hidden', 'true');
modal.classList.remove('is-open');
document.body.classList.remove('sb-modal-open');
if (modalId === 'sb-mobile-drawer') {
var menuBtn = document.getElementById('sb-mobile-menu-btn');
if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
}
if (modalId === 'sb-filters-sheet') {
var filterBtn = document.getElementById('sb-mobile-filters-btn');
if (filterBtn) filterBtn.setAttribute('aria-expanded', 'false');
}
if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
state.lastFocusedElement.focus();
state.lastFocusedElement = null;
}
}
function populateAttributionFields() {
try {
var params = new URLSearchParams(window.location.search);
var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'sccid', 'ttclid'];
for (var i = 0; i < keys.length; i++) {
var k = keys[i];
var val = params.get(k) || '';
var input = document.getElementById('sb-attr-' + k);
if (input && val) input.value = val;
}
} catch (e) {}
}
var lastFormSubmitTs = 0;
function saveLeadToLocalStorage(leadRecord) {
try {
var raw = localStorage.getItem('sb_v3_leads_backup') || '[]';
var list = JSON.parse(raw);
if (!Array.isArray(list)) list = [];
list.unshift(leadRecord);
if (list.length > 50) list = list.slice(0, 50);
localStorage.setItem('sb_v3_leads_backup', JSON.stringify(list));
} catch (e) {}
}
var lastSubmittedSignatures = {};
function submitToGoogleSheets(endpointUrl, payloadObj) {
var resolvedEndpoint = String(endpointUrl || (window.SB_CONFIG && window.SB_CONFIG.googleSheetsWebhookUrl) || (document.body && document.body.getAttribute('data-sheets-webhook-url')) || DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL || '').trim();
if (window.SB_TEST_MODE || (window.location && /[?&](?:test_mode|sb_dry_run)=1/.test(window.location.search))) {
return Promise.resolve({ ok: true, delivered: true, mode: 'test-dry-run' });
}
if (!resolvedEndpoint || /^(?:TODO_VERIFY|PASTE_YOUR)/i.test(resolvedEndpoint) || typeof window.fetch !== 'function') {
return Promise.resolve({ ok: false, delivered: false, mode: 'unconfigured' });
}
endpointUrl = resolvedEndpoint;
return window.fetch(endpointUrl, {
method: 'POST',
headers: { 'Content-Type': 'text/plain;charset=utf-8' },
body: JSON.stringify(payloadObj)
}).then(function (res) {
if (res && (res.ok || res.type === 'opaque')) {
return { ok: true, delivered: res.ok === true, mode: 'google-sheets' };
}
return { ok: false, delivered: false, mode: 'http-error' };
}).catch(function () {
return { ok: false, delivered: false, mode: 'network-error' };
});
}
function bindForms() {
var quoteForm = document.getElementById('sb-quote-form');
if (quoteForm) {
quoteForm.addEventListener('submit', function (e) {
e.preventDefault();
var hp = document.getElementById('sb-quote-hp');
if (hp && hp.value) return;
var now = Date.now();
if (now - lastFormSubmitTs < 2500) return;
var nameEl = document.getElementById('sb-quote-name');
var phoneEl = document.getElementById('sb-quote-phone');
var emailEl = document.getElementById('sb-quote-email');
var countryEl = document.getElementById('sb-quote-country');
var destEl = document.getElementById('sb-quote-dest');
var notesEl = document.getElementById('sb-quote-notes');
var provEl = document.getElementById('sb-quote-provider');
var consentEl = document.getElementById('sb-quote-consent');
var alertEl = document.getElementById('sb-quote-unconnected-alert');
var statusEl = document.getElementById('sb-form-status');
var nameInvalid = !nameEl || !nameEl.value.trim();
var phoneInvalid = !phoneEl || !phoneEl.value.trim();
var consentInvalid = !!(consentEl && !consentEl.checked);
if (nameEl) {
nameEl.setAttribute('aria-invalid', nameInvalid ? 'true' : 'false');
if (nameInvalid) nameEl.setAttribute('aria-describedby', 'sb-quote-unconnected-alert sb-form-status');
else nameEl.removeAttribute('aria-describedby');
}
if (phoneEl) {
phoneEl.setAttribute('aria-invalid', phoneInvalid ? 'true' : 'false');
if (phoneInvalid) phoneEl.setAttribute('aria-describedby', 'sb-quote-unconnected-alert sb-form-status');
else phoneEl.removeAttribute('aria-describedby');
}
if (consentEl) {
consentEl.setAttribute('aria-invalid', consentInvalid ? 'true' : 'false');
if (consentInvalid) consentEl.setAttribute('aria-describedby', 'sb-quote-unconnected-alert sb-form-status');
else consentEl.removeAttribute('aria-describedby');
}
if (nameInvalid || phoneInvalid || consentInvalid) {
var errMsg = t('formErrorRequired');
if (alertEl) {
alertEl.textContent = errMsg;
alertEl.hidden = false;
alertEl.setAttribute('role', 'alert');
alertEl.className = 'sb-alert-box sb-alert-error';
}
if (statusEl) {
statusEl.textContent = errMsg;
}
var firstInvalid = nameInvalid ? nameEl : (phoneInvalid ? phoneEl : consentEl);
if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
return;
}
var quoteSig = [nameEl.value.trim(), phoneEl.value.trim(), emailEl ? emailEl.value.trim() : '', destEl ? destEl.value : '', provEl ? provEl.value.trim() : '', notesEl ? notesEl.value.trim() : ''].join('|');
if (lastSubmittedSignatures.quote === quoteSig) return;
lastSubmittedSignatures.quote = quoteSig;
lastFormSubmitTs = now;
var refId = 'SB-' + Math.floor(100000 + Math.random() * 900000);
var calcTotalEl = document.getElementById('sb-calc-total-val');
var payload = {
formType:'quote_request',
referenceId: refId,
timestampIso: new Date().toISOString(),
language: state.activeLangCode || getLang(),
activeHub: state.hub,
provider: provEl ? provEl.value.trim() : '',
fullName: nameEl.value.trim(),
phone_prefix: (document.getElementById('sb-phone-prefix') ? document.getElementById('sb-phone-prefix').value : ''),
phone_number: phoneEl.value.trim(),
phoneWhatsApp: ((document.getElementById('sb-phone-prefix') ? document.getElementById('sb-phone-prefix').value + ' ' : '') + phoneEl.value.trim()).trim(),
treatment: (document.getElementById('sb-quote-treatment') ? document.getElementById('sb-quote-treatment').value : ''),
email: emailEl ? emailEl.value.trim() : '',
countryOfResidence: countryEl ? countryEl.value.trim() : '',
preferredDestination: destEl ? destEl.value : '',
medicalSummary: notesEl ? notesEl.value.trim() : '',
calculatorSnapshot: calcTotalEl ? calcTotalEl.textContent.trim() : '',
pageUrl: window.location.href
};
saveLeadToLocalStorage(payload);
var endpoint = quoteForm.getAttribute('data-endpoint-url') || DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL || '';
if (alertEl) {
alertEl.textContent = t('formSending');
alertEl.hidden = false;
alertEl.className = 'sb-alert-box';
}
var waDigits = (WHATSAPP_NUMBER || '96898212101').replace(/[^0-9]/g, '');
var waSummary = 'Hello SecretaryBird (' + refId + '), Name: ' + payload.fullName +
(payload.provider ? ', Provider: ' + payload.provider : '') +
(payload.preferredDestination ? ', Destination: ' + payload.preferredDestination : '') +
(payload.medicalSummary ? ', Notes: ' + payload.medicalSummary : '');
var waHref = 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent(waSummary);
var mailSubject = 'Treatment Comparison Request [' + refId + '] — ' + payload.fullName;
var mailHref = 'mailto:hello@thesecretarybird.com?subject=' + encodeURIComponent(mailSubject) + '&body=' + encodeURIComponent(waSummary);
submitToGoogleSheets(endpoint, payload).then(function (res) {
if (alertEl) {
alertEl.hidden = false;
if (res && res.ok) {
alertEl.innerHTML =
'<p><strong>' + escapeHtml(t('formSuccessTitle')) + '<span dir="ltr">' + escapeHtml(refId) + '</span></strong></p>' +
'<p>' + escapeHtml(t('formSuccessBody')) + '</p>' +
'<div class="sb-alert-links">' +
'<a class="sb-btn sb-btn-whatsapp sb-btn-sm" href="' + waHref + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t('formInstantWhatsApp')) + '</a>' +
'<a class="sb-btn sb-btn-secondary sb-btn-sm" href="' + mailHref + '">' + escapeHtml(t('formInstantEmail')) + '</a>' +
'</div>';
alertEl.className = 'sb-alert-box sb-alert-success';
} else {
var unconnTitle = (state.activeLangCode === 'ar')
? 'الإرسال التلقائي غير مفعّل حالياً — أرسل طلبك المجهّز مباشرة (' + refId + ')'
: 'Automated web delivery is not connected — send your prepared request directly (' + refId + ')';
var unconnDesc = (state.activeLangCode === 'ar')
? 'تم تجهيز تفاصيل طلبك وحفظ نسخة احتياطية في متصفحك. لإتمام إرسال طلبك فوراً إلى مكتب تنسيق المرضى، اختر واتساب أو البريد الإلكتروني أدناه:'
: 'Your inquiry details are prepared and saved locally in your browser. To complete delivery to our patient desk immediately, choose WhatsApp or Email below:';
alertEl.innerHTML =
'<p><strong>' + escapeHtml(unconnTitle) + '</strong></p>' +
'<p>' + escapeHtml(unconnDesc) + '</p>' +
'<div class="sb-alert-links">' +
'<a class="sb-btn sb-btn-whatsapp sb-btn-sm" href="' + waHref + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t('formInstantWhatsApp')) + '</a>' +
'<a class="sb-btn sb-btn-secondary sb-btn-sm" href="' + mailHref + '">' + escapeHtml(t('formInstantEmail')) + '</a>' +
'</div>';
alertEl.className = 'sb-alert-box sb-alert-unconnected';
}
}
});
});
}
var claimForm = document.getElementById('sb-claim-form');
if (claimForm) {
claimForm.addEventListener('submit', function (e) {
e.preventDefault();
var hp = document.getElementById('sb-claim-hp');
if (hp && hp.value) return;
var orgEl = document.getElementById('sb-claim-facility') || document.getElementById('sb-claim-org');
var roleEl = document.getElementById('sb-claim-name') || document.getElementById('sb-claim-role');
var emailEl = document.getElementById('sb-claim-email');
var msgEl = document.getElementById('sb-claim-details') || document.getElementById('sb-claim-notes') || claimForm.querySelector('textarea');
var fbEl = document.getElementById('sb-claim-feedback');
var firstClaimBad = null;
[].forEach.call(claimForm.querySelectorAll('[required]'), function (el) {
var bad = !String(el.value || '').trim();
el.setAttribute('aria-invalid', bad ? 'true' : 'false');
if (bad) {
el.setAttribute('aria-describedby', 'sb-claim-feedback');
if (!firstClaimBad) firstClaimBad = el;
} else {
el.removeAttribute('aria-describedby');
}
});
if (firstClaimBad) {
if (fbEl) {
fbEl.textContent = t('formErrorRequired');
fbEl.hidden = false;
fbEl.setAttribute('role', 'alert');
fbEl.className = 'sb-alert-box sb-alert-error';
}
if (typeof firstClaimBad.focus === 'function') firstClaimBad.focus();
return;
}
var claimSig = [orgEl ? orgEl.value.trim() : '', emailEl ? emailEl.value.trim() : '', roleEl ? roleEl.value.trim() : '', msgEl ? msgEl.value.trim() : ''].join('|');
if (lastSubmittedSignatures.claim === claimSig) return;
lastSubmittedSignatures.claim = claimSig;
var refId = 'SB-CLM-' + Math.floor(100000 + Math.random() * 900000);
var payload = {
formType:'claim_or_correction',
referenceId: refId,
timestampIso: new Date().toISOString(),
language: state.activeLangCode || getLang(),
hospitalName: orgEl ? orgEl.value.trim() : '',
officialEmail: emailEl ? emailEl.value.trim() : '',
role: roleEl ? roleEl.value.trim() : '',
details: msgEl ? msgEl.value.trim() : '',
pageUrl: window.location.href
};
saveLeadToLocalStorage(payload);
var endpoint = claimForm.getAttribute('data-endpoint-url') || DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL || '';
var alertEl = document.getElementById('sb-claim-feedback');
submitToGoogleSheets(endpoint, payload).then(function (res) {
if (alertEl) {
alertEl.hidden = false;
if (res && res.ok) {
alertEl.innerHTML =
'<p><strong>' + escapeHtml(t('formSuccessTitle')) + '<span dir="ltr">' + escapeHtml(refId) + '</span></strong></p>' +
'<p>' + escapeHtml(t('claimSuccessNotice')) + '</p>' +
'<div class="sb-alert-links">' +
'<a class="sb-btn sb-btn-secondary sb-btn-sm" href="mailto:hello@thesecretarybird.com?subject=' + encodeURIComponent('Listing Claim [' + refId + '] — ' + payload.hospitalName) + '">hello@thesecretarybird.com</a>' +
'</div>';
alertEl.className = 'sb-alert-box sb-alert-success';
} else {
alertEl.innerHTML =
'<p><strong>Automated claim webhook is not connected — send via Email (<span dir="ltr">' + escapeHtml(refId) + '</span>)</strong></p>' +
'<p>' + escapeHtml(t('claimSuccessNotice')) + '</p>' +
'<div class="sb-alert-links">' +
'<a class="sb-btn sb-btn-secondary sb-btn-sm" href="mailto:hello@thesecretarybird.com?subject=' + encodeURIComponent('Listing Claim [' + refId + '] — ' + payload.hospitalName) + '">hello@thesecretarybird.com</a>' +
'</div>';
alertEl.className = 'sb-alert-box sb-alert-unconnected';
}
}
});
});
}
}
function bindEvents() {
var searchInput = document.getElementById('sb-search-input');
if (searchInput) {
var debouncedSearch = debounce(function () {
state.query = searchInput.value.trim();
renderDirectoryCards();
syncUrlParams();
}, 120);
searchInput.addEventListener('input', debouncedSearch);
}
var langSearchInput = document.getElementById('sb-lang-search-input');
if (langSearchInput) {
langSearchInput.addEventListener('input', function () {
renderLanguageModalRegions(langSearchInput.value);
});
}
var scopeBtns = document.querySelectorAll('.sb-scope-btn');
for (var i = 0; i < scopeBtns.length; i++) {
scopeBtns[i].addEventListener('click', function (ev) {
var btn = ev.currentTarget;
state.scope = btn.getAttribute('data-scope') || 'all';
for (var k = 0; k < scopeBtns.length; k++) {
var active = scopeBtns[k] === btn;
scopeBtns[k].classList.toggle('active', active);
scopeBtns[k].setAttribute('aria-pressed', active ? 'true' : 'false');
}
renderDirectoryCards();
});
}
var filterMap = [
{ id: 'sb-filter-provider-type', key: 'providerType' },
{ id: 'sb-filter-specialty', key: 'specialty' },
{ id: 'sb-filter-subspecialty', key: 'subSpecialty' },
{ id: 'sb-filter-procedure', key: 'procFilter' },
{ id: 'sb-filter-destination', key: 'destination' },
{ id: 'sb-filter-city', key: 'city' },
{ id: 'sb-filter-accreditation', key: 'accreditation' },
{ id: 'sb-filter-arab-care', key: 'arabCare' },
{ id: 'sb-filter-logistics', key: 'logistics' },
{ id: 'sb-filter-billing-visa', key: 'logistics' },
{ id: 'sb-filter-experience', key: 'minExperience', isNum: true },
{ id: 'sb-filter-min-exp', key: 'minExperience', isNum: true },
{ id: 'sb-filter-doc-lang', key: 'spokenLang' },
{ id: 'sb-filter-consult-fee', key: 'maxConsultFee', isNum: true },
{ id: 'sb-filter-max-fee', key: 'maxConsultFee', isNum: true },
{ id: 'sb-filter-price', key: 'maxPrice', isNum: true },
{ id: 'sb-filter-fit-to-fly', key: 'maxFitToFly', isNum: true }
];
filterMap.forEach(function (f) {
var el = document.getElementById(f.id);
if (el) {
el.addEventListener('change', function () {
state[f.key] = f.isNum ? (Number(el.value) || 0) : el.value;
state.visibleLimit = 24;
if (f.key === 'destination') {
state.city = '';
var citySelEl = document.getElementById('sb-filter-city');
if (citySelEl) {
var allLbl = t('filterAllCities') || 'All Cities';
var optsHtml = '<option value="">' + escapeHtml(allLbl) + '</option>';
var seenC = {};
for (var ci = 0; ci < ALL_CITIES_INDEX.length; ci++) {
var cRow = ALL_CITIES_INDEX[ci];
if ((!state.destination || cRow[2] === state.destination) && !seenC[cRow[0]]) {
seenC[cRow[0]] = 1;
optsHtml += '<option value="' + escapeHtml(cRow[0]) + '">' + escapeHtml(cRow[1]) + '</option>';
}
}
citySelEl.innerHTML = optsHtml;
citySelEl.value = '';
}
}
renderDirectoryCards();
syncUrlParams();
});
}
});
var calcProc = document.getElementById('sb-calc-procedure');
if (calcProc) {
calcProc.addEventListener('change', function () { updateCalculator(true); });
}
var calcDest = document.getElementById('sb-calc-destination');
if (calcDest) {
calcDest.addEventListener('change', function () {
applyDestinationDefaults(calcDest.value);
updateCalculator(true);
});
}
var calcCurr = document.getElementById('sb-calc-currency');
if (calcCurr) {
calcCurr.addEventListener('change', function () { updateCalculator(false); });
}
var calcNumIds = [
'sb-calc-hosp-nights', 'sb-calc-recov-nights', 'sb-calc-apt-rate',
'sb-calc-companions', 'sb-calc-flight-patient', 'sb-calc-flight-companion',
'sb-calc-visa-fee', 'sb-calc-daily-living'
];
calcNumIds.forEach(function (cid) {
var el = document.getElementById(cid);
if (el) {
el.addEventListener('input', function () { updateCalculator(false); });
}
});
window.addEventListener('popstate', function () {
parseAndApplyUrlParams();
renderDirectoryCards();
});
document.addEventListener('click', function (e) {
var target = e.target.closest('[data-sb-action], .sb-open-shortlist-btn, .sb-open-compare-btn, #sb-mobile-menu-btn, #sb-mobile-filters-btn, .sb-modal-close, #sb-calc-cta-btn');
if (!target) {
if (e.target.classList && e.target.classList.contains('sb-modal-backdrop')) {
closeModal(e.target.id);
}
return;
}
var action = target.getAttribute('data-sb-action');
if (target.id === 'sb-mobile-menu-btn' || action === 'open-drawer') {
openModal('sb-mobile-drawer', target);
} else if (action === 'close-drawer') {
closeModal('sb-mobile-drawer');
} else if (target.id === 'sb-mobile-filters-btn' || action === 'open-filters') {
openModal('sb-filters-sheet', target);
} else if (action === 'apply-filters' || action === 'close-filters') {
closeModal('sb-filters-sheet');
} else if (action === 'load-more-cards') {
state.visibleLimit = (state.visibleLimit || 24) + 36;
renderDirectoryCards();
} else if (action === 'reset-filters') {
state.visibleLimit = 24;
resetAllFilters();
} else if (action === 'switch-hub') {
var targetHub = target.getAttribute('data-hub') || 'hospitals';
if (target.tagName === 'A' && document.getElementById('sb-directory-section')) {
e.preventDefault();
}
switchHub(targetHub, false);
closeModal('sb-mobile-drawer');
if (target.tagName === 'A') {
var dirSec = document.getElementById('sb-directory-section');
if (dirSec && typeof dirSec.scrollIntoView === 'function') dirSec.scrollIntoView({ behavior: 'smooth' });
}
} else if (action === 'quick-destination') {
var quickCountry = target.getAttribute('data-country') || '';
state.destination = quickCountry;
state.city = '';
state.visibleLimit = 24;
var destSelEl = document.getElementById('sb-filter-destination');
if (destSelEl) destSelEl.value = quickCountry;
var citySelEl2 = document.getElementById('sb-filter-city');
if (citySelEl2) citySelEl2.value = '';
renderDirectoryCards();
syncUrlParams();
var dirSec2 = document.getElementById('sb-directory-section');
if (dirSec2 && typeof dirSec2.scrollIntoView === 'function') dirSec2.scrollIntoView({ behavior: 'smooth' });
} else if (action === 'crosslink-hub') {
var nextHub = target.getAttribute('data-target-hub') || 'hospitals';
var fId = target.getAttribute('data-facility-id') || '';
var dId = target.getAttribute('data-doctor-id') || '';
var pCode = target.getAttribute('data-proc-code') || '';
state.facilityFilter = fId;
state.doctorFilter = dId;
state.procFilter = pCode;
switchHub(nextHub, false);
} else if (action === 'clear-relational-filter' || action === 'clear-single-filter') {
var keyToClear = target.getAttribute('data-filter-key');
if (keyToClear && state[keyToClear] !== undefined) {
if (keyToClear === 'scope') {
state.scope = 'all';
var sBtns = document.querySelectorAll('.sb-scope-btn');
for (var sb = 0; sb < sBtns.length; sb++) {
var isAll = sBtns[sb].getAttribute('data-scope') === 'all';
sBtns[sb].classList.toggle('active', isAll);
sBtns[sb].setAttribute('aria-pressed', isAll ? 'true' : 'false');
}
} else if (typeof state[keyToClear] === 'number') {
state[keyToClear] = 0;
} else {
state[keyToClear] = '';
}
if (keyToClear === 'query') {
var qInput = document.getElementById('sb-search-input');
if (qInput) qInput.value = '';
}
var keyToSelectId = {
providerType: 'sb-filter-provider-type',
specialty: 'sb-filter-specialty',
subSpecialty: 'sb-filter-subspecialty',
procFilter: 'sb-filter-procedure',
destination: 'sb-filter-destination',
city: 'sb-filter-city',
accreditation: 'sb-filter-accreditation',
arabCare: 'sb-filter-arab-care',
logistics: 'sb-filter-billing-visa',
minExperience: 'sb-filter-min-exp',
spokenLang: 'sb-filter-doc-lang',
maxConsultFee: 'sb-filter-max-fee',
maxPrice: 'sb-filter-price',
maxFitToFly: 'sb-filter-fit-to-fly'
};
if (keyToSelectId[keyToClear]) {
var selToClear = document.getElementById(keyToSelectId[keyToClear]);
if (selToClear) selToClear.value = '';
}
renderDirectoryCards();
syncUrlParams();
}
} else if (action === 'open-quote' || target.id === 'sb-calc-cta-btn') {
var prov = target.getAttribute('data-provider-name') || '';
openModal('sb-quote-modal', target, prov);
} else if (action === 'open-claim') {
openModal('sb-claim-modal', target);
} else if (target.classList.contains('sb-open-shortlist-btn') || action === 'open-shortlist') {
openModal('sb-shortlist-modal', target);
} else if (target.classList.contains('sb-open-compare-btn') || action === 'open-compare') {
openModal('sb-compare-modal', target);
} else if (action === 'open-lang-selector') {
ensureExternalI18nLoaded(function () {
renderLanguageModalRegions('');
});
openModal('sb-lang-modal', target);
} else if (action === 'confirm-detected-lang') {
var detCode = target.getAttribute('data-detected-lang') || state.detectedLangCode || 'en';
applyLanguage(detCode, true);
var banner = document.getElementById('sb-lang-detect-banner');
if (banner) banner.hidden = true;
} else if (action === 'dismiss-lang-prompt') {
try { localStorage.setItem(STORAGE_LANG_CONFIRMED, 'true'); } catch (err) {}
var bEl = document.getElementById('sb-lang-detect-banner');
if (bEl) bEl.hidden = true;
} else if (action === 'select-language') {
if (target.tagName === 'A') e.preventDefault();
var chosenCode = target.getAttribute('data-lang-code') || 'en';
applyLanguage(chosenCode, true);
var bPrompt = document.getElementById('sb-lang-detect-banner');
if (bPrompt) bPrompt.hidden = true;
var openDetails = target.closest('details.sb-lang-menu');
if (openDetails) openDetails.removeAttribute('open');
closeModal('sb-lang-modal');
closeModal('sb-mobile-drawer');
} else if (target.classList.contains('sb-modal-close') || action === 'close-modal') {
var parentModal = target.closest('.sb-modal-backdrop, .sb-drawer, .sb-filters-sheet');
if (parentModal) closeModal(parentModal.id);
} else if (action === 'toggle-shortlist') {
var sid = target.getAttribute('data-listing-id');
if (sid) toggleShortlist(sid);
} else if (action === 'toggle-compare') {
var cid = target.getAttribute('data-listing-id');
if (cid) toggleCompare(cid);
} else if (action === 'share-shortlist') {
var shareUrl = window.location.origin + window.location.pathname + '?shortlist=' + state.shortlist.join(',');
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(shareUrl);
}
var shareNote = document.getElementById('sb-shortlist-share-feedback');
if (shareNote) {
shareNote.textContent = t('copiedLink');
shareNote.hidden = false;
}
}
});
document.addEventListener('keydown', function (e) {
var activeModal = document.querySelector('.sb-modal-backdrop.is-open, .sb-drawer.is-open, .sb-filters-sheet.is-open');
if (!activeModal) return;
if (e.key === 'Escape') {
e.preventDefault();
closeModal(activeModal.id);
return;
}
if (e.key === 'Tab') {
var focusables = getFocusableElements(activeModal);
if (focusables.length === 0) return;
var first = focusables[0];
var last = focusables[focusables.length - 1];
if (e.shiftKey && document.activeElement === first) {
e.preventDefault();
last.focus();
} else if (!e.shiftKey && document.activeElement === last) {
e.preventDefault();
first.focus();
}
}
});
}
function mountHubDirectoryOnPost() {
var hubMount = document.getElementById('sb-hub-mount') || document.getElementById('sb-hub-auto-mount');
var dirShell = document.getElementById('sb-interactive-directory-shell');
if (hubMount && dirShell) {
var postBody = hubMount.closest ? hubMount.closest('.sb-post-body') : null;
if (postBody) {
var legacyStyles = postBody.querySelectorAll('style');
for (var s = 0; s < legacyStyles.length; s++) {
if (legacyStyles[s].parentNode) legacyStyles[s].parentNode.removeChild(legacyStyles[s]);
}
}
hubMount.innerHTML = '';
hubMount.appendChild(dirShell);
dirShell.hidden = false;
dirShell.removeAttribute('hidden');
var calloutEl = document.getElementById('sb-post-directory-callout');
if (calloutEl) calloutEl.hidden = true;
var postLayout = hubMount.closest ? hubMount.closest('.sb-post-layout') : null;
if (postLayout) {
postLayout.classList.add('sb-post-layout-hub');
}
var mountHub = hubMount.getAttribute('data-hub') || hubMount.getAttribute('data-hub-type');
if (mountHub && (mountHub === 'hospitals' || mountHub === 'doctors' || mountHub === 'costs')) {
state.hub = mountHub;
}
var mountLang = hubMount.getAttribute('data-lang');
if (mountLang) {
applyLanguage(mountLang, false);
}
var mountJsonUrl = hubMount.getAttribute('data-json-url');
if (mountJsonUrl && mountJsonUrl.indexOf('thesecretarybird.com/feeds/') === -1) {
loadExternalHubJson(state.hub, mountJsonUrl);
}
}
}
function hydratePostOrPageIfNeeded() {
var path = (window.location && window.location.pathname) ? window.location.pathname : '/';
if (!path || path === '/' || path === '/index.html') return;
var mainEl = document.getElementById('main');
if (!mainEl || mainEl.querySelector('.sb-post-article, .sb-card')) return;
if (path === '/p/hospitals-directory.html' || path === '/p/doctors-directory.html' || path === '/p/treatment-costs.html' || path === '/p/destinations.html') {
var dirShell = document.getElementById('sb-interactive-directory-shell');
if (dirShell) {
dirShell.hidden = false;
dirShell.removeAttribute('hidden');
}
var targetHub = path.indexOf('doctors') !== -1 ? 'doctors' : (path.indexOf('costs') !== -1 ? 'costs' : 'hospitals');
switchHub(targetHub, false);
}
if (typeof window.fetch !== 'function') return;
var feedUrl = '';
var isPage = path.indexOf('/p/') === 0;
var isPost = /^\/\d{4}\/\d{2}\//.test(path);
var isLabel = path.indexOf('/search/label/') === 0;
if (isPage) {
feedUrl = '/feeds/pages/default?alt=json&max-results=50';
} else if (isPost) {
feedUrl = '/feeds/posts/default?alt=json&path=' + encodeURIComponent(path) + '&max-results=10';
} else if (isLabel) {
var rawLbl = decodeURIComponent(path.replace('/search/label/', '').split('?')[0]);
feedUrl = '/feeds/posts/default/-/' + encodeURIComponent(rawLbl) + '?alt=json&max-results=24';
} else {
return;
}
window.fetch(feedUrl).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
if (!data || !data.feed) return;
var entries = data.feed.entry || [];
if (!entries.length) return;
if (isLabel) {
var cardsHtml = '<div class="sb-container"><div class="sb-cards-grid">';
for (var i = 0; i < entries.length; i++) {
var ent = entries[i];
var eTitle = (ent.title && ent.title.$t) || '';
var eUrl = '#';
var eLinks = ent.link || [];
for (var li = 0; li < eLinks.length; li++) {
if (eLinks[li].rel === 'alternate' && eLinks[li].href) { eUrl = eLinks[li].href; break; }
}
var rawBody = (ent.summary && ent.summary.$t) || (ent.content && ent.content.$t) || '';
var cleanSnip = rawBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);
cardsHtml += '<article class="sb-card"><div class="sb-card-body"><h2 class="sb-card-title"><a href="' + sanitizeUrl(eUrl) + '">' + escapeHtml(eTitle) + '</a></h2><p class="sb-card-snippet">' + escapeHtml(cleanSnip) + '</p><div class="sb-card-footer"><div class="sb-card-primary-actions"><a class="sb-btn sb-btn-secondary sb-btn-sm" href="' + sanitizeUrl(eUrl) + '">' + escapeHtml(t('viewProfile')) + '</a><button class="sb-btn sb-btn-primary sb-btn-sm" data-sb-action="open-quote" data-provider-name="' + escapeHtml(eTitle) + '" type="button">' + escapeHtml(t('requestQuote')) + '</button></div></div></div></article>';
}
cardsHtml += '</div></div>';
mainEl.classList.remove('no-items');
mainEl.style.display = 'block';
var fb = mainEl.nextElementSibling;
if (fb && fb.classList.contains('sb-no-items-fallback')) fb.style.display = 'none';
mainEl.innerHTML = cardsHtml;
return;
}
var matched = null;
for (var j = 0; j < entries.length; j++) {
var links = entries[j].link || [];
for (var k = 0; k < links.length; k++) {
if (links[k].rel === 'alternate' && links[k].href && links[k].href.indexOf(path) !== -1) {
matched = entries[j];
break;
}
}
if (matched) break;
}
if (!matched && isPost) matched = entries[0];
if (!matched) return;
var title = (matched.title && matched.title.$t) || '';
var bodyHtml = (matched.content && matched.content.$t) || (matched.summary && matched.summary.$t) || '';
var pubDate = (matched.published && matched.published.$t) ? matched.published.$t.slice(0, 10) : '';
var cats = (matched.category || []).map(function (c) { return c.term; });
var isHub = cats.some(function (c) { return ['hub-hospitals', 'hub-doctors', 'hub-costs', 't-directory'].indexOf(c) !== -1; }) || bodyHtml.indexOf('sb-hub-mount') !== -1;
var isClinical = cats.some(function (c) { return ['t-hospital', 't-clinic', 't-doctor', 't-cost', 't-treatment', 't-stay'].indexOf(c) !== -1; });
var chipsHtml = '';
if (cats.length) {
chipsHtml = '<div class="sb-card-labels">' + cats.map(function (c) {
return '<a class="sb-chip" data-sb-facet-chip="' + escapeHtml(c) + '" href="/p/hospitals-directory.html">' + escapeHtml(translateFacet(c)) + '</a>';
}).join('') + '</div>';
}
var metaHtml = '<div class="sb-post-meta">' +
(pubDate ? '<span><strong>Published:</strong> <time class="sb-ltr-inline" dir="ltr" datetime="' + escapeHtml(pubDate) + '">' + escapeHtml(pubDate) + '</time></span>' : '') +
(isClinical ? '<span><strong>Verification status:</strong> ' + escapeHtml(t('facetSourced')) + '</span>' : '') +
'</div>';
var sidebarHtml = isHub ? '' : (
'<aside class="sb-post-sidebar"><div class="sb-enquiry-card">' +
'<h2>' + escapeHtml(t('heroCtaPrimary')) + '</h2>' +
'<p>' + escapeHtml(t('howItWorksSub')) + '</p>' +
'<button class="sb-btn sb-btn-primary sb-btn-block" data-sb-action="open-quote" data-provider-name="' + escapeHtml(title) + '" type="button">' + escapeHtml(t('heroCtaPrimary')) + '</button>' +
'<button class="sb-btn sb-btn-secondary sb-btn-block" data-sb-action="open-claim" type="button">' + escapeHtml(t('footerSuggestCorrection')) + '</button>' +
'</div></aside>'
);
var wrapperHtml =
'<div class="sb-container sb-post-wrapper">' +
'<nav aria-label="Post breadcrumb" class="sb-breadcrumb">' +
'<a href="/">' + escapeHtml(t('navDirectory')) + '</a>' +
'<svg class="sb-icon-flip-rtl" aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
'<span aria-current="page">' + escapeHtml(title) + '</span>' +
'</nav>' +
'<div class="sb-post-layout' + (isHub ? ' sb-post-layout-hub' : '') + '">' +
'<article class="sb-post-article">' +
'<header class="sb-post-header">' +
'<h1 class="sb-post-title">' + escapeHtml(title) + '</h1>' +
metaHtml + chipsHtml +
'</header>' +
'<div class="sb-post-body">' + bodyHtml + '</div>' +
'<footer class="sb-post-footer-bar">' +
'<div><strong>' + escapeHtml(t('heroCtaPrimary')) + '</strong></div>' +
'<div class="sb-card-primary-actions">' +
'<button class="sb-btn sb-btn-primary sb-btn-sm" data-sb-action="open-quote" data-provider-name="' + escapeHtml(title) + '" type="button">' + escapeHtml(t('requestQuote')) + '</button>' +
'<button class="sb-btn sb-btn-secondary sb-btn-sm" data-sb-action="open-claim" type="button">' + escapeHtml(t('footerSuggestCorrection')) + '</button>' +
'</div>' +
'</footer>' +
'</article>' +
sidebarHtml +
'</div></div>';
mainEl.classList.remove('no-items');
mainEl.style.display = 'block';
var fb2 = mainEl.nextElementSibling;
if (fb2 && fb2.classList.contains('sb-no-items-fallback')) fb2.style.display = 'none';
mainEl.innerHTML = wrapperHtml;
mountHubDirectoryOnPost();
enhanceServerRenderedChips();
}).catch(function () {});
}
function init() {
var dedicatedPostLang = detectDedicatedPostLanguage();
if (dedicatedPostLang) {
var dBase = resolveBaseLangKey(dedicatedPostLang);
var dRtl = !!(RTL_LANGS[dedicatedPostLang] || RTL_LANGS[dBase]);
document.documentElement.setAttribute('lang', dedicatedPostLang);
document.documentElement.setAttribute('dir', dRtl ? 'rtl' : 'ltr');
}
state.activeLangCode = document.documentElement.getAttribute('lang') || getLang();
if ((state.activeLangCode !== 'en' && state.activeLangCode !== 'ar' && !RAW_LANG_PACKS[state.activeLangCode]) || document.getElementById('sb-editorial-section')) {
ensureExternalI18nLoaded(function () {
if (state.activeLangCode !== 'en' && state.activeLangCode !== 'ar') {
applyLanguage(state.activeLangCode, false, false);
}
if (typeof window.__SB_RENDER_MAGAZINES_17 === 'function') {
window.__SB_RENDER_MAGAZINES_17(state.activeLangCode);
}
});
}
refreshMultilingualSelectsAndData(state.activeLangCode);
syncCanonicalAndHreflang();
enrichHospitalPageSeoAndSchema();
tidyProfileFieldsAndReviewDate();
initWhatsAppVariable();
mountHubDirectoryOnPost();
hydratePostOrPageIfNeeded();
enhanceServerRenderedChips();
populateAttributionFields();
if (document.body.getAttribute('data-initial-compare') === 'true' && state.compare.length === 0) {
state.compare = ['TZ-IN-0001', 'TZ-TR-0001', 'TZ-TH-0001'];
}
updateBadgeCounts();
renderLanguageDetectBanner();
parseAndApplyUrlParams();
var hasDirShell = Boolean(document.getElementById('sb-interactive-directory-shell') || document.getElementById('sb-hub-mount'));
if (hasDirShell) {
syncHubTabsAndFiltersUI();
renderDirectoryCards();
var calcDest = document.getElementById('sb-calc-destination');
if (calcDest) {
applyDestinationDefaults(calcDest.value || 'india');
updateCalculator(true);
}
var cfg = Object.assign({}, DEFAULT_DATA_CONFIG, window.SB_DATA_CONFIG || {});
var deferLoad = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1800); };
deferLoad(function () {
if (cfg.hospitalsUrl) loadExternalHubJson('hospitals', cfg.hospitalsUrl);
if (cfg.doctorsUrl) loadExternalHubJson('doctors', cfg.doctorsUrl);
if (cfg.costsUrl) loadExternalHubJson('costs', cfg.costsUrl);
});
}
bindForms();
bindEvents();
var initialOpen = document.body.getAttribute('data-initial-open');
if (initialOpen) {
openModal(initialOpen, null);
}
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}
window.SBDirectory = {
openQuoteModal: function (prov) { openModal('sb-quote-modal', null, prov); },
openClaimModal: function () { openModal('sb-claim-modal', null); },
openLanguageSelector: function () { openModal('sb-lang-modal', null); },
setLanguage: function (code) { applyLanguage(code, true); },
switchHub: function (hub) { switchHub(hub, false); },
getActiveHub: function () { return state.hub; },
loadHubJson: function (hub, url) { return loadExternalHubJson(hub, url); },
applyUrlParams: function () { parseAndApplyUrlParams(); renderDirectoryCards(); },
simulateDeviceDetection: function (code, country) {
state.detectedLangCode = code;
state.detectedCountry = country || '';
renderLanguageDetectBanner({ code: code, country: country || '' });
},
getSupportedLanguages: function () { return Object.keys(PAGE_TRANSLATIONS); },
getRegions: function () { return GLOBAL_REGIONS; },
getTranslationPack: function (code) { return PAGE_TRANSLATIONS[code] || PAGE_TRANSLATIONS[resolveBaseLangKey(code)] || null; },
getState: function () { return state; },
resetFilters: resetAllFilters
};
})();
