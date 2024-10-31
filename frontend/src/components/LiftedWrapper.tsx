interface LiftedWrapperProps {
    children: React.ReactNode;
}

export function LiftedWrapper({ children }: LiftedWrapperProps) {
    return (
        <div
            // style={{
            //     transform: 'skew(20deg) scale(1.05)',
            // }}
            className="shadow-2xl shadow-black/80 z-50 transition-all duration-200 ease-out"
        >
            {children}
        </div>
    );
} 