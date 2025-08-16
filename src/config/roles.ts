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
        canManageSettings: true
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
        canManageSettings: false
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
        canManageSettings: false
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
        canManageSettings: false
    }
};
