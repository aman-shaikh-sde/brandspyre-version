
import { useNavigate } from "react-router";
import { useEffect } from "react";

const NotFound = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        navigate("/dashboard");
    };

    useEffect(() => {
        document.title = "Page Not Found | CRM Admin";
    }, []);

    return (
        <div className="min-h-screen bg-transparant dark:bg-gray-900 flex flex-col justify-center py-8 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-red-600 dark:text-red-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    404 - Page Not Found
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={handleGoBack}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800 transition-colors duration-200"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={handleGoHome}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 transition-colors duration-200 dark:text-red-100 dark:bg-red-700 dark:hover:bg-red-600"
                        >
                            Return to Dashboard
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                    Or search for what you need
                                </span>
                            </div>
                        </div>

                        {/* <div className="mt-6">
                            <form action="#" method="POST" className="space-y-6">
                                <div>
                                    <label htmlFor="search" className="sr-only">
                                        Search
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg
                                                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <input
                                            id="search"
                                            name="search"
                                            type="text"
                                            autoComplete="off"
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2"
                                            placeholder="Search the CRM..."
                                        />
                                    </div>
                                </div>
                            </form>
                        </div> */}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>Need help? Contact support@brandspyre.in</p>
                <p className="mt-1">Error code: 404_NOT_FOUND</p>
            </div>
        </div>
    );
};

export default NotFound;