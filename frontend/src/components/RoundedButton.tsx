export function RoundedButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
