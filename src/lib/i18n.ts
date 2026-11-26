export type LanguageCode = "en" | "zh";

export interface Strings {
  speechLang: string; // BCP 47 tag used for speech synthesis
  joiner: string; // how sentences are joined when shown or sent as one text
  collectionHeading: string;
  searchLabel: string;
  searchPlaceholderTitleArtist: string;
  searchPlaceholderTitle: string;
  noCachedMatch: (query: string) => string;
  moreMatches: (query: string) => string;
  searchOffer: (sources: string) => string;
  searchOnline: string;
  searching: string;
  searchNone: (query: string, sources: string) => string;
  searchUnavailable: string;
  searchNoSource: string;
  backToCollection: string;
  changeMuseum: string;
  audioGuide: string;
  guideUnavailable: string;
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
  yourGuide: string;
  generateGuide: string;
  exploreHeading: string;
  exploring: string;
  rewriteGuide: string;
  generating: string;
  generatingNote: string;
  yourGuideNote: (summary: string) => string;
  changePrefs: string;
  showOriginal: string;
  showYours: string;
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
    signIn: string;
  };
}

export const strings: Record<LanguageCode, Strings> = {
  en: {
    speechLang: "en-US",
    joiner: " ",
    collectionHeading: "Selected works",
    searchLabel: "Search by title or artist",
    searchPlaceholderTitleArtist: "Search by title or artist",
    searchPlaceholderTitle: "Search by title",
    noCachedMatch: (q) => `Nothing in the collection we have on hand matches “${q}”.`,
    moreMatches: (q) => `Not seeing what you want for “${q}”?`,
    searchOffer: (s) => `We can look for it by title in ${s}. Matches are added to this collection.`,
    searchOnline: "Search online",
    searching: "Searching…",
    searchNone: (q, s) => `No title in ${s} matches “${q}” either.`,
    searchUnavailable: "The search couldn’t reach its sources just now. Please try again in a moment.",
    searchNoSource: "There is no open online source for this museum to search.",
    backToCollection: "← Back to collection",
    changeMuseum: "← All museums",
    audioGuide: "Audio guide",
    guideUnavailable: "Be the first to hear this one: get a guide written just for you, in your language and shaped by your interests.",
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
    yourGuide: "Your guide",
    generateGuide: "Get my personalized guide",
    exploreHeading: "Keep exploring",
    exploring: "Writing…",
    rewriteGuide: "Rewrite to my preferences",
    generating: "Writing your guide…",
    generatingNote: "A new guide can take up to a minute.",
    yourGuideNote: (x) => `Written for your preferences: ${x}.`,
    changePrefs: "Change preferences",
    showOriginal: "Show the original guide",
    showYours: "Show my guide",
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
      signIn: "Please sign in first.",
    },
  },
  zh: {
    speechLang: "zh-CN",
    joiner: "",
    collectionHeading: "精选展品",
    searchLabel: "按名称搜索",
    searchPlaceholderTitleArtist: "按名称或艺术家搜索",
    searchPlaceholderTitle: "按名称搜索",
    noCachedMatch: (q) => `目前已有的藏品中没有与“${q}”匹配的内容。`,
    moreMatches: (q) => `没有找到想要的“${q}”？`,
    searchOffer: (s) => `我们可以在${s}中按名称查找，找到的展品会加入本藏品列表。`,
    searchOnline: "在线搜索",
    searching: "正在搜索…",
    searchNone: (q, s) => `${s}中也没有与“${q}”匹配的名称。`,
    searchUnavailable: "暂时无法连接搜索来源，请稍后再试。",
    searchNoSource: "该博物馆暂无可供搜索的公开在线来源。",
    backToCollection: "← 返回展品列表",
    changeMuseum: "← 全部博物馆",
    audioGuide: "语音导览",
    guideUnavailable: "来做第一个聆听者：获取一份按您的语言与兴趣专门撰写的导览。",
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
    yourGuide: "为您定制的导览",
    generateGuide: "获取我的专属导览",
    exploreHeading: "继续探索",
    exploring: "撰写中…",
    rewriteGuide: "按我的偏好重写",
    generating: "正在撰写您的导览…",
    generatingNote: "生成新导览最多需要一分钟。",
    yourGuideNote: (x) => `按您的偏好撰写：${x}。`,
    changePrefs: "更改偏好",
    showOriginal: "查看原版导览",
    showYours: "查看我的导览",
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
      signIn: "请先登录。",
    },
  },
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "en" || value === "zh";
}

