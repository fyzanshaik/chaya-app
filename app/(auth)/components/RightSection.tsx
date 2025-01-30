function RightSection() {
  return (
    <div className="hidden md:block md:w-1/2 bg-green-50 relative overflow-hidden dark:bg-green-900">
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-800 dark:to-green-700">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-green-800 mb-4 dark:text-green-300">
              Farmer Data Collection
            </h2>
            <p className="text-green-700 max-w-md mx-auto dark:text-green-400">
              Efficiently manage and track farmer information for sustainable
              agriculture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightSection;
