import React from 'react';

const TestPage: React.FC = () => {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
			<h1 className="text-4xl font-bold text-blue-600">Hello, World!</h1>
			<p className="mt-4 text-lg text-gray-700">This route is /test</p>
			<p className="mt-2 text-gray-600">This is a summary of the test page. It demonstrates a simple React component styled with Tailwind CSS.</p>
		</div>
	);
};

export default TestPage;
