/**
 * SoalCar.ir Data Models & Interfaces
 */

export enum UserRole {
  Owner = 'Owner',
  Mechanic = 'Mechanic',
  Admin = 'Admin'
}

export enum QuestionStatus {
  Open = 'Open',
  Answered = 'Answered',
  Closed = 'Closed'
}

export enum VoteType {
  Up = 'Up',
  Down = 'Down'
}

export enum TagCategory {
  CarBrand = 'CarBrand',
  IssueType = 'IssueType',
  System = 'System'
}

export interface User {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  mechanicProfile?: MechanicProfile;
}

export interface ServiceRecord {
  id: string;
  vehicleId: number;
  serviceType: string; // e.g. "تعویض روغن موتور و فیلترها", "تسمه تایم", "لنت ترمز", "روغن گیربکس", "شمع و وایر", "ضدیخ"
  mileageAtService: number; // کیلومتر زمان سرویس
  nextServiceMileage: number; // کیلومتر بعدی پیشنهادشده
  serviceDate: string; // تاریخ انجام سرویس
  nextServiceDate?: string; // تاریخ سررسید بعدی (اختیاری)
  cost?: number; // هزینه سرویس (تومان)
  notes?: string;
  createdAt: string;
}

export interface UserVehicle {
  id: number;
  userId: number;
  carBrand: string;
  carModel: string;
  carYear: number;
  mileage?: number; // kilometers
  fuelType?: string; // بنزین، دوگانه‌سوز، هیبرید
  licensePlateTag?: string; // e.g. "۴۴ ب ۵۵۵ ایران ۲2"
  lastServiceDate?: string;
  notes?: string;
  serviceLogs?: ServiceRecord[];
}

export interface UserSession {
  id: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecurityLog {
  id: number;
  eventType: 'login_success' | 'login_failed' | 'password_changed' | '2fa_toggled' | 'profile_updated';
  description: string;
  ipAddress: string;
  createdAt: string;
}


export interface MechanicSpecialty {
  id: number;
  name: string;
}

export interface MechanicReview {
  id: number;
  mechanicProfileId: number;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  serviceType?: string; // e.g. "تعویض تسمه تایم و دیاگ"
  createdAt: string;
}

export interface MechanicProfile {
  id: number;
  userId: number;
  displayName: string;
  bio?: string;
  workshopName?: string;
  address?: string;
  district?: string; // Tehran district e.g. "منطقه ۵ - ستارخان"
  phonePublic?: string;
  instagramHandle?: string;
  slug: string;
  isPremium: boolean;
  premiumUntil?: string;
  reputationScore: number;
  isVerifiedBadge: boolean;
  specialties: MechanicSpecialty[];
  user?: User;
  answersCount?: number;
  acceptedAnswersCount?: number;
  ratingAverage?: number; // e.g. 4.9
  ratingCount?: number;   // e.g. 28
  reviews?: MechanicReview[];
}

export interface QuestionImage {
  id: number;
  url: string;
  caption?: string;
}

export interface QuestionTag {
  id: number;
  tagId: number;
  tag: Tag;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  category: TagCategory;
  usageCount: number;
}

export interface Question {
  id: number;
  title: string;
  body: string;
  slug: string;
  authorId: number;
  author: User;
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  status: QuestionStatus;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  answers?: Answer[];
  questionTags?: Tag[];
  images?: QuestionImage[];
  aiSuggestion?: string;
}

export interface Vote {
  id: number;
  answerId: number;
  userId: number;
  type: VoteType;
  createdAt: string;
}

export interface Answer {
  id: number;
  questionId: number;
  authorId: number;
  author: User;
  body: string;
  isAccepted: boolean;
  voteScore: number;
  userVote?: VoteType;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  mechanicProfile?: MechanicProfile;
}

export interface LeadReferral {
  id: number;
  questionId: number;
  mechanicProfileId: number;
  contactName: string;
  contactPhone: string;
  status: 'Pending' | 'Contacted' | 'Converted';
  createdAt: string;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export enum ArticleStatus {
  Draft = 'Draft',
  Published = 'Published',
  Archived = 'Archived',
}

export interface ArticleCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
}

export interface ArticleTag {
  id: number;
  name: string;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  categoryId: number;
  category?: ArticleCategory;
  authorId: number;
  author?: User;
  status: ArticleStatus;
  viewCount: number;
  readingTimeMinutes: number;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  tags?: ArticleTag[];
  relatedQuestionIds?: number[];
  relatedQuestions?: Question[];
}

export interface PushNotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'mechanic_answer' | 'service_reminder' | 'system';
  targetUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface QuestionFilter {
  search?: string;
  carBrand?: string;
  carModel?: string;
  tagSlug?: string;
  status?: QuestionStatus | 'All';
  sort?: 'newest' | 'most_viewed' | 'unanswered';
  page?: number;
  limit?: number;
}
