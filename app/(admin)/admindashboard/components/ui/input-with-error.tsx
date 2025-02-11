import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputWithErrorProps extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: string;
}

const InputWithError = forwardRef<HTMLInputElement, InputWithErrorProps>(({ className, error, ...props }, ref) => {
	return (
		<div className="w-full">
			<Input className={cn(error && 'border-red-500 focus-visible:ring-red-500', className)} ref={ref} {...props} />
			{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
		</div>
	);
});

InputWithError.displayName = 'InputWithError';

export { InputWithError };
