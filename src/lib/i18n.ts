export type LanguageCode = "en" | "zh" | "fr" | "es";

export const LANGUAGE_CODES: readonly LanguageCode[] = ["en", "zh", "fr", "es"];

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
  fr: {
    speechLang: "fr-FR",
    joiner: " ",
    collectionHeading: "Œuvres choisies",
    searchLabel: "Rechercher par titre ou artiste",
    searchPlaceholderTitleArtist: "Rechercher par titre ou artiste",
    searchPlaceholderTitle: "Rechercher par titre",
    noCachedMatch: (q) => `Rien dans la collection dont nous disposons ne correspond à « ${q} ».`,
    moreMatches: (q) => `Vous ne trouvez pas ce que vous cherchez pour « ${q} » ?`,
    searchOffer: (s) => `Nous pouvons le chercher par titre dans ${s}. Les résultats sont ajoutés à cette collection.`,
    searchOnline: "Rechercher en ligne",
    searching: "Recherche en cours…",
    searchNone: (q, s) => `Aucun titre dans ${s} ne correspond non plus à « ${q} ».`,
    searchUnavailable: "La recherche n’a pas pu joindre ses sources à l’instant. Veuillez réessayer dans un moment.",
    searchNoSource: "Il n’existe aucune source en ligne ouverte à interroger pour ce musée.",
    backToCollection: "← Retour à la collection",
    audioGuide: "Audioguide",
    guideUnavailable: "Soyez le premier à l’écouter : obtenez un guide écrit rien que pour vous, dans votre langue et selon vos centres d’intérêt.",
    guideDepth: "Niveau de détail du guide",
    lowTitle: "Version courte",
    lowDesc: "Un guide concis · environ 1 min",
    highTitle: "Version approfondie",
    highDesc: "Histoire et interprétation plus poussées · environ 2 à 3 min",
    expand: "+ Développer avec une autre histoire",
    anotherAngle: "Un autre angle",
    viewOnMuseum: "Voir sur le site du musée ↗",
    imageCredit: "Image",
    commons: "Wikimedia Commons",
    play: "Lecture",
    pause: "Pause",
    resume: "Reprendre",
    playAgain: "Réécouter",
    restart: "Recommencer",
    speedLabel: "Vitesse de lecture",
    progressLabel: "Progression de la lecture",
    noSpeech: "La lecture audio n’est pas disponible dans ce navigateur. Les sous-titres ci-dessous fonctionnent toujours.",
    noVoice:
      "Aucune voix française n’a été trouvée sur cet appareil ; la voix peut sembler inhabituelle. Les sous-titres ci-dessous fonctionnent toujours.",
    askHeading: "Poser une question sur cette œuvre",
    askLabel: "Votre question sur cette œuvre",
    askPlaceholder: "Posez une question sur cette œuvre",
    ask: "Demander",
    thinking: "Réflexion…",
    yourGuide: "Votre guide",
    generateGuide: "Obtenir mon guide personnalisé",
    exploreHeading: "Continuer à explorer",
    exploring: "Rédaction…",
    rewriteGuide: "Réécrire selon mes préférences",
    generating: "Rédaction de votre guide…",
    generatingNote: "Un nouveau guide peut prendre jusqu’à une minute.",
    yourGuideNote: (x) => `Écrit selon vos préférences : ${x}.`,
    changePrefs: "Modifier les préférences",
    showOriginal: "Afficher le guide d’origine",
    showYours: "Afficher mon guide",
    errors: {
      invalid: "Requête non valide.",
      unknownWork: "Œuvre inconnue.",
      chooseDepth: "Choisissez d’abord un niveau de détail.",
      guideTooLong: "Le texte du guide est trop long.",
      emptyQuestion: "Veuillez saisir une question.",
      questionTooLong: (max) => `Les questions doivent comporter ${max} caractères au maximum.`,
      historyTooLong: "La conversation est trop longue.",
      invalidHistory: "Historique de conversation non valide.",
      notConfigured: "Les questions complémentaires ne sont pas encore activées sur ce serveur.",
      failed: "Le guide n’a pas pu répondre pour le moment. Veuillez réessayer.",
      network: "Impossible de joindre le guide. Vérifiez votre connexion et réessayez.",
      signIn: "Veuillez d’abord vous connecter.",
    },
  },
  es: {
    speechLang: "es-ES",
    joiner: " ",
    collectionHeading: "Obras seleccionadas",
    searchLabel: "Buscar por título o artista",
    searchPlaceholderTitleArtist: "Buscar por título o artista",
    searchPlaceholderTitle: "Buscar por título",
    noCachedMatch: (q) => `Nada en la colección de que disponemos coincide con «${q}».`,
    moreMatches: (q) => `¿No encuentras lo que buscas para «${q}»?`,
    searchOffer: (s) => `Podemos buscarlo por título en ${s}. Los resultados se añaden a esta colección.`,
    searchOnline: "Buscar en línea",
    searching: "Buscando…",
    searchNone: (q, s) => `Tampoco hay ningún título en ${s} que coincida con «${q}».`,
    searchUnavailable: "La búsqueda no pudo conectar con sus fuentes en este momento. Inténtalo de nuevo en unos instantes.",
    searchNoSource: "No hay ninguna fuente abierta en línea en la que buscar para este museo.",
    backToCollection: "← Volver a la colección",
    audioGuide: "Audioguía",
    guideUnavailable: "Sé el primero en escucharla: obtén una guía escrita solo para ti, en tu idioma y según tus intereses.",
    guideDepth: "Nivel de detalle de la guía",
    lowTitle: "Versión breve",
    lowDesc: "Una guía concisa · unos 1 min",
    highTitle: "Versión detallada",
    highDesc: "Más historia e interpretación · unos 2–3 min",
    expand: "+ Ampliar con otra historia",
    anotherAngle: "Otro enfoque",
    viewOnMuseum: "Ver en la web del museo ↗",
    imageCredit: "Imagen",
    commons: "Wikimedia Commons",
    play: "Reproducir",
    pause: "Pausar",
    resume: "Continuar",
    playAgain: "Reproducir de nuevo",
    restart: "Reiniciar",
    speedLabel: "Velocidad de reproducción",
    progressLabel: "Progreso de la reproducción",
    noSpeech: "La reproducción de audio no está disponible en este navegador. Los subtítulos de abajo siguen funcionando.",
    noVoice:
      "No se encontró ninguna voz en español en este dispositivo, por lo que la voz puede sonar extraña. Los subtítulos de abajo siguen funcionando.",
    askHeading: "Pregunta sobre esta obra",
    askLabel: "Tu pregunta sobre esta obra",
    askPlaceholder: "Pregunta lo que quieras sobre esta obra",
    ask: "Preguntar",
    thinking: "Pensando…",
    yourGuide: "Tu guía",
    generateGuide: "Obtener mi guía personalizada",
    exploreHeading: "Sigue explorando",
    exploring: "Escribiendo…",
    rewriteGuide: "Reescribir según mis preferencias",
    generating: "Escribiendo tu guía…",
    generatingNote: "Una guía nueva puede tardar hasta un minuto.",
    yourGuideNote: (x) => `Escrita según tus preferencias: ${x}.`,
    changePrefs: "Cambiar preferencias",
    showOriginal: "Mostrar la guía original",
    showYours: "Mostrar mi guía",
    errors: {
      invalid: "Solicitud no válida.",
      unknownWork: "Obra desconocida.",
      chooseDepth: "Elige primero un nivel de detalle.",
      guideTooLong: "El texto de la guía es demasiado largo.",
      emptyQuestion: "Escribe una pregunta.",
      questionTooLong: (max) => `Las preguntas deben tener ${max} caracteres o menos.`,
      historyTooLong: "La conversación es demasiado larga.",
      invalidHistory: "Historial de conversación no válido.",
      notConfigured: "Las preguntas de seguimiento aún no están activadas en este servidor.",
      failed: "La guía no pudo responder en este momento. Inténtalo de nuevo.",
      network: "No se pudo conectar con la guía. Comprueba tu conexión e inténtalo de nuevo.",
      signIn: "Inicia sesión primero.",
    },
  },
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && (LANGUAGE_CODES as readonly string[]).includes(value);
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
  backToTop: string;
  visited: string;
  photoCredit: string;
  visitsSignIn: string;
  visitsNone: string;
  worksViewed: (n: number) => string;
  firstVisited: (date: string) => string;
  prefsSettingsTitle: string;
  prefsSettingsNote: string;
  prefLanguage: string;
  prefLanguageNote: string;
  prefLength: string;
  prefStyle: string;
  prefTopics: string;
  prefTopicsNote: string;
  prefTopicsMin: string;
  saving: string;
  save: string;
  saveFailed: string;
  roomNotRecorded: string;
  pradoCredit: string;
  /** BCP 47 locale for dates. */
  dateLocale: string;
  /** Separator for a list of names. */
  listSeparator: string;
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
    allMuseums: "← Back",
    mapHint: "Zoom in to find a museum. Click its icon to see the name, then click the name to enter.",
    mapLabel: "World map of museums. Use plus and minus to zoom.",
    museumCount: (n) => `${n} ${n === 1 ? "museum" : "museums"}`,
    noGuidesYet: "This museum has no guides yet.",
    backToTop: "Back to top",
    visited: "Visited",
    photoCredit: "Photo: Wikimedia Commons",
    visitsSignIn: "Sign in to track the museums and works you’ve viewed.",
    visitsNone: "No visits yet — explore a museum and open a guide.",
    worksViewed: (n) => `${n} work${n === 1 ? "" : "s"} viewed`,
    firstVisited: (d) => `first visited ${d}`,
    prefsSettingsTitle: "Settings",
    prefsSettingsNote: "Guide preferences. They apply to guides you generate or rewrite.",
    prefLanguage: "Language",
    prefLanguageNote: "For guide pages and guides. If a museum has no guides in this language, we show what it has.",
    prefLength: "Length",
    prefStyle: "Style",
    prefTopics: "Topics",
    prefTopicsNote: "Pick one or more.",
    prefTopicsMin: "Choose at least one topic.",
    saving: "Saving…",
    save: "Save",
    saveFailed: "Couldn’t save your preferences. Please try again.",
    roomNotRecorded: "Room not recorded",
    pradoCredit: "Room numbers: Museo del Prado collection pages. No floor plan is available from open sources.",
    dateLocale: "en-US",
    listSeparator: ", ",
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
    allMuseums: "← 返回",
    mapHint: "放大地图以查找博物馆。点击图标查看名称，再点击名称进入。",
    mapLabel: "博物馆世界地图。使用加号和减号缩放。",
    museumCount: (n) => `${n}座博物馆`,
    noGuidesYet: "该博物馆暂无导览。",
    backToTop: "回到顶部",
    visited: "已参观",
    photoCredit: "照片：维基共享资源",
    visitsSignIn: "登录后可记录您看过的博物馆和展品。",
    visitsNone: "还没有参观记录——去逛逛博物馆，打开一份导览吧。",
    worksViewed: (n) => `已看${n}件展品`,
    firstVisited: (d) => `首次参观于${d}`,
    prefsSettingsTitle: "设置",
    prefsSettingsNote: "导览偏好，适用于您生成或重写的导览。",
    prefLanguage: "语言",
    prefLanguageNote: "用于导览页面和导览内容。如果博物馆没有该语言的导览，将显示其现有语言。",
    prefLength: "篇幅",
    prefStyle: "风格",
    prefTopics: "主题",
    prefTopicsNote: "可多选。",
    prefTopicsMin: "请至少选择一个主题。",
    saving: "保存中…",
    save: "保存",
    saveFailed: "无法保存您的偏好，请重试。",
    roomNotRecorded: "未记录展厅",
    pradoCredit: "展厅编号：普拉多博物馆藏品页面。公开来源中没有楼层平面图。",
    dateLocale: "zh-CN",
    listSeparator: "、",
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
  fr: {
    tagline: "Des audioguides, à votre rythme",
    signInGoogle: "Se connecter avec Google",
    continueGuest: "Continuer sans compte",
    guestFailed: (r) => `Impossible de continuer en tant qu’invité : ${r}`,
    guest: "Invité",
    signedIn: "Connecté",
    myVisits: "Mes visites",
    settings: "Paramètres",
    signOut: "Se déconnecter",
    loading: "Chargement…",
    loadFailed: "La collection n’a pas pu être chargée. Vérifiez votre connexion et rechargez la page.",
    allMuseums: "← Retour",
    mapHint: "Zoomez pour trouver un musée. Cliquez sur son icône pour voir son nom, puis sur le nom pour entrer.",
    mapLabel: "Carte du monde des musées. Utilisez plus et moins pour zoomer.",
    museumCount: (n) => `${n} ${n === 1 ? "musée" : "musées"}`,
    noGuidesYet: "Ce musée n’a pas encore de guides.",
    backToTop: "Haut de page",
    visited: "Visité",
    photoCredit: "Photo : Wikimedia Commons",
    visitsSignIn: "Connectez-vous pour suivre les musées et les œuvres que vous avez consultés.",
    visitsNone: "Aucune visite pour l’instant : explorez un musée et ouvrez un guide.",
    worksViewed: (n) => `${n} ${n === 1 ? "œuvre consultée" : "œuvres consultées"}`,
    firstVisited: (d) => `première visite le ${d}`,
    prefsSettingsTitle: "Paramètres",
    prefsSettingsNote: "Préférences de guide. Elles s’appliquent aux guides que vous générez ou réécrivez.",
    prefLanguage: "Langue",
    prefLanguageNote: "Pour les pages et les guides. Si un musée n’a pas de guides dans cette langue, nous affichons ceux qu’il possède.",
    prefLength: "Durée",
    prefStyle: "Style",
    prefTopics: "Thèmes",
    prefTopicsNote: "Choisissez-en un ou plusieurs.",
    prefTopicsMin: "Choisissez au moins un thème.",
    saving: "Enregistrement…",
    save: "Enregistrer",
    saveFailed: "Impossible d’enregistrer vos préférences. Veuillez réessayer.",
    roomNotRecorded: "Salle non renseignée",
    pradoCredit: "Numéros de salle : pages de collection du Musée du Prado. Aucun plan d’étage n’est disponible dans les sources ouvertes.",
    dateLocale: "fr-FR",
    listSeparator: ", ",
    explorer: {
      floor: "Niveau",
      wing: "Aile",
      pickWing: "Quelle aile visitez-vous ?",
      changeWing: "Changer d’aile",
      levels: { 2: "Niveau 2", 1: "Niveau 1", 0: "Rez-de-chaussée", [-1]: "Niveau −1", [-2]: "Niveau −2" },
      wingName: (w) => w,
      wingSuffix: (w) => `Aile ${w}`,
      room: (n) => `Salle ${n}`,
      rooms: (ns) => `Salles ${ns.join(", ")}`,
      works: (n) => `${n} ${n === 1 ? "œuvre" : "œuvres"}`,
      floorPlan: (l) => `Plan d’étage, ${l}`,
      loadingPlan: "Chargement du plan…",
      zoomIn: "Zoom avant",
      zoomOut: "Zoom arrière",
      zoomReset: "Réinitialiser la vue",
      clickHint: "Cliquez sur une salle colorée pour voir ses œuvres. Plan schématique : toutes les salles ne sont pas tracées.",
      otherRooms: "Autres salles de ce niveau",
      credit: "Emplacement des salles : base de données des collections du Louvre. Plan : © contributeurs OpenStreetMap (ODbL).",
      allRoomsOnLevel: "← Toutes les salles de ce niveau",
      noMatch: "Aucune œuvre ne correspond à ces filtres sur ce niveau.",
      notOnDisplay: (n) => `Non exposées actuellement (${n})`,
    },
  },
  es: {
    tagline: "Audioguías, a tu propio ritmo",
    signInGoogle: "Iniciar sesión con Google",
    continueGuest: "Continuar sin cuenta",
    guestFailed: (r) => `No se pudo continuar como invitado: ${r}`,
    guest: "Invitado",
    signedIn: "Sesión iniciada",
    myVisits: "Mis visitas",
    settings: "Ajustes",
    signOut: "Cerrar sesión",
    loading: "Cargando…",
    loadFailed: "No se pudo cargar la colección. Comprueba tu conexión y recarga la página.",
    allMuseums: "← Volver",
    mapHint: "Acércate para encontrar un museo. Haz clic en su icono para ver el nombre y luego en el nombre para entrar.",
    mapLabel: "Mapamundi de museos. Usa más y menos para acercar o alejar.",
    museumCount: (n) => `${n} ${n === 1 ? "museo" : "museos"}`,
    noGuidesYet: "Este museo aún no tiene guías.",
    backToTop: "Volver arriba",
    visited: "Visitada",
    photoCredit: "Foto: Wikimedia Commons",
    visitsSignIn: "Inicia sesión para registrar los museos y las obras que has visto.",
    visitsNone: "Aún no hay visitas: explora un museo y abre una guía.",
    worksViewed: (n) => `${n} ${n === 1 ? "obra vista" : "obras vistas"}`,
    firstVisited: (d) => `primera visita el ${d}`,
    prefsSettingsTitle: "Ajustes",
    prefsSettingsNote: "Preferencias de las guías. Se aplican a las guías que generes o reescribas.",
    prefLanguage: "Idioma",
    prefLanguageNote: "Para las páginas y las guías. Si un museo no tiene guías en este idioma, mostramos las que tenga.",
    prefLength: "Duración",
    prefStyle: "Estilo",
    prefTopics: "Temas",
    prefTopicsNote: "Elige uno o varios.",
    prefTopicsMin: "Elige al menos un tema.",
    saving: "Guardando…",
    save: "Guardar",
    saveFailed: "No se pudieron guardar tus preferencias. Inténtalo de nuevo.",
    roomNotRecorded: "Sala no registrada",
    pradoCredit: "Números de sala: páginas de colección del Museo del Prado. No hay plano de planta disponible en fuentes abiertas.",
    dateLocale: "es-ES",
    listSeparator: ", ",
    explorer: {
      floor: "Planta",
      wing: "Ala",
      pickWing: "¿Qué ala vas a visitar?",
      changeWing: "Cambiar de ala",
      levels: { 2: "Planta 2", 1: "Planta 1", 0: "Planta baja", [-1]: "Planta −1", [-2]: "Planta −2" },
      wingName: (w) => w,
      wingSuffix: (w) => `Ala ${w}`,
      room: (n) => `Sala ${n}`,
      rooms: (ns) => `Salas ${ns.join(", ")}`,
      works: (n) => `${n} ${n === 1 ? "obra" : "obras"}`,
      floorPlan: (l) => `Plano de planta, ${l}`,
      loadingPlan: "Cargando el plano…",
      zoomIn: "Acercar",
      zoomOut: "Alejar",
      zoomReset: "Restablecer vista",
      clickHint: "Haz clic en una sala coloreada para ver sus obras. Plano esquemático: no todas las salas están dibujadas.",
      otherRooms: "Otras salas de esta planta",
      credit: "Ubicación de las salas: base de datos de colecciones del Louvre. Plano: © colaboradores de OpenStreetMap (ODbL).",
      allRoomsOnLevel: "← Todas las salas de esta planta",
      noMatch: "Ninguna obra coincide con estos filtros en esta planta.",
      notOnDisplay: (n) => `No expuestas ahora (${n})`,
    },
  },
};

export const LANGUAGE_STORAGE_KEY = "lazyguide.language";

/** `lang` attribute value for a language. */
export const htmlLang = (l: LanguageCode): string => (l === "zh" ? "zh-Hans" : l);

/** The browser's preferred language when it is one of ours, else English. */
export function browserLanguage(): LanguageCode {
  if (typeof navigator === "undefined") return "en";
  for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLanguageCode(base)) return base;
  }
  return "en";
}

/** The language chosen on this device (kept so screens before sign-in match), else the browser's. */
export function initialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguageCode(saved)) return saved;
  } catch {}
  return browserLanguage();
}

export function rememberLanguage(language: LanguageCode): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {}
}
