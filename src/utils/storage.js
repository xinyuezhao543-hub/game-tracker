// 数据存储工具

const KEYS = {
  GAMES: 'gt_games',
  ACTIVITIES: 'gt_activities',
  COLLECTIONS_DRESS: 'gt_collections_dress',
  COLLECTIONS_CARD: 'gt_collections_card',
  CURRENCY_CONFIGS: 'gt_currency_configs',
}

function load(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// 游戏管理
export function getGames() {
  return load(KEYS.GAMES)
}

export function saveGames(games) {
  save(KEYS.GAMES, games)
}

export function getGameById(id) {
  return getGames().find(g => g.id === id)
}

export function addGame(game) {
  const games = getGames()
  games.push(game)
  saveGames(games)
}

export function updateGame(game) {
  const games = getGames()
  const idx = games.findIndex(g => g.id === game.id)
  if (idx !== -1) {
    games[idx] = game
    saveGames(games)
  }
}

export function deleteGame(id) {
  const games = getGames().filter(g => g.id !== id)
  saveGames(games)
  // 删除相关活动和收集
  const activities = getActivities().filter(a => a.gameId !== id)
  saveActivities(activities)
  const dressCollections = getDressCollections().filter(c => c.gameId !== id)
  saveDressCollections(dressCollections)
  const cardCollections = getCardCollections().filter(c => c.gameId !== id)
  saveCardCollections(cardCollections)
  const configs = getCurrencyConfigs().filter(c => c.gameId !== id)
  saveCurrencyConfigs(configs)
}

// 活动管理
export function getActivities() {
  return load(KEYS.ACTIVITIES)
}

export function saveActivities(activities) {
  save(KEYS.ACTIVITIES, activities)
}

export function addActivity(activity) {
  const activities = getActivities()
  activities.push(activity)
  saveActivities(activities)
}

export function updateActivity(activity) {
  const activities = getActivities()
  const idx = activities.findIndex(a => a.id === activity.id)
  if (idx !== -1) {
    activities[idx] = activity
    saveActivities(activities)
  }
}

export function deleteActivity(id) {
  const activities = getActivities().filter(a => a.id !== id)
  saveActivities(activities)
}

// 换装收集
export function getDressCollections() {
  return load(KEYS.COLLECTIONS_DRESS)
}

export function saveDressCollections(collections) {
  save(KEYS.COLLECTIONS_DRESS, collections)
}

export function addDressCollection(collection) {
  const collections = getDressCollections()
  collections.push(collection)
  saveDressCollections(collections)
}

export function updateDressCollection(collection) {
  const collections = getDressCollections()
  const idx = collections.findIndex(c => c.id === collection.id)
  if (idx !== -1) {
    collections[idx] = collection
    saveDressCollections(collections)
  }
}

export function deleteDressCollection(id) {
  const collections = getDressCollections().filter(c => c.id !== id)
  saveDressCollections(collections)
}

// 卡牌收集
export function getCardCollections() {
  return load(KEYS.COLLECTIONS_CARD)
}

export function saveCardCollections(collections) {
  save(KEYS.COLLECTIONS_CARD, collections)
}

export function addCardCollection(collection) {
  const collections = getCardCollections()
  collections.push(collection)
  saveCardCollections(collections)
}

export function updateCardCollection(collection) {
  const collections = getCardCollections()
  const idx = collections.findIndex(c => c.id === collection.id)
  if (idx !== -1) {
    collections[idx] = collection
    saveCardCollections(collections)
  }
}

export function deleteCardCollection(id) {
  const collections = getCardCollections().filter(c => c.id !== id)
  saveCardCollections(collections)
}

// 货币配置
export function getCurrencyConfigs() {
  return load(KEYS.CURRENCY_CONFIGS)
}

export function saveCurrencyConfigs(configs) {
  save(KEYS.CURRENCY_CONFIGS, configs)
}

export function getCurrencyConfigByGameId(gameId) {
  return getCurrencyConfigs().find(c => c.gameId === gameId)
}

export function saveCurrencyConfig(config) {
  const configs = getCurrencyConfigs()
  const idx = configs.findIndex(c => c.gameId === config.gameId)
  if (idx !== -1) {
    configs[idx] = config
  } else {
    configs.push(config)
  }
  saveCurrencyConfigs(configs)
}

// 数据导出
export function exportAllData() {
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    games: getGames(),
    activities: getActivities(),
    dressCollections: getDressCollections(),
    cardCollections: getCardCollections(),
    currencyConfigs: getCurrencyConfigs(),
  }
}

// 数据导入
export function importAllData(data) {
  try {
    if (!data || !data.version) throw new Error('无效的备份文件')
    if (data.games) saveGames(data.games)
    if (data.activities) saveActivities(data.activities)
    if (data.dressCollections) saveDressCollections(data.dressCollections)
    if (data.cardCollections) saveCardCollections(data.cardCollections)
    if (data.currencyConfigs) saveCurrencyConfigs(data.currencyConfigs)
    return true
  } catch (e) {
    console.error('导入失败:', e)
    return false
  }
}

// 清除所有数据
export function clearAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key))
}

// 生成唯一ID
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
