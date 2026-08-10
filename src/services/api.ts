import {
  Question,
  Answer,
  User,
  MechanicProfile,
  MechanicReview,
  Tag,
  QuestionFilter,
  LeadReferral,
  Article,
  ArticleCategory,
  ArticleTag,
  ArticleStatus,
} from '../types';

const API_BASE = '/api/v1';

// Helper for local storage token / session
export const getStoredUser = (): User | null => {
  try {
    const data = localStorage.getItem('soalcar_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('soalcar_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('soalcar_user');
  }
};

export const apiService = {
  // Auth
  async register(data: any): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ثبت‌نام');
    }
    return res.json();
  },

  async login(emailOrUsername: string): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ورود');
    }
    return res.json();
  },

  async getCurrentUser(userId?: number): Promise<User> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/auth/me`, { headers });
    const data = await res.json();
    return data.user;
  },

  // Quick OTP / 1-Click Email Auth
  async sendQuickCode(email: string): Promise<{ message: string; demoCode?: string }> {
    const res = await fetch(`${API_BASE}/auth/quick-code/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ارسال کد تایید');
    }
    return res.json();
  },

  async verifyQuickCode(email: string, code: string, role?: string): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/quick-code/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در تایید کد ورود');
    }
    return res.json();
  },

  // User Profile & Security
  async updateProfile(data: { username?: string; email?: string; phoneNumber?: string; avatarUrl?: string }, userId?: number): Promise<{ user: User; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در به‌روزرسانی مشخصات');
    }
    return res.json();
  },

  async updatePassword(currentPassword: string, newPassword: string, userId?: number): Promise<{ message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/security/password`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در تغییر رمز عبور');
    }
    return res.json();
  },

  async toggle2FA(enabled: boolean, userId?: number): Promise<{ twoFactorEnabled: boolean; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/security/2fa`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در فعال‌سازی ورود ۲ مرحله‌ای');
    }
    return res.json();
  },

  async getActiveSessions(userId?: number): Promise<{ sessions: any[] }> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/security/sessions`, { headers });
    return res.json();
  },

  async terminateOtherSessions(userId?: number): Promise<{ message: string }> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/security/sessions/others`, {
      method: 'DELETE',
      headers,
    });
    return res.json();
  },

  async getSecurityLogs(userId?: number): Promise<{ logs: any[] }> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/security/logs`, { headers });
    return res.json();
  },

  // Vehicle Garage
  async getGarageVehicles(userId?: number): Promise<{ vehicles: any[] }> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/garage`, { headers });
    return res.json();
  },

  async addGarageVehicle(data: any, userId?: number): Promise<{ vehicle: any; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/user/garage`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ثبت خودرو جدید');
    }
    return res.json();
  },

  async deleteGarageVehicle(vehicleId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/user/garage/${vehicleId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async addVehicleServiceRecord(vehicleId: number, data: any): Promise<{ vehicle: any; record: any; message: string }> {
    const res = await fetch(`${API_BASE}/user/garage/${vehicleId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ثبت سرویس دوره‌ای');
    }
    return res.json();
  },

  async deleteVehicleServiceRecord(vehicleId: number, serviceId: string): Promise<{ vehicle: any; message: string }> {
    const res = await fetch(`${API_BASE}/user/garage/${vehicleId}/services/${serviceId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در حذف سابقه سرویس');
    }
    return res.json();
  },

  async updateVehicleMileage(vehicleId: number, mileage: number): Promise<{ vehicle: any; message: string }> {
    const res = await fetch(`${API_BASE}/user/garage/${vehicleId}/mileage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mileage }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در به‌روزرسانی کارکرد کیلومتر');
    }
    return res.json();
  },

  // Questions
  async getQuestions(filter?: QuestionFilter): Promise<{ questions: Question[]; total: number }> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.carBrand) params.append('carBrand', filter.carBrand);
    if (filter?.carModel) params.append('carModel', filter.carModel);
    if (filter?.tagSlug) params.append('tagSlug', filter.tagSlug);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.sort) params.append('sort', filter.sort);

    const res = await fetch(`${API_BASE}/questions?${params.toString()}`);
    return res.json();
  },

  async getQuestionBySlug(slug: string): Promise<{ question: Question }> {
    const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('سوال یافت نشد.');
    return res.json();
  },

  async createQuestion(data: {
    title: string;
    body: string;
    carBrand?: string;
    carModel?: string;
    carYear?: number;
    tagIds?: number[];
    authorId?: number;
  }): Promise<{ question: Question; message: string }> {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ثبت سوال');
    }
    return res.json();
  },

  // Answers
  async submitAnswer(questionId: number, body: string, authorId?: number): Promise<{ answer: Answer; message: string }> {
    const res = await fetch(`${API_BASE}/questions/${questionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, authorId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ارسال پاسخ');
    }
    return res.json();
  },

  async acceptAnswer(questionId: number, answerId: number): Promise<{ message: string; answer: Answer }> {
    const res = await fetch(`${API_BASE}/questions/${questionId}/answers/${answerId}/accept`, {
      method: 'POST',
    });
    return res.json();
  },

  async voteAnswer(questionId: number, answerId: number, type: 'up' | 'down'): Promise<{ answer: Answer; voteScore: number }> {
    const res = await fetch(`${API_BASE}/questions/${questionId}/answers/${answerId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    return res.json();
  },

  // Mechanics
  async getMechanics(district?: string, specialty?: string, search?: string): Promise<{ mechanics: MechanicProfile[] }> {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (specialty) params.append('specialty', specialty);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/mechanics?${params.toString()}`);
    return res.json();
  },

  async getMechanicBySlug(slug: string): Promise<{ mechanic: MechanicProfile; recentAnswers: any[] }> {
    const res = await fetch(`${API_BASE}/mechanics/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('مکانیک یافت نشد.');
    return res.json();
  },

  async sendLeadReferral(mechanicId: number, data: { contactName: string; contactPhone: string; questionId?: number; notes?: string }): Promise<{ message: string; lead: LeadReferral }> {
    const res = await fetch(`${API_BASE}/mechanics/${mechanicId}/contact-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async submitMechanicReview(mechanicId: number, data: { rating: number; comment: string; authorName?: string; serviceType?: string }): Promise<{ message: string; review: MechanicReview; mechanic: MechanicProfile }> {
    const res = await fetch(`${API_BASE}/mechanics/${mechanicId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ثبت امتیاز و نظر');
    }
    return res.json();
  },

  // Tags
  async getTags(): Promise<{ tags: Tag[] }> {
    const res = await fetch(`${API_BASE}/tags`);
    return res.json();
  },

  async getPopularTags(): Promise<{ tags: Tag[] }> {
    const res = await fetch(`${API_BASE}/tags/popular`);
    return res.json();
  },

  // Gemini AI Smart Diagnostics & Chatbot
  async diagnoseVehicleSymptoms(symptoms: string, carBrand?: string, carModel?: string, carYear?: number): Promise<{ diagnosis: string; isAI: boolean; groundingSources?: Array<{ title: string; uri: string }> }> {
    const res = await fetch(`${API_BASE}/ai/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, carBrand, carModel, carYear }),
    });
    if (!res.ok) throw new Error('خطا در ارتباط با هوش مصنوعی');
    return res.json();
  },

  async chatWithGemini(messages: Array<{ role: 'user' | 'model'; text: string }>, carContext?: { carBrand?: string; carModel?: string; carYear?: number }): Promise<{ reply: string; groundingSources?: Array<{ title: string; uri: string }> }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, carContext }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در برقراری ارتباط با چت‌بات');
    }
    return res.json();
  },

  async findMechanicsWithMaps(issueQuery?: string, locationQuery?: string, lat?: number, lng?: number): Promise<{ recommendation: string; groundingSources?: Array<{ title: string; uri: string }>; mechanics: MechanicProfile[] }> {
    const res = await fetch(`${API_BASE}/ai/find-mechanics-maps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueQuery, locationQuery, lat, lng }),
    });
    return res.json();
  },

  async summarizeQuestionWithAi(data: { symptoms: string; carBrand: string; carModel: string; carYear?: number; aiDiagnosis?: string }): Promise<{ title: string; body: string }> {
    const res = await fetch(`${API_BASE}/ai/summarize-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('خطا در تلخیص هوشمند سوال');
    return res.json();
  },

  // Admin
  async verifyMechanic(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/mechanics/${id}/verify`, { method: 'POST' });
    return res.json();
  },

  async getAdminStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    return res.json();
  },

  // Articles & Blog Module
  async getArticles(params?: {
    categorySlug?: string;
    tagSlug?: string;
    search?: string;
    sort?: 'newest' | 'most_viewed';
    page?: number;
    pageSize?: number;
    includeDrafts?: boolean;
  }): Promise<{ data: Article[]; page: number; pageSize: number; totalCount: number }> {
    const query = new URLSearchParams();
    if (params?.categorySlug) query.append('categorySlug', params.categorySlug);
    if (params?.tagSlug) query.append('tagSlug', params.tagSlug);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.includeDrafts) query.append('includeDrafts', 'true');

    const res = await fetch(`${API_BASE}/articles?${query.toString()}`);
    return res.json();
  },

  async getArticleCategories(): Promise<ArticleCategory[]> {
    const res = await fetch(`${API_BASE}/articles/categories`);
    return res.json();
  },

  async getArticleTags(): Promise<ArticleTag[]> {
    const res = await fetch(`${API_BASE}/articles/tags`);
    return res.json();
  },

  async getArticleBySlug(slug: string): Promise<{ article: Article & { relatedQuestions: Question[]; relatedArticles: Article[] } }> {
    const res = await fetch(`${API_BASE}/articles/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('مقاله مورد نظر یافت نشد.');
    return res.json();
  },

  async getRelatedArticles(slug: string): Promise<Article[]> {
    const res = await fetch(`${API_BASE}/articles/related/${encodeURIComponent(slug)}`);
    return res.json();
  },

  async createArticle(articleData: any): Promise<{ article: Article; message: string }> {
    const res = await fetch(`${API_BASE}/admin/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ثبت مقاله.');
    }
    return res.json();
  },

  async updateArticle(id: number, articleData: any): Promise<{ article: Article; message: string }> {
    const res = await fetch(`${API_BASE}/admin/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در بروزرسانی مقاله.');
    }
    return res.json();
  },

  async deleteArticle(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/articles/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async updateArticleStatus(id: number, status: ArticleStatus | string): Promise<{ article: Article; message: string }> {
    const res = await fetch(`${API_BASE}/admin/articles/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async createArticleCategory(data: { name: string; description?: string }): Promise<ArticleCategory> {
    const res = await fetch(`${API_BASE}/admin/articles/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async createArticleTag(data: { name: string; category?: string }): Promise<ArticleTag> {
    const res = await fetch(`${API_BASE}/admin/articles/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Tag Management System
  async getAllTagsDetailed(): Promise<{ tags: Array<{ id: number; name: string; slug: string; category: string; questionCount: number; articleCount: number; totalUsage: number }> }> {
    const res = await fetch(`${API_BASE}/admin/tags/all`);
    return res.json();
  },

  async createTag(data: { name: string; category?: string }): Promise<{ tag: Tag; message: string }> {
    const res = await fetch(`${API_BASE}/admin/tags/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ایجاد برچسب');
    }
    return res.json();
  },

  async updateTag(id: number, data: { name: string; category?: string }): Promise<{ tag: Tag; message: string }> {
    const res = await fetch(`${API_BASE}/admin/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ویرایش برچسب');
    }
    return res.json();
  },

  async deleteTag(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/tags/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getTaggedContent(slug: string): Promise<{ tag: any; questions: Question[]; articles: Article[] }> {
    const res = await fetch(`${API_BASE}/tags/content/${encodeURIComponent(slug)}`);
    return res.json();
  },

  // Web Push & Service Worker Notifications
  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    const res = await fetch(`${API_BASE}/push/vapid-public-key`);
    return res.json();
  },

  async subscribePush(subscription: any, userId?: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطا در ثبت اشتراک اعلان‌ها');
    }
    return res.json();
  },

  async unsubscribePush(endpoint: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
    return res.json();
  },

  async getPushNotifications(userId?: number): Promise<{ notifications: any[]; unreadCount: number }> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/push/notifications`, { headers });
    return res.json();
  },

  async markNotificationRead(notificationId?: string, markAll?: boolean, userId?: number): Promise<{ message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/push/notifications/mark-read`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ notificationId, markAll }),
    });
    return res.json();
  },

  async sendTestPushNotification(data?: { title?: string; body?: string; type?: string }, userId?: number): Promise<{ message: string; notification: any }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/push/send-test`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data || {}),
    });
    return res.json();
  },

  async checkServiceReminders(userId?: number): Promise<{ message: string; dispatchedCount: number }> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId.toString();

    const res = await fetch(`${API_BASE}/push/check-service-reminders`, {
      method: 'POST',
      headers,
    });
    return res.json();
  }
};
