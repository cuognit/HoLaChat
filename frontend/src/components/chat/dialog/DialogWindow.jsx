import { useImperativeHandle } from 'react';
import { useRef } from 'react';
import { X } from 'lucide-react'
import { useResponsive } from '../../../hooks/useResponsive'
export default function DialogWindow({dialogForm,ref,position}){
        const dialogRef=useRef();
        const { isMobile } = useResponsive();
        // Trên mobile, dialog luôn hiển thị toàn màn hình với margin auto
        const mobileOverride = isMobile ? 'm-auto p-0 w-[95vw] max-w-[95vw]' : '';
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
            <dialog onClick={handleClick} ref={dialogRef} className={`border-none ${position} ${mobileOverride} rounded ` }>
                {/* <X onClick={()=>dialogRef.current.close()} className="relative right-0 left-52 text-gray-500 cursor-pointer hover:text-gray-700"/> */}
                {dialogForm}
            </dialog>
        </>
    );
}