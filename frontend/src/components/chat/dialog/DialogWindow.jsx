import { useImperativeHandle } from 'react';
import { useRef } from 'react';
import { X } from 'lucide-react'
export default function DialogWindow({dialogForm,ref,position}){
        const dialogRef=useRef();
      useImperativeHandle(ref, () => {
        return {
          open() {
            dialogRef.current.showModal();
            },
            close() {
              dialogRef.current.close();
            },
          };
        });
        function handleClick(e){
            if(e.target !== e.currentTarget) return;
            dialogRef.current.close();
           
            
        }
    return (
        <>
            <dialog onClick={handleClick} ref={dialogRef} className={`border-none ${position} absolute rounded ` }>
                {/* <X onClick={()=>dialogRef.current.close()} className="relative right-0 left-52 text-gray-500 cursor-pointer hover:text-gray-700"/> */}
                {dialogForm}
            </dialog>
        </>
    );
}