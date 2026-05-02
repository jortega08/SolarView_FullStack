export type Locale = "es" | "en"

export const translations: Record<Locale, Record<string, string>> = {
  es: {
    // Navegación lateral
    "nav.dashboard":      "Resumen",
    "nav.installations":  "Instalaciones",
    "nav.telemetry":      "Telemetría",
    "nav.alerts":         "Alertas",
    "nav.orders":         "Órdenes",
    "nav.maintenance":    "Mantenimiento",
    "nav.profile":        "Mi perfil",
    "nav.technicians":    "Técnicos",
    "nav.analytics":      "Analítica",
    "nav.reports":        "Reportes",
    "nav.notifications":  "Notificaciones",
    "nav.settings":       "Configuración",
    "nav.logout":         "Cerrar sesión",

    // Header
    "header.profile":     "Perfil profesional",
    "header.settings":    "Configuración",

    // Configuración — secciones
    "cfg.sections":          "Secciones",
    "cfg.profile":           "Mi perfil",
    "cfg.profile.sub":       "Información de tu cuenta",
    "cfg.appearance":        "Apariencia",
    "cfg.appearance.sub":    "Personaliza cómo se ve la interfaz",
    "cfg.language":          "Idioma",
    "cfg.language.sub":      "Idioma de la interfaz",
    "cfg.alerts":            "Alertas y umbrales",
    "cfg.alerts.sub":        "Configura cuándo se activan las alertas de batería",
    "cfg.system":            "Información del sistema",
    "cfg.system.sub":        "Estado actual de los servicios",

    // Configuración — apariencia
    "cfg.theme.label":  "Tema de color",
    "cfg.theme.light":  "Claro",
    "cfg.theme.dark":   "Oscuro",

    // Configuración — perfil
    "cfg.field.name":     "Nombre",
    "cfg.field.email":    "Correo electrónico",
    "cfg.field.role":     "Rol",
    "cfg.field.since":    "Miembro desde",
    "cfg.field.contact":  "Para cambiar tu correo o contraseña, contacta al administrador del sistema.",

    // Configuración — sistema
    "cfg.sys.platform":   "Plataforma",
    "cfg.sys.version":    "Versión",
    "cfg.sys.env":        "Entorno",
    "cfg.sys.api":        "API",
    "cfg.sys.production": "Producción",
    "cfg.sys.services":   "Estado de servicios",
    "cfg.sys.check":      "Verificar",
    "cfg.sys.django":     "API Django",
    "cfg.sys.postgres":   "Base de datos (PostgreSQL)",
    "cfg.sys.redis":      "Redis / Tareas Celery",
    "cfg.sys.ok":         "Operativo",
    "cfg.sys.error":      "Error",

    // Configuración — alertas
    "cfg.threshold.preview":     "Vista previa de zonas",
    "cfg.threshold.critical":    "Nivel crítico",
    "cfg.threshold.warning":     "Nivel de advertencia",
    "cfg.threshold.critical.sub": "Alerta crítica por debajo de este nivel",
    "cfg.threshold.warning.sub":  "Advertencia por debajo de este nivel",

    // Idioma
    "cfg.lang.note": "El idioma completo de la plataforma está disponible en Español e Inglés.",
    "cfg.lang.save": "Guardar idioma",

    // Comunes
    "common.save":    "Guardar cambios",
    "common.saved":   "Guardado",
    "common.saving":  "Guardando…",
  },

  en: {
    // Navegación lateral
    "nav.dashboard":      "Dashboard",
    "nav.installations":  "Installations",
    "nav.telemetry":      "Telemetry",
    "nav.alerts":         "Alerts",
    "nav.orders":         "Work Orders",
    "nav.maintenance":    "Maintenance",
    "nav.profile":        "My Profile",
    "nav.technicians":    "Technicians",
    "nav.analytics":      "Analytics",
    "nav.reports":        "Reports",
    "nav.notifications":  "Notifications",
    "nav.settings":       "Settings",
    "nav.logout":         "Sign Out",

    // Header
    "header.profile":     "Professional profile",
    "header.settings":    "Settings",

    // Configuración — secciones
    "cfg.sections":          "Sections",
    "cfg.profile":           "My Profile",
    "cfg.profile.sub":       "Your account information",
    "cfg.appearance":        "Appearance",
    "cfg.appearance.sub":    "Customize how the interface looks",
    "cfg.language":          "Language",
    "cfg.language.sub":      "Interface language",
    "cfg.alerts":            "Alerts & Thresholds",
    "cfg.alerts.sub":        "Configure when battery alerts are triggered",
    "cfg.system":            "System Information",
    "cfg.system.sub":        "Current status of services",

    // Configuración — apariencia
    "cfg.theme.label":  "Color theme",
    "cfg.theme.light":  "Light",
    "cfg.theme.dark":   "Dark",

    // Configuración — perfil
    "cfg.field.name":     "Name",
    "cfg.field.email":    "Email address",
    "cfg.field.role":     "Role",
    "cfg.field.since":    "Member since",
    "cfg.field.contact":  "To change your email or password, contact the system administrator.",

    // Configuración — sistema
    "cfg.sys.platform":   "Platform",
    "cfg.sys.version":    "Version",
    "cfg.sys.env":        "Environment",
    "cfg.sys.api":        "API",
    "cfg.sys.production": "Production",
    "cfg.sys.services":   "Service status",
    "cfg.sys.check":      "Check",
    "cfg.sys.django":     "Django API",
    "cfg.sys.postgres":   "Database (PostgreSQL)",
    "cfg.sys.redis":      "Redis / Celery Tasks",
    "cfg.sys.ok":         "Operational",
    "cfg.sys.error":      "Error",

    // Configuración — alertas
    "cfg.threshold.preview":      "Zone preview",
    "cfg.threshold.critical":     "Critical level",
    "cfg.threshold.warning":      "Warning level",
    "cfg.threshold.critical.sub": "Critical alert below this level",
    "cfg.threshold.warning.sub":  "Warning below this level",

    // Idioma
    "cfg.lang.note": "The platform interface is fully available in Spanish and English.",
    "cfg.lang.save": "Save language",

    // Comunes
    "common.save":    "Save changes",
    "common.saved":   "Saved",
    "common.saving":  "Saving…",
  },
}
