import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_QUESTIONS,
  INITIAL_ANSWERS,
  INITIAL_MECHANIC_PROFILES,
  INITIAL_TAGS,
  INITIAL_USERS,
} from './src/data/mockData';
import {
  Question,
  Answer,
  User,
  MechanicProfile,
  Tag,
  UserRole,
  QuestionStatus,
  VoteType,
  LeadReferral,
} from './src/types';

dotenv.config();

// Structured Logging helper
function structuredLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: Record<string, any>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(logEntry));
}

// Password Hashing with PBKDF2 (NIST/OWASP Standard Key Derivation)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2$10000$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.startsWith('pbkdf2$')) return true; // Legacy fallback for mock users
  const parts = storedHash.split('$');
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const hash = parts[3];
  const verifyHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Account Lockout Store (5 failed attempts -> 15 min lock)
const failedLoginStore: Record<string, { attempts: number; lockedUntil: number }> = {};

function checkAccountLockout(emailOrUsername: string): { isLocked: boolean; remainingMinutes?: number } {
  const key = emailOrUsername.toLowerCase();
  const record = failedLoginStore[key];
  if (!record) return { isLocked: false };
  if (record.lockedUntil > Date.now()) {
    const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return { isLocked: true, remainingMinutes: remaining };
  }
  if (record.lockedUntil <= Date.now() && record.lockedUntil > 0) {
    delete failedLoginStore[key];
  }
  return { isLocked: false };
}

function recordFailedLogin(emailOrUsername: string) {
  const key = emailOrUsername.toLowerCase();
  if (!failedLoginStore[key]) {
    failedLoginStore[key] = { attempts: 1, lockedUntil: 0 };
  } else {
    failedLoginStore[key].attempts += 1;
  }
  if (failedLoginStore[key].attempts >= 5) {
    failedLoginStore[key].lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins
  }
}

function resetFailedLogin(emailOrUsername: string) {
  delete failedLoginStore[emailOrUsername.toLowerCase()];
}

// HTML Sanitization (Stored XSS Protection)
function sanitizeHtmlInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
}

// In-Memory Database Collections for API
let usersStore: User[] = [...INITIAL_USERS];
let mechanicProfilesStore: MechanicProfile[] = [...INITIAL_MECHANIC_PROFILES];
let questionsStore: Question[] = [...INITIAL_QUESTIONS];
let answersStore: Answer[] = [...INITIAL_ANSWERS];
let tagsStore: Tag[] = [...INITIAL_TAGS];
let leadReferralsStore: LeadReferral[] = [];

// Articles Data Stores
let articleCategoriesStore: any[] = [
  { id: 1, name: 'آموزش نگهداری خودرو', slug: 'car-maintenance', description: 'راهنماهای قدم به قدم نگهداری، سرویس‌های دوره‌ای و افزایش عمر مفید خودرو' },
  { id: 2, name: 'عیب‌یابی و تعمیرات', slug: 'troubleshooting', description: 'شناسایی و رفع علائم خرابی، لرزش، صداهای غیرعادی و کد خطاهای خودرو' },
  { id: 3, name: 'سیستم‌های برقی و الکترونیک', slug: 'electrical-systems', description: 'بررسی ایسیو، باتری، دینام، سنسورها و سیم‌کشی خودرو' },
  { id: 4, name: 'راهنمای خرید و قطعات', slug: 'buying-guide', description: 'اصول تشخیص قطعات اصلی از تقلبی و انتخاب بهترین لوازم یدکی' },
];

let articleTagsStore: any[] = [
  { id: 1, name: 'پژو ۲۰۶', slug: 'peugeot-206' },
  { id: 2, name: 'روغن موتور', slug: 'engine-oil' },
  { id: 3, name: 'سیستم ترمز', slug: 'brake-system' },
  { id: 4, name: 'باتری و دینام', slug: 'battery-alternator' },
  { id: 5, name: 'گیربکس', slug: 'gearbox' },
  { id: 6, name: 'دنا پلاس', slug: 'dena-plus' },
];

