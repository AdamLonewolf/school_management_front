/**
 * _nav.js - Sidebar Navigation Configuration
 *
 * This file defines the structure and content of the sidebar navigation menu.
 * The navigation is rendered by AppSidebar component using CoreUI nav components.
 *
 * Navigation item types:
 * - CNavItem: Single navigation link
 * - CNavGroup: Expandable group of navigation items
 * - CNavTitle: Section title/divider
 *
 * Each item can have:
 * - component: CoreUI component type ('CNavItem', 'CNavGroup', 'CNavTitle')
 * - name: Display text
 * - to: Vue Router path (for CNavItem)
 * - icon: CoreUI icon name (from @coreui/icons)
 * - badge: Optional badge with color and text
 * - items: Array of child items (for CNavGroup)
 * - href: External link URL
 * - external: Boolean for external links
 *
 * @type {Array<Object>}
 */
// _nav.js
export default function getNav(role) {

  const accueil = {
    component: 'CNavItem',
    name: 'Accueil',
    to: '/',
    icon: 'cilHome',
  }

  const navAdmin = [
    accueil,
    { component: 'CNavTitle', name: 'Gestion' },
    { component: 'CNavItem', name: 'Utilisateurs', to: '/users', icon: 'cil-people' },
    { component: 'CNavItem', name: 'Étudiants', to: '/students', icon: 'cil-user' },
    { component: 'CNavItem', name: 'Parents', to: '/parents', icon: 'cil-user' },
    { component: 'CNavItem', name: 'Professeurs', to: '/teachers', icon: 'cil-user' },
    { component: 'CNavTitle', name: 'Académique' },
    { component: 'CNavItem', name: 'Niveaux', to: '/levels', icon: 'cil-layers' },
    { component: 'CNavItem', name: 'Filières', to: '/fields', icon: 'cil-folder' },
    { component: 'CNavItem', name: 'Cours', to: '/courses', icon: 'cil-book' },
    { component: 'CNavItem', name: 'Inscriptions', to: '/enrollments', icon: 'cil-list' },
    { component: 'CNavItem', name: 'Notes', to: '/grades', icon: 'cil-description' },
    { component: 'CNavItem', name: 'Absences', to: '/attendance', icon: 'cil-calendar' },
    { component: 'CNavItem', name: 'Devoirs', to: '/assignments', icon: 'cil-pencil' },
    { component: 'CNavItem', name: 'Emploi du temps', to: '/schedule', icon: 'cil-clock' },
  ]

  const navTeacher = [
    accueil,
    { component: 'CNavTitle', name: 'Mes classes' },
    { component: 'CNavItem', name: 'Étudiants', to: '/students', icon: 'cil-user' },
    { component: 'CNavItem', name: 'Notes', to: '/grades', icon: 'cil-description' },
    { component: 'CNavTitle', name: 'Cours' },
    { component: 'CNavItem', name: 'Inscriptions', to: '/enrollments', icon: 'cil-list' },
    { component: 'CNavItem', name: 'Devoirs', to: '/assignments', icon: 'cil-pencil' },
    { component: 'CNavItem', name: 'Soumissions', to: '/submissions', icon: 'cil-inbox' },
    { component: 'CNavItem', name: 'Emploi du temps', to: '/schedule', icon: 'cil-clock' },
  ]

  const navStudent = [
    accueil,
    { component: 'CNavTitle', name: 'Mon espace' },
    { component: 'CNavItem', name: 'Mes Notes', to: '/grades', icon: 'cil-description' },
    { component: 'CNavItem', name: 'Emploi du temps', to: '/schedule', icon: 'cil-clock' },
    { component: 'CNavItem', name: 'Devoirs', to: '/assignments', icon: 'cil-pencil' },
    { component: 'CNavItem', name: 'Soumissions', to: '/submissions', icon: 'cil-inbox' },
  ]

  const navParent = [
    accueil,
    { component: 'CNavTitle', name: 'Mon enfant' },
    { component: 'CNavItem', name: 'Notes', to: '/grades', icon: 'cil-description' },
    { component: 'CNavItem', name: 'Emploi du temps', to: '/schedule', icon: 'cil-clock' },
    { component: 'CNavItem', name: 'Inscriptions', to: '/enrollments', icon: 'cil-list' },
  ]

  switch (role) {
    case 'admin':   return navAdmin
    case 'teacher': return navTeacher
    case 'student': return navStudent
    case 'parent':  return navParent
    default:        return [accueil]
  }
}