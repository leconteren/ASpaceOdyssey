
import { Post } from './types';

export const INITIAL_USER = {
  id: 'user_xiaohan',
  name: 'Xiaohan',
  avatar: 'https://picsum.photos/seed/xiaohan/200',
  joinedAt: Date.now(),
  points: 0
};

export const INITIAL_POSTS_RAW = `
2025-12-29
徐新：不管多大的fund size，每期fund 都是4个home run，3-4年投资期 = 每年1个home run；
那么最优fund size到底该多大？无非是 coverage x hit ratio之间的平衡；
每年投的deal，少一半，你会砍哪些？
IRR角度 葛卫东是沐曦赚最多钱、最快的投资人；
Hummingbird - 一个创始人的特质你会投，但是这个特质的反面也会投。有争议的特点，会非常有意思。

2025-11-03
A2A Payment——
收敛场景下串行场景，需要AI间有多步工作流，更容易做切分；内容 - 供给本身容易实现切分的东西；
进一步研究：这种支付流程的效率到底有多高？

2025-04-21
极壳：
全新的品类，供应链并不成熟，累计研发费用投入了10-15mn养供应链；
实际用户的使用频率和活跃度如何，取决于什么Use case - 户外基本就是两周活、如果是日常使用就是日活；
实际Disable的用户占比，10%左右；

2025-03-17
智力 vs 知识（有一些信息只能垂直数据可以解答 - 比如问A股2024年成交量最高和最低的公司）；

2025-02-24
AIGC vs 上一代GC工具，Margin应该长神马样子？
语言模型、视频模型和世界模型，之后是神马关系？

2024-10-28
大变化里 最好的公司 最好的创始人
好的人 - 启明的特点（持续覆盖学者）、去五源的人的变化（变谦逊，Open Debate）
怎么找人 - 95后=18年以后进入大厂=中台化以后弱辐射的BU，一年下来十个人，动态变化 => what's going on；
姚顺雨 - 普林毕业，老师不是大牛，COT主要的贡献者，说明很多东西都是自己做出来的；
美国正在发生财富转移 - baby boomer->千禧年一代，富二代会批量出现；中国要晚5-10年；
OAI、Anthropic，目前发布的东西都是6-12M之前的东西；

2024-09-09
AVGO
为什么一个披着科技外衣的PE公司，通过收购，可以再各个领域建立起自己的壁垒，如ASIC？- 有运气成分碰上了TPU；
IP业务有over charge的风险，Marvell和AVGO是ASIC领域的第一梯队，其他人更多是在做Supply Chain Management；

2024-07-29
KLA 讨论：
新技术路线的竞争风险？E-beam效率是optical的1/1000，需要有100x的提升才可能产生一定替代；目前是互补关系；
测量设备 vs Semi的CapEx投入占比过去是否稳定？- 其实略有一点提升，往先进制程升级的时候CapEx投入会增加；
白马大票，Multiple All time high，有啥Edge？- 中国inflection point，看中国什么时候capex往下走，可以Short；目前AI exposure不是特别大；
`;

export const parseInitialPosts = (userId: string, userName: string): Post[] => {
  const posts: Post[] = [];
  const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
  const segments = INITIAL_POSTS_RAW.split(dateRegex).filter(s => s.trim() !== '');

  for (let i = 0; i < segments.length; i += 2) {
    const dateStr = segments[i].trim();
    const content = segments[i + 1]?.trim();
    if (dateStr && content) {
      posts.push({
        id: `init_${i}`,
        userId,
        userName,
        content,
        timestamp: new Date(dateStr).getTime(),
        dateStr
      });
    }
  }
  return posts.sort((a, b) => b.timestamp - a.timestamp);
};
