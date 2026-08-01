import { createRouter, createWebHashHistory } from 'vue-router';
import MainLayout from '../components/layout/MainLayout.vue';
import AdminLayout from '../components/admin/AdminLayout.vue';
import PortalLayout from '../components/portal/PortalLayout.vue';
import Home from '../pages/Home.vue';
import About from '../pages/About.vue';
import Blog from '../pages/Blog.vue';
import Contact from '../pages/Contact.vue';
import Login from '../pages/Login.vue';
import Portfolio from '../pages/Portfolio.vue';
import Quote from '../pages/Quote.vue';
import Register from '../pages/Register.vue';
import Services from '../pages/Services.vue';
import NotFound from '../pages/NotFound.vue';
import AdminDashboard from '../pages/admin/AdminDashboard.vue';
import AdminContent from '../pages/admin/AdminContent.vue';
import AdminMedia from '../pages/admin/AdminMedia.vue';
import AdminMessages from '../pages/admin/AdminMessages.vue';
import AdminSettings from '../pages/admin/AdminSettings.vue';
import AdminUsers from '../pages/admin/AdminUsers.vue';
import AdminPageBuilder from '../pages/admin/AdminPageBuilder.vue';
import AdminTheme from '../pages/admin/AdminTheme.vue';
import AdminAnalytics from '../pages/admin/AdminAnalytics.vue';
import AdminNotifications from '../pages/admin/AdminNotifications.vue';
import AdminActivityLogs from '../pages/admin/AdminActivityLogs.vue';
import AdminBackups from '../pages/admin/AdminBackups.vue';
import AdminApiKeys from '../pages/admin/AdminApiKeys.vue';
import AdminSystemHealth from '../pages/admin/AdminSystemHealth.vue';
import PortalDashboard from '../pages/portal/PortalDashboard.vue';
import PortalProjects from '../pages/portal/PortalProjects.vue';
import PortalTasks from '../pages/portal/PortalTasks.vue';
import PortalQuotes from '../pages/portal/PortalQuotes.vue';
import PortalInvoices from '../pages/portal/PortalInvoices.vue';
import PortalSupport from '../pages/portal/PortalSupport.vue';
import PortalFiles from '../pages/portal/PortalFiles.vue';
import PortalCalendar from '../pages/portal/PortalCalendar.vue';
import AccountPassword from '../pages/account/AccountPassword.vue';

