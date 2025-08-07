export const rolePermissions = {
    admin: {
        canManageUsers: true,
        canManageCourses: true,
        canAssignSections: true,
        canViewAll: true,
        canEditGrades: false,
        canEditAttendance: false,
        canSendMessages: false,
        canViewAlerts: true
    },
    docente: {
        canManageUsers: false,
        canManageCourses: false,
        canAssignSections: false,
        canViewAll: false,
        canEditGrades: true,
        canEditAttendance: true,
        canSendMessages: true,
        canViewAlerts: true
    },
    alumno: {
        canManageUsers: false,
        canManageCourses: false,
        canAssignSections: false,
        canViewAll: false,
        canEditGrades: false,
        canEditAttendance: false,
        canSendMessages: true,
        canViewAlerts: true
    },
    familiar: {
        canManageUsers: false,
        canManageCourses: false,
        canAssignSections: false,
        canViewAll: false,
        canEditGrades: false,
        canEditAttendance: false,
        canSendMessages: true,
        canViewAlerts: true
    }
};
