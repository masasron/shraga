import { useRef, useEffect } from 'react';

export default function Shraga() {
    const leftEye = useRef(null);
    const rightEye = useRef(null);

    useEffect(function () {
        function onMouseMove(e) {
            const { clientX, clientY } = e;
            const container = leftEye.current;
            const { left, top, width, height } = container.getBoundingClientRect();
            const containerCenterX = left + width / 2;
            const containerCenterY = top + height / 2;

            const deltaX = clientX - containerCenterX;
            const deltaY = clientY - containerCenterY;

            const angle = Math.atan2(deltaY, deltaX);
            const eyeRadius = 2.5; // Adjust this value to control how far the eyes can move

            let x = Math.cos(angle) * eyeRadius;
            let y = Math.sin(angle) * eyeRadius;

            let rightEyeX = Math.cos(angle) * (eyeRadius + 0.4);
            let rightEyeY = Math.sin(angle) * (eyeRadius + 0.4);

            leftEye.current.style.transform = `translate(${x}px, ${y}px)`;
            rightEye.current.style.transform = `translate(${rightEyeX}px, ${rightEyeY}px)`;
        }

        function handleTouchMove(e) {
            const touch = e.touches[0];
            onMouseMove(touch);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", handleTouchMove);

        // inoke first time automatically with the current mouse position or center for mobile.
        if (typeof window !== "undefined") {
            const { clientX, clientY } = window;
            onMouseMove({ clientX, clientY });
        }


        return function () {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("touchmove", handleTouchMove);
        }
    }, []);

    return <div className="rounded-full border-[1px] border-slate-100 relative bg-white p-2 min-w-[120px] min-h-[120px] flex items-center justify-center" style={{
        background: 'url(/profile2.png) no-repeat bottom center',
        backgroundColor: "#fff",
        backgroundSize: '120px',
        transformOrigin: 'center center'
    }}>
        <div className="absolute w-[9px] h-[9px] rounded-full" style={{ left: 40, top: 50 }}>
            <div ref={leftEye} className="absolute blinking w-[2px] h-[2px] rounded-full bg-black" />
        </div>
        <div className="absolute w-[9px] h-[9px] rounded-full" style={{ left: 57, top: 50 }}>
            <div ref={rightEye} className="absolute blinking w-[2px] h-[2px] rounded-full bg-black" />
        </div>
    </div>
}