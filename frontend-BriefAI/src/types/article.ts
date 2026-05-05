export interface Article {
  uniqueKey: string;
  title: string;
  url: string;
  pubDate: string;
  source: string;
  category: string;
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  entities: string[];
  trendingTopics: string[];
  macroTopics?: string[];
  score?: number;
}
