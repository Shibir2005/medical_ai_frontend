interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function Alert({ type, message }: AlertProps) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`p-4 mb-4 text-sm border rounded-lg ${styles[type]}`} role="alert">
      <span className="font-medium">{message}</span>
    </div>
  );
}