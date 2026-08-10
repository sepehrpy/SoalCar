import { User, UserRole, MechanicProfile, Question, Answer, Tag, TagCategory, QuestionStatus, VoteType } from '../types';

export const INITIAL_TAGS: Tag[] = [
  { id: 1, name: 'ایران خودرو', slug: 'ikco', category: TagCategory.CarBrand, usageCount: 42 },
  { id: 2, name: 'سایپا', slug: 'saipa', category: TagCategory.CarBrand, usageCount: 38 },
  { id: 3, name: 'پژو ۲۰۶', slug: 'peugeot-206', category: TagCategory.CarBrand, usageCount: 29 },
  { id: 4, name: 'دنا و دنا پلاس', slug: 'dena', category: TagCategory.CarBrand, usageCount: 19 },
  { id: 5, name: 'پراید', slug: 'pride', category: TagCategory.CarBrand, usageCount: 35 },
  { id: 6, name: 'هیوندای', slug: 'hyundai', category: TagCategory.CarBrand, usageCount: 15 },
  { id: 7, name: 'کیاموتورز', slug: 'kia', category: TagCategory.CarBrand, usageCount: 12 },
  { id: 8, name: 'جک S5', slug: 'jac-s5', category: TagCategory.CarBrand, usageCount: 8 },
  { id: 9, name: 'موتور و فنی', slug: 'engine', category: TagCategory.IssueType, usageCount: 64 },
  { id: 10, name: 'گیربکس اتوماتیک', slug: 'auto-gearbox', category: TagCategory.IssueType, usageCount: 31 },
  { id: 11, name: 'برق و دیاگ', slug: 'electrical-diag', category: TagCategory.IssueType, usageCount: 27 },
  { id: 12, name: 'سیستم تعلیق و جلوبندی', slug: 'suspension', category: TagCategory.IssueType, usageCount: 22 },
  { id: 13, name: 'توربوشارژ', slug: 'turbocharger', category: TagCategory.IssueType, usageCount: 14 },
  { id: 14, name: 'ترمز و ABS', slug: 'brakes-abs', category: TagCategory.IssueType, usageCount: 18 },
  { id: 15, name: 'کولر و بخاری', slug: 'hvac', category: TagCategory.IssueType, usageCount: 11 },
];

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'ali_rezaei',
    email: 'ali@example.com',
    phoneNumber: '09121111111',
    role: UserRole.Owner,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 2,
    username: 'mehdi_mechanic',
    email: 'mehdi@soalcar.ir',
    phoneNumber: '09122222222',
    role: UserRole.Mechanic,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-11-01T08:30:00Z',
  },
  {
    id: 3,
    username: 'saman_auto',
    email: 'saman@soalcar.ir',
    phoneNumber: '09123333333',
    role: UserRole.Mechanic,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-12-15T14:20:00Z',
  },
  {
    id: 4,
    username: 'admin',
    email: 'admin@soalcar.ir',
    phoneNumber: '09120000000',
    role: UserRole.Admin,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 5,
    username: 'hasan_206',
    email: 'hasan@example.com',
    phoneNumber: '09124444444',
    role: UserRole.Owner,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-01T11:15:00Z',
  }
];