/** Texts outside a museum's pages (sign-in, map, settings, visits), in the visitor's chosen language. */
export interface UiStrings {
  tagline: string;
  signInGoogle: string;
  continueGuest: string;
  guestFailed: (reason: string) => string;
  guest: string;
  signedIn: string;
  myVisits: string;
  settings: string;
  signOut: string;
  loading: string;
  loadFailed: string;
  allMuseums: string;
  mapHint: string;
  mapLabel: string;
  museumCount: (n: number) => string;
  noGuidesYet: string;
  fallbackNotice: (language: string) => string;
  backToTop: string;
  visited: string;
  photoCredit: string;
  visitsSignIn: string;
  visitsNone: string;
  worksViewed: (n: number) => string;
  firstVisited: (date: string) => string;
  prefsOnboardingTitle: string;
  prefsSettingsTitle: string;
  prefsOnboardingNote: string;
  prefsSettingsNote: string;
  prefLanguage: string;
  prefLanguageNote: string;
  prefLength: string;
  prefStyle: string;
  prefTopics: string;
  prefTopicsNote: string;
  prefTopicsMin: string;
  saving: string;
  saveContinue: string;
  save: string;
  saveFailed: string;
  explorer: {
    floor: string;
    wing: string;
    pickWing: string;
    changeWing: string;
    levels: Record<number, string>;
    wingName: (w: string) => string;
    wingSuffix: (w: string) => string;
    room: (n: string) => string;
    rooms: (ns: string[]) => string;
    works: (n: number) => string;
    floorPlan: (level: string) => string;
    loadingPlan: string;
    zoomIn: string;
    zoomOut: string;
    zoomReset: string;
    clickHint: string;
    otherRooms: string;
    credit: string;
    allRoomsOnLevel: string;
    noMatch: string;
    notOnDisplay: (n: number) => string;
  };
}