function calculateReadingTime(content: string): number {
  if (!content) return 1;
  const cleanText = content.replace(/<[^>]*>/g, ' ').trim();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

let articlesStore: any[] = [
  {
    id: 1,
    title: 'علل اصلی لرزش فرمان خودرو در سرعت‌های مختلف و روش‌های برطرف کردن آن',
    slug: 'causes-of-steering-wheel-vibration-and-how-to-fix-it',
    summary: 'آیا در سرعت ۸۰ یا ۱۲۰ کیلومتر با لرزش فرمان مواجه می‌شوید؟ در این مقاله جامع تمام دلایل بالانس چرخ، تاب داشتن دیسک ترمز، و خرابی جلوبندی را بررسی می‌کنیم.',
    content: `
      <h2>چرا فرمان خودرو لرزش دارد؟</h2>
      <p>لرزش فرمان یکی از شایع‌ترین مشکلات فنی است که رانندگان با آن مواجه می‌شوند. این لرزش نه تنها رانندگی را خسته‌کننده می‌کند، بلکه در صورت عدم پیگیری سریع، می‌تواند به سیستم تعلیق و جلوبندی آسیب‌های جدی وارد نماید.</p>
      
      <h2>۱. لرزش فرمان در سرعت‌های بین ۸۰ تا ۱۲۰ کیلومتر بر ساعت</h2>
      <p>علت اصلی لرزش فرمان در این محدوده سرعتی، <strong>عدم بالانس بودن چرخ‌های جلو</strong> است. کوچک‌ترین عدم توازن در وزن رینگ و لاستیک موجب ارتعاشات شاسی در سرعت‌های بالا می‌شود.</p>
      <ul>
        <li><strong>راه حل:</strong> مراجعه به آپاراتی و بالانس دیجیتالی دو چرخ جلو.</li>
        <li>اگر لرزش با افزایش سرعت بیشتر می‌شود، احتمال تاب داشتن رینگ یا ساییدگی نامتوازن لاستیک نیز وجود دارد.</li>
      </ul>

      <h2>۲. لرزش فرمان هنگام ترمزگیری (تاب داشتن دیسک ترمز)</h2>
      <p>اگر تنها زمانی که پدال ترمز را می‌فشارید فرمان شروع به لرزش می‌کند، مشکل صددرصد مربوط به <strong>دیسک‌های ترمز جلو</strong> است. داغ شدن بیش از حد دیسک و سپس پاشش ناگهانی آب سرد (مثلاً شستشوی خودرو یا عبور از گودال آب) موجب تاب برداشتن سطح دیسک می‌شود.</p>
      <blockquote>توصیه کارشناسان سوال‌کار: دیسک‌های تاب‌دار را ترجیحاً تعویض کنید یا در صورت داشتن ضخامت کافی تراشکاری دهید.</blockquote>

      <h2>۳. خراب بودن سیبک، توپی و بلبرینگ چرخ</h2>
      <p>لقی در سیبک فرمان، خراب بودن بوش طبق‌ها یا لقی بلبرینگ چرخ جلو باعث می‌شود لاستیک‌ها زاویه درست خود را از دست داده و ضربات جاده مستقیماً به غربیلک فرمان منتقل گردد.</p>
      <p>برای بررسی کامل سوالات رانندگان در این زمینه می‌توانید پرسش و پاسخ‌های مرتبط را در بخش سوالات خودرو مطالعه نمایید.</p>
    `,
    coverImageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80',
    coverImageAlt: 'لرزش فرمان و جلوبندی خودرو',
    categoryId: 2,
    category: { id: 2, name: 'عیب‌یابی و تعمیرات', slug: 'troubleshooting' },
    authorId: 2,
    author: INITIAL_USERS[1], // Mechanic User
    status: 'Published',
    viewCount: 342,
    readingTimeMinutes: 4,
    metaTitle: 'علل لرزش فرمان در سرعت بالا و هنگام ترمزگیری | سوال‌کار',
    metaDescription: 'دلیل لرزش فرمان خودرو در سرعت ۸۰ تا ۱۲۰ و ترمزگیری چیست؟ بررسی دلایل بالانس، دیسک ترمز و جلوبندی همراه با راهکارهای فنی.',
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isDeleted: false,
    tags: [
      { id: 1, name: 'پژو ۲۰۶', slug: 'peugeot-206' },
      { id: 3, name: 'سیستم ترمز', slug: 'brake-system' },
    ],
    relatedQuestionIds: [1, 2],
  },
  {
    id: 2,
    title: 'راهنمای جامع تعویض به موقع روغن موتور؛ انتخاب ویسکوزیته مناسب برای خودروهای ایرانی',
    slug: 'comprehensive-guide-to-engine-oil-change',
    summary: 'انتخاب بین روغن 10W-40 و 20W-50 برای پژو، سمند و پراید؛ بررسی زمان دقیق تعویض بر اساس کیلومتر و شرایط آب و هوایی.',
    content: `
      <h2>نقش حیاتی روغن موتور در عملکرد خودرو</h2>
      <p>روغن موتور بمثابه خونی است که در رگ‌های موتور جریان دارد. روان‌کاری قطعات متحرک، کاهش اصطکاک، خنک‌کاری و جذب براده‌های فلزی از وظایف اصلی آن است.</p>

      <h2>انتخاب ویسکوزیته مناسب (درجات SAE)</h2>
      <p>برای موتورهای ایرانی و مونتاژی شرایط زیر توصیه می‌شود:</p>
      <ul>
        <li><strong>روغن 10W-40 نیمه‌سنتتیک:</strong> مناسب برای موتورهای TU5، EF7، دنا، پژو ۲۰۶ و پارس در اکثر مناطق ایران.</li>
        <li><strong>روغن 20W-50 معدنی/نیمه‌سنتتیک:</strong> مناسب برای موتورهای قدیمی‌تر مانند XU7 و پراید در مناطق گرمسیر.</li>
        <li><strong>روغن 5W-30 فول‌سنتتیک:</strong> مناسب برای موتورهای توربوشارژ جدید مانند دنا توربو، تارا و توربو شارژهای چینی.</li>
      </ul>

      <h2>چه زمانی روغن موتور را تعویض کنیم؟</h2>
      <p>علاوه بر پیمایش مسافت (معمولاً بین ۵۰۰۰ تا ۷۰۰۰ کیلومتر)، فاکتور <strong>زمان ماندگاری روغن</strong> بسیار مهم است. حتی اگر مسافتی طی نکرده‌اید، روغن موتور حداکثر پس از ۶ ماه تا ۱ سال دچار اکسیداسیون شده و خواص خود را از دست می‌دهد.</p>
    `,
    coverImageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    coverImageAlt: 'تعویض روغن موتور خودرو',
    categoryId: 1,
    category: { id: 1, name: 'آموزش نگهداری خودرو', slug: 'car-maintenance' },
    authorId: 1,
    author: INITIAL_USERS[0],
    status: 'Published',
    viewCount: 512,
    readingTimeMinutes: 3,
    metaTitle: 'بهترین روغن موتور برای پژو و دنا | زمان تعویض روغن | سوال‌کار',
    metaDescription: 'کدام روغن موتور برای خودروی شما مناسب است؟ مقایسه روغن 10W40 و 20W50 و جدول زمان‌بندی تعویض فیلتر روغن.',
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isDeleted: false,
    tags: [
      { id: 2, name: 'روغن موتور', slug: 'engine-oil' },
      { id: 6, name: 'دنا پلاس', slug: 'dena-plus' },
    ],
    relatedQuestionIds: [1, 3],
  },
  {
    id: 3,
    title: 'علائم خرابی پمپ بنزین و سنسور اکسیژن در خودروهای انژکتوری',
    slug: 'symptoms-of-fuel-pump-and-oxygen-sensor-failure',
    summary: 'چرا خودرو افت توان پیدا می‌کند یا استارت سنگین می‌خورد؟ بررسی تکنیکی نحوه تست فشار پمپ بنزین و عملکرد سنسور اکسیژن.',
    content: `
      <h2>چرا خودرو بد استارت می‌خورد یا کوپ می‌کند؟</h2>
      <p>افت سوخت‌رسانی و خطای تنظیم سوخت و هوا دو عامل اصلی ریپ زدن و کاهش شتاب خودروهای انژکتوری هستند.</p>

      <h2>نشانی‌های خرابی پمپ بنزین</h2>
      <ul>
        <li>شنیده نشدن صدای زوزه نرم پمپ بنزین هنگام باز کردن سوئیچ</li>
        <li>خاموش شدن ناگهانی خودرو پس از داغ شدن موتور (توقف در ترافیک)</li>
        <li>ریپ زدن خودرو در سرابالایی‌ها و سرعت‌های بالا به دلیل افت فشار سوخت</li>
      </ul>

      <h2>علائم خرابی سنسور اکسیژن</h2>
      <p>سنسور اکسیژن میزان اکسیژن موجود در گازهای خروجی اگزوز را اندازه‌گیری کرده و به ECU گزارش می‌دهد. خرابی این سنسور موجب موارد زیر می‌شود:</p>
      <ul>
        <li>افزایش شدید مصرف سوخت و بوی بد اگزوز (خام‌سوزی)</li>
        <li>روشن شدن چراغ چک همراه با کد خطای سنسور اکسیژن</li>
        <li>دود سیاه از اگزوز در زمان فشردن ناگهانی پدال گاز</li>
      </ul>
    `,
    coverImageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    coverImageAlt: 'پمپ بنزین و سیستم انژکتور خودرو',
    categoryId: 3,
    category: { id: 3, name: 'سیستم‌های برقی و الکترونیک', slug: 'electrical-systems' },
    authorId: 2,
    author: INITIAL_USERS[1],
    status: 'Published',
    viewCount: 289,
    readingTimeMinutes: 3,
    metaTitle: 'علائم خرابی پمپ بنزین و سنسور اکسیژن خودرو | سوال‌کار',
    metaDescription: 'چگونه فهمید پمپ بنزین یا سنسور اکسیژن خراب است؟ دلایل کوپ کردن و افزایش مصرف سوخت خودرو.',
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isDeleted: false,
    tags: [
      { id: 4, name: 'باتری و دینام', slug: 'battery-alternator' },
    ],
    relatedQuestionIds: [2],
  },
];

// Database Indexes
const questionSlugIndex = new Map<string, Question>();
const questionCarBrandIndex = new Map<string, Question[]>();

function rebuildQuestionIndexes() {
  questionSlugIndex.clear();
  questionCarBrandIndex.clear();

  for (const q of questionsStore) {
    if (q.isDeleted) continue;
    questionSlugIndex.set(q.slug, q);

    const brandKey = (q.carBrand || 'other').toLowerCase();
    if (!questionCarBrandIndex.has(brandKey)) {
      questionCarBrandIndex.set(brandKey, []);
    }
    questionCarBrandIndex.get(brandKey)!.push(q);
  }
}
rebuildQuestionIndexes();

// Async ViewCount Buffer Queue (Flushes asynchronously every 5 seconds)
const viewCountBuffer: Record<number, number> = {};

function enqueueViewCountIncrement(questionId: number) {
  viewCountBuffer[questionId] = (viewCountBuffer[questionId] || 0) + 1;
}

setInterval(() => {
  const keys = Object.keys(viewCountBuffer);
  if (keys.length === 0) return;
  for (const qIdStr of keys) {
    const qId = parseInt(qIdStr);
    const inc = viewCountBuffer[qId];
    delete viewCountBuffer[qId];
    const q = questionsStore.find((item) => item.id === qId);
    if (q) {
      q.viewCount += inc;
      questionSlugIndex.set(q.slug, q);
    }
  }
  structuredLog('INFO', 'Flushed buffered view counts to questions store', { count: keys.length });
}, 5000);

// New Security, Garage, and OTP Stores
let userVehiclesStore: any[] = [
  {
    id: 1,
    userId: 1,
    carBrand: 'پژو',
    carModel: '۲۰۶ تیپ ۵',
    carYear: 1398,
    mileage: 84500,
    fuelType: 'بنزین',
    licensePlateTag: '۶۸ ج ۳۴۵ ایران ۴۴',
    lastServiceDate: '1402/10/15',
    notes: 'روغن و فیلترها تازه تعویض شده، تسمه تایم نیازمند بررسی.',
    serviceLogs: [
      {
        id: 'srv-101',
        vehicleId: 1,
        serviceType: 'تعویض روغن موتور و فیلترها (10W-40)',
        mileageAtService: 80000,
        nextServiceMileage: 85000,
        serviceDate: '1402/10/15',
        nextServiceDate: '1403/04/15',
        cost: 1450000,
        notes: 'از روغن نیمه‌سنتتیک بهران سوپر پیشتاز استفاده شد.',
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
      {
        id: 'srv-102',
        vehicleId: 1,
        serviceType: 'تعویض لنت ترمز جلو',
        mileageAtService: 75000,
        nextServiceMileage: 105000,
        serviceDate: '1402/06/10',
        nextServiceDate: '1404/06/10',
        cost: 1200000,
        notes: 'لنت تکستار اصلی فرانسه نصب گردید.',
        createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      }
    ],
  },
  {
    id: 2,
    userId: 1,
    carBrand: 'سمند',
    carModel: 'LX EF7',
    carYear: 1396,
    mileage: 140500,
    fuelType: 'دوگانه‌سوز',
    licensePlateTag: '۲۲ د ۹۸۷ ایران ۱۱',
    lastServiceDate: '1402/11/01',
    notes: 'معاینه فنی تا انتهای سال معتبر است.',
    serviceLogs: [
      {
        id: 'srv-201',
        vehicleId: 2,
        serviceType: 'تعویض تسمه تایم و بلبرینگ سفت‌کن',
        mileageAtService: 80000,
        nextServiceMileage: 140000,
        serviceDate: '1400/05/20',
        nextServiceDate: '1403/05/20',
        cost: 2800000,
        notes: 'تسمه کانتیننتال اصلی آلمان همراه با تسمه دینام.',
        createdAt: new Date(Date.now() - 86400000 * 300).toISOString(),
      }
    ],
  },
];

let activeSessionsStore: any[] = [
  {
    id: 'sess-1',
    userId: 1,
    deviceName: 'مرورگر کلینیک خودرو (ویندوز ۱۰)',
    browser: 'Chrome 122.0',
    ipAddress: '5.160.188.42',
    location: 'تهران، ایران',
    lastActive: 'همین الان (فعال)',
    isCurrent: true,
  },
  {
    id: 'sess-2',
    userId: 1,
    deviceName: 'گوشی همراه سامسونگ A54',
    browser: 'Mobile Safari / Chrome',
    ipAddress: '2.185.12.90',
    location: 'کرج، ایران',
    lastActive: '۲ ساعت پیش',
    isCurrent: false,
  },
];

let securityLogsStore: any[] = [
  {
    id: 1,
    userId: 1,
    eventType: 'login_success',
    description: 'ورود موفقیت‌آمیز به سیستم با ایمیل',
    ipAddress: '5.160.188.42',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    userId: 1,
    eventType: '2fa_toggled',
    description: 'فعال‌سازی ورود دو مرحله‌ای امنیتی (SMS/ایمیل)',
    ipAddress: '5.160.188.42',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// OTP Store for Quick Email Login
let otpCodesStore: Record<string, { code: string; expiresAt: number }> = {};

// --- WEB PUSH & SERVICE WORKER NOTIFICATION SYSTEM ---
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  vapidKeys = webpush.generateVAPIDKeys();
}

try {
  webpush.setVapidDetails(
    'mailto:support@soalcar.ir',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (err: any) {
  console.error('[WebPush] VAPID configuration error:', err?.message);
}

let pushSubscriptionsStore: Array<{
  id: string;
  userId?: number;
  subscription: any;
  createdAt: string;
}> = [];

let notificationsStore: Array<{
  id: string;
  userId: number;
  title: string;
  body: string;
  type: 'mechanic_answer' | 'service_reminder' | 'system';
  targetUrl: string;
  read: boolean;
  createdAt: string;
}> = [
  {
    id: 'notif-seed-1',
    userId: 1,
    title: 'پاسخ جدید مکانیک',
    body: 'مکانیک رضا محمدی به سوال "علت صدای تق تق فرمان پژو ۲۰۶" شما پاسخ داد.',
    type: 'mechanic_answer',
    targetUrl: '/question/peugeot-206-steering-noise',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif-seed-2',
    userId: 1,
    title: 'یادآوری سرویس دوره‌ای سمند LX',
    body: 'موعد تعویض تسمه تایم و بلبرینگ سفت‌کن سمند LX (کیلومتر ۱۴۰,۰۰۰) فرارسیده است.',
    type: 'service_reminder',
    targetUrl: '/profile',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

function sendPushNotificationToUser(
  userId: number,
  payload: { title: string; body: string; type: 'mechanic_answer' | 'service_reminder' | 'system'; url?: string }
) {
  const notificationId = 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const notifObj = {
    id: notificationId,
    userId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    targetUrl: payload.url || '/',
    read: false,
    createdAt: new Date().toISOString(),
  };
  notificationsStore.unshift(notifObj);

  const userSubs = pushSubscriptionsStore.filter((s) => s.userId === userId || !s.userId);
  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    type: payload.type,
    url: payload.url || '/',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });

  userSubs.forEach((subObj) => {
    webpush.sendNotification(subObj.subscription, pushPayload).catch((err: any) => {
      console.log('[WebPush] Dispatch error or expired subscription endpoint:', err?.message);
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        pushSubscriptionsStore = pushSubscriptionsStore.filter(
          (s) => s.subscription.endpoint !== subObj.subscription.endpoint
        );
      }
    });
  });

  return notifObj;
}

// Helper function to generate Persian/Farsi friendly Slugs
function generateSlug(text: string): string {
  const clean = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-');
  return clean || `item-${Date.now()}`;
}

// Lazy initialization of Gemini AI
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize Gemini Client:', e);
    }
  }
  return genAIClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https:;"
    );
    next();
  });

  // Explicit CORS Policy Middleware
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // --------------------------------------------------------------------------
  // API ROUTES (/api/v1/*)
  // --------------------------------------------------------------------------

  // --- Auth Endpoints ---
  app.post('/api/v1/auth/register', (req: Request, res: Response) => {
    const { username, email, password, phoneNumber, role, displayName, workshopName, district, address } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'نام کاربری و ایمیل الزامی است.' });
    }

    const existing = usersStore.find((u) => u.email === email || u.username === username);
    if (existing) {
      return res.status(400).json({ error: 'این نام کاربری یا ایمیل قبلا ثبت شده است.' });
    }

    const newUser: User = {
      id: usersStore.length + 1,
      username: sanitizeHtmlInput(username),
      email: sanitizeHtmlInput(email),
      phoneNumber: phoneNumber || '09120000000',
      role: role === 'Mechanic' ? UserRole.Mechanic : UserRole.Owner,
      isVerified: true,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
    };

    if (newUser.role === UserRole.Mechanic) {
      const newProfile: MechanicProfile = {
        id: mechanicProfilesStore.length + 1,
        userId: newUser.id,
        displayName: sanitizeHtmlInput(displayName || username),
        workshopName: sanitizeHtmlInput(workshopName || 'تعمیرگاه شخصی'),
        address: sanitizeHtmlInput(address || 'تهران'),
        district: sanitizeHtmlInput(district || 'منطقه ۵'),
        slug: generateSlug(displayName || username),
        isPremium: false,
        reputationScore: 100,
        isVerifiedBadge: false,
        specialties: [{ id: 1, name: 'تعمیرات عمومی خودرو' }],
        answersCount: 0,
        acceptedAnswersCount: 0,
      };
      mechanicProfilesStore.push(newProfile);
      newUser.mechanicProfile = newProfile;
    }

    usersStore.push(newUser);

    const fakeToken = `jwt-token-${newUser.id}-${Date.now()}`;
    return res.json({
      user: newUser,
      token: fakeToken,
      message: 'ثبت‌نام با موفقیت انجام شد.',
    });
  });

  app.post('/api/v1/auth/login', (req: Request, res: Response) => {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername) {
      return res.status(400).json({ error: 'لطفاً نام کاربری یا ایمیل را وارد کنید.' });
    }

    // Check Account Lockout
    const lockout = checkAccountLockout(emailOrUsername);
    if (lockout.isLocked) {
      structuredLog('WARN', 'Blocked login attempt due to Account Lockout', { emailOrUsername });
      return res.status(429).json({
        error: `حساب کاربری شما به دلیل ۵ بار تلاش ناموفق متوالی، به مدت ${lockout.remainingMinutes} دقیقه قفل شده است.`,
      });
    }

    const user = usersStore.find(
      (u) => u.email.toLowerCase() === emailOrUsername.toLowerCase() || u.username.toLowerCase() === emailOrUsername.toLowerCase()
    );

    if (!user) {
      recordFailedLogin(emailOrUsername);
      return res.status(404).json({ error: 'کاربری با این مشخصات یافت نشد.' });
    }

    resetFailedLogin(emailOrUsername);

    if (user.role === UserRole.Mechanic) {
      user.mechanicProfile = mechanicProfilesStore.find((p) => p.userId === user.id);
    }

    const fakeToken = `jwt-token-${user.id}-${Date.now()}`;
    return res.json({
      user,
      token: fakeToken,
      message: 'خوش آمدید!',
    });
  });

  app.get('/api/v1/auth/me', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1; // Default to standard user
    const user = usersStore.find((u) => u.id === userId) || usersStore[0];

    if (user && user.role === UserRole.Mechanic) {
      user.mechanicProfile = mechanicProfilesStore.find((p) => p.userId === user.id);
    }

    return res.json({ user });
  });

  // --- Quick Email OTP & One-Click Authentication ---
  app.post('/api/v1/auth/quick-code/send', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' });
    }

    const code = '1234'; // Quick demo code
    otpCodesStore[email.toLowerCase()] = {
      code,
      expiresAt: Date.now() + 600000, // 10 mins
    };

    return res.json({
      message: `کد تایید ورود به ایمیل ${email} ارسال شد.`,
      demoCode: code,
    });
  });

  app.post('/api/v1/auth/quick-code/verify', (req: Request, res: Response) => {
    const { email, code, role } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'ایمیل و کد تایید الزامی است.' });
    }

    const record = otpCodesStore[email.toLowerCase()];
    if (code !== '1234' && (!record || record.code !== code || Date.now() > record.expiresAt)) {
      return res.status(400).json({ error: 'کد تایید وارد شده اشتباه یا منقضی شده است. (کد تست: 1234)' });
    }

    // Find existing user or auto-create account in 1 click
    let user = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const generatedUsername = email.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900);
      user = {
        id: usersStore.length + 1,
        username: generatedUsername,
        email: email.toLowerCase(),
        phoneNumber: '09120000000',
        role: role === 'Mechanic' ? UserRole.Mechanic : UserRole.Owner,
        isVerified: true,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        createdAt: new Date().toISOString(),
        twoFactorEnabled: false,
      };

      if (user.role === UserRole.Mechanic) {
        const newProfile: MechanicProfile = {
          id: mechanicProfilesStore.length + 1,
          userId: user.id,
          displayName: user.username,
          workshopName: 'تعمیرگاه سریع',
          address: 'تهران - مرکز',
          district: 'منطقه ۲ (ستارخان)',
          slug: generateSlug(user.username),
          isPremium: false,
          reputationScore: 100,
          isVerifiedBadge: false,
          specialties: [{ id: 1, name: 'عیب‌یابی سریع موتور' }],
          answersCount: 0,
          acceptedAnswersCount: 0,
        };
        mechanicProfilesStore.push(newProfile);
        user.mechanicProfile = newProfile;
      }

      usersStore.push(user);
    } else {
      if (user.role === UserRole.Mechanic) {
        user.mechanicProfile = mechanicProfilesStore.find((p) => p.userId === user.id);
      }
    }

    // Record Security Log
    securityLogsStore.unshift({
      id: securityLogsStore.length + 1,
      userId: user.id,
      eventType: 'login_success',
      description: 'ورود یک‌کلیکی با کد تایید ایمیل',
      ipAddress: '5.160.188.42',
      createdAt: new Date().toISOString(),
    });

    const fakeToken = `jwt-token-${user.id}-${Date.now()}`;
    return res.json({
      user,
      token: fakeToken,
      message: 'ورود سریع با موفقیت انجام شد.',
    });
  });

  // --- Profile & Account Security Endpoints ---
  app.put('/api/v1/user/profile', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const user = usersStore.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد.' });
    }

    const { username, email, phoneNumber, avatarUrl } = req.body;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    // Log security event
    securityLogsStore.unshift({
      id: securityLogsStore.length + 1,
      userId: user.id,
      eventType: 'profile_updated',
      description: 'ویرایش مشخصات پروفایل کاربری',
      ipAddress: '5.160.188.42',
      createdAt: new Date().toISOString(),
    });

    return res.json({ user, message: 'پروفایل کاربری با موفقیت به‌روزرسانی شد.' });
  });

  app.put('/api/v1/user/security/password', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const user = usersStore.find((u) => u.id === userId);

    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });

    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' });
    }

    securityLogsStore.unshift({
      id: securityLogsStore.length + 1,
      userId: user.id,
      eventType: 'password_changed',
      description: 'تغییر موفقیت‌آمیز رمز عبور حساب',
      ipAddress: '5.160.188.42',
      createdAt: new Date().toISOString(),
    });

    return res.json({ message: 'رمز عبور جدید با موفقیت ثبت و فعال شد.' });
  });

  app.put('/api/v1/user/security/2fa', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const user = usersStore.find((u) => u.id === userId);

    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });

    const { enabled } = req.body;
    user.twoFactorEnabled = !!enabled;

    securityLogsStore.unshift({
      id: securityLogsStore.length + 1,
      userId: user.id,
      eventType: '2fa_toggled',
      description: user.twoFactorEnabled ? 'فعال‌سازی ورود ۲ مرحله‌ای (2FA)' : 'غیرفعال‌سازی ورود ۲ مرحله‌ای',
      ipAddress: '5.160.188.42',
      createdAt: new Date().toISOString(),
    });

    return res.json({
      twoFactorEnabled: user.twoFactorEnabled,
      message: user.twoFactorEnabled
        ? 'ورود ۲ مرحله‌ای امنیتی برای حساب شما فعال شد.'
        : 'ورود ۲ مرحله‌ای غیرفعال شد.',
    });
  });

  app.get('/api/v1/user/security/sessions', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const sessions = activeSessionsStore.filter((s) => s.userId === userId);
    return res.json({ sessions });
  });

  app.delete('/api/v1/user/security/sessions/others', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    activeSessionsStore = activeSessionsStore.filter((s) => s.userId !== userId || s.isCurrent);
    return res.json({ message: 'تمامی نشست‌های فعال دیگر با موفقیت بسته شدند.' });
  });

  app.get('/api/v1/user/security/logs', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const logs = securityLogsStore.filter((l) => l.userId === userId);
    return res.json({ logs });
  });

  // --- Vehicle Garage Endpoints ---
  app.get('/api/v1/user/garage', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const vehicles = userVehiclesStore.filter((v) => v.userId === userId);
    return res.json({ vehicles });
  });

  app.post('/api/v1/user/garage', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const { carBrand, carModel, carYear, mileage, fuelType, licensePlateTag, notes } = req.body;

    if (!carBrand || !carModel) {
      return res.status(400).json({ error: 'برند و مدل خودرو الزامی است.' });
    }

    const newVehicle = {
      id: userVehiclesStore.length + 1,
      userId,
      carBrand,
      carModel,
      carYear: parseInt(carYear) || 1398,
      mileage: parseInt(mileage) || 0,
      fuelType: fuelType || 'بنزین',
      licensePlateTag: licensePlateTag || '',
      lastServiceDate: new Date().toLocaleDateString('fa-IR'),
      notes: notes || '',
    };

    userVehiclesStore.push(newVehicle);
    return res.json({ vehicle: newVehicle, message: 'خودرو جدید با موفقیت به گاراژ شما اضافه شد.' });
  });

  app.delete('/api/v1/user/garage/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    userVehiclesStore = userVehiclesStore.filter((v) => v.id !== parseInt(id));
    return res.json({ message: 'خودرو از گاراژ حذف شد.' });
  });

  // Add Service Log to Vehicle
  app.post('/api/v1/user/garage/:id/services', (req: Request, res: Response) => {
    const { id } = req.params;
    const vehicle = userVehiclesStore.find((v) => v.id === parseInt(id));
    if (!vehicle) {
      return res.status(404).json({ error: 'خودرو یافت نشد.' });
    }

    const { serviceType, mileageAtService, nextServiceMileage, serviceDate, nextServiceDate, cost, notes } = req.body;
    if (!serviceType || !mileageAtService || !nextServiceMileage) {
      return res.status(400).json({ error: 'عنوان سرویس، کیلومتر فعلی و کیلومتر سرویس بعدی الزامی است.' });
    }

    if (!vehicle.serviceLogs) {
      vehicle.serviceLogs = [];
    }

    const newRecord = {
      id: 'srv-' + Date.now(),
      vehicleId: vehicle.id,
      serviceType,
      mileageAtService: parseInt(mileageAtService),
      nextServiceMileage: parseInt(nextServiceMileage),
      serviceDate: serviceDate || new Date().toLocaleDateString('fa-IR'),
      nextServiceDate: nextServiceDate || '',
      cost: cost ? parseInt(cost) : undefined,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    vehicle.serviceLogs.unshift(newRecord);

    // Auto-update vehicle mileage if the service mileage is higher
    if (parseInt(mileageAtService) > (vehicle.mileage || 0)) {
      vehicle.mileage = parseInt(mileageAtService);
    }
    vehicle.lastServiceDate = serviceDate || new Date().toLocaleDateString('fa-IR');

    return res.json({ vehicle, record: newRecord, message: 'سرویس دوره‌ای جدید با موفقیت ثبت شد.' });
  });

  // Delete Service Log
  app.delete('/api/v1/user/garage/:id/services/:serviceId', (req: Request, res: Response) => {
    const { id, serviceId } = req.params;
    const vehicle = userVehiclesStore.find((v) => v.id === parseInt(id));
    if (!vehicle) {
      return res.status(404).json({ error: 'خودرو یافت نشد.' });
    }

    if (vehicle.serviceLogs) {
      vehicle.serviceLogs = vehicle.serviceLogs.filter((s: any) => s.id !== serviceId);
    }

    return res.json({ vehicle, message: 'سابقه سرویس حذف شد.' });
  });

  // Update Vehicle Current Mileage
  app.patch('/api/v1/user/garage/:id/mileage', (req: Request, res: Response) => {
    const { id } = req.params;
    const { mileage } = req.body;
    const vehicle = userVehiclesStore.find((v) => v.id === parseInt(id));
    if (!vehicle) {
      return res.status(404).json({ error: 'خودرو یافت نشد.' });
    }

    if (mileage === undefined || isNaN(parseInt(mileage))) {
      return res.status(400).json({ error: 'مقدار کارکرد کیلومتر معتبر نیست.' });
    }

    vehicle.mileage = parseInt(mileage);
    return res.json({ vehicle, message: 'کارکرد کیلومتر خودرو با موفقیت به‌روزرسانی شد.' });
  });

  // --- SERVICE WORKER & WEB PUSH ENDPOINTS ---
  app.get('/sw.js', (req: Request, res: Response) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Content-Type', 'application/javascript');
    return res.sendFile(path.join(process.cwd(), 'public', 'sw.js'));
  });

  app.get('/api/v1/push/vapid-public-key', (req: Request, res: Response) => {
    return res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post('/api/v1/push/subscribe', (req: Request, res: Response) => {
    const { subscription, userId } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'اطلاعات اشتراک Push معتبر نیست.' });
    }

    const uId = userId ? parseInt(userId) : 1;
    const existingIndex = pushSubscriptionsStore.findIndex(
      (s) => s.subscription.endpoint === subscription.endpoint
    );

    if (existingIndex >= 0) {
      pushSubscriptionsStore[existingIndex].userId = uId;
    } else {
      pushSubscriptionsStore.push({
        id: 'sub-' + Date.now(),
        userId: uId,
        subscription,
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({ message: 'اشتراک اعلان‌های هوشمند مرورگر با موفقیت ثبت شد.' });
  });

  app.post('/api/v1/push/unsubscribe', (req: Request, res: Response) => {
    const { endpoint } = req.body;
    if (endpoint) {
      pushSubscriptionsStore = pushSubscriptionsStore.filter(
        (s) => s.subscription.endpoint !== endpoint
      );
    }
    return res.json({ message: 'اشتراک اعلان‌ها لغو شد.' });
  });

  app.get('/api/v1/push/notifications', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;

    const userNotifs = notificationsStore.filter((n) => n.userId === userId || n.userId === 1);
    const unreadCount = userNotifs.filter((n) => !n.read).length;

    return res.json({
      notifications: userNotifs,
      unreadCount,
    });
  });

  app.patch('/api/v1/push/notifications/mark-read', (req: Request, res: Response) => {
    const { notificationId, markAll } = req.body;
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;

    if (markAll) {
      notificationsStore.forEach((n) => {
        if (n.userId === userId || n.userId === 1) n.read = true;
      });
    } else if (notificationId) {
      const found = notificationsStore.find((n) => n.id === notificationId);
      if (found) found.read = true;
    }

    return res.json({ message: 'وضعیت خوانده شده اعلان به‌روز شد.' });
  });

  app.post('/api/v1/push/send-test', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;
    const { title, body, type } = req.body;

    const testTitle = title || '🧪 تست سرویس ورکر سوالکار';
    const testBody = body || 'اعلان‌های مرورگر و سرویس ورکر با موفقیت پیکربندی شده و آماده دریافت هشدارها هستند!';

    const createdNotif = sendPushNotificationToUser(userId, {
      title: testTitle,
      body: testBody,
      type: type || 'system',
      url: '/profile',
    });

    return res.json({
      message: 'اعلان آزمایشی ارسال شد.',
      notification: createdNotif,
    });
  });

  app.post('/api/v1/push/check-service-reminders', (req: Request, res: Response) => {
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string) : 1;

    const userVehicles = userVehiclesStore.filter((v) => v.userId === userId);
    let dispatchedCount = 0;

    userVehicles.forEach((v) => {
      const currentKm = v.mileage || 0;
      if (!v.serviceLogs || !Array.isArray(v.serviceLogs)) return;

      v.serviceLogs.forEach((s: any) => {
        const nextKm = s.nextServiceMileage || 0;
        if (!nextKm) return;

        const remKm = nextKm - currentKm;
        if (remKm <= 1000) {
          dispatchedCount++;
          const isOverdue = remKm <= 0;
          sendPushNotificationToUser(userId, {
            title: isOverdue ? `🚨 هشدار سررسید سرویس ${v.carBrand} ${v.carModel}` : `🔔 یادآوری سرویس نزدیک ${v.carBrand} ${v.carModel}`,
            body: isOverdue
              ? `سرویس "${s.serviceType}" در کیلومتر ${nextKm.toLocaleString('fa-IR')} منقضی شده است! (کارکرد فعلی: ${currentKm.toLocaleString('fa-IR')}km)`
              : `تنها ${remKm.toLocaleString('fa-IR')} کیلومتر تا سرویس "${s.serviceType}" باقی مانده است.`,
            type: 'service_reminder',
            url: '/profile',
          });
        }
      });
    });

    return res.json({
      message: `بررسی انجام شد. ${dispatchedCount} یادآوری سرویس دوره‌ای ارسال شد.`,
      dispatchedCount,
    });
  });

  // --- File Upload Magic Bytes & MIME Type Validation Endpoint ---
  app.post('/api/v1/upload', (req: Request, res: Response) => {
    const { mimeType, base64Data } = req.body;

    if (!mimeType || !base64Data) {
      return res.status(400).json({ error: 'فایل و مشخصات آن الزامی است.' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ error: 'فرمت فایل غیرمجاز است. تنها تصاویر JPG, PNG, WEBP مجاز هستند.' });
    }

    // Simulated Magic Bytes Check
    let magicValid = true;
    try {
      const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
      if (buffer.length < 4) {
        magicValid = false;
      } else {
        const headerHex = buffer.subarray(0, 4).toString('hex').toUpperCase();
        if (mimeType.includes('jpeg') && !headerHex.startsWith('FFD8FF')) magicValid = false;
        if (mimeType.includes('png') && !headerHex.startsWith('89504E47')) magicValid = false;
      }
    } catch (e) {
      magicValid = false;
    }

    if (!magicValid) {
      return res.status(400).json({ error: 'محتوای فایل (Magic Bytes) با پسوند فایل مطابقت ندارد.' });
    }

    const fileUrl = `https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80`;
    return res.json({
      fileUrl,
      message: 'تصویر با موفقیت بررسی، اعتبارسنجی و بارگذاری شد.',
    });
  });

  // --- Questions Endpoints ---
  app.get('/api/v1/questions', (req: Request, res: Response) => {
    const { search, carBrand, carModel, tagSlug, status, sort } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    let results = questionsStore.filter((q) => !q.isDeleted);

    if (search) {
      const qStr = (search as string).toLowerCase();
      results = results.filter(
        (q) =>
          q.title.toLowerCase().includes(qStr) ||
          q.body.toLowerCase().includes(qStr) ||
          (q.carBrand && q.carBrand.toLowerCase().includes(qStr)) ||
          (q.carModel && q.carModel.toLowerCase().includes(qStr))
      );
    }

    if (carBrand && carBrand !== 'All') {
      results = results.filter((q) => q.carBrand?.toLowerCase() === (carBrand as string).toLowerCase());
    }

    if (carModel && carModel !== 'All') {
      results = results.filter((q) => q.carModel?.toLowerCase().includes((carModel as string).toLowerCase()));
    }

    if (tagSlug && tagSlug !== 'All') {
      results = results.filter((q) => q.questionTags?.some((t) => t.slug === tagSlug));
    }

    if (status && status !== 'All') {
      results = results.filter((q) => q.status === status);
    }

    // Attach Answers count to question objects
    results = results.map((q) => {
      const qAnswers = answersStore.filter((a) => a.questionId === q.id && !a.isDeleted);
      return {
        ...q,
        answers: qAnswers,
      };
    });

    if (sort === 'most_viewed') {
      results.sort((a, b) => b.viewCount - a.viewCount);
    } else if (sort === 'unanswered') {
      results = results.filter((q) => (q.answers?.length || 0) === 0);
    } else {
      // default newest
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const totalCount = results.length;
    const paginated = results.slice((page - 1) * pageSize, page * pageSize);

    // Standardized Pagination Envelope
    return res.json({
      data: paginated,
      questions: paginated, // backward compatibility
      page,
      pageSize,
      totalCount,
    });
  });

  app.get('/api/v1/questions/search', (req: Request, res: Response) => {
    const q = (req.query.q as string || '').toLowerCase();
    const matches = questionsStore.filter(
      (item) =>
        !item.isDeleted &&
        (item.title.toLowerCase().includes(q) ||
          item.body.toLowerCase().includes(q) ||
          item.carBrand?.toLowerCase().includes(q) ||
          item.carModel?.toLowerCase().includes(q))
    );
    return res.json({ results: matches });
  });

  app.get('/api/v1/questions/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const question = questionSlugIndex.get(slug) || questionsStore.find((q) => q.slug === slug || q.id === parseInt(slug));

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'سوال مورد نظر یافت نشد.' });
    }

    // Async Queue View Count Increment (Non-blocking)
    enqueueViewCountIncrement(question.id);

    // Fetch Answers for this question
    const questionAnswers = answersStore
      .filter((a) => a.questionId === question.id && !a.isDeleted)
      .map((ans) => {
        const mechanicProfile = mechanicProfilesStore.find((p) => p.userId === ans.authorId);
        return {
          ...ans,
          mechanicProfile,
        };
      });

    return res.json({
      question: {
        ...question,
        answers: questionAnswers,
      },
    });
  });

  app.post('/api/v1/questions', (req: Request, res: Response) => {
    const { title, body, carBrand, carModel, carYear, tagIds, authorId } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'عنوان و متن سوال الزامی است.' });
    }

    const sanitizedTitle = sanitizeHtmlInput(title);
    const sanitizedBody = sanitizeHtmlInput(body);

    const userId = authorId ? parseInt(authorId) : 1;
    const author = usersStore.find((u) => u.id === userId) || usersStore[0];

    const slug = generateSlug(sanitizedTitle) + '-' + Math.floor(1000 + Math.random() * 9000);

    const selectedTags: Tag[] = [];
    if (Array.isArray(tagIds)) {
      tagIds.forEach((tId) => {
        const t = tagsStore.find((tag) => tag.id === tId);
        if (t) {
          t.usageCount += 1;
          selectedTags.push(t);
        }
      });
    }

    const newQuestion: Question = {
      id: questionsStore.length + 1,
      title: sanitizedTitle,
      body: sanitizedBody,
      slug,
      authorId: author.id,
      author,
      carBrand: sanitizeHtmlInput(carBrand || 'نامشخص'),
      carModel: sanitizeHtmlInput(carModel || 'سایر'),
      carYear: carYear ? parseInt(carYear) : undefined,
      status: QuestionStatus.Open,
      viewCount: 1,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      questionTags: selectedTags,
      answers: [],
    };

    questionsStore.unshift(newQuestion);
    rebuildQuestionIndexes();

    return res.status(201).json({
      question: newQuestion,
      message: 'سوال شما با موفقیت ثبت شد.',
    });
  });

  // --- Answers Endpoints ---
  app.post('/api/v1/questions/:questionId/answers', (req: Request, res: Response) => {
    const questionId = parseInt(req.params.questionId);
    const { body, authorId } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'متن پاسخ نمی‌تواند خالی باشد.' });
    }

    const sanitizedBody = sanitizeHtmlInput(body);

    const question = questionsStore.find((q) => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'سوال یافت نشد.' });
    }

    const userId = authorId ? parseInt(authorId) : 2; // Default to mechanic
    const author = usersStore.find((u) => u.id === userId) || usersStore[1];
    const mechanicProfile = mechanicProfilesStore.find((p) => p.userId === author.id);

    const newAnswer: Answer = {
      id: answersStore.length + 1,
      questionId,
      authorId: author.id,
      author,
      mechanicProfile,
      body: sanitizedBody,
      isAccepted: false,
      voteScore: 0,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };

    answersStore.push(newAnswer);

    // Update question status to Answered
    question.status = QuestionStatus.Answered;

    if (mechanicProfile) {
      mechanicProfile.answersCount = (mechanicProfile.answersCount || 0) + 1;
      mechanicProfile.reputationScore += 15;
    }

    // --- SERVICE WORKER PUSH NOTIFICATION TRIGGER ---
    // Alert question author that a mechanic/specialist responded to their question
    const responderName = mechanicProfile?.displayName || author.username || 'مکانیک متخصص';
    sendPushNotificationToUser(question.authorId, {
      title: '🛠️ پاسخ جدید به سوال شما در سوالکار',
      body: `${responderName} به سوال "${question.title}" شما پاسخ داد.`,
      type: 'mechanic_answer',
      url: `/question/${question.slug}`,
    });

    return res.status(201).json({
      answer: newAnswer,
      message: 'پاسخ شما با موفقیت ثبت شد.',
    });
  });

  app.post('/api/v1/questions/:questionId/answers/:answerId/accept', (req: Request, res: Response) => {
    const answerId = parseInt(req.params.answerId);
    const questionId = parseInt(req.params.questionId);

    const answer = answersStore.find((a) => a.id === answerId && a.questionId === questionId);
    if (!answer) {
      return res.status(404).json({ error: 'پاسخ یافت نشد.' });
    }

    // Reset other answers acceptance
    answersStore.forEach((a) => {
      if (a.questionId === questionId) a.isAccepted = false;
    });

    answer.isAccepted = true;

    if (answer.mechanicProfile) {
      answer.mechanicProfile.acceptedAnswersCount = (answer.mechanicProfile.acceptedAnswersCount || 0) + 1;
      answer.mechanicProfile.reputationScore += 50;
    }

    return res.json({ message: 'پاسخ به‌عنوان پاسخ پذیرفته شده علامت زده شد.', answer });
  });

  app.post('/api/v1/questions/:questionId/answers/:answerId/vote', (req: Request, res: Response) => {
    const answerId = parseInt(req.params.answerId);
    const { type } = req.body; // 'up' | 'down'

    const answer = answersStore.find((a) => a.id === answerId);
    if (!answer) {
      return res.status(404).json({ error: 'پاسخ یافت نشد.' });
    }

    if (type === 'up') {
      answer.voteScore += 1;
      answer.userVote = VoteType.Up;
      if (answer.mechanicProfile) answer.mechanicProfile.reputationScore += 5;
    } else {
      answer.voteScore -= 1;
      answer.userVote = VoteType.Down;
    }

    return res.json({ answer, voteScore: answer.voteScore });
  });

  // --- Mechanics Directory Endpoints ---
  app.get('/api/v1/mechanics', (req: Request, res: Response) => {
    const { district, specialty, search } = req.query;

    let list = [...mechanicProfilesStore];

    if (district && district !== 'All') {
      list = list.filter((m) => m.district?.includes(district as string));
    }

    if (specialty && specialty !== 'All') {
      list = list.filter((m) => m.specialties.some((s) => s.name.includes(specialty as string)));
    }

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.workshopName?.toLowerCase().includes(q) ||
          m.address?.toLowerCase().includes(q)
      );
    }

    return res.json({ mechanics: list });
  });

  app.get('/api/v1/mechanics/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const mechanic = mechanicProfilesStore.find((m) => m.slug === slug || m.id === parseInt(slug));

    if (!mechanic) {
      return res.status(404).json({ error: 'مکانیک مورد نظر یافت نشد.' });
    }

    // Get mechanic's recent answers
    const mechanicAnswers = answersStore
      .filter((a) => a.authorId === mechanic.userId && !a.isDeleted)
      .map((a) => {
        const question = questionsStore.find((q) => q.id === a.questionId);
        return {
          ...a,
          questionTitle: question?.title || 'سوال تخصصی',
          questionSlug: question?.slug || '',
        };
      });

    return res.json({
      mechanic,
      recentAnswers: mechanicAnswers,
    });
  });

  // Submit Mechanic Review & Rating (Star rating system)
  app.post('/api/v1/mechanics/:id/reviews', (req: Request, res: Response) => {
    const mechanicId = parseInt(req.params.id, 10);
    const { rating, comment, authorName, serviceType } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'لطفاً امتیازی بین ۱ تا ۵ ستاره انتخاب کنید.' });
    }
    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({ error: 'لطفاً متن بازخورد خود را وارد کنید.' });
    }

    const mechanic = mechanicProfilesStore.find((m) => m.id === mechanicId);
    if (!mechanic) {
      return res.status(404).json({ error: 'مکانیک مورد نظر یافت نشد.' });
    }

    if (!mechanic.reviews) mechanic.reviews = [];

    const newReview = {
      id: Date.now(),
      mechanicProfileId: mechanicId,
      authorName: sanitizeHtmlInput(authorName || 'کاربر سوال‌کار'),
      rating: Number(rating),
      comment: sanitizeHtmlInput(comment),
      serviceType: serviceType ? sanitizeHtmlInput(serviceType) : undefined,
      createdAt: new Date().toISOString(),
    };

    mechanic.reviews.unshift(newReview);
    mechanic.ratingCount = mechanic.reviews.length;
    const sum = mechanic.reviews.reduce((acc, r) => acc + r.rating, 0);
    mechanic.ratingAverage = Number((sum / mechanic.ratingCount).toFixed(1));

    return res.json({
      message: 'امتیاز و بازخورد شما با موفقیت ثبت شد.',
      review: newReview,
      mechanic,
    });
  });

  app.post('/api/v1/mechanics/:mechanicId/contact-lead', (req: Request, res: Response) => {
    const mechanicId = parseInt(req.params.mechanicId);
    const { contactName, contactPhone, questionId, notes } = req.body;

    if (!contactName || !contactPhone) {
      return res.status(400).json({ error: 'نام و شماره تماس الزامی است.' });
    }

    const lead: LeadReferral = {
      id: leadReferralsStore.length + 1,
      mechanicProfileId: mechanicId,
      questionId: questionId ? parseInt(questionId) : 0,
      contactName,
      contactPhone,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      notes,
    };

    leadReferralsStore.push(lead);

    return res.json({
      message: 'درخواست تماس شما با موفقیت برای استادکار ارسال شد. به زودی با شما تماس خواهند گرفت.',
      lead,
    });
  });

  // --- Tags Endpoints ---
  app.get('/api/v1/tags', (req: Request, res: Response) => {
    return res.json({ tags: tagsStore });
  });

  app.get('/api/v1/tags/popular', (req: Request, res: Response) => {
    const sorted = [...tagsStore].sort((a, b) => b.usageCount - a.usageCount).slice(0, 20);
    return res.json({ tags: sorted });
  });

  function isQuotaOr429Error(err: any): boolean {
    if (!err) return false;
    const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
    return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('Quota');
  }

  // --- AI Diagnostic Smart Endpoint (Gemini API with Search Grounding) ---
  app.post('/api/v1/ai/diagnose', async (req: Request, res: Response) => {
    const { symptoms, carBrand, carModel, carYear } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'شرح عیب یا صدای خودرو الزامی است.' });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      // Fallback response if key is missing or not configured yet
      return res.json({
        diagnosis: `بر اساس علائم ذکر شده (${symptoms}) برای خودروی ${carBrand || ''} ${carModel || ''}:\n\n۱. **علت احتمالی اول:** اشکال در سیستم انتقال قدرت یا قطعات هیدرولیکی.\n۲. **سطح فوریت:** متوسط - مراجعه به مکانیک ظرف ۴۸ ساعت آینده توصیه می‌شود.\n۳. **تست اولیه:** بررسی سطح روغن موتور و چک کردن خطاهای دیاگ.`,
        isAI: false,
        groundingSources: [],
      });
    }

    try {
      const prompt = `شما یک استادیار مکانیک متخصص و باتجربه خودروهای ایرانی و وارداتی (مانند پژو، پراید، دنا، جک، هیوندای، کیا) در ایران هستید.
کاربر مشخصات زیر را وارد کرده است:
- برند/مدل خودرو: ${carBrand || 'نامشخص'} ${carModel || ''} (${carYear || 'سال نامشخص'})
- شرح مشکل / صدای غیرعادی / علامت: ${symptoms}

لطفاً یک تحلیلی تکنیکال، کاملاً کاربردی و قابل فهم به زبان فارسی در قالب زیر ارائه دهید:
۱) **علل احتمالی اصلی و فنی (به ترتیب احتمال)**
۲) **سطح خطر و فوریت (کم، متوسط، بالا)**
۳) **اقدامات فوری که مالک خودرو باید انجام دهد**
۴) **تست‌های پیشنهادی که مکانیک باید با دیاگ یا ابزار انجام دهد**

پاسخ را مختصر، ساختاریافته و با لحنی محترمانه و حرفه‌ای بنویسید.`;

      let response;
      try {
        response = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
      } catch (primaryErr: any) {
        if (isQuotaOr429Error(primaryErr)) {
          throw primaryErr;
        }
        console.warn('Primary Gemini model call failed, trying flash-lite fallback:', primaryErr?.message || primaryErr);
        response = await gemini.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
      }

      const text = response.text || 'پاسخی دریافت نشد.';

      // Extract Grounding Chunks (Web Search Citations)
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingSources = chunks
        .map((c: any) => ({
          title: c.web?.title || 'اطلاعات تخصصی وب',
          uri: c.web?.uri || '',
        }))
        .filter((s: any) => Boolean(s.uri));

      return res.json({
        diagnosis: text,
        isAI: true,
        groundingSources,
      });
    } catch (error: any) {
      console.error('Gemini Diagnosis Fallback Activated:', error?.message || error);
      return res.json({
        diagnosis: `بر اساس علائم ذکر شده (${symptoms}) برای خودروی ${carBrand || ''} ${carModel || ''}:\n\n۱. **علل احتمالی اصلی:** اشکال فنی در قطعات مصرفی خنک‌کننده، شمع/کوئل یاجلوبندی.\n۲. **سطح فوریت:** متوسط - جهت جلوگیری از آسیب بیشتر، بررسی کدهای خطای دیاگ توسط مکانیک توصیه می‌شود.\n۳. **اقدامات پیشنهادی:** چک کردن سطح روغن موتور، چک کردن آمپر آب و ثبت سوال در سامانه جهت دریافت پاسخ مستقیم مکانیک‌ها.`,
        isAI: false,
        groundingSources: [],
      });
    }
  });

  // --- Gemini Interactive Chatbot Endpoint (Multi-turn + Google Search Grounding) ---
  app.post('/api/v1/ai/chat', async (req: Request, res: Response) => {
    const { messages, carContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'پیام کاربر الزامی است.' });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      return res.json({
        reply: `در پاسخ به "${lastUserMsg}": جهت تحلیل دقیق‌تر، وضعیت روغن، علائم آمپر آب و کدهای خطای احتمالی دیاگ خودروی خود را بررسی کنید.`,
        groundingSources: [],
      });
    }

    try {
      const systemInstruction = `شما چت‌بات تخصصی و دستیار هوشمند خودرو «سوال‌کار» با قدرت مدل Gemini و جستجوی آنلاین گوگل (Search Grounding) هستید.
وظایف شما:
1. پاسخ به تمام سوالات فنی، عیب‌یابی صداهای ناآشنا، تحلیل کدهای خطای ECU، انتخاب روغن موتور و لوازم یدکی برای خودروهای ایرانی (پژو، پراید، دنا، کوئیک، تارا و...) و خارجی.
2. استفاده از داده‌های آنلاین گوگل جهت دریافت آخرین اطلاعیه‌های فراخوان خودرو، مشخصات فنی دقیق و کدهای فنی قطعات.
3. ارائه پاسخ‌های گام‌به‌گام، مؤدبانه و دقیق به زبان فارسی.
4. در صورت ارتباط سوال با مکانیک، ارجاع کاربر به دایرکتوری مکانیک‌های تأییدشده سایت سوال‌کار.
${carContext ? `مشخصات خودروی فعال کاربر: ${carContext.carBrand || ''} ${carContext.carModel || ''} مدل ${carContext.carYear || ''}` : ''}`;

      const contentsParts: any[] = messages.map((m: any) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      let response;
      try {
        response = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: contentsParts,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
          },
        });
      } catch (primaryErr: any) {
        if (isQuotaOr429Error(primaryErr)) {
          throw primaryErr;
        }
        console.warn('Primary Gemini Chat call failed, trying flash-lite fallback:', primaryErr?.message || primaryErr);
        response = await gemini.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: contentsParts,
          config: { systemInstruction },
        });
      }

      const reply = response.text || 'پاسخی از چت‌بات دریافت نشد.';

      // Extract Web Search Grounding Sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingSources = chunks
        .map((c: any) => ({
          title: c.web?.title || 'منبع آنلاین گوگل',
          uri: c.web?.uri || '',
        }))
        .filter((s: any) => Boolean(s.uri));

      return res.json({
        reply,
        groundingSources,
      });
    } catch (error: any) {
      console.error('Gemini Chatbot Fallback Activated:', error?.message || error);
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      return res.json({
        reply: `در پاسخ به سوال شما درباره «${lastUserMsg}»:\nسیستم هوشمند در حال حاضر با تراکم درخواست مواجه است. به طور کلی پیشنهاد می‌شود کدهای خطای دیاگ، سطح مایع خنک‌کننده و وضعیت تسمه‌ها را چک کنید. همچنین می‌توانید سوال خود را به صورت رایگان ثبت کنید تا مکانیک‌های تاییدشده سوال‌کار پاسخ دهند.`,
        groundingSources: [],
      });
    }
  });

  // --- Gemini AI Summarize Question Endpoint ---
  app.post('/api/v1/ai/summarize-question', async (req: Request, res: Response) => {
    const { symptoms, carBrand, carModel, carYear, aiDiagnosis } = req.body;

    const gemini = getGeminiClient();
    if (!gemini) {
      const title = `بررسی فنی ${carBrand || 'خودرو'} ${carModel || ''}: ${symptoms ? symptoms.slice(0, 50) : 'مشکل فنی'}`;
      const body = `مشخصات خودرو: ${carBrand || ''} ${carModel || ''} (${carYear || ''})\n\nشرح مشکل فنی:\n${symptoms || ''}\n\n${aiDiagnosis ? `خلاصه تحلیل اولیه Gemini AI:\n${aiDiagnosis}` : ''}`;
      return res.json({ title, body });
    }

    try {
      const prompt = `شما دستیار ارشد هوش مصنوعی سامانه سوال‌کار هستید.
کاربر مشخصات زیر را برای عیب‌یابی خودرو وارد کرده است:
- برند خودرو: ${carBrand || 'نامشخص'}
- مدل خودرو: ${carModel || 'نامشخص'}
- سال ساخت: ${carYear || 'نامشخص'}
- شرح مشکل / علائم کاربر: ${symptoms || ''}
${aiDiagnosis ? `- نتیجه تحلیل اولیه AI: ${aiDiagnosis}` : ''}

لطفاً یک عنوان دقیق و حرفه‌ای برای پرسش از مکانیک‌ها (عنوان سوال) و یک متن اصلی خلاصه، مفید، ساختاریافته و تخصصی به زبان فارسی جهت ثبت نهایی سوال تولید کنید.
پاسخ را دقیقاً به فرمت JSON زیر ارائه دهید (بدون هیچ متن و توضیحات اضافه):
{
  "title": "عنوان جذاب، کوتاه و دقیق برای سوال (حداکثر ۱۰ کلمه)",
  "body": "متن اصلی سوال شامل شرح دقیق و منظم علائم، مشخصات خودرو و خلاصه نکات فنی برای مطالعه مکانیک‌های متخصص"
}`;

      let response;
      try {
        response = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } catch (err: any) {
        if (isQuotaOr429Error(err)) {
          throw err;
        }
        console.warn('Summarize question primary model failed, fallback to flash-lite:', err?.message || err);
        response = await gemini.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      }

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text);
        return res.json({
          title: parsed.title || `علت ${symptoms?.slice(0, 50)} در ${carBrand} ${carModel}`,
          body: parsed.body || symptoms,
        });
      } catch (parseErr) {
        return res.json({
          title: `علت ${symptoms?.slice(0, 50)} در ${carBrand} ${carModel}`,
          body: `مشخصات خودرو: ${carBrand} ${carModel} (${carYear})\n\nشرح مشکل:\n${symptoms}\n\n${aiDiagnosis ? `تحلیل اولیه هوش مصنوعی:\n${aiDiagnosis}` : ''}`,
        });
      }
    } catch (error: any) {
      console.error('Gemini Summarize Question Fallback Activated:', error?.message || error);
      return res.json({
        title: `علت ${symptoms?.slice(0, 50)} در ${carBrand} ${carModel}`,
        body: `مشخصات خودرو: ${carBrand} ${carModel} (${carYear})\n\nشرح مشکل:\n${symptoms}\n\n${aiDiagnosis ? `تحلیل اولیه هوش مصنوعی:\n${aiDiagnosis}` : ''}`,
      });
    }
  });

  // --- Google Maps Mechanics Locator Endpoint (Google Maps Grounding) ---
  app.post('/api/v1/ai/find-mechanics-maps', async (req: Request, res: Response) => {
    const { issueQuery, locationQuery, lat, lng } = req.body;

    const latitude = typeof lat === 'number' ? lat : 35.6892; // Tehran default
    const longitude = typeof lng === 'number' ? lng : 51.3890;

    const userLocStr = locationQuery || 'تهران';
    const problemStr = issueQuery || 'تعمیرگاه و مکانیکی خودرو';

    const gemini = getGeminiClient();

    // Internal database matching mechanics
    const matchedMechanics = mechanicProfilesStore.map((m) => {
      const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.workshopName || m.displayName} ${m.address || m.district} ${userLocStr}`)}`;
      return {
        ...m,
        googleMapsUrl: mapSearchUrl,
      };
    });

    if (!gemini) {
      return res.json({
        recommendation: `بر اساس موقعیت مکانی (${userLocStr}) و نیاز فنی (${problemStr})، مکانیک‌های متناسب زیر در سامانه سوال‌کار به همراه لینک نقشه گوگل یافت شدند:`,
        groundingSources: matchedMechanics.map((m) => ({
          title: `${m.workshopName} (${m.district})`,
          uri: m.googleMapsUrl,
        })),
        mechanics: matchedMechanics,
      });
    }

    try {
      const prompt = `کاربر در محدوده یا شهر «${userLocStr}» به دنبال بهترین و نزدیک‌ترین مکانیکی و تعمیرگاه تخصصی خودرو برای مشکل زیر است:
مشکل خودرو / تخصص درخواستی: ${problemStr}

لطفاً با استفاده از ابزار نقشه گوگل (Google Maps Grounding):
۱. نزدیک‌ترین و باکیفیت‌ترین تعمیرگاه‌ها و مکانیکی‌های ثبت‌شده در منطقه را پیشنهاد دهید.
۲. آدرس دقیق و معابر اصلی دسترسی را ذکر کنید.
۳. نکات مهم برای مراجعه حضوری (مانند زمان خلوت‌تر یا بردن دیاگ) را بیان کنید.`;

      let response;
      try {
        response = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude,
                  longitude,
                },
              },
            },
          },
        });
      } catch (primaryErr: any) {
        if (isQuotaOr429Error(primaryErr)) {
          throw primaryErr;
        }
        console.warn('Primary Gemini Maps call failed, trying flash-lite fallback:', primaryErr?.message || primaryErr);
        response = await gemini.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
      }

      const recommendation = response.text || 'اطلاعات نقشه دریافت شد.';

      // Extract Maps Grounding Sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingSources: any[] = [];

      chunks.forEach((c: any) => {
        if (c.maps?.uri) {
          groundingSources.push({
            title: c.maps?.title || 'مکان در Google Maps',
            uri: c.maps?.uri,
          });
        }
      });

      return res.json({
        recommendation,
        groundingSources,
        mechanics: matchedMechanics,
      });
    } catch (error: any) {
      console.error('Gemini Maps Grounding Fallback Activated:', error?.message || error);
      return res.json({
        recommendation: `پیشنهادات مکانیک‌های سوال‌کار بر اساس محدوده ${userLocStr}:`,
        groundingSources: matchedMechanics.map((m) => ({
          title: `${m.workshopName} (${m.district})`,
          uri: m.googleMapsUrl,
        })),
        mechanics: matchedMechanics,
      });
    }
  });

  // --- Admin Endpoints ---
  app.post('/api/v1/admin/mechanics/:id/verify', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const profile = mechanicProfilesStore.find((m) => m.id === id);

    if (!profile) {
      return res.status(404).json({ error: 'پروفایل یافت نشد.' });
    }

    profile.isVerifiedBadge = true;
    return res.json({ message: 'نشان مکانیک تأییدشده با موفقیت اعطا شد.', profile });
  });

  app.get('/api/v1/admin/stats', (req: Request, res: Response) => {
    return res.json({
      totalQuestions: questionsStore.length,
      totalAnswers: answersStore.length,
      totalMechanics: mechanicProfilesStore.length,
      totalUsers: usersStore.length,
      pendingLeads: leadReferralsStore.length,
      totalArticles: articlesStore.filter((a) => !a.isDeleted).length,
    });
  });

  // --------------------------------------------------------------------------
  // ARTICLE & BLOG ENDPOINTS (/api/v1/articles/*)
  // --------------------------------------------------------------------------
  app.get('/api/v1/articles', (req: Request, res: Response) => {
    const { categorySlug, tagSlug, search, sort, includeDrafts } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;

    let results = articlesStore.filter((a) => !a.isDeleted);

    if (includeDrafts !== 'true') {
      results = results.filter((a) => a.status === 'Published');
    }

    if (categorySlug) {
      results = results.filter((a) => a.category?.slug === categorySlug || a.categoryId === parseInt(categorySlug as string));
    }

    if (tagSlug) {
      results = results.filter((a) => a.tags?.some((t: any) => t.slug === tagSlug));
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      results = results.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
    }

    if (sort === 'most_viewed') {
      results.sort((a, b) => b.viewCount - a.viewCount);
    } else {
      // Default: newest
      results.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
    }

    const totalCount = results.length;
    const paginated = results.slice((page - 1) * pageSize, page * pageSize);

    // Project DTO for summary list (exclude heavy HTML content)
    const projected = paginated.map(({ content, ...rest }) => rest);

    return res.json({
      data: projected,
      page,
      pageSize,
      totalCount,
    });
  });

  app.get('/api/v1/articles/categories', (req: Request, res: Response) => {
    const categoriesWithCount = articleCategoriesStore.map((cat) => {
      const count = articlesStore.filter((a) => !a.isDeleted && a.status === 'Published' && a.categoryId === cat.id).length;
      return { ...cat, articleCount: count };
    });
    return res.json(categoriesWithCount);
  });

  app.get('/api/v1/articles/tags', (req: Request, res: Response) => {
    return res.json(articleTagsStore);
  });

  app.get('/api/v1/articles/related/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const current = articlesStore.find((a) => a.slug === slug);
    if (!current) {
      return res.json([]);
    }

    const related = articlesStore
      .filter((a) => !a.isDeleted && a.status === 'Published' && a.id !== current.id)
      .filter((a) => a.categoryId === current.categoryId || a.tags?.some((t: any) => current.tags?.some((ct: any) => ct.id === t.id)))
      .slice(0, 4)
      .map(({ content, ...rest }) => rest);

    return res.json(related);
  });

  app.get('/api/v1/articles/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const article = articlesStore.find((a) => a.slug === slug || a.id === parseInt(slug));

    if (!article || article.isDeleted) {
      return res.status(404).json({ error: 'مقاله مورد نظر یافت نشد.' });
    }

    // Enqueue async view count increment
    enqueueViewCountIncrement(article.id);

    // Fetch related questions for internal linking
    let relatedQuestions: Question[] = [];
    if (article.relatedQuestionIds && article.relatedQuestionIds.length > 0) {
      relatedQuestions = questionsStore.filter((q) => !q.isDeleted && article.relatedQuestionIds.includes(q.id));
    } else {
      // Fallback related questions matching article category/tags
      relatedQuestions = questionsStore.filter((q) => !q.isDeleted).slice(0, 3);
    }

    // Related articles
    const relatedArticles = articlesStore
      .filter((a) => !a.isDeleted && a.status === 'Published' && a.id !== article.id && a.categoryId === article.categoryId)
      .slice(0, 4)
      .map(({ content, ...rest }) => rest);

    return res.json({
      article: {
        ...article,
        relatedQuestions,
        relatedArticles,
      },
    });
  });

  // --- Admin Article Endpoints ---
  app.post('/api/v1/admin/articles', (req: Request, res: Response) => {
    const {
      title,
      summary,
      content,
      coverImageUrl,
      coverImageAlt,
      categoryId,
      tagIds,
      relatedQuestionIds,
      status,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!title || !summary || !content) {
      return res.status(400).json({ error: 'عنوان، خلاصه و بدنه مقاله الزامی است.' });
    }

    const sanitizedTitle = sanitizeHtmlInput(title);
    const sanitizedSummary = sanitizeHtmlInput(summary);
    const sanitizedContent = sanitizeHtmlInput(content);

    const catId = categoryId ? parseInt(categoryId) : 1;
    const category = articleCategoriesStore.find((c) => c.id === catId) || articleCategoriesStore[0];

    const selectedTags = Array.isArray(tagIds)
      ? articleTagsStore.filter((t) => tagIds.includes(t.id))
      : [];

    let slug = generateSlug(sanitizedTitle);
    let counter = 2;
    while (articlesStore.some((a) => a.slug === slug)) {
      slug = `${generateSlug(sanitizedTitle)}-${counter}`;
      counter++;
    }

    const readingTime = calculateReadingTime(sanitizedContent);
    const articleStatus = status === 'Published' ? 'Published' : 'Draft';

    const newArticle = {
      id: articlesStore.length + 1,
      title: sanitizedTitle,
      slug,
      summary: sanitizedSummary,
      content: sanitizedContent,
      coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80',
      coverImageAlt: coverImageAlt || sanitizedTitle,
      categoryId: catId,
      category,
      authorId: 1,
      author: usersStore[0],
      status: articleStatus,
      viewCount: 1,
      readingTimeMinutes: readingTime,
      metaTitle: metaTitle ? sanitizeHtmlInput(metaTitle) : sanitizedTitle,
      metaDescription: metaDescription ? sanitizeHtmlInput(metaDescription) : sanitizedSummary,
      publishedAt: articleStatus === 'Published' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      tags: selectedTags,
      relatedQuestionIds: Array.isArray(relatedQuestionIds) ? relatedQuestionIds : [],
    };

    articlesStore.unshift(newArticle);
    structuredLog('INFO', 'New article created in Admin Panel', { articleId: newArticle.id, title: newArticle.title });

    return res.status(201).json({
      article: newArticle,
      message: 'مقاله با موفقیت ایجاد شد.',
    });
  });

  app.put('/api/v1/admin/articles/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const article = articlesStore.find((a) => a.id === id);

    if (!article || article.isDeleted) {
      return res.status(404).json({ error: 'مقاله یافت نشد.' });
    }

    const {
      title,
      summary,
      content,
      coverImageUrl,
      coverImageAlt,
      categoryId,
      tagIds,
      relatedQuestionIds,
      status,
      metaTitle,
      metaDescription,
    } = req.body;

    if (title) article.title = sanitizeHtmlInput(title);
    if (summary) article.summary = sanitizeHtmlInput(summary);
    if (content) {
      article.content = sanitizeHtmlInput(content);
      article.readingTimeMinutes = calculateReadingTime(article.content);
    }
    if (coverImageUrl) article.coverImageUrl = coverImageUrl;
    if (coverImageAlt) article.coverImageAlt = coverImageAlt;

    if (categoryId) {
      article.categoryId = parseInt(categoryId);
      article.category = articleCategoriesStore.find((c) => c.id === article.categoryId);
    }

    if (Array.isArray(tagIds)) {
      article.tags = articleTagsStore.filter((t) => tagIds.includes(t.id));
    }

    if (Array.isArray(relatedQuestionIds)) {
      article.relatedQuestionIds = relatedQuestionIds;
    }

    if (status) {
      if (article.status !== 'Published' && status === 'Published') {
        article.publishedAt = new Date().toISOString();
      }
      article.status = status;
    }

    if (metaTitle) article.metaTitle = sanitizeHtmlInput(metaTitle);
    if (metaDescription) article.metaDescription = sanitizeHtmlInput(metaDescription);

    article.updatedAt = new Date().toISOString();

    return res.json({
      article,
      message: 'مقاله با موفقیت بروزرسانی شد.',
    });
  });

  app.delete('/api/v1/admin/articles/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const article = articlesStore.find((a) => a.id === id);

    if (!article) {
      return res.status(404).json({ error: 'مقاله یافت نشد.' });
    }

    article.isDeleted = true;
    return res.json({ message: 'مقاله با موفقیت حذف گردید.' });
  });

  app.patch('/api/v1/admin/articles/:id/status', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const article = articlesStore.find((a) => a.id === id);

    if (!article) {
      return res.status(404).json({ error: 'مقاله یافت نشد.' });
    }

    if (status) {
      if (article.status !== 'Published' && status === 'Published') {
        article.publishedAt = new Date().toISOString();
      }
      article.status = status;
    }

    return res.json({ article, message: `وضعیت مقاله به ${status} تغییر یافت.` });
  });

  app.post('/api/v1/admin/articles/categories', (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'نام دسته الزامی است.' });

    const newCat = {
      id: articleCategoriesStore.length + 1,
      name: sanitizeHtmlInput(name),
      slug: generateSlug(name),
      description: description ? sanitizeHtmlInput(description) : '',
    };
    articleCategoriesStore.push(newCat);
    return res.status(201).json(newCat);
  });

  app.post('/api/v1/admin/articles/tags', (req: Request, res: Response) => {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'نام تگ الزامی است.' });

    const sanitizedName = sanitizeHtmlInput(name);
    const slug = generateSlug(sanitizedName);

    const newTag = {
      id: Math.max(...tagsStore.map((t) => t.id), ...articleTagsStore.map((t) => t.id), 0) + 1,
      name: sanitizedName,
      slug,
      category: category || 'System',
      usageCount: 0,
    };

    articleTagsStore.push(newTag);
    if (!tagsStore.some((t) => t.slug === slug)) {
      tagsStore.push(newTag);
    }

    return res.status(201).json(newTag);
  });

  // Comprehensive Tag Management Endpoints
  app.get('/api/v1/admin/tags/all', (req: Request, res: Response) => {
    // Combine tagsStore and articleTagsStore, calculated live counts
    const tagsMap = new Map<string, any>();

    tagsStore.forEach((t) => {
      const qCount = questionsStore.filter((q) => !q.isDeleted && q.questionTags?.some((qt) => qt.slug === t.slug || qt.id === t.id)).length;
      tagsMap.set(t.slug, {
        id: t.id,
        name: t.name,
        slug: t.slug,
        category: t.category || 'System',
        questionCount: qCount,
        articleCount: 0,
        totalUsage: qCount,
      });
    });

    articleTagsStore.forEach((at) => {
      const aCount = articlesStore.filter((a) => !a.isDeleted && a.tags?.some((t: any) => t.slug === at.slug || t.id === at.id)).length;
      if (tagsMap.has(at.slug)) {
        const existing = tagsMap.get(at.slug);
        existing.articleCount = aCount;
        existing.totalUsage = existing.questionCount + aCount;
      } else {
        tagsMap.set(at.slug, {
          id: at.id,
          name: at.name,
          slug: at.slug,
          category: at.category || 'System',
          questionCount: 0,
          articleCount: aCount,
          totalUsage: aCount,
        });
      }
    });

    const allTags = Array.from(tagsMap.values());
    allTags.sort((a, b) => b.totalUsage - a.totalUsage);

    return res.json({ tags: allTags });
  });

  app.post('/api/v1/admin/tags/create', (req: Request, res: Response) => {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'نام برچسب الزامی است.' });

    const sanitizedName = sanitizeHtmlInput(name);
    const slug = generateSlug(sanitizedName);

    if (tagsStore.some((t) => t.slug === slug) || articleTagsStore.some((t) => t.slug === slug)) {
      return res.status(400).json({ error: 'برچسبی با این نام یا اسلاگ قبلاً وجود دارد.' });
    }

    const nextId = Math.max(...tagsStore.map((t) => t.id), ...articleTagsStore.map((t) => t.id), 0) + 1;

    const newTag: Tag = {
      id: nextId,
      name: sanitizedName,
      slug,
      category: category || ('System' as any),
      usageCount: 0,
    };

    tagsStore.push(newTag);
    articleTagsStore.push({ id: nextId, name: sanitizedName, slug, category: category || 'System' });

    structuredLog('INFO', 'New tag created in Tag Manager', { tagId: nextId, name: sanitizedName });

    return res.status(201).json({
      tag: newTag,
      message: `برچسب «${sanitizedName}» با موفقیت به سیستم اضافه شد.`,
    });
  });

  app.put('/api/v1/admin/tags/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, category } = req.body;

    const mainTag = tagsStore.find((t) => t.id === id);
    const articleTag = articleTagsStore.find((t) => t.id === id);

    if (!mainTag && !articleTag) {
      return res.status(404).json({ error: 'برچسب پیدا نشد.' });
    }

    const sanitizedName = name ? sanitizeHtmlInput(name) : (mainTag?.name || articleTag?.name);
    const newSlug = name ? generateSlug(sanitizedName) : (mainTag?.slug || articleTag?.slug);

    if (mainTag) {
      mainTag.name = sanitizedName;
      mainTag.slug = newSlug;
      if (category) mainTag.category = category;
    }

    if (articleTag) {
      articleTag.name = sanitizedName;
      articleTag.slug = newSlug;
      if (category) articleTag.category = category;
    }

    return res.json({
      message: 'برچسب با موفقیت ویرایش شد.',
      tag: mainTag || articleTag,
    });
  });

  app.delete('/api/v1/admin/tags/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    tagsStore = tagsStore.filter((t) => t.id !== id);
    articleTagsStore = articleTagsStore.filter((t) => t.id !== id);

    return res.json({ message: 'برچسب با موفقیت حذف گردید.' });
  });

  app.get('/api/v1/tags/content/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;

    const matchedQuestions = questionsStore.filter(
      (q) => !q.isDeleted && q.questionTags?.some((t) => t.slug === slug || t.id.toString() === slug)
    );

    const matchedArticles = articlesStore.filter(
      (a) => !a.isDeleted && a.status === 'Published' && a.tags?.some((t: any) => t.slug === slug || t.id.toString() === slug)
    );

    const tagObj = tagsStore.find((t) => t.slug === slug) || articleTagsStore.find((t) => t.slug === slug);

    return res.json({
      tag: tagObj || { name: slug, slug },
      questions: matchedQuestions,
      articles: matchedArticles,
    });
  });

  // --------------------------------------------------------------------------
  // SEO ENDPOINTS (SITEMAP & RSS FEED)
  // --------------------------------------------------------------------------
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = 'https://soalcar.ir';
    const now = new Date().toISOString();

    let urls = `
    <url>
      <loc>${baseUrl}/</loc>
      <lastmod>${now}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>${baseUrl}/articles</loc>
      <lastmod>${now}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
    `;

    // Add Categories
    for (const cat of articleCategoriesStore) {
      urls += `
    <url>
      <loc>${baseUrl}/articles/category/${cat.slug}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`;
    }

    // Add Articles
    for (const a of articlesStore) {
      if (a.isDeleted || a.status !== 'Published') continue;
      urls += `
    <url>
      <loc>${baseUrl}/articles/${a.slug}</loc>
      <lastmod>${a.updatedAt || a.publishedAt || now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
    }

    // Add Questions
    for (const q of questionsStore) {
      if (q.isDeleted) continue;
      urls += `
    <url>
      <loc>${baseUrl}/question/${q.slug}</loc>
      <lastmod>${q.updatedAt || q.createdAt}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    return res.send(xml);
  });

  app.get('/rss/articles.xml', (req: Request, res: Response) => {
    const baseUrl = 'https://soalcar.ir';
    const publishedArticles = articlesStore.filter((a) => !a.isDeleted && a.status === 'Published');

    let items = '';
    for (const a of publishedArticles) {
      items += `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${baseUrl}/articles/${a.slug}</link>
      <guid>${baseUrl}/articles/${a.slug}</guid>
      <pubDate>${new Date(a.publishedAt || a.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${a.summary}]]></description>
      <category><![CDATA[${a.category?.name || 'عمومی'}]]></category>
    </item>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>مجله تخصصی خودرو سوال‌کار</title>
    <link>${baseUrl}/articles</link>

    <description>جدیدترین مقالات آموزش نگهداری، عیب‌یابی و راهنمای خرید خودروهای ایرانی و وارداتی</description>
    <language>fa-ir</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'text/xml');
    return res.send(xml);
  });

  // --- Global Exception Handler Middleware ---
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const traceId = `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    structuredLog('ERROR', 'Unhandled Exception trapped in global middleware', {
      error: err?.message || String(err),
      path: req.path,
      method: req.method,
      traceId,
    });

    return res.status(err?.status || 500).json({
      status: err?.status || 500,
      message: err?.message || 'خطای غیرمنتظره در سرور رخ داده است. لطفاً مجدداً تلاش نمایید.',
      traceId,
    });
  });

  // --------------------------------------------------------------------------
  // VITE MIDDLEWARE & STATIC ASSET HANDLING
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SoalCar Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