const routes = [
  {
    path: '/',
    redirect: '/tr'
  },
  {
    path: '/:locale(tr|en)',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: Home },
      { path: 'about', name: 'about', component: About },
      { path: 'services', name: 'services', component: Services },
      { path: 'portfolio', name: 'portfolio', component: Portfolio },
      { path: 'blog', name: 'blog', component: Blog },
      { path: 'contact', name: 'contact', component: Contact },
      { path: 'quote', name: 'quote', component: Quote },
      { path: 'login', name: 'login', component: Login },
      { path: 'register', name: 'register', component: Register }
    ]
  },
  {
    path: '/:locale(tr|en)/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: { titleKey: 'admin.nav.dashboard' }
      },
      {
        path: 'pages',
        name: 'admin-pages',
        component: AdminContent,
        meta: { titleKey: 'admin.nav.pages', contentType: 'pages' }
      },
      {
        path: 'services',
        name: 'admin-services',
        component: AdminContent,
        meta: { titleKey: 'admin.nav.services', contentType: 'services' }
      },
      {
        path: 'portfolio',
        name: 'admin-portfolio',
        component: AdminContent,
        meta: { titleKey: 'admin.nav.portfolio', contentType: 'portfolio' }
      },
      {
        path: 'blog',
        name: 'admin-blog',
        component: AdminContent,
        meta: { titleKey: 'admin.nav.blog', contentType: 'blog' }
      },
      {
        path: 'media',
        name: 'admin-media',
        component: AdminMedia,
        meta: { titleKey: 'admin.nav.media' }
      },
      {
        path: 'builder',
        name: 'admin-builder',
        component: AdminPageBuilder,
        meta: { titleKey: 'admin.nav.builder' }
      },
      {
        path: 'theme',
        name: 'admin-theme',
        component: AdminTheme,
        meta: { titleKey: 'admin.nav.theme' }
      },
      {
        path: 'analytics',
        name: 'admin-analytics',
        component: AdminAnalytics,
        meta: { titleKey: 'admin.nav.analytics' }
      },
      {
        path: 'notifications',
        name: 'admin-notifications',
        component: AdminNotifications,
        meta: { titleKey: 'admin.nav.notifications' }
      },
      {
        path: 'activity',
        name: 'admin-activity',
        component: AdminActivityLogs,
        meta: { titleKey: 'admin.nav.activity' }
      },
      {
        path: 'backups',
        name: 'admin-backups',
        component: AdminBackups,
        meta: { titleKey: 'admin.nav.backups' }
      },
      {
        path: 'api-keys',
        name: 'admin-api-keys',
        component: AdminApiKeys,
        meta: { titleKey: 'admin.nav.apiKeys' }
      },
      {
        path: 'system-health',
        name: 'admin-system-health',
        component: AdminSystemHealth,
        meta: { titleKey: 'admin.nav.systemHealth' }
      },
      {
        path: 'messages',
        name: 'admin-messages',
        component: AdminMessages,
        meta: { titleKey: 'admin.nav.messages' }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUsers,
        meta: { titleKey: 'admin.nav.users' }
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: AdminSettings,
        meta: { titleKey: 'admin.nav.settings' }
      },
      {
        path: 'password',
        name: 'admin-password',
        component: AccountPassword,
        meta: { titleKey: 'account.navTitle' }
      }
    ]
  },
  {
    path: '/:locale(tr|en)/portal',
    component: PortalLayout,
    children: [
      {
        path: '',
        name: 'portal-dashboard',
        component: PortalDashboard,
        meta: { titleKey: 'portal.nav.dashboard' }
      },
      {
        path: 'projects',
        name: 'portal-projects',
        component: PortalProjects,
        meta: { titleKey: 'portal.nav.projects' }
      },
      {
        path: 'tasks',
        name: 'portal-tasks',
        component: PortalTasks,
        meta: { titleKey: 'portal.nav.tasks' }
      },
      {
        path: 'quotes',
        name: 'portal-quotes',
        component: PortalQuotes,
        meta: { titleKey: 'portal.nav.quotes' }
      },
      {
        path: 'invoices',
        name: 'portal-invoices',
        component: PortalInvoices,
        meta: { titleKey: 'portal.nav.invoices' }
      },
      {
        path: 'support',
        name: 'portal-support',
        component: PortalSupport,
        meta: { titleKey: 'portal.nav.support' }
      },
      {
        path: 'files',
        name: 'portal-files',
        component: PortalFiles,
        meta: { titleKey: 'portal.nav.files' }
      },
      {
        path: 'calendar',
        name: 'portal-calendar',
        component: PortalCalendar,
        meta: { titleKey: 'portal.nav.calendar' }
      },
      {
        path: 'password',
        name: 'portal-password',
        component: AccountPassword,
        meta: { titleKey: 'account.navTitle' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
});

router.beforeEach((to) => {
  const locale = to.params.locale;
  const token =
    localStorage.getItem('spilweb_access_token') || localStorage.getItem('spilweb_refresh_token');
  const role = localStorage.getItem('spilweb_role');

  if (locale && ['tr', 'en'].includes(locale)) {
    localStorage.setItem('spilweb_locale', locale);
    document.documentElement.lang = locale;
  }

  if ((to.path.includes('/admin') || to.path.includes('/portal')) && !token) {
    return `/${locale || 'tr'}/login`;
  }

  if (to.path.includes('/admin') && !['super_admin', 'admin', 'editor'].includes(role)) {
    return `/${locale || 'tr'}/portal`;
  }

  return true;
});

export default router;
