import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import 'vant/lib/index.css'
import './styles/global.css'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/Home.vue') },
  { path: '/collection', name: 'collection', component: () => import('./views/Collection.vue') },
  { path: '/calculator', name: 'calculator', component: () => import('./views/Calculator.vue') },
  { path: '/games', name: 'games', component: () => import('./views/Games.vue') },
  { path: '/games/add', name: 'game-add', component: () => import('./views/GameEdit.vue') },
  { path: '/games/edit/:id', name: 'game-edit', component: () => import('./views/GameEdit.vue') },
  { path: '/activity/add', name: 'activity-add', component: () => import('./views/ActivityEdit.vue') },
  { path: '/activity/edit/:id', name: 'activity-edit', component: () => import('./views/ActivityEdit.vue') },
  { path: '/collection/dress/:gameId', name: 'collection-dress', component: () => import('./views/CollectionDress.vue') },
  { path: '/collection/card/:gameId', name: 'collection-card', component: () => import('./views/CollectionCard.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
