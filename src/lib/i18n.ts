export type LanguageCode = "en" | "zh";

export interface Strings {
  speechLang: string; // BCP 47 tag used for speech synthesis
  joiner: string; // how sentences are joined when shown or sent as one text
  collectionHeading: string;
  collectionLede: string;
  searchLabel: string;
  searchPlaceholderTitleArtist: string;
  searchPlaceholderTitle: string;
  backToCollection: string;
  changeMuseum: string;
  audioGuide: string;
  guideDepth: string;
  lowTitle: string;
  lowDesc: string;
  highTitle: string;
  highDesc: string;
  expand: string;
  anotherAngle: string;
  viewOnMuseum: string;
  imageCredit: string;
  commons: string;
  play: string;
  pause: string;
  resume: string;
  playAgain: string;
  restart: string;
  speedLabel: string;
  progressLabel: string;
  noSpeech: string;
  noVoice: string;
  askHeading: string;
  askLabel: string;
  askPlaceholder: string;
  ask: string;
  thinking: string;
  errors: {
    invalid: string;
    unknownWork: string;
    chooseDepth: string;
    guideTooLong: string;
    emptyQuestion: string;
    questionTooLong: (max: number) => string;
    historyTooLong: string;
    invalidHistory: string;
    notConfigured: string;
    failed: string;
    network: string;
  };
}

export const strings: Record<LanguageCode, Strings> = {
  en: {
    speechLang: "en-US",
    joiner: " ",
    collectionHeading: "Selected works",
    collectionLede:
      "An audio guide to a curated selection of works, not the museum’s full collection.",
    searchLabel: "Search by title or artist",
    searchPlaceholderTitleArtist: "Search by title or artist",
    searchPlaceholderTitle: "Search by title",
    backToCollection: "← Back to collection",
    changeMuseum: "← All museums",
    audioGuide: "Audio guide",
    guideDepth: "Guide depth",
    lowTitle: "Low effort",
    lowDesc: "A concise guide · about 1 min",
    highTitle: "High effort",
    highDesc: "Deeper history and interpretation · about 2–3 min",
    expand: "+ Expand with another story",
    anotherAngle: "Another angle",
    viewOnMuseum: "View on the museum’s website ↗",
    imageCredit: "Image",
    commons: "Wikimedia Commons",
    play: "Play",
    pause: "Pause",
    resume: "Resume",
    playAgain: "Play again",
    restart: "Restart",
    speedLabel: "Playback speed",
    progressLabel: "Playback progress",
    noSpeech: "Audio playback isn’t available in this browser. The captions below still work.",
    noVoice:
      "No English voice was found on this device, so the voice may sound unusual. The captions below still work.",
    askHeading: "Ask about this work",
    askLabel: "Your question about this work",
    askPlaceholder: "Ask anything about this work",
    ask: "Ask",
    thinking: "Thinking…",
    errors: {
      invalid: "Invalid request.",
      unknownWork: "Unknown work.",
      chooseDepth: "Choose a guide depth first.",
      guideTooLong: "The guide text is too long.",
      emptyQuestion: "Please type a question.",
      questionTooLong: (max) => `Questions must be ${max} characters or fewer.`,
      historyTooLong: "The conversation is too long.",
      invalidHistory: "Invalid conversation history.",
      notConfigured: "Follow-up questions aren’t set up yet on this server.",
      failed: "The guide couldn’t answer right now. Please try again.",
      network: "Couldn’t reach the guide. Check your connection and try again.",
    },
  },
  zh: {
    speechLang: "zh-CN",
    joiner: "",
    collectionHeading: "精选展品",
    collectionLede: "这是一份精选展品的语音导览，并非博物馆的全部藏品。",
    searchLabel: "按名称搜索",
    searchPlaceholderTitleArtist: "按名称或艺术家搜索",
    searchPlaceholderTitle: "按名称搜索",
    backToCollection: "← 返回展品列表",
    changeMuseum: "← 全部博物馆",
    audioGuide: "语音导览",
    guideDepth: "导览深度",
    lowTitle: "轻松版",
    lowDesc: "简短导览 · 约1分钟",
    highTitle: "深度版",
    highDesc: "深入的历史与解读 · 约2–3分钟",
    expand: "+ 再听一个故事",
    anotherAngle: "另一个角度",
    viewOnMuseum: "在博物馆官网查看 ↗",
    imageCredit: "图片",
    commons: "维基共享资源",
    play: "播放",
    pause: "暂停",
    resume: "继续",
    playAgain: "重新播放",
    restart: "从头开始",
    speedLabel: "播放速度",
    progressLabel: "播放进度",
    noSpeech: "此浏览器不支持语音播放，下方字幕仍可正常阅读。",
    noVoice: "此设备上没有找到中文语音，可能无法朗读；下方字幕仍可阅读。",
    askHeading: "关于这件展品的提问",
    askLabel: "您对这件展品的提问",
    askPlaceholder: "关于这件展品，您想了解什么？",
    ask: "提问",
    thinking: "思考中…",
    errors: {
      invalid: "请求无效。",
      unknownWork: "未找到该展品。",
      chooseDepth: "请先选择导览深度。",
      guideTooLong: "导览文本过长。",
      emptyQuestion: "请输入问题。",
      questionTooLong: (max) => `问题不能超过${max}个字。`,
      historyTooLong: "对话过长。",
      invalidHistory: "对话记录无效。",
      notConfigured: "该服务器尚未启用追问功能。",
      failed: "导览暂时无法回答，请稍后再试。",
      network: "无法连接导览服务，请检查网络后重试。",
    },
  },
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "en" || value === "zh";
}
