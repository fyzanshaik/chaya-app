import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
	icon: LucideIcon;
	label: string;
	onClick?: () => void;
	variant?: 'ghost' | 'destructive';
	disabled?: boolean;
}

const ActionButton = ({ icon: Icon, label, onClick, variant = 'ghost', disabled = false }: ActionButtonProps) => (
	<Button
		variant={variant}
		size="sm"
		onClick={onClick}
		disabled={disabled}
		className={cn('flex items-center gap-2 transition-all', variant === 'destructive' && 'hover:bg-red-600 hover:text-white', 'whitespace-nowrap')}
	>
		<Icon className="h-4 w-4" />
		<span className="hidden md:inline">{label}</span>
	</Button>
);

export default ActionButton;
