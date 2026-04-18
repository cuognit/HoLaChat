import ItemUser from "./ItemUser";
import { Search } from "lucide-react"
import { UserPlus, Users2} from "lucide-react"
export default function LeftSidebar() {
    return (
        <>  
        
        <div className=" flex flex-col w-92 bg-white p-0 gap-2 border-r border-gray-200 h-screen">
            <div className="flex bg-white-100 p-3 justify-start items-center gap-3 border-b border-gray-300">
            <img src="/notfound.png" alt="" className="cursor-pointer w-15 h-15 border border-blue-700 border-4 hover:border-1 transition-ease-in-out duration-300 rounded-full object-cover "/>
            <div className="focus-within:ring-2 focus-within:ring-blue-500 flex items-center bg-gray-200 p-1 rounded-md gap-1 ">
                <Search className=" text-gray-400 ms-1" />
                <input type="text" className="outline-none w-full text-sm font-medium h-8 p-2 bg-gray-200 rounded-md text-gray-500 placeholder:text-gray-400" placeholder="Tìm kiếm" /> 
            </div>
            <UserPlus className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            <Users2 className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            
            </div>
            <div className="overflow-y-auto ">
            
            </div>
            
        </div>
        </>
    );
}