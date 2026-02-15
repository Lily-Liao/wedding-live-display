
import { VoteOption } from './types';

// 生成 50 張測試素材
const generateMockMedia = () => {
  const media = [];
  for (let i = 1; i <= 50; i++) {
    // 每 5 張插一則影片 (使用 sample 影片路徑)
    if (i % 5 === 0) {
      media.push(`https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4?id=${i}`);
    } else {
      media.push(`https://picsum.photos/id/${100 + i}/1920/1080`);
    }
  }
  return media;
};

export const WEDDING_IMAGES = generateMockMedia();

export const VOTE_OPTIONS: VoteOption[] = [
  { id: 'A', label: '海風清透藍 Sea Blue', color: '#AAC6E6', count: 0 },
  { id: 'B', label: '星塵霧銀灰 Silver Gray', color: '#A7A2A2C9', count: 0 },
  { id: 'C', label: '可可焦糖棕 Caramel Brown', color: '#BA8663', count: 0 },
  { id: 'D', label: '霓光櫻花粉 Blossom Pink', color: '#F4BDE0', count: 0 }
];

export const ROSE_GOLD = '#E11D48';

export const INITIAL_MESSAGES = [
  { id: '1', name: '王小明', content: '祝福新人白頭偕老，永浴愛河！', timestamp: Date.now() },
  { id: '2', name: '李美美', content: '今天是最美的一天，恭喜！', timestamp: Date.now() },
  { id: '3', name: '張大華', content: '新婚快樂，早生貴子～', timestamp: Date.now() },
  { id: '4', name: '陳曉東', content: '看到你們幸福，我也很開心。', timestamp: Date.now() },
  { id: '5', name: '林淑芬', content: '天作之合，一定要一直走下去。', timestamp: Date.now() }
];

export const MOCK_GUESTS = [
  '張庭瑋', '林志龍', '陳雅婷', '王威廉', '李心潔', 
  '趙又廷', '周杰倫', '昆凌', '許瑋甯', '邱澤', 
  '蔡依林', '羅志祥', '蕭敬騰', '林俊傑', '田馥甄'
];
