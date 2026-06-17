export default function NotFound() {
    return (
        <>
            <div className="flex flex-col items-center justify-center h-screen px-4">
                <img 
                className="h-1/3 md:h-1/2 object-contain"
                src="/warning404error.png" 
                alt="Page Not Found " />
                <h1 className="text-2xl md:text-4xl font-bold mt-4 text-gray-500 italic text-center"> PAGE NOT FOUND</h1>
                <p className="text-sm md:text-lg text-gray-600 text-center">The page you are looking for does not exist.</p>
                <a href="/" className="mt-4 text-blue-500 bg-white hover:bg-blue-500 hover:text-white border border- hover:border-blue-700 rounded px-4 py-2 transition duration-500 text-sm md:text-base">
                Go back home</a>
            </div>
        </>
    );
}