export const uiStrings: Record<LanguageCode, UiStrings> = {
  en: {
    tagline: "Audio guides, at your own pace",
    signInGoogle: "Sign in with Google",
    continueGuest: "Continue without an account",
    guestFailed: (r) => `Couldn’t continue as a guest: ${r}`,
    guest: "Guest",
    signedIn: "Signed in",
    myVisits: "My visits",
    settings: "Settings",
    signOut: "Sign out",
    loading: "Loading…",
    loadFailed: "The collection couldn’t be loaded. Check your connection and reload.",
    allMuseums: "← All museums",
    mapHint: "Zoom in to find a museum. Click its icon to see the name, then click the name to enter.",
    mapLabel: "World map of museums. Use plus and minus to zoom.",
    museumCount: (n) => `${n} ${n === 1 ? "museum" : "museums"}`,
    noGuidesYet: "This museum has no guides yet.",
    fallbackNotice: (l) => `This museum has no guides in your language yet, so it is shown in ${l}.`,
    backToTop: "Back to top",
    visited: "Visited",
    photoCredit: "Photo: Wikimedia Commons",
    visitsSignIn: "Sign in to track the museums and works you’ve viewed.",
    visitsNone: "No visits yet — explore a museum and open a guide.",
    worksViewed: (n) => `${n} work${n === 1 ? "" : "s"} viewed`,
    firstVisited: (d) => `first visited ${d}`,
    prefsOnboardingTitle: "How would you like your guides?",
    prefsSettingsTitle: "Settings",
    prefsOnboardingNote: "Choose once; you can change this any time. These shape the guides we write for you.",
    prefsSettingsNote: "Guide preferences. They apply to guides you generate or rewrite.",
    prefLanguage: "Language",
    prefLanguageNote: "For guide pages and guides. If a museum has no guides in this language, we show what it has.",
    prefLength: "Length",
    prefStyle: "Style",
    prefTopics: "Topics",
    prefTopicsNote: "Pick one or more.",
    prefTopicsMin: "Choose at least one topic.",
    saving: "Saving…",
    saveContinue: "Save and continue",
    save: "Save",
    saveFailed: "Couldn’t save your preferences. Please try again.",
    explorer: {
      floor: "Level",
      wing: "Wing",
      pickWing: "Which wing are you visiting?",
      changeWing: "Change wing",
      levels: { 2: "Level 2", 1: "Level 1", 0: "Ground", [-1]: "Level −1", [-2]: "Level −2" },
      wingName: (w) => w,
      wingSuffix: (w) => `${w} Wing`,
      room: (n) => `Room ${n}`,
      rooms: (ns) => `Rooms ${ns.join(", ")}`,
      works: (n) => `${n} ${n === 1 ? "work" : "works"}`,
      floorPlan: (l) => `Floor plan, ${l}`,
      loadingPlan: "Loading floor plan…",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      zoomReset: "Reset view",
      clickHint: "Click a coloured room to see its works. Schematic plan, not every room is outlined.",
      otherRooms: "Other rooms on this level",
      credit: "Room locations: Louvre collection database. Plan: © OpenStreetMap contributors (ODbL).",
      allRoomsOnLevel: "← All rooms on this level",
      noMatch: "No works match these filters on this level.",
      notOnDisplay: (n) => `Not on display right now (${n})`,
    },
  },
  zh: {
    tagline: "按自己的节奏聆听导览",
    signInGoogle: "使用 Google 登录",
    continueGuest: "无需账号，继续使用",
    guestFailed: (r) => `无法以访客身份继续：${r}`,
    guest: "访客",
    signedIn: "已登录",
    myVisits: "我的参观",
    settings: "设置",
    signOut: "退出登录",
    loading: "加载中…",
    loadFailed: "无法加载藏品，请检查网络后刷新页面。",
    allMuseums: "← 全部博物馆",
    mapHint: "放大地图以查找博物馆。点击图标查看名称，再点击名称进入。",
    mapLabel: "博物馆世界地图。使用加号和减号缩放。",
    museumCount: (n) => `${n}座博物馆`,
    noGuidesYet: "该博物馆暂无导览。",
    fallbackNotice: (l) => `该博物馆暂无您所选语言的导览，现以${l}显示。`,
    backToTop: "回到顶部",
    visited: "已参观",
    photoCredit: "照片：维基共享资源",
    visitsSignIn: "登录后可记录您看过的博物馆和展品。",
    visitsNone: "还没有参观记录——去逛逛博物馆，打开一份导览吧。",
    worksViewed: (n) => `已看${n}件展品`,
    firstVisited: (d) => `首次参观于${d}`,
    prefsOnboardingTitle: "您希望导览是什么样的？",
    prefsSettingsTitle: "设置",
    prefsOnboardingNote: "只需选择一次，之后可随时更改。这些选择会决定我们为您撰写的导览风格。",
    prefsSettingsNote: "导览偏好，适用于您生成或重写的导览。",
    prefLanguage: "语言",
    prefLanguageNote: "用于导览页面和导览内容。如果博物馆没有该语言的导览，将显示其现有语言。",
    prefLength: "篇幅",
    prefStyle: "风格",
    prefTopics: "主题",
    prefTopicsNote: "可多选。",
    prefTopicsMin: "请至少选择一个主题。",
    saving: "保存中…",
    saveContinue: "保存并继续",
    save: "保存",
    saveFailed: "无法保存您的偏好，请重试。",
    explorer: {
      floor: "楼层",
      wing: "展馆",
      pickWing: "您要参观哪个展馆？",
      changeWing: "更换展馆",
      levels: { 2: "2层", 1: "1层", 0: "地面层", [-1]: "负1层", [-2]: "负2层" },
      wingName: (w) => ({ Denon: "德农馆", Sully: "叙利馆", Richelieu: "黎塞留馆" })[w] ?? w,
      wingSuffix: (w) => ({ Denon: "德农馆", Sully: "叙利馆", Richelieu: "黎塞留馆" })[w] ?? w,
      room: (n) => `${n}号厅`,
      rooms: (ns) => `${ns.join("、")}号厅`,
      works: (n) => `${n}件展品`,
      floorPlan: (l) => `平面图，${l}`,
      loadingPlan: "正在加载平面图…",
      zoomIn: "放大",
      zoomOut: "缩小",
      zoomReset: "重置视图",
      clickHint: "点击彩色展厅查看其中的展品。这是示意图，并未标出所有展厅。",
      otherRooms: "本层其他展厅",
      credit: "展厅位置：卢浮宫藏品数据库。平面图：© OpenStreetMap 贡献者 (ODbL)。",
      allRoomsOnLevel: "← 本层全部展厅",
      noMatch: "本层没有符合这些筛选条件的展品。",
      notOnDisplay: (n) => `目前未展出（${n}）`,
    },
  },
};

/** The language to show app-level text in before the visitor has chosen one: their browser's. */
export function browserLanguage(): LanguageCode {
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}
