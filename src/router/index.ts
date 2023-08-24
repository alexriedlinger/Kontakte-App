import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Contacts from '@/views/Contacts.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/contacts'
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: Contacts
  },
  {
    path: '/contacts/:id',
    name: 'ContactDetails',
    props:true,
    component: () => import('@/views/ContactDetails.vue'),
  },
  {
    path: '/contacts/create',
    name: 'CreateContact',
    props: true,
    component: () => import('@/views/CreateContact.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
