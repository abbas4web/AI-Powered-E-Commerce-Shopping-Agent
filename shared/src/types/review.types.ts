export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number; // 1–5
  comment: string;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface ReviewSentimentSummary {
  productId: string;
  overallSentiment: number; // 0–1
  positiveAspects: string[];
  negativeAspects: string[];
  commonComplaints: string[];
  commonBenefits: string[];
  recurringTopics: string[];
  totalReviewsAnalyzed: number;
}
