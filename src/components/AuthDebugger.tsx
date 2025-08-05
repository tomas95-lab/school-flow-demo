import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AuthDebugInfo {
  isAuthenticated: boolean;
  userEmail: string | null;
  userRole: string | null;
  firebaseUser: unknown;
  appUser: unknown;
  permissions: {
    canReadAttendances: boolean;
    canWriteAttendances: boolean;
    canReadGrades: boolean;
    canWriteGrades: boolean;
  };
}

export function AuthDebugger() {
  const { user, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateDebugInfo = async () => {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        setDebugInfo({
          isAuthenticated: false,
          userEmail: null,
          userRole: null,
          firebaseUser: null,
          appUser: null,
          permissions: {
            canReadAttendances: false,
            canWriteAttendances: false,
            canReadGrades: false,
            canWriteGrades: false,
          }
        });
        return;
      }

      try {
        // Get user document from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        // Determine permissions based on role
        const role = userData?.role || 'unknown';
        const permissions = {
          canReadAttendances: ['admin', 'docente', 'alumno', 'familiar'].includes(role),
          canWriteAttendances: ['admin', 'docente'].includes(role),
          canReadGrades: ['admin', 'docente', 'alumno', 'familiar'].includes(role),
          canWriteGrades: ['admin', 'docente'].includes(role),
        };

        setDebugInfo({
          isAuthenticated: true,
          userEmail: firebaseUser.email,
          userRole: role,
          firebaseUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
          },
          appUser: user,
          permissions,
        });
      } catch (error) {
        console.error('Error getting debug info:', error);
        setDebugInfo({
          isAuthenticated: true,
          userEmail: firebaseUser.email,
          userRole: 'error',
          firebaseUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
          },
          appUser: user,
          permissions: {
            canReadAttendances: false,
            canWriteAttendances: false,
            canReadGrades: false,
            canWriteGrades: false,
          }
        });
      }
    };

    updateDebugInfo();
  }, [user, loading]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-blue-50 hover:bg-blue-100"
        >
          <Info className="h-4 w-4 mr-2" />
          Debug Auth
        </Button>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Auth Debugger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading debug information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 max-h-96 overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Auth Debugger
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div>
            <h4 className="font-semibold mb-2">Authentication Status</h4>
            <div className="flex items-center gap-2 mb-2">
              {debugInfo.isAuthenticated ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={debugInfo.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
            {debugInfo.userEmail && (
              <p className="text-sm text-gray-600">{debugInfo.userEmail}</p>
            )}
          </div>

          {/* User Role */}
          {debugInfo.userRole && (
            <div>
              <h4 className="font-semibold mb-2">User Role</h4>
              <Badge variant={debugInfo.userRole === 'admin' ? 'default' : 'secondary'}>
                {debugInfo.userRole}
              </Badge>
            </div>
          )}

          {/* Permissions */}
          <div>
            <h4 className="font-semibold mb-2">Permissions</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Read Attendances</span>
                {debugInfo.permissions.canReadAttendances ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Write Attendances</span>
                {debugInfo.permissions.canWriteAttendances ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Read Grades</span>
                {debugInfo.permissions.canReadGrades ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Write Grades</span>
                {debugInfo.permissions.canWriteGrades ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Firebase User Info */}
          {debugInfo.firebaseUser && (
            <div>
              <h4 className="font-semibold mb-2">Firebase User</h4>
              <div className="text-xs space-y-1">
                <p><strong>UID:</strong> {debugInfo.firebaseUser.uid}</p>
                <p><strong>Email Verified:</strong> {debugInfo.firebaseUser.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          {/* App User Info */}
          {debugInfo.appUser && (
            <div>
              <h4 className="font-semibold mb-2">App User</h4>
              <div className="text-xs space-y-1">
                <p><strong>Name:</strong> {debugInfo.appUser.name || 'N/A'}</p>
                <p><strong>Teacher ID:</strong> {debugInfo.appUser.teacherId || 'N/A'}</p>
                <p><strong>Student ID:</strong> {debugInfo.appUser.studentId || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Troubleshooting */}
          {!debugInfo.isAuthenticated && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to be authenticated to access Firestore collections. Please log in first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 