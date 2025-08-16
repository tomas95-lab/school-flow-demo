type SwitchProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={`inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-blue-600' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default Switch;


