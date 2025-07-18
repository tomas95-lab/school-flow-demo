import React, { useState, useContext, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AuthContext } from '../context/AuthContext';
import { setDoc, doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { UserPlus, Edit, Loader2 } from 'lucide-react';
import ReutilizableDialog from './DialogReutlizable';

interface UserModalProps {
  mode: 'create' | 'edit';
  user?: any;
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserModal({ mode, user, onUserCreated, onUserUpdated, open: externalOpen, onOpenChange: externalOnOpenChange }: UserModalProps) {
  const { user: currentUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'alumno',
    status: 'active',
    password: '',
    confirmPassword: ''
  });

  // Cargar datos del usuario si estamos en modo edición
  useEffect(() => {
    console.log('UserModal useEffect - mode:', mode, 'user:', user);
    if (mode === 'edit' && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'alumno',
        status: user.status || 'active',
        password: '',
        confirmPassword: ''
      });
    }
  }, [mode, user]);

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'docente', label: 'Docente' },
    { value: 'alumno', label: 'Estudiante' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' }
  ];

  const validateForm = async () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    } else if (mode === 'create') {
      // Verificar si el email ya existe
      const emailQuery = query(collection(db, "users"), where("email", "==", formData.email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        newErrors.email = 'Este email ya está registrado';
      }
    }
    
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        // Crear usuario en Firebase Auth primero
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const firebaseUser = userCredential.user;
        
        // Guardar datos del usuario en Firestore usando el UID de Firebase Auth
        await setDoc(doc(db, "users", firebaseUser.uid), {
          id: firebaseUser.uid,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.uid,
          lastLogin: null,
          teacherId: formData.role === 'docente' ? firebaseUser.uid : '',
          studentId: formData.role === 'alumno' ? firebaseUser.uid : ''
        });

        onUserCreated?.();
      } else {
        // Actualizar usuario existente
        if (user?.id) {
          await updateDoc(doc(db, "users", user.id), {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.status,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.uid
          });
        }

        onUserUpdated?.();
      }

      // Resetear formulario
      setFormData({
        name: '',
        email: '',
        role: 'alumno',
        status: 'active',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setOpen(false);
    } catch (error: any) {
      console.error('Error:', error);
      
      // Manejar errores específicos de Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Este email ya está registrado en el sistema.' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'La contraseña debe tener al menos 6 caracteres.' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'El formato del email no es válido.' });
      } else {
        setErrors({ general: 'Error al procesar la solicitud. Inténtalo de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'alumno',
      status: 'active',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen);
    } else {
      setOpen(newOpen);
    }
    if (!newOpen) {
      resetForm();
    }
  };

  // Usar el estado externo si se proporciona, sino el interno
  const isOpen = externalOpen !== undefined ? externalOpen : open;

  const triggerButton = (
    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
      {mode === 'create' ? (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </>
      ) : (
        <>
          <Edit className="h-4 w-4 mr-2" />
          Editar Usuario
        </>
      )}
    </Button>
  );

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            {errors.general}
          </div>
        </div>
      )}

      {/* Información básica */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Información Personal</h4>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre completo *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa el nombre completo"
              className={`${errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} transition-colors`}
            />
            {errors.name && <p className="text-red-500 text-xs flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.name}
            </p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="usuario@ejemplo.com"
              className={`${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} transition-colors`}
            />
            {errors.email && <p className="text-red-500 text-xs flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.email}
            </p>}
          </div>
        </div>
      </div>

      {/* Configuración del usuario */}
      <div className="space-y-4 ">
        <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Configuración</h4>
        
        <div className="space-y-4 flex w-full gap-4">
          <div className="space-y-2 w-full">
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              Rol *
            </Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger className="focus:border-blue-500 transition-colors h-12 px-4 text-base w-full">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
              Estado *
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="focus:border-blue-500 transition-colors h-12 px-4 text-base w-full">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contraseña solo para crear */}
      {mode === 'create' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Seguridad</h4>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={`${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} transition-colors`}
              />
              {errors.password && <p className="text-red-500 text-xs flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.password}
              </p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmar contraseña *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Repite la contraseña"
                className={`${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} transition-colors`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.confirmPassword}
              </p>}
            </div>
          </div>
        </div>
      )}
    </form>
  );

  const footerContent = (
    <div className="flex gap-3 pt-4 border-t border-gray-200 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOpenChange(false)}
        disabled={loading}
        className="flex-1"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        onClick={handleSubmit}
        disabled={loading}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          mode === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'
        )}
      </Button>
    </div>
  );

      return (
      <ReutilizableDialog
        triger={externalOpen === undefined ? triggerButton : undefined}
        title={mode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
        description={mode === 'create' 
          ? 'Completa el formulario para crear un nuevo usuario en el sistema.'
          : 'Modifica la información del usuario seleccionado.'
        }
        content={formContent}
        footer={footerContent}
        open={isOpen}
        onOpenChange={handleOpenChange}
        small={true}
      />
    );
} 