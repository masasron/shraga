
export default function ChatLayout(props) {
    return <div className="flex flex-col h-full overflow-hidden">
        <header className="sticky z-10 flex shadow-white shadow-lg items-center gap-2 top-0 bg-white p-4 slide-in-top">
            {props.header}
        </header>
        <main id="messages_container" className="flex-grow overflow-y-auto p-4">
            {props.children}
        </main>
        <footer className="sticky bottom-4 px-4 slide-in-bottom">
            {props.footer}
        </footer>
    </div>
}

export const ChatContainer = ({ children, ...props }) => <div {...props} className="mx-auto flex flex-col flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl">{children}</div>