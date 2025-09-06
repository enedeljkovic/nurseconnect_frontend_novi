import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Materials from '../views/Materials.vue';
import Quizzes from '../views/Quizzes.vue';
import Profile from '../views/Profile.vue';
import Login from '../views/Login.vue';
import AddQuiz from '../views/AddQuiz.vue';
import TakeQuiz from '../views/TakeQuiz.vue';
import Settings from '../views/Settings.vue';
import SubjectMaterials from '../views/SubjectMaterials.vue';
import MaterialDetails from '../views/MaterialDetails.vue';
import SubjectQuizzes from '../views/SubjectQuizzes.vue';
import AdminLogin from '../views/AdminLogin.vue';
import AdminStudents from '../views/AdminStudents.vue';
import AddMaterial from '../views/AddMaterial.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/admin-login', name: 'AdminLogin', component: AdminLogin },
  { path: '/home', name: 'Home', component: Home },
  { path: '/materials', name: 'Materials', component: Materials },
  { path: '/materials/:predmet', name: 'SubjectMaterials', component: SubjectMaterials },
  { path: '/quizzes', name: 'Quizzes', component: Quizzes },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/add-quiz', name: 'AddQuiz', component: AddQuiz },
  { path: '/quizzes/:id', name: 'TakeQuiz', component: TakeQuiz },
  { path: '/quizzes-subject/:subject', name: 'SubjectQuizzes', component: SubjectQuizzes },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/materials/:id', name: 'MaterialDetails', component: MaterialDetails },
  { path: '/admin-panel', name: 'AdminPanel', component: () => import('../views/AdminPanel.vue') },
  { path: '/admin/students', name: 'AdminStudents', component: () => import('../views/AdminStudents.vue') },
  { path: '/admin/materials', name: 'AdminMaterials', component: () => import('../views/AdminMaterials.vue') },
  { path: '/admin/quizzes', name: 'AdminQuizzes', component: () => import('../views/AdminQuizzes.vue') },
  { path: '/admin/professors', name: 'AdminProfessors', component: () => import('../views/AdminProfessors.vue') },
  { path: '/admin/settings', name: 'AdminSettings', component: () => import('../views/AdminSettings.vue') },
  { path: '/add-material', name: 'AddMaterial', component: () => import('../views/AddMaterial.vue') },
  { path: '/chat', name: 'Chat', component: () => import('../views/Chat.vue') },
  { path: '/quiz-statistics', name: 'Statistika', component: () => import('../views/Statistika.vue') },
 

];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isProfesor = localStorage.getItem('isProfesor') === 'true';

  const publicPages = ['/login', '/admin-login'];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !user && !isAdmin) {
    return next('/login');
  }

  if (isAdmin && to.path !== '/admin-panel' && to.path.startsWith('/home')) {
    return next('/admin-panel');
  }

  next();
});

export default router;


