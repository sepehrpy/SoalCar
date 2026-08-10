export interface CarBrandData {
  id: string;
  name: string;
  country: string;
  logoUrl?: string;
  models: {
    name: string;
    trims?: string[];
  }[];
}

export const CAR_BRANDS_DATABASE: CarBrandData[] = [
  {
    id: 'ikco',
    name: 'ایران خودرو',
    country: 'ایران',
    models: [
      { name: 'پژو ۲۰۶', trims: ['تیپ ۲', 'تیپ ۳', 'تیپ ۵', 'صندوقدار SD V8', 'صندوقدار SD V9 اتومات'] },
      { name: 'پژو ۲۰۷', trims: ['دستی 1.6 TU5', 'اتوماتیک 4 سرعته', 'سقف شیشه‌ای (پانوراما)', 'MC دو رنگ اتوماتیک'] },
      { name: 'پژو پارس', trims: ['پارس LX موتور TU5', 'پارس سال XU7P', 'پارس ELX', 'پارس اتوماتیک'] },
      { name: 'دنا', trims: ['دنا معمولی 1.7 EF7', 'دنا پلاس توربو دستی', 'دنا پلاس توربو اتوماتیک 6 دنده'] },
      { name: 'تارا', trims: ['تارا دستی V1P', 'تارا اتوماتیک V4 LX'] },
      { name: 'سمند', trims: ['سمند LX موتور EF7', 'سمند SE', 'سورن پلاس EF7', 'سورن پلاس توربو'] },
      { name: 'رانا', trims: ['رانا LX', 'رانا پلاس', 'رانا پلاس سقف شیشه‌ای 6 دنده'] },
      { name: 'پیکان و وانت', trims: ['پیکان کاربراتوری', 'پیکان انژکتوری', 'وانت باردو', 'وانت آریسان ۱', 'وانت آریسان ۲'] },
      { name: 'پژو ۴۰۵', trims: ['GLX 1.8 XU7', 'SLX 1.6 TU5', 'دوگانه‌سوز CNG'] },
      { name: 'هایما', trims: ['S7 توربو 1.8', 'S7 پلاس توربو', 'S5 6 دنده اتوماتیک', '8S توربو'] }
    ]
  },
  {
    id: 'saipa',
    name: 'سایپا',
    country: 'ایران',
    models: [
      { name: 'کوییک', trims: ['کوییک دنده‌ای ساده', 'کوییک S', 'کوییک R دو رنگ', 'کوییک اتوماتیک CVT', 'کوییک GX'] },
      { name: 'ساینا', trims: ['ساینا EX دنده‌ای', 'ساینا S', 'ساینا S دوگانه‌سوز', 'ساینا GX'] },
      { name: 'شاهین', trims: ['شاهین G دنده‌ای 1.5 توربو', 'شاهین اتوماتیک CVT', 'شاهین پلاس 1.6 ME16'] },
      { name: 'پراید', trims: ['۱۳۱ صبا صندوقدار', '۱۱۱ هاچبک', '۱۳۲ صندوقدار جدید', '۱۴۱ لیفت‌بک', 'وانت ۱۵۱'] },
      { name: 'تیبا', trims: ['تیبا ۱ صندوقدار', 'تیبا ۲ هاچبک'] },
      { name: 'زانتیا', trims: ['زانتیا 2.0 2000cc', 'زانتیا 1.8 1800cc'] },
      { name: 'چنگان', trims: ['CS35 مونتاژ سایپا', 'CS35 پلاس وارداتی'] },
      { name: 'سراتو سایپا', trims: ['۱۶۰۰ دنده‌ای', '۲۰۰۰ اتوماتیک اپشنال'] }
    ]
  },
  {
    id: 'mvm_fownix',
    name: 'مدیران خودرو (ام‌وی‌ام / فونیکس)',
    country: 'چین / ایران',
    models: [
      { name: 'ام‌وی‌ام X22', trims: ['X22 دنده‌ای اسپرت', 'X22 اتوماتیک', 'X22 پرو توربو 3 سیلندر'] },
      { name: 'ام‌وی‌ام X33', trims: ['X33 دنده‌ای', 'X33S اتوماتیک', 'X33 کراس'] },
      { name: 'ام‌وی‌ام X55', trims: ['X55 اتوماتیک', 'X55 پرو اکسلنت'] },
      { name: 'ام‌وی‌ام 315', trims: ['315 هاچبک ساده', '315 اسپرت لاکچری', '315 پلاس اتوماتیک'] },
      { name: 'فونیکس آریزو', trims: ['آریزو 6 پرو', 'آریزو 6 جی‌تی', 'آریزو 5 توربو IE'] },
      { name: 'فونیکس تیگو', trims: ['تیگو 7 پرو', 'تیگو 8 پرو مکس AWD', 'تیگو 8 پرو هیبرید e+'] }
    ]
  },
  {
    id: 'kerman_kmc',
    name: 'کرمان موتور (جک / KMC)',
    country: 'چین / ایران',
    models: [
      { name: 'جک J4', trims: ['J4 1.5 CVT'] },
      { name: 'جک J5', trims: ['J5 1.5 دنده‌ای', 'J5 1.8 اتوماتیک'] },
      { name: 'جک S3', trims: ['S3 1.6 اتوماتیک CVT'] },
      { name: 'جک S5', trims: ['S5 2.0 توربو دنده‌ای', 'S5 2.0 توربو اتوماتیک', 'S5 1.5 فیس‌لیفت GDI'] },
      { name: 'KMC J7', trims: ['J7 1.5 توربو 6 دنده دوکلاچه'] },
      { name: 'KMC T8', trims: ['T8 2.0 توربو دو دیفرانسیل'] },
      { name: 'KMC K7', trims: ['K7 1.5 توربو'] }
    ]
  },
  {
    id: 'bahman',
    name: 'بهمن موتور',
    country: 'ایران / چین / ژاپن',
    models: [
      { name: 'دیگنیتی', trims: ['دیگنیتی پرایم 1.5 توربو', 'دیگنیتی پرستیژ 2.0 توربو 228 اسب'] },
      { name: 'فدلیتی', trims: ['فدلیتی پرایم 5 نفره', 'فدلیتی پرایم 7 نفره', 'فدلیتی پرستیژ'] },
      { name: 'ریسپکت', trims: ['ریسپکت پرایم', 'ریسپکت ۲'] },
      { name: 'مزدا ۳', trims: ['مزدا ۳ قدیم 2.0', 'مزدا ۳ نیو تیپ ۳', 'مزدا ۳ نیو تیپ ۴ FL'] },
      { name: 'وانت کاپرا', trims: ['کاپرا تک کابین', 'کاپرا ۲ دو کابین دو دیفرانسیل'] }
    ]
  },
  {
    id: 'renault',
    name: 'رنو (Renault)',
    country: 'فرانسه / ایران',
    models: [
      { name: 'تندر ۹۰ (ال۹۰)', trims: ['E1 فول', 'E2 فول پارس خودرو', 'تندر اتوماتیک', 'تندر پلاس اتوماتیک'] },
      { name: 'ساندرو', trims: ['ساندرو دنده‌ای', 'ساندرو اتوماتیک', 'استپ‌وی دنده‌ای', 'استپ‌وی اتوماتیک'] },
      { name: 'مگان', trims: ['مگان ۱۶۰۰ دنده‌ای', 'مگان ۲۰۰۰ اتوماتیک E4'] },
      { name: 'تالیسمان', trims: ['E3 1.6 توربو 190 اسب'] },
      { name: 'کولیوس', trims: ['2.5 4WD فول شرکتی نگین خودرو'] }
    ]
  },
  {
    id: 'hyundai',
    name: 'هیوندای (Hyundai)',
    country: 'کره جنوبی',
    models: [
      { name: 'سوناتا', trims: ['NF 2.4', 'YF 2.4', 'LF 2.4', 'LF هیبرید'] },
      { name: 'سانتافه', trims: ['CM 2.7 V6', 'DM 2.4 GDI 4WD'] },
      { name: 'توسان', trims: ['ix35 2.4 4WD', 'TL 2.0 GDI'] },
      { name: 'النترا', trims: ['MD 1.8', 'AD 2.0 فول شرکتی'] },
      { name: 'اکسنت', trims: ['1.6 مونتاژی کرمان موتور', '1.6 وارداتی'] },
      { name: 'آزرا / گرنجور', trims: ['آزرا TG 3.3 V6', 'گرنجور HG 3.0 V6', 'AZERA IG 2.4 GDI'] }
    ]
  },
  {
    id: 'kia',
    name: 'کیا (Kia)',
    country: 'کره جنوبی',
    models: [
      { name: 'سراتو', trims: ['سراتو YD 2.0 وارداتی', 'سراتو TD 2.0 سایپایی', 'سراتو کوپ 2.0'] },
      { name: 'اسپورتیج', trims: ['SL 2.4 4WD', 'QL 2.4 4WD'] },
      { name: 'اپتیما', trims: ['TF 2.4', 'JF 2.4 GDI', 'JF هیبرید'] },
      { name: 'سورنتو', trims: ['XM 3.5 V6', 'UM 2.4 GDI 4WD 7 نفره'] },
      { name: 'اسپورتیج', trims: ['2.4 4WD'] }
    ]
  },
  {
    id: 'toyota_lexus',
    name: 'تویوتا و لکسوس (Toyota / Lexus)',
    country: 'ژاپن',
    models: [
      { name: 'تویوتا کرولا', trims: ['1.8 GLI', '2.0 XLI', 'وارداتی ۲.۰ جدید'] },
      { name: 'تویوتا کمری', trims: ['GLX 2.4', 'SE 2.5', 'XLE هیبرید'] },
      { name: 'تویوتا پرادو', trims: ['2.7 4 سیلندر GX', '4.0 6 سیلندر VX 4 در'] },
      { name: 'تویوتا RAV4', trims: ['2.5 4WD الفطیم', '2.5 4WD ایرتویا'] },
      { name: 'لکسوس NX', trims: ['NX200t توربو', 'NX300h هیبرید 4WD'] },
      { name: 'لکسوس RX', trims: ['RX350 3.5 V6', 'RX200t 2.0 توربو'] }
    ]
  }
];

export function getCarBrandNames(): string[] {
  return CAR_BRANDS_DATABASE.map(b => b.name);
}

export function getModelsByBrandName(brandName: string): { name: string; trims?: string[] }[] {
  const found = CAR_BRANDS_DATABASE.find(b => b.name === brandName || brandName.includes(b.name));
  if (found) return found.models;

  // Generic fallback if not matched
  return [
    { name: 'سایر مدل‌ها', trims: ['پایه', 'فول'] }
  ];
}

export function getTrimsByBrandAndModel(brandName: string, modelName: string): string[] {
  const models = getModelsByBrandName(brandName);
  const foundModel = models.find(m => m.name === modelName || modelName.includes(m.name));
  if (foundModel && foundModel.trims) {
    return foundModel.trims;
  }
  return ['استاندارد', 'فول آپشن', 'سفارشی'];
}
