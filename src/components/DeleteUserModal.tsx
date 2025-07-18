import { useState } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ReutilizableDialog from './DialogReutlizable';

interface DeleteUserModalProps {
  user: any;
  onUserDeleted?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteUserModal({ user, onUserDeleted, open, onOpenChange }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.id));
      onUserDeleted?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  const content = (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div>
          <h4 className="font-medium text-red-900">Confirmar eliminación</h4>
          <p className="text-sm text-red-700">
            Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">Usuario a eliminar:</h5>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Nombre:</strong> {user?.name || 'Sin nombre'}</p>
          <p><strong>Email:</strong> {user?.email || 'Sin email'}</p>
          <p><strong>Rol:</strong> {user?.role || 'Sin rol'}</p>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-2 mt-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange?.(false)}
        disabled={loading}
      >
        Cancelar
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Eliminando...
          </>
        ) : (
          'Eliminar Usuario'
        )}
      </Button>
    </div>
  );

  return (
    <ReutilizableDialog
      title="Eliminar Usuario"
      description="¿Estás seguro de que quieres eliminar este usuario?"
      content={content}
      footer={footer}
      open={open}
      onOpenChange={handleOpenChange}
      small={false}
    />
  );
} 