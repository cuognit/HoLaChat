export default function NotFound() {
    return (
        <>
            <div class="flex flex-col items-center justify-center h-screen">
                <img 
                class=" h-1/2 object-contain"
                src="/warning404error.png" 
                alt="Page Not Found " />
                <h1 class="text-4xl font-bold mt-4 text-gray-500 italic"> PAGE NOT FOUND</h1>
                <p class="text-lg text-gray-600">The page you are looking for does not exist.</p>
                <a href="/" class="mt-4 text-blue-500 bg-white hover:bg-blue-500 hover:text-white border border- hover:border-blue-700 rounded px-4 py-2 transition duration-500">
                Go back home</a>
            </div>
        </>
    );
}