

export default function TailwindPlayground() {
    return (<>
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4">
            <div className="shrink-0">
            <img className="h-12 w-12" src="/vercel.svg" alt="ChitChat Logo" />
            </div>
            <div>
            <div className="text-xl font-medium text-black">ChitChat</div>
            <p className="text-slate-500">You have a new message!</p>
            <p className="text-[#83003F]">This uses a custom color "#83003F"</p>
            <p className="text-blue-100">Color is "blue-100"</p>
            <p className="text-blue-300">Color is "blue-300"</p>
            <p className="text-blue-500">Color is "blue-500"</p>
            <p className="text-blue-700">Color is "blue-700"</p>
            </div>
        </div>
    </>);
}