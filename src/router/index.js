import Vue from 'vue'
import Router from 'vue-router'
import recoder from '@/components/recoder'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'recoder',
      component: recoder
    }
  ]
})