export const INITIAL_MECHANIC_PROFILES: MechanicProfile[] = [
  {
    id: 1,
    userId: 2,
    displayName: 'استاد مهدی رضایی',
    bio: 'تخصص ۲۰ ساله در تعمیرات تخصصی موتور TU5 و EF7، برق خودرو و عیب‌یابی دیاگ تخصصی خانواده ایران خودرو و سایپا.',
    workshopName: 'تعمیرگاه تخصصی نوین کار (استاد مهدی)',
    address: 'تهران، خیابان ستارخان، نرسیده به پل یادگار امام، خیابان صحرایی، پلاک ۴۲',
    district: 'منطقه ۲ (ستارخان)',
    phonePublic: '02166554433',
    instagramHandle: 'novincar_sattarkhan',
    slug: 'ostad-mehdi-rezaei',
    isPremium: true,
    reputationScore: 1480,
    isVerifiedBadge: true,
    ratingAverage: 4.9,
    ratingCount: 28,
    specialties: [
      { id: 1, name: 'موتور TU5 و EF7' },
      { id: 2, name: 'گیربکس دستی و اتوماتیک' },
      { id: 3, name: 'برق و دیاگ تخصصی' },
      { id: 4, name: 'تنظیم موتور و کاهش مصرف سوخت' }
    ],
    answersCount: 84,
    acceptedAnswersCount: 62,
    reviews: [
      {
        id: 1,
        mechanicProfileId: 1,
        authorName: 'رضا کمالی',
        rating: 5,
        comment: 'استاد مهدی بسیار منصف و بااخلاق بودن! مشکل صدای موتور ۲۰۶ منو که ۳ جا برده بودم دقیقاً تشخیص دادن و با هزینه مناسب برطرف کردن.',
        serviceType: 'تعویض تایپیت و تنظیم موتور',
        createdAt: '2026-02-01T14:20:00Z'
      },
      {
        id: 2,
        mechanicProfileId: 1,
        authorName: 'حسین احمدی',
        rating: 5,
        comment: 'عالی و منظم. عیب‌یابی دیاگ تخصصی ستارخان فقط تعمیرگاه نوین کار.',
        serviceType: 'برق و عیب‌یابی دیاگ',
        createdAt: '2026-01-25T11:00:00Z'
      }
    ]
  },
  {
    id: 2,
    userId: 3,
    displayName: 'مهندس سامان احمدی',
    bio: 'کارشناس رسمی خودروهای کره‌ای و چینی (هیوندای، کیا، جک، چری). مستردیپلم تعمیرات گیربکس‌های CVT و AT6.',
    workshopName: 'مرکز تخصصی گیربکس و دیاگ کوروش',
    address: 'تهران، خیابان عباس‌آباد (بهشتی)، خیابان صابونچی، پلاک ۸۸',
    district: 'منطقه ۷ (عباس‌آباد)',
    phonePublic: '02188776655',
    instagramHandle: 'kourosh_autocenter',
    slug: 'eng-saman-ahmadi',
    isPremium: true,
    reputationScore: 1920,
    isVerifiedBadge: true,
    ratingAverage: 4.8,
    ratingCount: 35,
    specialties: [
      { id: 5, name: 'گیربکس اتوماتیک هیوندای و کیا' },
      { id: 6, name: 'توربوشارژر و سوپرشارژر' },
      { id: 7, name: 'عیب‌یابی شبکه CAN و کنترل‌ یونیت ECU' },
      { id: 8, name: 'تعلیق باد و جلوبندی وارداتی' }
    ],
    answersCount: 112,
    acceptedAnswersCount: 95,
    reviews: [
      {
        id: 3,
        mechanicProfileId: 2,
        authorName: 'امیرحسین موسوی',
        rating: 5,
        comment: 'مرکز فوق تخصصی برای گیربکس‌های اتوماتیک هیوندای و جک. تقه دنده جک S5 من با آپدیت نرم‌افزار TCU به راحتی حل شد.',
        serviceType: 'تعمیر گیربکس اتوماتیک DCT',
        createdAt: '2026-02-02T10:15:00Z'
      }
    ]
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'صدای غیرعادی تق‌تق از سمت راست موتور پژو ۲۰۶ تیپ ۵ در استارت سرد',
    body: 'سلام خدمت استادان عزیز. پژو ۲۰۶ تیپ ۵ مدل ۱۳۹۷ دارم (کارکرد ۹۵ هزار). مدتی هست صبح‌ها وقتی ماشینو استارت می‌زنم، حدود ۲ تا ۳ دقیقه یک صدای تق‌تق یا تقه‌مانند تیز از سمت راست بالای موتور (سمت تسمه تایم) شنیده میشه و بعد از گرم شدن کامل موتور کلاً قطع میشه. روغن موتور رو تازه عوض کردم (10W40 توتال). آیا ممکنه از تایپیت‌های هیدرولیک باشه یا استکانکی‌ها؟ راه حل چیه؟',
    slug: 'صدای-غیرعادی-موتور-پژو-206-استارت-سرد',
    authorId: 5,
    author: INITIAL_USERS[4],
    carBrand: 'ایران خودرو',
    carModel: 'پژو ۲۰۶ تیپ ۵',
    carYear: 1397,
    status: QuestionStatus.Answered,
    viewCount: 1420,
    createdAt: '2026-02-05T09:30:00Z',
    isDeleted: false,
    questionTags: [INITIAL_TAGS[0], INITIAL_TAGS[2], INITIAL_TAGS[8]],
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80', caption: 'نمای محفظه موتور پژو ۲۰۶' }
    ],
    aiSuggestion: 'بر اساس نشانه‌های مطرح شده (صدای تق‌تق در ۳ دقیقه اول استارت سرد و برطرف شدن پس از گرم شدن روغن)، احتمال ۹۰٪ ضعیف شدن تایپیت‌های هیدرولیکی (استکانکی‌ها) یا افت فشار لحظه‌ای اویل‌پمپ در ثانیه‌های اول استارت است. استفاده از روغن با ویسکوزیته مناسب استاندارد (مثلا 5W30 یا 10W40 باکیفیت) و چک کردن فشار روغن توصیه می‌شود.'
  },
  {
    id: 2,
    title: 'تقه‌زدن شدید گیربکس اتوماتیک جک S5 هنگام معکوس دادن از دنده ۳ به ۲',
    body: 'با سلام. جک S5 فیس‌لیفت توربو اتوماتیک مدل ۱۴۰۰ دارم. مواقعی که ترافیکه یا سرعت رو کم می‌کنم، دقیقا موقعی که گیربکس میخواد از دنده ۳ بیاد روی ۲، یک تقه کاملاً محسوس و ضربه به اتاق وارد می‌کنه. در دنده‌های بالاتر یا هنگام شتاب‌گیری هیچ مشکلی نداره. تعویض روغن گیربکس رو کیلومتر ۶۰ هزار انجام دادم. ممنون میشم راهنمایی کنید آیا از شیر برقی‌هاست یا نیاز به آپدیت نرم‌افزار ECU/TCU داره؟',
    slug: 'تقه‌زدن-گیربکس-اتوماتیک-جک-s5-معکوس',
    authorId: 1,
    author: INITIAL_USERS[0],
    carBrand: 'جک (JAC)',
    carModel: 'جک S5 توربو اتوماتیک',
    carYear: 1400,
    status: QuestionStatus.Answered,
    viewCount: 2180,
    createdAt: '2026-02-03T16:10:00Z',
    isDeleted: false,
    questionTags: [INITIAL_TAGS[7], INITIAL_TAGS[9]],
    aiSuggestion: 'در گیربکس‌های ۶ سرعته DCT یا اتوماتیک جک S5، ضربه معکوس دنده ۳ به ۲ معمولاً دو علت اصلی دارد: ۱) خطای سنسور دمای روغن گیربکس یا کثیفی شیر برقی دنده ۲. ۲) نیاز به تعریف مجدد (Adaptation/Learning) و آپدیت نرم‌افزار TCU با دستگاه دیاگ تخصصی جک Launch یا G-Scan.'
  },
  {
    id: 3,
    title: 'روشن شدن همزمان چراغ چک و ABS دنا پلاس توربو و افت شتاب ماشین',
    body: 'دوستان عزیز سلام. دنا پلاس توربو ۶ دنده اتوماتیک دارم. دیشب توی اتوبان هنگام حرکت یهو چراغ چک به همراه چراغ ABS روشن شد و ماشین حالت کندی به خودش گرفت و گاز نمی‌خورد (حالت ایمنی یا Limp Mode). وقتی خاموش روشن کردم چراغ ABS خاموش شد ولی چراغ چک هنوز روشنه. آیا ممکنه از سنسور دور چرخ یا سنسور مپ/پدال گاز باشه؟ هزینه تعمیرش حدوداً چقدر میشه؟',
    slug: 'روشن-شدن-چراغ-چک-abs-دنا-پلاس-توربو',
    authorId: 5,
    author: INITIAL_USERS[4],
    carBrand: 'ایران خودرو',
    carModel: 'دنا پلاس توربو اتوماتیک',
    carYear: 1401,
    status: QuestionStatus.Open,
    viewCount: 890,
    createdAt: '2026-02-07T18:45:00Z',
    isDeleted: false,
    questionTags: [INITIAL_TAGS[0], INITIAL_TAGS[3], INITIAL_TAGS[10], INITIAL_TAGS[13]],
  }
];

