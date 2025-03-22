export function ButtonIcon({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => Promise<void>;
}) {
  return (
    <div className="p-1 rounded hover:bg-gray-100" onClick={onClick}>
      {icon}
    </div>
  );
}

export function ButtonContainer({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1 cursor-pointer">{children}</div>;
}
