export interface Virtue {
  name: string;
  chineseName: string;
  franklinDefinition: string;
  universalExample: string;
  actionableSteps: string[];
  guaName: string;
  guaXiang: string;
  tuanCi: string;
}

export const virtues: Virtue[] = [
  {
    name: "Temperance",
    chineseName: "节制",
    franklinDefinition: "Eat not to dullness; drink not to elevation.",
    universalExample: "Overeating at a late-night social event just because the food was appealing.",
    actionableSteps: [
      "Stop eating when you feel 80% full, rather than eating until you are completely stuffed.",
      "Set a strict limit of one alcoholic or sugary drink per social event before you arrive.",
      "When stressed, drink a full glass of water and wait 10 minutes before snacking."
    ],
    guaName: "第60卦 水泽节",
    guaXiang: "䷼",
    tuanCi: "节，亨。刚柔分而刚得中。苦节不可贞，其道穷也。说以行险，当位以节，中正以通。天地节而四时成。节以制度，不伤财，不害民。",
  },
  {
    name: "Silence",
    chineseName: "沉默",
    franklinDefinition: "Speak not but what may benefit others or yourself; avoid trifling conversation.",
    universalExample: "Interrupting a meaningful discussion with a shallow, unrelated joke.",
    actionableSteps: [
      "Listen actively without interrupting, waiting a full 3 seconds after someone finishes speaking before you reply.",
      "Before speaking, ask yourself if the comment is constructive; if it's mere gossip or complaining, hold it back.",
      "Spend 15 minutes a day in complete silence, away from screens and conversations."
    ],
    guaName: "第27卦 山雷颐",
    guaXiang: "䷚",
    tuanCi: "颐，贞吉，养正则吉也。观颐，自求口实。天地养万物，圣人养贤以及万民，颐之时大矣哉！",
  },
  {
    name: "Order",
    chineseName: "秩序",
    franklinDefinition: "Let all your things have their places; let each part of your business have its time.",
    universalExample: "Leaving open browser tabs and physical documents scattered, causing mental fog.",
    actionableSteps: [
      "Designate a specific, permanent home for your keys, wallet, and phone, and always return them there.",
      "Spend 10 minutes every evening planning and scheduling your top 3 tasks for the next day.",
      "Clear your physical workspace of all non-essential items before starting a focused work block."
    ],
    guaName: "第10卦 天泽履",
    guaXiang: "䷉",
    tuanCi: "履，柔履刚也。说而应乎乾，是以履虎尾，不咥人，亨。刚中正，履帝位而不疚，光明也。",
  },
  {
    name: "Resolution",
    chineseName: "果断",
    franklinDefinition: "Resolve to perform what you ought; perform without fail what you resolve.",
    universalExample: "Delaying a difficult self-improvement task to check messages instead.",
    actionableSteps: [
      "Break down a goal you've been procrastinating on into a tiny, 5-minute task and do it immediately.",
      "Once you commit to a meeting or deadline, write it down and treat it as a non-negotiable contract.",
      "When faced with an urge to quit a difficult task, promise yourself to work for just 10 more minutes."
    ],
    guaName: "第43卦 泽天夬",
    guaXiang: "䷪",
    tuanCi: "夬，决也，刚决柔也。健而说，决而和。扬于王庭，柔乘五刚也。告自邑，不利即戎，所尚乃穷也。利有攸往，刚长乃终也。",
  },
  {
    name: "Frugality",
    chineseName: "节俭",
    franklinDefinition: "Make no expense but to do good to others or yourself; i.e., waste nothing.",
    universalExample: "Buying a digital tool or subscription without a clear plan to utilize it immediately.",
    actionableSteps: [
      "Implement a 24-hour waiting period before purchasing any non-essential item over $50.",
      "Review your monthly subscriptions and immediately cancel at least one that you rarely use.",
      "Prepare your own lunch and coffee for work instead of buying them out."
    ],
    guaName: "第41卦 山泽损",
    guaXiang: "䷨",
    tuanCi: "损，损下益上，其道上行。损而有孚，元吉，无咎，可贞，利有攸往。曷之用？二簋可用享。二簋应有时，损刚益柔有时。损益盈虚，与时偕行。",
  },
  {
    name: "Industry",
    chineseName: "勤勉",
    franklinDefinition: "Lose no time; be always employ'd in something useful; cut off all unnecessary actions.",
    universalExample: "Spending the first hour of the day on low-priority emails instead of deep work.",
    actionableSteps: [
      "Use the Pomodoro technique: work with zero distractions for 25 minutes, then take a 5-minute break.",
      "Identify your most difficult or important task of the day and complete it first thing in the morning.",
      "When you catch yourself mindlessly scrolling on your phone, immediately put it down and read a page of a book or do a small chore."
    ],
    guaName: "第1卦 乾为天",
    guaXiang: "䷀",
    tuanCi: "大哉乾元，万物资始，乃统天。云行雨施，品物流形。大明终始，六位时成，时乘六龙以御天。乾道变化，各正性命，保合太和，乃利贞。首出庶物，万国咸宁。",
  },
  {
    name: "Sincerity",
    chineseName: "诚恳",
    franklinDefinition: "Use no hurtful deceit; think innocently and justly, and, if you speak, speak accordingly.",
    universalExample: "Giving a polite but insincere compliment just to avoid an awkward silence.",
    actionableSteps: [
      "Give a genuine compliment to a colleague or friend today without expecting anything in return.",
      "Admit when you don't know something instead of guessing or pretending to have the answer.",
      "Avoid using passive-aggressive language; express your needs and boundaries clearly and kindly."
    ],
    guaName: "第61卦 风泽中孚",
    guaXiang: "䷼",
    tuanCi: "中孚，柔在内而刚得中。说而巽，孚，乃化邦也。豚鱼吉，信及豚鱼也。利涉大川，乘木舟虚也。中孚以利贞，乃应乎天也。",
  },
  {
    name: "Justice",
    chineseName: "正直",
    franklinDefinition: "Wrong none by doing injuries, or omitting the benefits that are your duty.",
    universalExample: "Failing to acknowledge a colleague's contribution to a shared achievement.",
    actionableSteps: [
      "Stand up for someone who is being interrupted or talked over in a meeting or group conversation.",
      "Before judging a conflict, intentionally seek out and listen to the perspective of the opposing side.",
      "Ensure you give credit to others for their ideas and contributions, both in private and public."
    ],
    guaName: "第21卦 火雷噬嗑",
    guaXiang: "䷔",
    tuanCi: "颐中有物曰噬嗑。噬嗑而亨，刚柔分，动而明。雷电合而章。柔得中而上行，虽不当位，利用狱也。",
  },
  {
    name: "Moderation",
    chineseName: "中庸",
    franklinDefinition: "Avoid extremes; forbear resenting injuries so much as you think they deserve.",
    universalExample: "Dwelling on a minor insult and letting it affect my mood for the entire afternoon.",
    actionableSteps: [
      "When you feel slighted or angry, take 5 deep breaths before responding to avoid overreacting.",
      "Limit your daily news or social media consumption to a specific 30-minute window.",
      "Forgive a minor offense from a friend or family member today instead of holding a grudge."
    ],
    guaName: "第62卦 雷山小过",
    guaXiang: "䷽",
    tuanCi: "小过，小者过而亨也。过以利贞，与时行也。柔得中，是以小事吉也。刚失位而不中，是以不可大事也。有飞鸟之象焉，飞鸟遗之音，不宜上，宜下，大吉，上逆而下顺也。",
  },
  {
    name: "Cleanliness",
    chineseName: "整洁",
    franklinDefinition: "Tolerate no uncleanness in body, clothes, or habitation.",
    universalExample: "Ignoring a stack of dirty dishes or a messy workspace until it feels overwhelming.",
    actionableSteps: [
      "Make your bed every morning immediately after waking up to establish a baseline of order.",
      "Wash your dishes or load the dishwasher right after eating, never leaving them in the sink overnight.",
      "Take a shower and wear clean, presentable clothes even if you are working from home all day."
    ],
    guaName: "第22卦 山火贲",
    guaXiang: "䷕",
    tuanCi: "贲，亨。柔来而文刚，故亨。分刚上而文柔，故小利有攸往。天文也。文明以止，人文也。观乎天文，以察时变。观乎人文，以化成天下。",
  },
  {
    name: "Tranquility",
    chineseName: "平静",
    franklinDefinition: "Be not disturbed at trifles, or at accidents common or unavoidable.",
    universalExample: "Losing my inner peace because of a minor technical bug in my project.",
    actionableSteps: [
      "When an unexpected delay occurs (like traffic or a long line), use the time to practice mindfulness instead of getting frustrated.",
      "Write down three things you are worried about, categorize them as 'in my control' or 'out of my control', and let go of the latter.",
      "Disconnect from all digital screens at least one hour before going to bed."
    ],
    guaName: "第52卦 艮为山",
    guaXiang: "䷳",
    tuanCi: "艮，止也。时止则止，时行则行，动静不失其时，其道光明。艮其止，止其所也。上下敌应，不相与也。是以不获其身，行其庭不见其人，无咎也。",
  },
  {
    name: "Chastity",
    chineseName: "贞洁",
    franklinDefinition: "Rarely use venery but for health or offspring... never to the injury of your own or another's peace.",
    universalExample: "Pursuing sensory distractions that scatter my focus and weaken my willpower.",
    actionableSteps: [
      "Direct your romantic and sexual energy exclusively toward strengthening the bond with your committed partner.",
      "Avoid consuming media or entertainment that cheapens intimacy or objectifies others.",
      "Practice redirecting intrusive lustful thoughts toward a productive physical or creative activity."
    ],
    guaName: "第44卦 天风姤",
    guaXiang: "䷫",
    tuanCi: "姤，遇也，柔遇刚也。勿用取女，不可与长也。天地相遇，品物咸章也。刚遇中正，天下大行也。姤之时义大矣哉！",
  },
  {
    name: "Humility",
    chineseName: "谦逊",
    franklinDefinition: "Imitate Jesus and Socrates.",
    universalExample: "Explaining a concept I already know in a way that makes others feel inferior.",
    actionableSteps: [
      "Acknowledge a recent mistake you made openly and discuss what you learned from it.",
      "When receiving praise, graciously say 'thank you' and highlight the contributions of others who helped.",
      "Instead of directly contradicting an idea you disagree with, use the Socratic method of asking questions to guide the conversation."
    ],
    guaName: "第15卦 地山谦",
    guaXiang: "䷎",
    tuanCi: "谦，亨。天道下济而光明，地道卑而上行。地道变盈而流谦，鬼神害盈而福谦，人道恶盈而好谦。谦尊而光，卑而不可逾，君子之终也。",
  },
  {
    name: "Adaptability",
    chineseName: "圆融",
    franklinDefinition: "Buffer the friction of others' illogical behavior. Do not let external chaos disrupt your internal logic; be as earth that supports all things.",
    universalExample: "Getting internally irritated and judgmental when a partner explains a simple task in a disorganized way.",
    actionableSteps: [
      "When someone is being illogical or disorganized, take a deep breath and ask clarifying questions instead of showing frustration.",
      "Treat unexpected changes in your schedule as an opportunity to practice mental flexibility rather than a disruption.",
      "Focus solely on controlling your internal emotional response, letting go of the urge to control other people's chaotic behavior."
    ],
    guaName: "第2卦 坤为地",
    guaXiang: "䷁",
    tuanCi: "至哉坤元，万物资生，乃顺承天。坤厚载物，德合无疆。含弘光大，品物咸亨。牝马地类，行地无疆，柔顺利贞。君子有攸往，先迷后得主，利居贞。西南得朋，乃与类行。东北丧朋，乃终有庆。安贞之吉，应地无疆。",
  },
];