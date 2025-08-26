export const rolePermissions = {
    admin: {
        canManageUsers: true,
        canManageCourses: true,
        canAssignSections: true,
        canViewAll: true,
        canEditGrades: false,
        canEditAttendance: false,
        canSendMessages: false,
        canViewAlerts: true,
        canManageSettings: true,
        canAccessFinances: false
    },
    docente: {
        canManageUsers: false,
        canManageCourses: false,
        canAssignSections: false,
        canViewAll: false,
        canEditGrades: true,
        canEditAttendance: true,
        canSendMessages: true,
        canViewAlerts: true,
        canManageSettings: false,
        canAccessFinances: false
    },
    alumno: {
        canManageUsers: false,
        canManageCourses: false,
        canAssignSections: false,
        canViewAll: false,
        canEditGrades: false,
        canEditAttendance: false,
        canSendMessages: true,
        canViewAlerts: true,
        canManageSettings: false,
        canAccessFinances: false
    },
    familiar: {
        canManageUsers: false,
        canManageCourses: false,
        canAssignSections: false,
        canViewAll: false,
        canEditGrades: false,
        canEditAttendance: false,
        canSendMessages: true,
        canViewAlerts: true,
        canManageSettings: false,
        canAccessFinances: false
    }
};
