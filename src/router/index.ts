import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Solicitar',
    component: () => import('../views/SolicitarCarteirinhaView.vue')
  },
  {
    path: '/minha-carteirinha',
    name: 'MinhaCarteirinha',
    component: () => import('../views/CarteirinhaView.vue')
  },
  {
    path: '/gestor',
    name: 'PainelGestor',
    component: () => import('../views/PainelGestorView.vue')
  },
  {
    path: '/validar/:qrcode',
    name: 'ValidarQrCode',
    component: () => import('../views/ValidacaoView.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})