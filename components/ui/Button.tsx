interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyle = "w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 flex justify-center items-center";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-teal-500 hover:bg-teal-600 text-white",
    outline: "bg-transparent hover:bg-blue-50 text-blue-700 border border-blue-500"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      ) : children}
    </button>
  );
}