export const INITIAL_ANSWERS: Answer[] = [
  {
    id: 1,
    questionId: 1,
    authorId: 2,
    author: INITIAL_USERS[1],
    mechanicProfile: INITIAL_MECHANIC_PROFILES[0],
    body: `سلام دوست گرامی.
توضیحات شما بسیار دقیق و کلاسیک است! این نشانه دقیقاً مربوط به **تایپیت‌های هیدرولیک (استکانکی‌ها)** موتور TU5 می‌باشد.

### علت فنی:
در موتور TU5 زمانی که خودرو چند ساعت خاموش می‌ماند، روغن درون استکانکی‌های هیدرولیک به سمت کارتل تخلیه می‌شود. در ۳ دقیقه اول استارت سرد تا زمانی که اویل‌پمپ فشار روغن را به سرسیلندر برساند و استکانکی‌ها پر از روغن شوند، لقی سوپاپ‌ها بیشتر شده و صدای تق‌تق ایجاد می‌کنند.

### اقدام پیشنهادی:
۱. **فشار روغن را اندازه بگیرید:** ابتدا با گیج فشار در تعمیرگاه، فشار اویل‌پمپ در حالت سرد و گرم چک شود.
۲. **شستشوی مجاری روغن:** استفاده از فلاشینگ موتور باکیفیت قبل از تعویض روغن بعدی.
۳. **تغییر ویسکوزیته روغن:** پیشنهاد می‌کنم در تعویض بعدی از روغن 5W40 سنتیک باکیفیت (مانند بهران سوپر پیشتاز یا ادینول) استفاده کنید که سریع‌تر به بالای سرسیلندر می‌رسد.

اگر بعد از تعویض روغن هم صدا ادامه داشت، ۲ الی ۴ عدد از تایپیت‌ها ضعیف شده‌اند و هزینه تعویض آن‌ها همراه با واشر درب سوپاپ حدود ۱.۵ تا ۲.۵ میلیون تومان خواهد بود. در خدمت شما هستیم در ستارخان.`,
    isAccepted: true,
    voteScore: 24,
    userVote: VoteType.Up,
    createdAt: '2026-02-05T11:20:00Z',
    isDeleted: false,
  },
  {
    id: 2,
    questionId: 2,
    authorId: 3,
    author: INITIAL_USERS[2],
    mechanicProfile: INITIAL_MECHANIC_PROFILES[1],
    body: `سلام و درود.
در خودروی جک S5 اتوماتیک (گیربکس دوبل کلاچ DCT ۶ سرعته)، تقه معکوس دنده ۳ به ۲ از شایع‌ترین ایرادات نرم‌افزاری و هیدرولیکی است.

### مراحل عیب‌یابی دقیق:
۱. **تطبیق‌دهی کلاچ‌ها (Clatch Readaptation):** با دستگاه دیاگ تخصصی، عملکرد کلاچ تر کالیبره شود. در ۷۰ درصد موارد بدون نیاز به باز کردن گیربکس با این آپدیت مشکل حل می‌شود.
۲. **چک کردن وضعیت شیر برقی Solenoid V4:** شیر برقی کنترل معکوس دنده ۲ اگر جرمی گرفته باشد، تخلیه فشار روغن را با تاخیر انجام می‌دهد که باعث ضربه می‌شود.
۳. **سطح و کیفیت روغن گیربکس:** مطمئن شوید روغن با استاندارد DCT اصلی شارژ شده باشد (نه روغن معمولی AT).

می‌توانید برای دیاگ رایگان و تست جاده‌ای به مجموعه ما در عباس‌آباد مراجعه بفرمایید.`,
    isAccepted: true,
    voteScore: 31,
    userVote: VoteType.Up,
    createdAt: '2026-02-03T18:00:00Z',
    isDeleted: false,
  }
];
